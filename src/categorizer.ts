/**
 * Categorization service for MCP servers
 * 
 * Assigns servers to functional categories based on keyword matching
 * in name, description, keywords, and README content.
 * 
 * @module categorizer
 */

import { Log } from '@apify/log';
const logger = new Log();
import type { ServerMetadata, Category } from './types.js';
import { CATEGORIES } from './types.js';

/**
 * Categorizes MCP servers based on functionality
 */
export class Categorizer {
  private categories: Category[];

  /**
   * Creates a new Categorizer instance
   * @param categories - Optional custom category definitions (uses CATEGORIES from types.ts by default)
   */
  constructor(categories?: Category[]) {
    // Import CATEGORIES at runtime to avoid circular dependency
    this.categories = categories || [];
  }

  /**
   * Categorizes a server by analyzing its metadata
   * 
   * Searches name, description, keywords, and README for category keywords.
   * A server can belong to multiple categories.
   * 
   * @param server - Server metadata to categorize
   * @returns Array of category names (defaults to ["Uncategorized"] if no matches)
   */
  async categorize(server: ServerMetadata): Promise<string[]> {
    const categories = new Set<string>();

    // Search in name
    for (const category of CATEGORIES) {
      if (this.matchesCategory(server.name, category)) {
        categories.add(category.name);
        continue;
      }

      // Search in description
      if (this.matchesCategory(server.description, category)) {
        categories.add(category.name);
        continue;
      }

      // Search in keywords
      if (server.keywords && server.keywords.length > 0) {
        for (const keyword of server.keywords) {
          if (this.matchesCategory(keyword, category)) {
            categories.add(category.name);
            break;
          }
        }
      }

      // Search in README with lower weight
      if (server.readme && categories.size < 3) {
        const readmeMatches = this.countKeywordMatches(server.readme, category);
        if (readmeMatches > 2) {
          // At least 3 matches in README
          categories.add(category.name);
        }
      }
    }

    // Default to Uncategorized if no matches
    if (categories.size === 0) {
      categories.add('Uncategorized');
      logger.warning(`Server ${server.name} has no category matches`);
    }

    return Array.from(categories);
  }

  /**
   * Check if text matches any keywords in a category
   */
  private matchesCategory(text: string, category: Category): boolean {
    if (!text) {
      return false;
    }

    const lowerText = text.toLowerCase();

    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Count keyword matches in text
   */
  private countKeywordMatches(text: string, category: Category): number {
    if (!text) {
      return 0;
    }

    const lowerText = text.toLowerCase();
    let count = 0;

    for (const keyword of category.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  /**
   * Returns all available category definitions
   * @returns Array of category objects with names and keywords
   */
  async getCategories(): Promise<Category[]> {
    return CATEGORIES;
  }
}





