/**
 * Tests for CompatibilityChecker
 */

import { CompatibilityChecker } from '../src/compatibility.js';
import type { ServerMetadata } from '../src/types.js';

describe('CompatibilityChecker', () => {
  let checker: CompatibilityChecker;

  beforeEach(() => {
    checker = new CompatibilityChecker();
  });

  describe('check', () => {
    it('should detect Claude compatibility from description', async () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'MCP server compatible with Claude',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/server',
        source: 'github',
        lastUpdated: new Date().toISOString(),
      };

      const compatibility = await checker.check(server);
      const claudeCompat = compatibility.find((c) => c.client === 'Claude');
      expect(claudeCompat).toBeDefined();
      expect(claudeCompat?.status).toBe('likely');
    });

    it('should detect multiple clients from README', async () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'Test server',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/server',
        source: 'github',
        readme: 'This server works with Claude and OpenAI clients',
        lastUpdated: new Date().toISOString(),
      };

      const compatibility = await checker.check(server);
      expect(compatibility.length).toBeGreaterThanOrEqual(2);
      expect(compatibility.some((c) => c.client === 'Claude')).toBe(true);
      expect(compatibility.some((c) => c.client === 'OpenAI')).toBe(true);
    });

    it('should return unknown when no compatibility info found', async () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'Generic MCP server',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/server',
        source: 'github',
        lastUpdated: new Date().toISOString(),
      };

      const compatibility = await checker.check(server);
      expect(compatibility).toHaveLength(1);
      expect(compatibility[0].client).toBe('Unknown');
      expect(compatibility[0].status).toBe('unknown');
    });

    it('should detect Kiro compatibility', async () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'Works with Kiro IDE',
        version: '1.0.0',
        sourceUrl: 'https://github.com/test/server',
        source: 'github',
        lastUpdated: new Date().toISOString(),
      };

      const compatibility = await checker.check(server);
      const kiroCompat = compatibility.find((c) => c.client === 'Kiro');
      expect(kiroCompat).toBeDefined();
    });
  });
});
