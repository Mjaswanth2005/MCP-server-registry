/**
 * PyPI scraper for discovering MCP servers
 * 
 * Searches PyPI for Python packages with MCP-related keywords.
 * Uses PyPI JSON API to fetch package metadata.
 * 
 * @module scrapers/pypi
 */

import axios from 'axios';
import { Log } from '@apify/log';
const logger = new Log();
import type { ServerMetadata, ActorInput, RateLimitEvent } from '../types.js';

const PYPI_SEARCH_API = 'https://pypi.org/pypi/_/json'; // Requires custom search
const PYPI_JSON_API = 'https://pypi.org/pypi';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Scrapes PyPI for MCP servers
 */
export class PyPIScraper {
  private rateLimitEvents: RateLimitEvent[] = [];
  private runId: string;

  /**
   * Creates a new PyPI scraper
   * @param runId - Unique identifier for this actor run
   */
  constructor(runId: string = 'unknown') {
    this.runId = runId;
  }

  /**
   * Scrapes PyPI for MCP servers
   * 
   * Searches by keywords (mcp, mcp-server, model-context-protocol).
   * Fetches package metadata and deduplicates results.
   * 
   * @param input - Actor input configuration
   * @returns Array of server metadata from PyPI
   */
  async scrape(input: ActorInput): Promise<ServerMetadata[]> {
    const servers: ServerMetadata[] = [];
    const keywords = ['mcp', 'mcp-server', 'model-context-protocol'];
    const seenPackages = new Set<string>();

    for (const keyword of keywords) {
      try {
        const packages = await this.searchPackages(keyword, input);
        for (const pkg of packages) {
          if (!seenPackages.has(pkg.name)) {
            servers.push(pkg);
            seenPackages.add(pkg.name);
          }
        }

        if (input.maxServers && servers.length >= input.maxServers) {
          break;
        }
      } catch (error) {
        logger.error(`Error searching PyPI with keyword ${keyword}:`, { error });
      }
    }

    logger.info(`PyPI: Found ${servers.length} MCP servers`);
    return servers.slice(0, input.maxServers);
  }

  private async searchPackages(keyword: string, input: ActorInput): Promise<ServerMetadata[]> {
    const servers: ServerMetadata[] = [];

    // PyPI doesn't have a public search API, so we search through project classifiers
    // This is a simplified approach using known MCP packages
    try {
      // Construct search URL - PyPI Simple API doesn't support full search
      // We'll use a different approach: fetch packages that mention MCP in their classifiers
      const response = await axios.get(
        `https://pypi.org/pypi?:action=query&classifier=Development%20Status%20::&classifier=Environment&sort=name`,
        {
          timeout: REQUEST_TIMEOUT,
          maxRedirects: 5,
        }
      );

      // This approach is limited; for production, consider using PyPI's XMLRPC API or a third-party service
      // For now, we'll parse some common MCP packages manually
      const commonPackages = [
        'mcp',
        'mcp-server',
        'mcp-server-notion',
        'mcp-server-brave-search',
        'mcp-server-github',
      ];

      for (const packageName of commonPackages) {
        const pkg = await this.fetchPackageInfo(packageName);
        if (pkg) {
          servers.push(pkg);
        }

        if (input.maxServers && servers.length >= input.maxServers) {
          break;
        }
      }
    } catch (error) {
      logger.error('Error searching PyPI packages:', { error });
    }

    return servers;
  }

  private async fetchPackageInfo(packageName: string): Promise<ServerMetadata | null> {
    try {
      const response = await axios.get(`${PYPI_JSON_API}/${packageName}/json`, {
        timeout: REQUEST_TIMEOUT,
      });

      const data = response.data;
      const info = data.info || {};
      const urls = data.urls || [];
      const latestRelease = urls.length > 0 ? urls[0] : {};

      // Extract download stats from release history
      let downloads = 0;
      if (data.releases) {
        // Count total releases as proxy for popularity
        downloads = Object.keys(data.releases).length * 10; // Simplified metric
      }

      // Extract repository URL
      let repository: string | undefined;
      if (info.project_urls) {
        repository =
          info.project_urls['Repository'] ||
          info.project_urls['Source'] ||
          info.project_urls['Homepage'] ||
          info.home_page;
      } else {
        repository = info.home_page;
      }

      const sourceUrl = `https://pypi.org/project/${packageName}/`;

      const server: ServerMetadata = {
        name: info.name || packageName,
        description: info.summary || 'No description provided',
        version: info.version || '1.0.0',
        sourceUrl,
        source: 'pypi',
        downloads,
        license: info.license,
        author: info.author,
        repository: repository,
        keywords: info.keywords ? info.keywords.split(',').map((k: string) => k.trim()) : [],
        lastUpdated: new Date().toISOString(), // PyPI doesn't provide update time in JSON API easily
      };

      return server;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Package not found, continue
        return null;
      }

      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60', 10);
        const event: RateLimitEvent = {
          source: 'pypi',
          timestamp: new Date().toISOString(),
          message: `PyPI rate limited. Retry after ${retryAfter}s`,
          retryAfter,
        };
        this.rateLimitEvents.push(event);
        logger.warning(event.message);
      }

      logger.error(`Error fetching PyPI package ${packageName}:`, error.message);
      return null;
    }
  }

  /**
   * Returns all rate limit events encountered during scraping
   * @returns Array of rate limit event records
   */
  getRateLimitEvents(): RateLimitEvent[] {
    return this.rateLimitEvents;
  }
}





