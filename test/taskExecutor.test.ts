import type { ExecutionContext } from '../src/taskExecutor'
import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest'
import { execa, type ExecaMethod } from 'execa'
import open from 'open'
import { executeMenus } from '../src/taskExecutor'
import type { CliConfig, MenuItem } from '../src/core'

// Mock dependencies
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}))

vi.mock('open', () => ({
  default: vi.fn(),
}))

describe('taskExecutor', () => {
  let mockExeca: MockedFunction<ExecaMethod<{}>>

  beforeEach(() => {
    vi.clearAllMocks()
    mockExeca = vi.mocked(execa)
  })

  it('should execute command task', async () => {
    const menu: MenuItem = {
      name: 'Test Command',
      type: 'command',
      task: 'echo hello',
    }

    await executeMenus([menu], {
      context: { env: {}, menuEnv: {} },
      taskRunMode: 'serial',
    })

    expect(mockExeca).toHaveBeenCalledWith(
      'echo hello',
      expect.objectContaining({ shell: true, stdio: 'inherit' }),
    )
  })

  it('should execute link task', async () => {
    const menu: MenuItem = {
      name: 'Test Link',
      type: 'link',
      task: 'https://example.com',
    }

    await executeMenus([menu], {
      context: { env: {}, menuEnv: {} },
      taskRunMode: 'serial',
    })

    expect(open).toHaveBeenCalledWith('https://example.com')
  })

  describe('environment variable precedence', () => {
    it('should give precedence to menu env over global env', async () => {
      const menu: MenuItem = {
        name: 'Test ENV',
        type: 'command',
        task: 'echo %VAR%',
        env: {
          VAR: 'menu-value',
        },
      }

      const context: ExecutionContext = {
        env: {
          VAR: 'global-value',
        },
        menuEnv: {},
        debug: true,
      }

      await executeMenus([menu], { context, taskRunMode: 'serial' })

      expect(mockExeca).toHaveBeenCalledWith(
        'echo menu-value',
        expect.objectContaining({ shell: true, stdio: 'inherit' }),
      )
    })

    it('should resolve both global and menu variables', async () => {
      const menu: MenuItem = {
        name: 'Test Both ENV',
        type: 'command',
        task: 'echo %GLOBAL_VAR% {MENU_VAR}',
        env: {
          MENU_VAR: 'menu-value',
        },
      }

      const context: ExecutionContext = {
        env: {
          GLOBAL_VAR: 'global-value',
        },
        menuEnv: {},
        debug: true,
      }

      await executeMenus([menu], { context, taskRunMode: 'serial' })

      expect(mockExeca).toHaveBeenCalledWith(
        'echo global-value menu-value',
        expect.objectContaining({ shell: true, stdio: 'inherit' }),
      )
    })
  })

  describe('task execution modes', () => {
    it('should execute tasks serially by default', async () => {
      const menus = [
        { name: 'Task 1', type: 'command', task: 'echo "task1"' },
        { name: 'Task 2', type: 'command', task: 'echo "task2"' },
      ] as MenuItem[]

      await executeMenus(menus, { taskRunMode: 'serial' })

      expect(mockExeca).toHaveBeenNthCalledWith(1,
        'echo "task1"',
        expect.objectContaining({ shell: true, stdio: 'inherit' }),
      )
      expect(mockExeca).toHaveBeenNthCalledWith(2,
        'echo "task2"',
        expect.objectContaining({ shell: true, stdio: 'inherit' }),
      )
    })

    it('should handle command error', async () => {
      mockExeca.mockRejectedValueOnce(new Error('Command failed'))

      await expect(executeMenus([
        { name: 'Failed Task', type: 'command', task: 'invalid-command' },
      ] as MenuItem[])).rejects.toThrow('Task execution failed: Command failed')
    })
  })

  describe('debug configuration', () => {
    it('should enable debug logging when debug is true', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await executeMenus([{
        name: 'Test Task',
        type: 'command',
        task: 'echo "test"',
      }], {
        context: { debug: true, env: {}, menuEnv: {} },
      })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
    })
  })
})
