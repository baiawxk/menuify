import type { MenuOpts } from '../src/core'
import { writeFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import { resolveConfig } from '../src/core'
import { generateShellScript } from '../src/generator'

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
}))

vi.mock('../src/core', () => ({
  resolveConfig: vi.fn().mockImplementation(async () => ({
    config: mockConfig,
    sources: ['cli.config.ts'],
  })),
}))

const mockConfig: MenuOpts = {
  menus: [
    {
      name: 'Test Command',
      type: 'command',
      task: 'echo "test"',
    },
    {
      name: 'Multiple Commands',
      type: 'command',
      task: ['echo "one"', 'echo "two"'],
    },
  ],
}

describe('generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate bash script', async () => {
    await generateShellScript({ type: 'bash' })

    const [[, content]] = vi.mocked(writeFile).mock.calls
    expect(content).toContain('#!/bin/bash')
    expect(content).toContain('function run_test_command()')
    expect(content).toContain('echo "test"')
    expect(content).toContain('select opt in "${options[@]}"')
  })

  it('should generate cmd script', async () => {
    await generateShellScript({ type: 'cmd' })

    const [[, content]] = vi.mocked(writeFile).mock.calls
    expect(content).toContain('@echo off')
    expect(content).toContain(':test_command')
    expect(content).toContain('echo "test"')
    expect(content).toContain('set /p choice=')
  })

  it('should generate powershell script', async () => {
    await generateShellScript({ type: 'ps1' })

    const [[, content]] = vi.mocked(writeFile).mock.calls
    expect(content).toContain('function Run-test_command')
    expect(content).toContain('echo "test"')
    expect(content).toContain('Show-Menu')
    expect(content).toContain('Read-Host')
  })

  it('should handle multiple commands', async () => {
    await generateShellScript({ type: 'bash' })

    const [[, content]] = vi.mocked(writeFile).mock.calls
    expect(content).toContain('echo "one"')
    expect(content).toContain('echo "two"')
  })

  it('should use custom output file', async () => {
    await generateShellScript({
      type: 'bash',
      outputFile: 'custom.sh',
    })

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('custom.sh'),
      expect.any(String),
      'utf-8',
    )
  })

  it('should throw error if no menus found', async () => {
    vi.mocked(resolveConfig).mockResolvedValueOnce({
      config: { menus: [] },
      sources: ['cli.config.ts'],
    })

    await expect(generateShellScript()).rejects.toThrow('No menus found in config')
  })

  it('should throw error for unsupported script type', async () => {
    await expect(generateShellScript({
      type: 'invalid' as any,
    })).rejects.toThrow('Unsupported script type: invalid')
  })
})
