/**
 * CLI Plugin System — Type definitions
 */

export interface CliPluginManifest {
  name: string;
  version: string;
  agentType: string;
}

export interface PluginConfig {
  enabled?: string[];
  disabled?: string[];
  pluginDirs?: string[];
}
