import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { editConfig } from '../src/editor'

// Mock dependencies
vi.mock('node:child_process')
vi.mock('node:fs')
vi.mock('../src/core', () => ({
  resolveConfig: vi.fn().mockImplementation(async () => ({
    sources: ['/path/to/config.ts'],
  })),
}))

describe('editor', () => {
  const mockSpawn = {
    on: vi.fn(),
    stdout: { pipe: vi.fn() },
    stderr: { pipe: vi.fn() },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(spawn).mockReturnValue(mockSpawn as any)
    vi.mocked(existsSync).mockReturnValue(true)
    process.env.EDITOR = undefined
  })

  describe('editor selection', () => {
    it('should use specified editor when provided', async () => {
      // Setup mock spawn event handlers
      mockSpawn.on.mockImplementation((event, cb) => {
        if (event === 'exit')
          cb(0) // Simulate successful exit
      })

      await editConfig({ editor: 'code' })
      expect(spawn).toHaveBeenCalledWith('code', ['--wait', '/path/to/config.ts'], expect.any(Object))
    })

    it('should use process.env.EDITOR when no editor specified', async () => {
      process.env.EDITOR = 'nano'
      await editConfig({})
      expect(spawn).toHaveBeenCalledWith('notepad', ['/path/to/config.ts'], expect.any(Object))
    })

    it('should use platform-specific default when no editor specified', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32' })

      await editConfig({})
      expect(spawn).toHaveBeenCalledWith('notepad', ['/path/to/config.ts'], expect.any(Object))

      Object.defineProperty(process, 'platform', { value: originalPlatform })
    })
  })

  describe('editor command mapping', () => {
    it('should map sublime text command correctly on Windows', async () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32' })

      await editConfig({ editor: 'sublime' })
      expect(spawn).toHaveBeenCalledWith('subl', ['--wait', '/path/to/config.ts'], expect.any(Object))

      Object.defineProperty(process, 'platform', { value: originalPlatform })
    })

    it('should map VSCode command with correct arguments', async () => {
      await editConfig({ editor: 'code' })
      expect(spawn).toHaveBeenCalledWith('code', ['--wait', '/path/to/config.ts'], expect.any(Object))
    })
  })

  describe('error handling', () => {
    it('should throw error when editor not found', async () => {
      mockSpawn.on.mockImplementation((event, cb) => {
        if (event === 'error')
          cb(new Error('ENOENT'))
      })

      await expect(editConfig({ editor: 'nonexistent' }))
        .rejects
        .toThrow('Editor "nonexistent" not found')
    })

    it('should handle non-zero exit codes', async () => {
      mockSpawn.on.mockImplementation((event, cb) => {
        if (event === 'exit')
          cb(1)
      })

      await expect(editConfig({ editor: 'vim' }))
        .rejects
        .toThrow('Editor exited with code 1')
    })
  })
})
