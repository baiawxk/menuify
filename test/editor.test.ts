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

describe.skip('editor', () => {
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

  it('should use notepad on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })

    await editConfig()
    expect(spawn).toHaveBeenCalledWith('notepad', ['/path/to/config.ts'], {
      stdio: 'inherit',
      shell: true,
    })
  })

  it('should use vi on non-Windows platforms', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })

    await editConfig()
    expect(spawn).toHaveBeenCalledWith('vi', ['/path/to/config.ts'], {
      stdio: 'inherit',
      shell: true,
    })
  })

  it('should use EDITOR environment variable if set', async () => {
    process.env.EDITOR = 'code'

    await editConfig()
    expect(spawn).toHaveBeenCalledWith('code', ['/path/to/config.ts'], {
      stdio: 'inherit',
      shell: true,
    })
  })

  it('should throw error if editor exits with non-zero code', async () => {
    mockSpawn.on.mockImplementation((event, cb) => {
      if (event === 'exit')
        cb(1)
    })

    await expect(editConfig()).rejects.toThrow('Editor exited with code 1')
  })

  it('should throw error if editor process fails', async () => {
    mockSpawn.on.mockImplementation((event, cb) => {
      if (event === 'error')
        cb(new Error('Process failed'))
    })

    await expect(editConfig()).rejects.toThrow('Process failed')
  })

  it('should throw error if config file not found', async () => {
    vi.mocked(existsSync).mockReturnValue(false)

    await expect(editConfig('nonexistent')).rejects.toThrow('No config file found')
  })
})
