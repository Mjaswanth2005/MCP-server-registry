/**
 * Tests for Deduplicator
 */

import { Deduplicator } from '../src/deduplicator.js';
import type { ServerRecord } from '../src/types.js';

describe('Deduplicator', () => {
  let deduplicator: Deduplicator;

  beforeEach(() => {
    deduplicator = new Deduplicator('test-run', 'full');
  });

  describe('deduplicate', () => {
    it('should remove duplicates by normalized name', async () => {
      const servers: ServerRecord[] = [
        {
          name: 'mcp-server-test',
          normalizedName: 'mcp-server-test',
          description: 'Test server',
          version: '1.0.0',
          sourceUrl: 'https://npm.com/mcp-server-test',
          sourceUrls: { npm: 'https://npm.com/mcp-server-test' },
          source: 'npm',
          lastUpdated: new Date().toISOString(),
          isActive: true,
          categories: ['Database'],
          compatibility: [],
          installationInstructions: {},
        },
        {
          name: 'mcp_server_test',
          normalizedName: 'mcp-server-test',
          description: 'Test server',
          version: '1.0.0',
          sourceUrl: 'https://pypi.org/mcp-server-test',
          sourceUrls: { pypi: 'https://pypi.org/mcp-server-test' },
          source: 'pypi',
          lastUpdated: new Date().toISOString(),
          isActive: true,
          categories: ['Database'],
          compatibility: [],
          installationInstructions: {},
        },
      ];

      const result = await deduplicator.deduplicate(servers);
      expect(result).toHaveLength(1);
    });

    it('should merge data from multiple sources', async () => {
      const servers: ServerRecord[] = [
        {
          name: 'test-server',
          normalizedName: 'test-server',
          description: 'Test',
          version: '1.0.0',
          sourceUrl: 'https://github.com/test/server',
          sourceUrls: { github: 'https://github.com/test/server' },
          source: 'github',
          stars: 100,
          repository: 'test/server',
          lastUpdated: new Date().toISOString(),
          isActive: true,
          categories: [],
          compatibility: [],
          installationInstructions: {},
        },
        {
          name: 'test-server',
          normalizedName: 'test-server',
          description: 'Test',
          version: '1.0.0',
          sourceUrl: 'https://npm.com/test-server',
          sourceUrls: { npm: 'https://npm.com/test-server' },
          source: 'npm',
          downloads: { npm: 5000 },
          repository: 'test/server',
          lastUpdated: new Date().toISOString(),
          isActive: true,
          categories: [],
          compatibility: [],
          installationInstructions: {},
        },
      ];

      const result = await deduplicator.deduplicate(servers);
      expect(result).toHaveLength(1);
      expect(result[0].stars).toBe(100);
      expect(result[0].downloads?.npm).toBe(5000);
      expect(result[0].sourceUrls.github).toBeDefined();
      expect(result[0].sourceUrls.npm).toBeDefined();
    });

    it('should keep unique servers', async () => {
      const servers: ServerRecord[] = [
        {
          name: 'server-one',
          normalizedName: 'server-one',
          description: 'First server',
          version: '1.0.0',
          sourceUrl: 'https://github.com/test/one',
          sourceUrls: { github: 'https://github.com/test/one' },
          source: 'github',
          lastUpdated: new Date().toISOString(),
          isActive: true,
          categories: [],
          compatibility: [],
          installationInstructions: {},
        },
        {
          name: 'server-two',
          normalizedName: 'server-two',
          description: 'Second server',
          version: '1.0.0',
          sourceUrl: 'https://github.com/test/two',
          sourceUrls: { github: 'https://github.com/test/two' },
          source: 'github',
          lastUpdated: new Date().toISOString(),
          isActive: true,
          categories: [],
          compatibility: [],
          installationInstructions: {},
        },
      ];

      const result = await deduplicator.deduplicate(servers);
      expect(result).toHaveLength(2);
    });
  });
});
