import { isCliAvailable, getRegisteredTypes, isBuiltinType, type CliAgentType } from '../../team/model-contract.js';

export interface SkillRuntimeAvailability {
  claude: boolean;
  codex: boolean;
  gemini: boolean;
  [key: string]: boolean | undefined;
}

export function detectSkillRuntimeAvailability(
  detector: (agentType: CliAgentType) => boolean = isCliAvailable,
): SkillRuntimeAvailability {
  const safeDetect = (agentType: CliAgentType): boolean => {
    try {
      return detector(agentType);
    } catch {
      return false;
    }
  };
  const result: SkillRuntimeAvailability = {
    claude: safeDetect('claude'),
    codex: safeDetect('codex'),
    gemini: safeDetect('gemini'),
  };
  // Detect plugin CLIs
  for (const type of getRegisteredTypes()) {
    if (!isBuiltinType(type)) {
      result[type] = safeDetect(type as CliAgentType);
    }
  }
  return result;
}

function normalizeSkillName(skillName: string): string {
  return skillName.trim().toLowerCase();
}

function hasNonBuiltInAvailable(availability: SkillRuntimeAvailability): string[] {
  const nonBuiltin: string[] = [];
  for (const type of getRegisteredTypes()) {
    if (!isBuiltinType(type) && availability[type]) {
      nonBuiltin.push(type);
    }
  }
  return nonBuiltin;
}

function renderPlanRuntimeGuidance(availability: SkillRuntimeAvailability): string {
  const lines: string[] = [];
  if (availability.codex) {
    lines.push('## Provider Runtime Availability');
    lines.push('Codex CLI is installed and available. When `--architect codex` or `--critic codex` flags are present, use `omc ask codex --agent-prompt <role> "<prompt>"` for those passes. Do NOT report Codex as unavailable.');
  }
  const nonBuiltin = hasNonBuiltInAvailable(availability);
  if (nonBuiltin.length > 0) {
    if (!availability.codex) lines.push('## Provider Runtime Availability');
    for (const type of nonBuiltin) {
      lines.push(`${type} CLI is installed and available. Use \`omc ask ${type} --agent-prompt <role> "<prompt>"\` for multi-model passes.`);
    }
  }
  return lines.join('\n');
}

function renderRalphRuntimeGuidance(availability: SkillRuntimeAvailability): string {
  const lines: string[] = [];
  if (availability.codex) {
    lines.push('## Provider Runtime Availability');
    lines.push('Codex CLI is installed and available. When `--critic=codex` is set, use `omc ask codex --agent-prompt critic "<prompt>"` for the approval pass. Do NOT report Codex as unavailable.');
  }
  const nonBuiltin = hasNonBuiltInAvailable(availability);
  if (nonBuiltin.length > 0) {
    if (!availability.codex) lines.push('## Provider Runtime Availability');
    for (const type of nonBuiltin) {
      lines.push(`${type} CLI is available. Use \`omc ask ${type} --agent-prompt critic "<prompt>"\` for the approval pass.`);
    }
  }
  return lines.join('\n');
}

function renderDeepInterviewRuntimeGuidance(availability: SkillRuntimeAvailability): string {
  const lines: string[] = [];
  if (availability.codex) {
    lines.push('## Provider-Aware Execution Recommendations');
    lines.push('When Phase 5 presents post-interview execution choices, keep the Claude-only defaults above and add these Codex variants because Codex CLI is available:');
    lines.push('');
    lines.push('- `/ralplan --architect codex "<spec or task>"` — Codex handles the architect pass; best for implementation-heavy design review; higher cost than Claude-only ralplan.');
    lines.push('- `/ralplan --critic codex "<spec or task>"` — Codex handles the critic pass; cheaper than moving the full loop off Claude; strong second-opinion review.');
    lines.push('- `/ralph --critic codex "<spec or task>"` — Ralph still executes normally, but final verification goes through the Codex critic; smallest multi-provider upgrade.');
    lines.push('');
    lines.push('If Codex becomes unavailable, briefly note that and fall back to the Claude-only recommendations already listed in Phase 5.');
  }
  const nonBuiltin = hasNonBuiltInAvailable(availability);
  if (nonBuiltin.length > 0) {
    if (!availability.codex) lines.push('## Provider-Aware Execution Recommendations');
    for (const type of nonBuiltin) {
      lines.push(`- \`/ralplan --critic ${type} "<spec or task>"\` — ${type} handles the critic pass for a second opinion.`);
    }
  }
  return lines.join('\n');
}

export function renderSkillRuntimeGuidance(
  skillName: string,
  availability?: SkillRuntimeAvailability,
): string {
  switch (normalizeSkillName(skillName)) {
    case 'deep-interview':
      return renderDeepInterviewRuntimeGuidance(availability ?? detectSkillRuntimeAvailability());
    case 'ralplan':
    case 'omc-plan':
    case 'plan':
      return renderPlanRuntimeGuidance(availability ?? detectSkillRuntimeAvailability());
    case 'ralph':
      return renderRalphRuntimeGuidance(availability ?? detectSkillRuntimeAvailability());
    default:
      return '';
  }
}
