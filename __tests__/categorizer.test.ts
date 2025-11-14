/**
 * Tests for Categorizer
 */

import { Categorizer } from '../src/categorizer.js';
import type { ServerMetadata } from '../src/types.js';

describe('Categorizer', () => {
  let categorizer: Categorizer;

  beforeEach(() => {
    categorizer = new Categorizer();
  });

  describe('categorize', () => {
    it('should categorize database servers', async () => {
      const server: ServerMetadata = {
        name: 'mcp-server-postgres',
        description: 'PostgreSQL database server for MCP',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/postgres',
        source: 'github',
        keywords: ['database', 'postgres', 'sql'],
        lastUpdated: new Date().toISOString(),
      };

      const categories = await categorizer.categorize(server);
      expect(categories).toContain('Database');
    });

    it('should categorize file system servers', async () => {
      const server: ServerMetadata = {
        name: 'mcp-server-filesystem',
        description: 'File system access for MCP',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/fs',
        source: 'github',
        keywords: ['file', 'filesystem'],
        lastUpdated: new Date().toISOString(),
      };

      const categories = await categorizer.categorize(server);
      expect(categories).toContain('File System');
    });

    it('should assign multiple categories', async () => {
      const server: ServerMetadata = {
        name: 'mcp-server-github',
        description: 'GitHub API and git repository access',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/github',
        source: 'github',
        keywords: ['github', 'git', 'api'],
        lastUpdated: new Date().toISOString(),
      };

      const categories = await categorizer.categorize(server);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('Code & Development');
    });

    it('should default to Uncategorized when no matches', async () => {
      const server: ServerMetadata = {
        name: 'random-server',
        description: 'Some random server',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/random',
        source: 'github',
        lastUpdated: new Date().toISOString(),
      };

      const categories = await categorizer.categorize(server);
      expect(categories).toContain('Uncategorized');
    });

    it('should match keywords in description', async () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'A server for Slack integration and messaging',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/slack',
        source: 'github',
        lastUpdated: new Date().toISOString(),
      };

      const categories = await categorizer.categorize(server);
      expect(categories).toContain('Communication');
    });
  });
});
