/**
 * CLI Plugin System — Plugin loader
 *
 * Discovers and loads CLI agent plugins from node_modules/omc-cli-* packages.
 * Follows convention-based naming for auto-discovery.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { CliAgentContract } from '../team/model-contract.js';
import type { CliPluginManifest, PluginConfig } from './types.js';
import { registerContract } from '../team/model-contract.js';

const PLUGIN_NAME_RE = /^omc-cli-/;
const AGENT_TYPE_RE = /^[a-z][a-z0-9-]*$/;

export class PluginLoader {
  private loaded = false;

  discoverPlugins(rootDir: string): CliPluginManifest[] {
    const nodeModulesPath = join(rootDir, 'node_modules');
    if (!existsSync(nodeModulesPath)) return [];

    const manifests: CliPluginManifest[] = [];

    try {
      const entries = readdirSync(nodeModulesPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

        // Direct omc-cli-* packages
        if (PLUGIN_NAME_RE.test(entry.name)) {
          const manifest = this.readManifest(join(nodeModulesPath, entry.name));
          if (manifest) manifests.push(manifest);
          continue;
        }

        // Scoped packages: @scope/omc-cli-*
        if (entry.name.startsWith('@')) {
          try {
            const scopedPath = join(nodeModulesPath, entry.name);
            const scopedEntries = readdirSync(scopedPath, { withFileTypes: true });
            for (const scopedEntry of scopedEntries) {
              if (PLUGIN_NAME_RE.test(scopedEntry.name)) {
                const manifest = this.readManifest(join(scopedPath, scopedEntry.name));
                if (manifest) manifests.push(manifest);
              }
            }
          } catch {
            // Permission or read error — skip this scope
          }
        }
      }
    } catch {
      // node_modules not readable
    }

    return manifests;
  }

  loadPlugin(pluginDir: string): CliAgentContract | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(pluginDir);
      const contract = mod.default ?? mod;
      if (!this.validateContract(contract)) {
        console.warn(`[omc:plugins] Invalid contract from ${pluginDir} — skipping`);
        return null;
      }
      return contract;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[omc:plugins] Failed to load plugin from ${pluginDir}: ${msg}`);
      return null;
    }
  }

  registerAll(rootDir: string, config?: PluginConfig): void {
    if (this.loaded) return;

    const disabled = new Set(config?.disabled ?? []);
    const manifests = this.discoverPlugins(rootDir);

    for (const manifest of manifests) {
      if (disabled.has(manifest.agentType) || disabled.has(manifest.name)) {
        continue;
      }

      const pluginDir = this.resolvePluginDir(rootDir, manifest.name);
      if (!pluginDir) continue;

      const contract = this.loadPlugin(pluginDir);
      if (contract) {
        try {
          registerContract(contract);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn(`[omc:plugins] Failed to register ${manifest.name}: ${msg}`);
        }
      }
    }

    this.loaded = true;
  }

  validateContract(contract: unknown): contract is CliAgentContract {
    if (!contract || typeof contract !== 'object') return false;
    const c = contract as Record<string, unknown>;

    // Required fields
    if (typeof c.agentType !== 'string') return false;
    if (!AGENT_TYPE_RE.test(c.agentType as string)) return false;
    if (typeof c.binary !== 'string') return false;
    if (typeof c.installInstructions !== 'string') return false;
    if (typeof c.buildLaunchArgs !== 'function') return false;
    if (typeof c.parseOutput !== 'function') return false;

    return true;
  }

  private readManifest(pluginDir: string): CliPluginManifest | null {
    const pkgPath = join(pluginDir, 'package.json');
    if (!existsSync(pkgPath)) return null;

    try {
      const raw = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const agentType = raw.omc?.agentType ?? raw.omcAgentType;
      if (!agentType || typeof agentType !== 'string') return null;
      if (!AGENT_TYPE_RE.test(agentType)) return null;

      return {
        name: raw.name ?? '',
        version: raw.version ?? '0.0.0',
        agentType,
      };
    } catch {
      return null;
    }
  }

  private resolvePluginDir(rootDir: string, pluginName: string): string | null {
    // Try direct path first
    const directPath = join(rootDir, 'node_modules', pluginName);
    if (existsSync(directPath)) return directPath;

    // Try scoped package path
    if (pluginName.startsWith('@')) {
      const scopedPath = join(rootDir, 'node_modules', pluginName);
      if (existsSync(scopedPath)) return scopedPath;
    }

    return null;
  }
}
