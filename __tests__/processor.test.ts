/**
 * Tests for DataProcessor
 */

import { DataProcessor } from '../src/processor.js';
import type { ServerMetadata } from '../src/types.js';

describe('DataProcessor', () => {
  let processor: DataProcessor;

  beforeEach(() => {
    processor = new DataProcessor();
  });

  describe('normalizeName', () => {
    it('should convert to lowercase', () => {
      expect(processor.normalizeName('MCP-Server')).toBe('mcp-server');
    });

    it('should replace spaces with hyphens', () => {
      expect(processor.normalizeName('mcp server test')).toBe('mcp-server-test');
    });

    it('should replace underscores with hyphens', () => {
      expect(processor.normalizeName('mcp_server_test')).toBe('mcp-server-test');
    });

    it('should collapse multiple hyphens', () => {
      expect(processor.normalizeName('mcp---server')).toBe('mcp-server');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(processor.normalizeName('-mcp-server-')).toBe('mcp-server');
    });

    it('should remove special characters', () => {
      expect(processor.normalizeName('mcp@server!')).toBe('mcp-server');
    });
  });

  describe('normalizeRepositoryUrl', () => {
    it('should normalize GitHub URLs', () => {
      const url = 'https://github.com/user/repo.git';
      expect(processor.normalizeRepositoryUrl(url)).toBe('github.com/user/repo');
    });

    it('should remove trailing slashes', () => {
      const url = 'https://github.com/user/repo/';
      expect(processor.normalizeRepositoryUrl(url)).toBe('github.com/user/repo');
    });

    it('should handle git@ URLs', () => {
      const url = 'git@github.com:user/repo.git';
      // The processor removes 'git@github.com:' prefix, leaving just 'user/repo'
      expect(processor.normalizeRepositoryUrl(url)).toBe('user/repo');
    });

    it('should return undefined for invalid URLs', () => {
      expect(processor.normalizeRepositoryUrl(undefined)).toBeUndefined();
    });
  });

  describe('process', () => {
    it('should validate and process valid servers', async () => {
      const servers: ServerMetadata[] = [
        {
          name: 'test-server',
          description: 'Test description',
          version: '1.0.0',
          sourceUrl: 'https://github.com/test/server',
          source: 'github',
          lastUpdated: new Date().toISOString(),
        },
      ];

      const result = await processor.process(servers);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-server');
    });

    it('should reject servers with missing required fields', async () => {
      const servers: ServerMetadata[] = [
        {
          name: '',
          description: 'Test',
          version: '1.0.0',
          sourceUrl: 'https://test.com',
          source: 'github',
          lastUpdated: new Date().toISOString(),
        },
      ];

      const result = await processor.process(servers);
      expect(result).toHaveLength(0);
      expect(processor.getValidationFailures()).toHaveLength(1);
    });

    it('should reject servers with invalid URLs', async () => {
      const servers: ServerMetadata[] = [
        {
          name: 'test',
          description: 'Test',
          version: '1.0.0',
          sourceUrl: 'not-a-url',
          source: 'github',
          lastUpdated: new Date().toISOString(),
        },
      ];

      const result = await processor.process(servers);
      expect(result).toHaveLength(0);
    });

    it('should sanitize text fields', async () => {
      const servers: ServerMetadata[] = [
        {
          name: 'test\x00server',
          description: 'Test   description',
          version: '1.0.0',
          sourceUrl: 'https://test.com',
          source: 'github',
          lastUpdated: new Date().toISOString(),
        },
      ];

      const result = await processor.process(servers);
      expect(result[0].name).not.toContain('\x00');
      expect(result[0].description).toBe('Test description');
    });
  });
});
