/**
 * NPM Registry scraper for discovering MCP servers
 * 
 * Searches NPM registry for packages with MCP-related keywords.
 * Fetches download statistics and detailed package metadata.
 * 
 * @module scrapers/npm
 */

import axios from 'axios';
import { Log } from '@apify/log';
const logger = new Log();
import type { ServerMetadata, ActorInput, RateLimitEvent } from '../types.js';

const NPM_SEARCH_API = 'https://registry.npmjs.org/-/v1/search';
const NPM_REGISTRY_API = 'https://registry.npmjs.org';
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Scrapes NPM registry for MCP servers
 */
export class NPMScraper {
  private rateLimitEvents: RateLimitEvent[] = [];
  private runId: string;

  /**
   * Creates a new NPM scraper
   * @param runId - Unique identifier for this actor run
   */
  constructor(runId: string = 'unknown') {
    this.runId = runId;
  }

  /**
   * Scrapes NPM registry for MCP servers
   * 
   * Searches by keywords (mcp, mcp-server, model-context-protocol).
   * Fetches download statistics and deduplicates results.
   * 
   * @param input - Actor input configuration
   * @returns Array of server metadata from NPM
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
        logger.error(`Error searching NPM with keyword ${keyword}:`, { error });
      }
    }

    logger.info(`NPM: Found ${servers.length} MCP servers`);
    return servers.slice(0, input.maxServers);
  }

  private async searchPackages(keyword: string, input: ActorInput): Promise<ServerMetadata[]> {
    const servers: ServerMetadata[] = [];
    let size = 100;
    let from = 0;

    try {
      while (true) {
        const response = await axios.get(NPM_SEARCH_API, {
          params: {
            text: keyword,
            size,
            from,
          },
          timeout: REQUEST_TIMEOUT,
        });

        const packages = response.data?.objects || [];

        if (packages.length === 0) {
          break;
        }

        for (const pkg of packages) {
          const server = await this.extractMetadata(pkg.package);
          if (server) {
            servers.push(server);
          }

          if (input.maxServers && servers.length >= input.maxServers) {
            return servers;
          }
        }

        if (packages.length < size) {
          break;
        }

        from += size;
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60', 10);
        const event: RateLimitEvent = {
          source: 'npm',
          timestamp: new Date().toISOString(),
          message: `NPM rate limited. Retry after ${retryAfter}s`,
          retryAfter,
        };
        this.rateLimitEvents.push(event);
        logger.warning(event.message);
      } else {
        logger.error('Error searching NPM packages:', error.message);
      }
    }

    return servers;
  }

  private async extractMetadata(pkg: any): Promise<ServerMetadata | null> {
    try {
      const sourceUrl = pkg.links?.npm || `https://www.npmjs.com/package/${pkg.name}`;
      const repository =
        typeof pkg.repository === 'string'
          ? pkg.repository
          : pkg.links?.repository || pkg.repository?.url;

      // Fetch detailed package info if needed
      let version = pkg.version || '1.0.0';
      let downloads = 0;

      try {
        const detailedResponse = await axios.get(`${NPM_REGISTRY_API}/${pkg.name}`, {
          timeout: REQUEST_TIMEOUT,
        });

        const distTags = detailedResponse.data['dist-tags'];
        version = distTags?.latest || version;

        // Try to get download stats
        try {
          const statsResponse = await axios.get(`https://api.npmjs.org/downloads/point/last-week/${pkg.name}`, {
            timeout: REQUEST_TIMEOUT,
          });
          downloads = statsResponse.data?.downloads || 0;
        } catch {
          // Downloads not available
        }
      } catch {
        // Detailed info not available
      }

      const server: ServerMetadata = {
        name: pkg.name,
        description: pkg.description || 'No description provided',
        version,
        sourceUrl,
        source: 'npm',
        downloads,
        license: pkg.license,
        author: pkg.author?.name || typeof pkg.author === 'string' ? pkg.author : undefined,
        repository: repository,
        keywords: pkg.keywords || [],
        lastUpdated: pkg.date || new Date().toISOString(),
      };

      return server;
    } catch (error) {
      logger.error('Error extracting NPM metadata:', { error });
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





