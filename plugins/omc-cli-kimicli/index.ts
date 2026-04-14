/**
 * omc-cli-kimicli — OMC CLI Plugin for Kimi CLI (Moonshot AI)
 *
 * Reference implementation of the OMC CLI Plugin System.
 * Implements the full CliAgentContract interface with behavioral hints.
 */

const contract = {
  agentType: 'kimicli',
  binary: 'kimi',
  installInstructions: 'Install Kimi CLI: npm install -g @anthropic/kimi-cli',
  supportsPromptMode: true,
  promptModeFlag: '-p',
  hints: {
    modelEnvPrefix: 'OMC_KIMICLI',
    startupWaitStrategy: 'prompt-mode' as const,
    workerGuidanceOverride: [
      '### Agent-Type Guidance (kimicli)',
      '- Use concise commands and report progress to leader-fixed after each step.',
      '- Keep changes scoped to assigned files only.',
      '- You MUST claim your task before starting work and transition status when done.',
    ].join('\n'),
  },

  buildLaunchArgs(model?: string, extraFlags: string[] = []): string[] {
    const args: string[] = [];
    if (model) args.push('--model', model);
    return [...args, ...extraFlags];
  },

  parseOutput(rawOutput: string): string {
    return rawOutput.trim();
  },
};

module.exports = contract;
