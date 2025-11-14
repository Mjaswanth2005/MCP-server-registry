/**
 * GitHub scraper for discovering MCP servers
 */

import { Octokit } from 'octokit';
import { Log } from '@apify/log';
const logger = new Log();
import type { ServerMetadata, ActorInput, RateLimitEvent } from '../types.js';

const RATE_LIMIT_BACKOFF_DELAYS = [60000, 120000, 300000]; // 60s, 120s, 300s
const CONCURRENCY_LIMIT = 3;

export class GitHubScraper {
  private octokit: Octokit;
  private rateLimitEvents: RateLimitEvent[] = [];
  private runId: string;

  constructor(githubToken?: string, runId: string = 'unknown') {
    this.runId = runId;
    this.octokit = new Octokit({
      auth: githubToken,
    });
  }

  async scrape(input: ActorInput): Promise<ServerMetadata[]> {
    const servers: ServerMetadata[] = [];
    const seenRepos = new Set<string>();

    try {
      // Search by topics
      const topicServers = await this.searchByTopics(input);
      for (const server of topicServers) {
        const key = server.repository || server.sourceUrl;
        if (!seenRepos.has(key)) {
          servers.push(server);
          seenRepos.add(key);
        }
      }

      // Search by code patterns
      const codeServers = await this.searchByCode(input);
      for (const server of codeServers) {
        const key = server.repository || server.sourceUrl;
        if (!seenRepos.has(key)) {
          servers.push(server);
          seenRepos.add(key);
        }
      }

      logger.info(`GitHub: Found ${servers.length} MCP servers`);
      return servers.slice(0, input.maxServers);
    } catch (error) {
      logger.error('GitHub scraper error:', { error });
      throw error;
    }
  }

  private async searchByTopics(input: ActorInput): Promise<ServerMetadata[]> {
    const servers: ServerMetadata[] = [];
    const topics = ['mcp-server', 'model-context-protocol', 'mcp'];

    for (const topic of topics) {
      try {
        const query = `topic:${topic} stars:>0`;
        let page = 1;
        const perPage = 100;

        while (true) {
          const response = (await this.withRateLimitHandling(() =>
            this.octokit.rest.search.repos({
              q: query,
              order: 'desc',
              per_page: perPage,
              page,
            })
          )) as any;

          if (!response.data?.items || response.data.items.length === 0) {
            break;
          }

          for (const repo of response.data.items) {
            if (input.minStars && (repo.stargazers_count || 0) < input.minStars) {
              continue;
            }

            const server = await this.extractMetadata(repo);
            if (server) {
              servers.push(server);
            }

            if (input.maxServers && servers.length >= input.maxServers) {
              return servers;
            }
          }

          if ((response.data?.items?.length || 0) < perPage) {
            break;
          }

          page++;
        }
      } catch (error) {
        logger.error(`Error searching topic ${topic}:`, { error });
      }
    }

    return servers;
  }

  private async searchByCode(input: ActorInput): Promise<ServerMetadata[]> {
    const servers: ServerMetadata[] = [];
    const patterns = ['filename:mcp*.json', 'filename:*mcp-server*.ts', 'filename:*mcp-server*.js'];

    for (const pattern of patterns) {
      try {
        const query = `${pattern} language:typescript OR language:javascript`;
        let page = 1;
        const perPage = 100;

        while (true) {
          const response = (await this.withRateLimitHandling(() =>
            this.octokit.rest.search.code({
              q: query,
              order: 'desc',
              per_page: perPage,
              page,
            })
          )) as any;

          if (!response.data?.items || response.data.items.length === 0) {
            break;
          }

          // Get unique repositories
          const uniqueRepos = new Map<string, any>();
          for (const item of response.data.items) {
            if (item.repository && !uniqueRepos.has(item.repository.id)) {
              uniqueRepos.set(item.repository.id, item.repository);
            }
          }

          for (const repo of uniqueRepos.values()) {
            if (input.minStars && (repo.stargazers_count || 0) < input.minStars) {
              continue;
            }

            const server = await this.extractMetadata(repo);
            if (server) {
              servers.push(server);
            }

            if (input.maxServers && servers.length >= input.maxServers) {
              return servers;
            }
          }

          if ((response.data?.items?.length || 0) < perPage) {
            break;
          }

          page++;
        }
      } catch (error) {
        logger.error(`Error searching code pattern ${pattern}:`, { error });
      }
    }

    return servers;
  }

  private async extractMetadata(repo: any): Promise<ServerMetadata | null> {
    try {
      const sourceUrl = repo.html_url || repo.url;
      const lastUpdated = repo.updated_at || new Date().toISOString();

      let readme = undefined;
      if (true) {
        // includeReadme is typically true by default
        try {
          const readmeResponse = (await this.withRateLimitHandling(() =>
            this.octokit.rest.repos.getReadme({
              owner: repo.owner.login,
              repo: repo.name,
            })
          )) as any;

          if (readmeResponse.data && typeof readmeResponse.data === 'string') {
            readme = readmeResponse.data.substring(0, 500 * 1024); // 500 KB limit
          } else if (readmeResponse.data && 'content' in readmeResponse.data) {
            const content = Buffer.from(readmeResponse.data.content as string, 'base64').toString('utf-8');
            readme = content.substring(0, 500 * 1024);
          }
        } catch {
          // README not found, continue
        }
      }

      const server: ServerMetadata = {
        name: repo.name,
        description: repo.description || 'No description provided',
        version: '1.0.0', // GitHub doesn't provide direct version
        sourceUrl,
        source: 'github',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        license: repo.license?.name,
        author: repo.owner?.login,
        repository: repo.full_name,
        keywords: repo.topics || [],
        readme,
        lastUpdated,
      };

      return server;
    } catch (error) {
      logger.error('Error extracting metadata:', { error });
      return null;
    }
  }

  private async withRateLimitHandling<T>(fn: () => Promise<T>): Promise<T> {
    let attempts = 0;
    const maxAttempts = RATE_LIMIT_BACKOFF_DELAYS.length + 1;

    while (attempts < maxAttempts) {
      try {
        return await fn();
      } catch (error: any) {
        if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
          const delay = RATE_LIMIT_BACKOFF_DELAYS[Math.min(attempts, RATE_LIMIT_BACKOFF_DELAYS.length - 1)];
          const event: RateLimitEvent = {
            source: 'github',
            timestamp: new Date().toISOString(),
            message: `Rate limited. Waiting ${delay / 1000}s before retry (attempt ${attempts + 1}/${maxAttempts})`,
            retryAfter: delay / 1000,
          };
          this.rateLimitEvents.push(event);
          logger.warning(event.message);

          await this.sleep(delay);
          attempts++;
        } else {
          throw error;
        }
      }
    }

    throw new Error('Rate limit retries exhausted');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getRateLimitEvents(): RateLimitEvent[] {
    return this.rateLimitEvents;
  }
}





