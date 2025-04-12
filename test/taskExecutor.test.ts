import { spawn } from 'node:child_process'
import { open } from 'open'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnvResolver } from '../src/envResolver'
import { executeTask } from '../src/taskExecutor'

// Mock dependencies
vi.mock('node:child_process')
vi.mock('open')
vi.mock('../src/envResolver', () => ({
  EnvResolver: vi.fn(() => ({
    resolve: vi.fn(str => str),
  })),
}))

describe('taskExecutor', () => {
  const mockSpawn = {
    on: vi.fn(),
    stdout: { pipe: vi.fn() },
    stderr: { pipe: vi.fn() },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(spawn).mockReturnValue(mockSpawn as any)
  })

  it('should execute command task', async () => {
    const task = {
      name: 'test',
      type: 'command',
      value: 'echo hello',
    }

    await executeTask(task)
    expect(spawn).toHaveBeenCalledWith('echo hello', {
      stdio: 'inherit',
      shell: true,
    })
  })

  it('should execute link task', async () => {
    const task = {
      name: 'test',
      type: 'link',
      value: 'https://example.com',
    }

    await executeTask(task)
    expect(open).toHaveBeenCalledWith('https://example.com')
  })

  it('should resolve env variables', async () => {
    const task = {
      name: 'test',
      type: 'command',
      value: 'echo %HOME%',
    }

    const mockResolver = new EnvResolver()
    vi.mocked(mockResolver.resolve).mockReturnValue('echo /home/user')

    await executeTask(task, { envResolver: mockResolver })
    expect(mockResolver.resolve).toHaveBeenCalledWith('echo %HOME%')
    expect(spawn).toHaveBeenCalledWith('echo /home/user', {
      stdio: 'inherit',
      shell: true,
    })
  })

  it('should handle command error', async () => {
    const task = {
      name: 'test',
      type: 'command',
      value: 'invalid-command',
    }

    mockSpawn.on.mockImplementation((event, cb) => {
      if (event === 'error')
        cb(new Error('Command failed'))
    })

    await expect(executeTask(task)).rejects.toThrow('Command failed')
  })
})
