/**
 * Deduplicator for managing server records and handling duplicates
 */

import { KeyValueStore } from 'apify';
import { Log } from '@apify/log';
const logger = new Log();
import type {
  ServerRecord,
  ServerMetadata,
  DeduplicationState,
  SourceUrls,
  DownloadStats,
} from './types.js';
import { DataProcessor } from './processor.js';

export class Deduplicator {
  private state: DeduplicationState;
  private processor: DataProcessor;

  constructor(runId: string, updateMode: 'full' | 'incremental' = 'full') {
    this.processor = new DataProcessor();
    this.state = {
      runId,
      serverMap: new Map(),
      normalizedNames: new Map(),
      repositoryUrls: new Map(),
      lastRunTimestamp: new Date().toISOString(),
      updateMode,
    };
  }

  async loadState(): Promise<void> {
    try {
      const store = await KeyValueStore.open();
      const stateKey = `dedup-state-${this.state.runId}`;
      const savedState = await store.getValue(stateKey);

      if (savedState && this.state.updateMode === 'incremental') {
        const parsed = JSON.parse(savedState as string);
        this.state.serverMap = new Map(parsed.serverMap || []);
        this.state.normalizedNames = new Map(parsed.normalizedNames || []);
        this.state.repositoryUrls = new Map(parsed.repositoryUrls || []);
        this.state.lastRunTimestamp = parsed.lastRunTimestamp;
        logger.info('Loaded deduplication state for incremental update');
      }
    } catch (error) {
      logger.warning('Could not load deduplication state, starting fresh:', { error });
    }
  }

  async saveState(): Promise<void> {
    try {
      const store = await KeyValueStore.open();
      const stateKey = `dedup-state-${this.state.runId}`;

      const stateToSave = {
        runId: this.state.runId,
        serverMap: Array.from(this.state.serverMap.entries()),
        normalizedNames: Array.from(this.state.normalizedNames.entries()),
        repositoryUrls: Array.from(this.state.repositoryUrls.entries()),
        lastRunTimestamp: this.state.lastRunTimestamp,
        updateMode: this.state.updateMode,
      };

      await store.setValue(stateKey, JSON.stringify(stateToSave));
      logger.info('Saved deduplication state');
    } catch (error) {
      logger.error('Error saving deduplication state:', { error });
    }
  }

  async deduplicate(servers: ServerRecord[]): Promise<ServerRecord[]> {
    const deduplicated: ServerRecord[] = [];
    let duplicatesRemoved = 0;

    for (const server of servers) {
      const normalized = this.processor.normalizeName(server.normalizedName || server.name);
      const repoUrl = server.repository
        ? this.processor.normalizeRepositoryUrl(server.repository)
        : undefined;

      // Check if duplicate by normalized name
      if (this.state.normalizedNames.has(normalized)) {
        const existingKey = this.state.normalizedNames.get(normalized);
        if (existingKey) {
          const existing = this.state.serverMap.get(existingKey);
          if (existing) {
            // Merge with existing
            this.mergeServers(existing, server);
            duplicatesRemoved++;
            continue;
          }
        }
      }

      // Check if duplicate by repository URL
      if (repoUrl && this.state.repositoryUrls.has(repoUrl)) {
        const existingKey = this.state.repositoryUrls.get(repoUrl);
        if (existingKey) {
          const existing = this.state.serverMap.get(existingKey);
          if (existing) {
            // Merge with existing (prefer repo URL matching)
            this.mergeServers(existing, server);
            duplicatesRemoved++;
            continue;
          }
        }
      }

      // Not a duplicate, add to state and results
      const key = `${server.source}:${normalized}`;
      this.state.serverMap.set(key, server);
      this.state.normalizedNames.set(normalized, key);

      if (repoUrl) {
        this.state.repositoryUrls.set(repoUrl, key);
      }

      deduplicated.push(server);
    }

    logger.info(`Removed ${duplicatesRemoved} duplicates, kept ${deduplicated.length} unique servers`);
    return deduplicated;
  }

  private mergeServers(existing: ServerRecord, incoming: ServerRecord): void {
    // Prefer GitHub for stars and forks
    if (incoming.source === 'github') {
      if (incoming.stars !== undefined) existing.stars = incoming.stars;
      if (incoming.forks !== undefined) existing.forks = incoming.forks;
    }

    // Sum downloads from all sources
    if (!existing.downloads) {
      existing.downloads = {};
    }
    if (incoming.downloads) {
      if (incoming.source === 'npm') {
        const npmDownloads = typeof incoming.downloads === 'number' ? incoming.downloads : incoming.downloads.npm;
        if (npmDownloads) existing.downloads.npm = npmDownloads;
      } else if (incoming.source === 'pypi') {
        const pypiDownloads = typeof incoming.downloads === 'number' ? incoming.downloads : incoming.downloads.pypi;
        if (pypiDownloads) existing.downloads.pypi = pypiDownloads;
      }
    }

    // Keep longer/more detailed README
    if (incoming.readme && (!existing.readme || incoming.readme.length > existing.readme.length)) {
      existing.readme = incoming.readme;
    }

    // Combine source URLs
    if (!existing.sourceUrls) {
      existing.sourceUrls = {};
    }
    if (incoming.source === 'github') {
      existing.sourceUrls.github = incoming.sourceUrl;
    } else if (incoming.source === 'npm') {
      existing.sourceUrls.npm = incoming.sourceUrl;
    } else if (incoming.source === 'pypi') {
      existing.sourceUrls.pypi = incoming.sourceUrl;
    }

    // Use most recent version
    if (incoming.version && incoming.version.localeCompare(existing.version || '') > 0) {
      existing.version = incoming.version;
    }

    // Update last updated timestamp
    if (incoming.lastUpdated && incoming.lastUpdated > existing.lastUpdated) {
      existing.lastUpdated = incoming.lastUpdated;
    }

    logger.debug(`Merged duplicate: ${existing.name}`);
  }

  getState(): DeduplicationState {
    return this.state;
  }

  getDuplicateCount(): number {
    // Calculate based on total servers processed vs deduplicated
    return Math.max(0, this.state.serverMap.size);
  }
}





