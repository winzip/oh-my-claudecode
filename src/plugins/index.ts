/**
 * CLI Plugin System — Public API
 *
 * Singleton plugin loader with lazy initialization.
 * Eager loading should be called from CLI entry points.
 */

import { PluginLoader } from './plugin-loader.js';
import { readPluginConfig } from './config.js';
export type { CliPluginManifest, PluginConfig } from './types.js';
export { registerContract, getRegisteredTypes, isBuiltinType } from '../team/model-contract.js';
export { PluginLoader } from './plugin-loader.js';

let loader: PluginLoader | null = null;

export function ensurePluginsLoaded(): void {
  if (loader) return;
  loader = new PluginLoader();
  const config = readPluginConfig(process.cwd());
  loader.registerAll(process.cwd(), config);
}

export function resetPluginLoader(): void {
  loader = null;
}
