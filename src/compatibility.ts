/**
 * Compatibility checker for AI clients
 * 
 * Detects which AI clients (Claude, OpenAI, Kiro, etc.) are compatible
 * with MCP servers by analyzing documentation and configuration examples.
 * 
 * @module compatibility
 */

import { Log } from '@apify/log';
const logger = new Log();
import type { ServerMetadata, CompatibilityInfo } from './types.js';

const CLIENT_NAMES = ['Claude', 'OpenAI', 'Kiro', 'Anthropic', 'ChatGPT', 'GPT'];

/**
 * Checks AI client compatibility for MCP servers
 */
export class CompatibilityChecker {
  /**
   * Checks which AI clients are compatible with a server
   * 
   * Searches description and README for mentions of client names
   * and configuration examples. Never executes code.
   * 
   * @param server - Server metadata to check
   * @returns Array of compatibility information for detected clients
   */
  async check(server: ServerMetadata): Promise<CompatibilityInfo[]> {
    const compatibility: CompatibilityInfo[] = [];
    const detectedClients = new Set<string>();

    // Search in description
    const descriptionMatches = this.findClientMatches(server.description);
    for (const client of descriptionMatches) {
      if (!detectedClients.has(client)) {
        compatibility.push({
          client,
          status: 'likely',
          notes: 'Mentioned in description',
        });
        detectedClients.add(client);
      }
    }

    // Search in README
    if (server.readme) {
      const readmeMatches = this.findClientMatches(server.readme);
      for (const client of readmeMatches) {
        if (!detectedClients.has(client)) {
          compatibility.push({
            client,
            status: 'likely',
            notes: 'Mentioned in README',
          });
          detectedClients.add(client);
        }
      }

      // Look for configuration examples
      for (const client of CLIENT_NAMES) {
        if (
          !detectedClients.has(client) &&
          (server.readme.includes(`"${client}"`) || server.readme.includes(`'${client}'`))
        ) {
          compatibility.push({
            client,
            status: 'likely',
            notes: 'Configuration example found',
          });
          detectedClients.add(client);
        }
      }
    }

    // If no specific matches, mark as unknown
    if (compatibility.length === 0) {
      compatibility.push({
        client: 'Unknown',
        status: 'unknown',
        notes: 'No compatibility information found in documentation',
      });
    }

    return compatibility;
  }

  /**
   * Find client names mentioned in text
   */
  private findClientMatches(text: string): string[] {
    const matches = new Set<string>();

    for (const client of CLIENT_NAMES) {
      const regex = new RegExp(`\\b${client}\\b`, 'gi');
      if (regex.test(text)) {
        matches.add(client);
      }
    }

    return Array.from(matches);
  }
}





