/**
 * Main Apify Actor entry point for MCP Server Registry
 * 
 * This actor discovers, categorizes, and aggregates Model Context Protocol (MCP) servers
 * from multiple package sources (GitHub, NPM, PyPI). It performs the following operations:
 * 
 * 1. Scrapes package sources for MCP servers
 * 2. Validates and normalizes server metadata
 * 3. Categorizes servers by functionality
 * 4. Checks AI client compatibility
 * 5. Generates installation instructions
 * 6. Deduplicates servers found across multiple sources
 * 7. Stores results in Apify Dataset
 * 8. Generates run metadata and statistics
 * 
 * @module main
 */

import { Actor, KeyValueStore, Dataset } from 'apify';
import { Log } from '@apify/log';
const logger = new Log();
import type {
  ActorInput,
  ServerMetadata,
  ServerRecord,
  RunMetadata,
  SourceStats,
  CategoryStats,
  RateLimitEvent,
} from './types.js';
import { GitHubScraper } from './scrapers/github.js';
import { NPMScraper } from './scrapers/npm.js';
import { PyPIScraper } from './scrapers/pypi.js';
import { DataProcessor } from './processor.js';
import { Categorizer } from './categorizer.js';
import { CompatibilityChecker } from './compatibility.js';
import { Deduplicator } from './deduplicator.js';
import { InstallationGenerator } from './installationGenerator.js';

/**
 * Default input configuration for zero-configuration execution
 */
const DEFAULT_INPUT: Partial<ActorInput> = {
  sources: ['github', 'npm', 'pypi'],
  updateMode: 'full',
  includeReadme: true,
  runMode: 'production',
};

/**
 * Main actor class that orchestrates the MCP server discovery and aggregation process
 * Coordinates scrapers, processors, and storage operations
 */
class MCPRegistryActor {
  private input: ActorInput;
  private runId: string;
  private startTime: number;
  private rateLimitEvents: RateLimitEvent[] = [];
  private validationFailures: any[] = [];
  private errors: string[] = [];

  /**
   * Initialize the actor with input configuration and run ID
   * @param input - Actor input configuration
   * @param runId - Unique identifier for this run
   */
  constructor(input: ActorInput, runId: string) {
    this.input = { ...DEFAULT_INPUT, ...input } as ActorInput;
    this.runId = runId;
    this.startTime = Date.now();
  }

