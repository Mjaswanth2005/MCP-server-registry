/**
 * Data processor for normalizing and validating server metadata
 */

import { Log } from '@apify/log';
const logger = new Log();
import type { ServerMetadata, ValidationFailure } from './types.js';

export class DataProcessor {
  private validationFailures: ValidationFailure[] = [];

  async process(metadata: ServerMetadata[]): Promise<ServerMetadata[]> {
    const processed: ServerMetadata[] = [];

    for (const server of metadata) {
      try {
        // Validate required fields
        if (!this.validateRequired(server)) {
          continue;
        }

        // Validate URLs
        if (!this.validateUrls(server)) {
          continue;
        }

        // Sanitize text fields
        server.description = this.sanitizeText(server.description);
        if (server.readme) {
          server.readme = this.sanitizeText(server.readme);
          server.readme = server.readme.substring(0, 500 * 1024); // 500 KB limit
        }
        if (server.keywords) {
          server.keywords = server.keywords.map((k: string) => this.sanitizeText(k));
        }

        // Normalize name
        server.name = this.sanitizeText(server.name);

        // Calculate popularity score
        server.downloads = this.calculatePopularityScore(server);

        // Determine active status
        const daysSinceUpdate = this.daysSinceLastUpdate(server.lastUpdated);
        server.version = server.version || '1.0.0';

        processed.push(server);
      } catch (error) {
        logger.error(`Error processing server ${server.name}:`, { error });
      }
    }

    logger.info(`Processed ${processed.length}/${metadata.length} servers`);
    return processed;
  }

  /**
   * Normalize a server name for deduplication
   */
  normalizeName(name: string): string {
    return name
      .toLowerCase() // Convert to lowercase
      .replace(/[^\w\-]/g, '-') // Replace non-word chars except hyphens with hyphens
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
  }

  /**
   * Extract and normalize repository URL for deduplication
   */
  normalizeRepositoryUrl(url?: string): string | undefined {
    if (!url) {
      return undefined;
    }

    try {
      let normalized = url.toLowerCase();

      // Remove .git suffix
      normalized = normalized.replace(/\.git$/, '');

      // Normalize GitHub URLs
      if (normalized.includes('github.com')) {
        normalized = normalized.replace('https://', '').replace('http://', '').replace('git@github.com:', '');
        normalized = normalized.replace(/\.git$/, '').replace(/\/$/, '');
      }

      // Normalize trailing slashes
      normalized = normalized.replace(/\/$/, '');

      return normalized;
    } catch {
      return undefined;
    }
  }

  /**
   * Calculate popularity score
   * Formula: (stars * 0.4) + (log10(downloads + 1) * 0.3) + (recency_factor * 0.3)
   */
  private calculatePopularityScore(server: ServerMetadata): number {
    const stars = server.stars || 0;
    const downloads = server.downloads || 0;

    const daysSinceUpdate = this.daysSinceLastUpdate(server.lastUpdated);
    const recencyFactor = Math.max(0, 1 - daysSinceUpdate / 365);

    const score =
      stars * 0.4 + Math.log10(downloads + 1) * 0.3 + recencyFactor * 0.3;

    return Math.round(score * 100) / 100;
  }

  /**
   * Calculate days since last update
   */
  private daysSinceLastUpdate(lastUpdated: string): number {
    const lastDate = new Date(lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate required fields
   */
  private validateRequired(server: ServerMetadata): boolean {
    const requiredFields = ['name', 'description', 'version', 'sourceUrl'];

    for (const field of requiredFields) {
      const value = (server as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        this.recordValidationFailure(server.name, field, 'missing or empty');
        return false;
      }
    }

    return true;
  }

  /**
   * Validate URLs
   */
  private validateUrls(server: ServerMetadata): boolean {
    if (!this.isValidUrl(server.sourceUrl)) {
      this.recordValidationFailure(server.name, 'sourceUrl', 'invalid URL format');
      return false;
    }

    if (server.repository && !this.isValidUrl(server.repository)) {
      logger.warning(`Invalid repository URL for ${server.name}: ${server.repository}`);
      server.repository = undefined;
    }

    return true;
  }

  /**
   * Check if string is valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize text fields (remove control characters, limit length)
   */
  private sanitizeText(text: string): string {
    if (!text) {
      return '';
    }

    // Remove control characters
    text = text.replace(/[\x00-\x1F\x7F]/g, ' ');

    // Collapse multiple spaces
    text = text.replace(/\s+/g, ' ');

    // Trim
    text = text.trim();

    return text;
  }

  /**
   * Record validation failure
   */
  private recordValidationFailure(serverName: string, field: string, reason: string): void {
    const failure: ValidationFailure = {
      timestamp: new Date().toISOString(),
      field,
      value: serverName,
      reason,
    };
    this.validationFailures.push(failure);
    logger.warning(`Validation failure - ${serverName}.${field}: ${reason}`);
  }

  getValidationFailures(): ValidationFailure[] {
    return this.validationFailures;
  }
}





