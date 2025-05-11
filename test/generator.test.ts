import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { genShell } from '../src/generator'

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}))

describe('shell generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(true)
  })

  describe('cross-platform command normalization', () => {
    it('should normalize environment variables for bash', async () => {
      await genShell({
        shell: 'echo %TEST_VAR%',
        cmdName: 'test',
        type: 'bash',
      })

      const [[, content]] = vi.mocked(writeFile).mock.calls
      expect(content).toContain('echo $TEST_VAR')
    })

    it('should normalize environment variables for cmd', async () => {
      await genShell({
        shell: 'echo $TEST_VAR',
        cmdName: 'test',
        type: 'cmd',
      })

      const [[, content]] = vi.mocked(writeFile).mock.calls
      expect(content).toContain('echo %TEST_VAR%')
    })

    it('should normalize environment variables for powershell', async () => {
      await genShell({
        shell: 'echo %TEST_VAR%',
        cmdName: 'test',
        type: 'ps1',
      })

      const [[, content]] = vi.mocked(writeFile).mock.calls
      expect(content).toContain('echo $env:env:TEST_VAR')
    })
  })

  describe('shell type support', () => {
    it('should generate fish shell script', async () => {
      await genShell({
        shell: 'echo test',
        cmdName: 'test',
        type: 'fish',
      })

      const [[, content]] = vi.mocked(writeFile).mock.calls
      expect(content).toContain('#!/usr/bin/env fish')
      expect(content).toContain('set -e')
    })

    it('should generate zsh shell script', async () => {
      await genShell({
        shell: 'echo test',
        cmdName: 'test',
        type: 'zsh',
      })

      const [[, content]] = vi.mocked(writeFile).mock.calls
      expect(content).toContain('#!/bin/zsh')
      expect(content).toContain('set -e')
    })

    it('should throw error for unsupported shell type', async () => {
      await expect(genShell({
        shell: 'echo test',
        cmdName: 'test',
        type: 'invalid' as any,
      })).rejects.toThrow('Unsupported script type: invalid')
    })
  })

  describe('output configuration', () => {
    it.skip('should use custom output directory', async () => {
      const outputDir = '/custom/output/dir'
      vi.mocked(existsSync).mockReturnValue(false)

      await genShell({
        shell: 'echo test',
        cmdName: 'test',
        type: 'bash',
        outputDir,
      })

      expect(mkdir).toHaveBeenCalledWith(outputDir, { recursive: true })
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(outputDir),
        expect.any(String),
        'utf-8',
      )
    })

    it('should use custom filename', async () => {
      await genShell({
        shell: 'echo test',
        cmdName: 'test',
        fileName: 'custom-name',
        type: 'bash',
      })

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('custom-name.sh'),
        expect.any(String),
        'utf-8',
      )
    })

    it('should create missing directories', async () => {
      vi.mocked(existsSync).mockReturnValue(false)

      await genShell({
        shell: 'echo test',
        cmdName: 'test',
        outputDir: 'new/dir',
        type: 'bash',
      })

      expect(mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true },
      )
    })
  })
})
