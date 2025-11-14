/**
 * Installation instruction generator for MCP servers
 * 
 * Generates installation commands and configuration examples
 * for NPM and PyPI packages.
 * 
 * @module installationGenerator
 */

import type { ServerMetadata, InstallationInstructions, InstallCommand } from './types.js';

/**
 * Generates installation instructions for MCP servers
 */
export class InstallationGenerator {
  /**
   * Generates installation instructions for a server
   * 
   * Creates package manager commands (npm, pip, uvx) and
   * configuration examples based on server metadata.
   * 
   * @param server - Server metadata
   * @returns Installation instructions object
   */
  generateInstructions(server: ServerMetadata): InstallationInstructions {
    const instructions: InstallationInstructions = {};

    // Generate NPM installation command
    if (server.source === 'npm') {
      instructions.npm = {
        command: `npm install ${server.name}@${server.version}`,
        package: server.name,
        version: server.version,
      };
    }

    // Generate PyPI installation commands
    if (server.source === 'pypi') {
      const pipCommand: InstallCommand = {
        command: `pip install ${server.name}==${server.version}`,
        package: server.name,
        version: server.version,
      };

      const uvxCommand: InstallCommand = {
        command: `uvx ${server.name}==${server.version}`,
        package: server.name,
        version: server.version,
      };

      instructions.pypi = [pipCommand, uvxCommand];
    }

    // Generate configuration example
    instructions.configExample = this.generateConfigExample(server);

    return instructions;
  }

  private generateConfigExample(server: ServerMetadata): string {
    const serverName = this.formatServerName(server.name);

    // Base configuration template
    let config = `{
  "mcpServers": {
    "${serverName}": {
      "command": "npm",
      "args": ["exec", "${server.name}"]
    }
  }
}`;

    // Check for environment variables in README
    if (server.readme && server.readme.includes('environment') && server.readme.includes('variable')) {
      config = `{
  "mcpServers": {
    "${serverName}": {
      "command": "npm",
      "args": ["exec", "${server.name}"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}`;
    }

    // Check for specific client configurations
    if (server.readme) {
      if (server.readme.toLowerCase().includes('claude')) {
        config = `{
  "mcpServers": {
    "${serverName}": {
      "command": "npm",
      "args": ["exec", "${server.name}"]
    }
  }
}`;
      }
    }

    return config;
  }

  private formatServerName(name: string): string {
    // Convert kebab-case to camelCase
    return name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
}




