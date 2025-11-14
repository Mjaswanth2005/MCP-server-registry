/**
 * Tests for InstallationGenerator
 */

import { InstallationGenerator } from '../src/installationGenerator.js';
import type { ServerMetadata } from '../src/types.js';

describe('InstallationGenerator', () => {
  let generator: InstallationGenerator;

  beforeEach(() => {
    generator = new InstallationGenerator();
  });

  describe('generateInstructions', () => {
    it('should generate NPM installation command', () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'Test',
        version: '1.0.0',
        sourceUrl: 'https://npm.com/test-server',
        source: 'npm',
        lastUpdated: new Date().toISOString(),
      };

      const instructions = generator.generateInstructions(server);
      expect(instructions.npm).toBeDefined();
      expect(instructions.npm?.command).toContain('npm install');
      expect(instructions.npm?.command).toContain('test-server@1.0.0');
    });

    it('should generate PyPI installation commands', () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'Test',
        version: '1.0.0',
        sourceUrl: 'https://pypi.org/test-server',
        source: 'pypi',
        lastUpdated: new Date().toISOString(),
      };

      const instructions = generator.generateInstructions(server);
      expect(instructions.pypi).toBeDefined();
      expect(instructions.pypi).toHaveLength(2);
      expect(instructions.pypi?.[0].command).toContain('pip install');
      expect(instructions.pypi?.[1].command).toContain('uvx');
    });

    it('should generate configuration example', () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'Test',
        version: '1.0.0',
        sourceUrl: 'https://npm.com/test-server',
        source: 'npm',
        lastUpdated: new Date().toISOString(),
      };

      const instructions = generator.generateInstructions(server);
      expect(instructions.configExample).toBeDefined();
      expect(instructions.configExample).toContain('mcpServers');
    });

    it('should include environment variables in config when detected', () => {
      const server: ServerMetadata = {
        name: 'test-server',
        description: 'Test',
        version: '1.0.0',
        sourceUrl: 'https://npm.com/test-server',
        source: 'npm',
        readme: 'This server requires environment variables for API keys',
        lastUpdated: new Date().toISOString(),
      };

      const instructions = generator.generateInstructions(server);
      expect(instructions.configExample).toContain('env');
    });
  });
});
