import type { ExecutionContext } from '../src/taskExecutor'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { execa } from 'execa'
import open from 'open'
import { EnvResolver } from '../src/envResolver'
import { executeMenus } from '../src/taskExecutor'
import type { CliConfig, MenuItem } from '../src/core'

// Mock dependencies
vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}))

vi.mock('open', () => ({
  default: vi.fn()
}))

vi.mock('../src/envResolver', () => ({
  EnvResolver: vi.fn(() => ({
    resolve: vi.fn(str => str),
  })),
}))

describe('taskExecutor', () => {
  let mockExeca: jest.Mock

  beforeEach(() => {
    vi.clearAllMocks()
    mockExeca = vi.mocked(execa)
  })

  it('should execute command task', async () => {
    const menu: MenuItem = {
      name: 'test',
      type: 'command',
      task: 'echo hello'
    }

    await executeMenus([menu], {
      context: { env: {}, menuEnv: {} },
    })

    expect(mockExeca).toHaveBeenCalledWith(
      'echo hello',
      expect.objectContaining({ shell: true, stdio: 'inherit' })
    )
  })

  it('should execute link task', async () => {
    const menu: MenuItem = {
      name: 'test',
      type: 'link',
      task: 'https://example.com'
    }

    await executeMenus([menu], {
      context: { env: {}, menuEnv: {} },
    })

    expect(open).toHaveBeenCalledWith('https://example.com')
  })

  it('should resolve env variables', async () => {
    const menu: MenuItem = {
      name: 'test',
      type: 'command',
      task: 'echo %HOME%'
    }

    const context: ExecutionContext = {
      env: { HOME: '/home/user' },
      menuEnv: {}
    }

    await executeMenus([menu], { context,  })

    expect(mockExeca).toHaveBeenCalledWith(
      'echo /home/user',
      expect.objectContaining({ shell: true, stdio: 'inherit' })
    )
  })

  describe('environment variable precedence', () => {
    it('should give precedence to menu env over global env', async () => {
      const menu: MenuItem = {
        name: 'Test ENV',
        type: 'command',
        task: 'echo %SHARED_VAR%',
        env: {
          SHARED_VAR: 'menu-value',
        },
      }

      const context = {
        env: {
          SHARED_VAR: 'global-value',
        },
        menuEnv: {},
        debug: true,
      }

      await executeMenus([menu], { context, })

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

      const context = {
        env: {
          GLOBAL_VAR: 'global-value',
        },
        menuEnv: {},
        debug: true,
      }

      await executeMenus([menu], { context,  })

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

      await executeMenus(menus, { context: { env: {}, menuEnv: {} } })

      expect(mockExeca).toHaveBeenNthCalledWith(1,
        'echo "task1"',
        expect.objectContaining({ shell: true }),
      )
      expect(mockExeca).toHaveBeenNthCalledWith(2,
        'echo "task2"',
        expect.objectContaining({ shell: true }),
      )
    })

    it('should handle command error', async () => {
      mockExeca.mockRejectedValueOnce(new Error('Command failed'))

      await expect(executeMenus([
        { name: 'Failed Task', type: 'command', task: 'invalid-command' },
      ] as MenuItem[])).rejects.toThrow('Command failed')
    })
  })

  describe('debug configuration', () => {
    it('should enable debug logging when debug is true', async () => {
      const config: CliConfig = {
        debug: true,
        menus: [{
          name: 'Test Task',
          type: 'command',
          task: 'echo "test"',
        }],
      }

      const consoleSpy = vi.spyOn(console, 'log')
      await executeMenus(config.menus!, { context: { debug: true } })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
    })
  })
})
