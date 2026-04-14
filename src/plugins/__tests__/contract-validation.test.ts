/**
 * Contract validation integration tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getContract, getRegisteredTypes, isBuiltinType, registerContract, type CliAgentContract } from '../../team/model-contract.js';

describe('Contract Registry', () => {
  it('built-in types are always registered', () => {
    expect(getRegisteredTypes()).toContain('claude');
    expect(getRegisteredTypes()).toContain('codex');
    expect(getRegisteredTypes()).toContain('gemini');
  });

  it('isBuiltinType identifies built-in types', () => {
    expect(isBuiltinType('claude')).toBe(true);
    expect(isBuiltinType('codex')).toBe(true);
    expect(isBuiltinType('gemini')).toBe(true);
    expect(isBuiltinType('kimicli')).toBe(false);
  });

  it('getContract returns valid contracts for built-ins', () => {
    const claudeContract = getContract('claude');
    expect(claudeContract.agentType).toBe('claude');
    expect(claudeContract.binary).toBe('claude');
    expect(typeof claudeContract.buildLaunchArgs).toBe('function');
    expect(typeof claudeContract.parseOutput).toBe('function');
  });

  it('getContract throws for unknown type', () => {
    expect(() => getContract('nonexistent')).toThrow(/Unknown agent type/);
  });

  it('built-in contracts have behavioral hints', () => {
    const claude = getContract('claude');
    expect(claude.hints?.startupWaitStrategy).toBe('evidence-file');

    const codex = getContract('codex');
    expect(codex.hints?.modelEnvPrefix).toBe('OMC_CODEX');
    expect(codex.hints?.startupWaitStrategy).toBe('prompt-mode');

    const gemini = getContract('gemini');
    expect(gemini.hints?.needsTrustConfirm).toBe(true);
    expect(gemini.hints?.modelEnvPrefix).toBe('OMC_GEMINI');
  });

  it('registerContract adds a new contract', () => {
    const testContract: CliAgentContract = {
      agentType: 'test-cli-reg',
      binary: 'test-cli-reg',
      installInstructions: 'test',
      buildLaunchArgs: () => [],
      parseOutput: (s: string) => s,
    };

    registerContract(testContract);
    expect(getRegisteredTypes()).toContain('test-cli-reg');
    expect(getContract('test-cli-reg')).toBe(testContract);
  });

  it('registerContract validates binary name', () => {
    const badContract = {
      agentType: 'bad-cli',
      binary: '../etc/passwd',
      installInstructions: 'test',
      buildLaunchArgs: () => [],
      parseOutput: (s: string) => s,
    };
    expect(() => registerContract(badContract)).toThrow(/Unsafe/);
  });
});
