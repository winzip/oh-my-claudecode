/**
 * CLI Plugin System — Configuration reader
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { PluginConfig } from './types.js';

export function readPluginConfig(cwd: string): PluginConfig {
  const configPath = join(cwd, '.omc', 'config.json');
  if (!existsSync(configPath)) return {};
  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
    return raw.cliPlugins ?? {};
  } catch {
    return {};
  }
}