  async run(): Promise<void> {
    try {
      logger.info('MCP Server Registry Actor Started', {
        runId: this.runId,
        input: this.input,
      });

      // Parse and validate input
      await this.validateInput();

      // Scrape all sources
      const allServers = await this.scrapeAllSources();
      logger.info(`Total servers scraped: ${allServers.length}`);

      // Process servers
      const processor = new DataProcessor();
      const processed = await processor.process(allServers);
      this.validationFailures.push(...processor.getValidationFailures());

      // Categorize and check compatibility
      const categorizer = new Categorizer();
      const compatibilityChecker = new CompatibilityChecker();
      const installationGenerator = new InstallationGenerator();

      const enhancedServers: ServerRecord[] = [];

      for (const server of processed) {
        const categories = await categorizer.categorize(server);
        const compatibility = await compatibilityChecker.check(server);
        const installationInstructions = installationGenerator.generateInstructions(server);

        const daysSinceUpdate = this.calculateDaysSinceUpdate(server.lastUpdated);
        const isActive = daysSinceUpdate <= 180;

        const record: ServerRecord = {
          ...server,
          categories,
          compatibility,
          installationInstructions,
          isActive,
          normalizedName: processor.normalizeName(server.name),
          sourceUrls: {
            [server.source]: server.sourceUrl,
          },
          downloads: server.downloads ? { [server.source]: server.downloads } : undefined,
        };

        enhancedServers.push(record);
      }

      // Deduplicate
      const deduplicator = new Deduplicator(this.runId, this.input.updateMode);
      await deduplicator.loadState();

      const deduplicated = await deduplicator.deduplicate(enhancedServers);
      await deduplicator.saveState();

      // Write to dataset
      const dataset = await Dataset.open();
      const batchSize = 100;

      for (let i = 0; i < deduplicated.length; i += batchSize) {
        const batch = deduplicated.slice(i, i + batchSize);
        await dataset.pushData(batch);
      }

      logger.info(`Pushed ${deduplicated.length} servers to dataset`);

      // Generate metadata
      const metadata = this.generateMetadata(
        allServers,
        enhancedServers.length - deduplicated.length
      );

      // Save metadata
      const store = await KeyValueStore.open();
      await store.setValue(`run-metadata-${this.runId}`, JSON.stringify(metadata));

      logger.info('Actor run completed successfully', {
        totalServers: deduplicated.length,
        duration: Date.now() - this.startTime,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(errorMessage);
      logger.error('Actor run failed:', { message: errorMessage });
      throw error;
    }
  }

  private async validateInput(): Promise<void> {
    if (!this.input.sources || this.input.sources.length === 0) {
      throw new Error('At least one source must be specified');
    }

    const validSources = ['github', 'npm', 'pypi'];
    for (const source of this.input.sources) {
      if (!validSources.includes(source)) {
        throw new Error(`Invalid source: ${source}`);
      }
    }

    if (this.input.maxServers && this.input.maxServers < 1) {
      throw new Error('maxServers must be at least 1');
    }

    if (this.input.minStars && this.input.minStars < 0) {
      throw new Error('minStars must be non-negative');
    }

    logger.info('Input validation passed');
  }

  private async scrapeAllSources(): Promise<ServerMetadata[]> {
    const allServers: ServerMetadata[] = [];
    const scrapers: Array<[string, any]> = [];

    if (this.input.sources.includes('github')) {
      const githubScraper = new GitHubScraper(this.input.githubToken, this.runId);
      scrapers.push(['github', githubScraper]);
    }

    if (this.input.sources.includes('npm')) {
      const npmScraper = new NPMScraper(this.runId);
      scrapers.push(['npm', npmScraper]);
    }

    if (this.input.sources.includes('pypi')) {
      const pypiScraper = new PyPIScraper(this.runId);
      scrapers.push(['pypi', pypiScraper]);
    }

    // Run scrapers in parallel
    const scrapePromises = scrapers.map(async ([source, scraper]) => {
      try {
        logger.info(`Starting scraper: ${source}`);
        const servers = await scraper.scrape(this.input);
        logger.info(`${source}: Found ${servers.length} servers`);

        // Collect rate limit events
        if (typeof scraper.getRateLimitEvents === 'function') {
          this.rateLimitEvents.push(...scraper.getRateLimitEvents());
        }

        return servers;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error scraping ${source}:`, { message: errorMessage });
        this.errors.push(`${source}: ${errorMessage}`);
        return [];
      }
    });

    const results = await Promise.all(scrapePromises);

    for (const serverList of results) {
      allServers.push(...serverList);
    }

    return allServers;
  }

  private calculateDaysSinceUpdate(lastUpdated: string): number {
    const lastDate = new Date(lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private generateMetadata(
    allServers: ServerMetadata[],
    duplicatesRemoved: number
  ): RunMetadata {
    // Calculate statistics by source
    const sourceStats: SourceStats = {
      github: 0,
      npm: 0,
      pypi: 0,
    };

    for (const server of allServers) {
      sourceStats[server.source as keyof SourceStats]++;
    }

    // Calculate statistics by category (placeholder - would need categorization results)
    const categoryStats: CategoryStats = {
      Uncategorized: allServers.length, // Simplified
    };

    const metadata: RunMetadata = {
      runId: this.runId,
      startedAt: new Date(this.startTime).toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      totalServersFound: allServers.length,
      serversBySource: sourceStats,
      duplicatesRemoved,
      serversByCategory: categoryStats,
      rateLimitEvents: this.rateLimitEvents,
      validationFailures: this.validationFailures,
      errors: this.errors,
      updateMode: this.input.updateMode || 'full',
    };

    return metadata;
  }
}

async function main() {
  const input: Partial<ActorInput> = (await Actor.getInput()) as Partial<ActorInput>;

  if (!input) {
    logger.warning('No input provided, using defaults');
  }

  const runId = process.env.APIFY_RUN_ID || 'local-' + Date.now();
  const testMode = input?.runMode === 'test';

  if (testMode) {
    logger.info('Running in TEST mode - limiting to 5 servers per source');
    if (!input.maxServers) {
      input.maxServers = 5;
    }
  }

  const actor = new MCPRegistryActor(input as ActorInput, runId);
  await actor.run();
}

// Start the actor
Actor.main(main).catch((error: any) => {
  logger.error('Fatal error:', { error });
  process.exit(1);
});




