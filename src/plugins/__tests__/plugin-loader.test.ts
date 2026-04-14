/**
 * Plugin system unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginLoader } from '../plugin-loader.js';
import type { CliAgentContract } from '../../team/model-contract.js';

describe('PluginLoader', () => {
  describe('validateContract', () => {
    let loader: PluginLoader;

    beforeEach(() => {
      loader = new PluginLoader();
    });

    it('accepts a valid contract', () => {
      const contract = {
        agentType: 'mycli',
        binary: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: () => [],
        parseOutput: (s: string) => s,
      };
      expect(loader.validateContract(contract)).toBe(true);
    });

    it('rejects when agentType is missing', () => {
      const contract = {
        binary: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: () => [],
        parseOutput: (s: string) => s,
      };
      expect(loader.validateContract(contract)).toBe(false);
    });

    it('rejects when agentType starts with a number (collision risk)', () => {
      const contract = {
        agentType: '1mycli',
        binary: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: () => [],
        parseOutput: (s: string) => s,
      };
      expect(loader.validateContract(contract)).toBe(false);
    });

    it('rejects when agentType contains uppercase', () => {
      const contract = {
        agentType: 'MyCli',
        binary: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: () => [],
        parseOutput: (s: string) => s,
      };
      expect(loader.validateContract(contract)).toBe(false);
    });

    it('rejects when binary is missing', () => {
      const contract = {
        agentType: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: () => [],
        parseOutput: (s: string) => s,
      };
      expect(loader.validateContract(contract)).toBe(false);
    });

    it('rejects when buildLaunchArgs is not a function', () => {
      const contract = {
        agentType: 'mycli',
        binary: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: 'not-a-function',
        parseOutput: (s: string) => s,
      };
      expect(loader.validateContract(contract)).toBe(false);
    });

    it('rejects when parseOutput is not a function', () => {
      const contract = {
        agentType: 'mycli',
        binary: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: () => [],
        parseOutput: 'not-a-function',
      };
      expect(loader.validateContract(contract)).toBe(false);
    });

    it('rejects null', () => {
      expect(loader.validateContract(null)).toBe(false);
    });

    it('rejects non-objects', () => {
      expect(loader.validateContract('string')).toBe(false);
      expect(loader.validateContract(42)).toBe(false);
    });

    it('accepts hyphenated agentType', () => {
      const contract = {
        agentType: 'my-custom-cli',
        binary: 'my-custom-cli',
        installInstructions: 'npm install -g my-custom-cli',
        buildLaunchArgs: () => [],
        parseOutput: (s: string) => s,
      };
      expect(loader.validateContract(contract)).toBe(true);
    });

    it('accepts contract with optional hints', () => {
      const contract = {
        agentType: 'mycli',
        binary: 'mycli',
        installInstructions: 'npm install -g mycli',
        buildLaunchArgs: () => [],
        parseOutput: (s: string) => s,
        hints: {
          modelEnvPrefix: 'OMC_MYCLI',
          startupWaitStrategy: 'prompt-mode',
        },
      };
      expect(loader.validateContract(contract)).toBe(true);
    });
  });

  describe('discoverPlugins', () => {
    it('returns empty array when node_modules does not exist', () => {
      const loader = new PluginLoader();
      const result = loader.discoverPlugins('/nonexistent/path');
      expect(result).toEqual([]);
    });
  });

  describe('loadPlugin', () => {
    it('returns null for nonexistent plugin directory', () => {
      const loader = new PluginLoader();
      const result = loader.loadPlugin('/nonexistent/plugin');
      expect(result).toBeNull();
    });
  });
});
