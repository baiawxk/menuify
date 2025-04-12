import type { MenuItem } from '../../src/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { execa } from 'execa'
import open from 'open'
import { TaskHandler } from '../../src/handlers/taskHandler'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('open', () => ({
  default: vi.fn(),
}))

describe('TaskHandler', () => {
  let taskHandler: TaskHandler
  let mockContext: any

  beforeEach(() => {
    vi.clearAllMocks()
    taskHandler = new TaskHandler()
    mockContext = {
      env: { GLOBAL_VAR: 'global' },
      menuEnv: { MENU_VAR: 'menu' },
      inputs: { INPUT_VAR: 'input' },
      debug: false,
    }
  })

  describe('Command Tasks', () => {
    it('should execute single command task', async () => {
      const menu: MenuItem = {
        name: 'Test Command',
        type: 'command',
        task: 'echo %GLOBAL_VAR%',
      }

      await taskHandler.executeMenuItem(menu, mockContext)

      expect(execa).toHaveBeenCalledWith('echo global', {
        shell: true,
        stdio: 'inherit',
      })
    })

    it('should execute multiple commands in sequence', async () => {
      const menu: MenuItem = {
        name: 'Multiple Commands',
        type: 'command',
        task: [
          'echo %GLOBAL_VAR%',
          'echo {MENU_VAR}',
        ],
      }

      await taskHandler.executeMenuItem(menu, mockContext)

      expect(execa).toHaveBeenCalledTimes(2)
      expect(execa).toHaveBeenNthCalledWith(1, 'echo global', {
        shell: true,
        stdio: 'inherit',
      })
      expect(execa).toHaveBeenNthCalledWith(2, 'echo menu', {
        shell: true,
        stdio: 'inherit',
      })
    })

    it('should handle command errors', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('Command failed'))

      const menu: MenuItem = {
        name: 'Failed Command',
        type: 'command',
        task: 'invalid-command',
      }

      await expect(taskHandler.executeMenuItem(menu, mockContext))
        .rejects.toThrow('Command failed')
    })
  })

  describe('Link Tasks', () => {
    it('should execute link task', async () => {
      const menu: MenuItem = {
        name: 'Test Link',
        type: 'link',
        task: 'https://example.com/%GLOBAL_VAR%',
      }

      await taskHandler.executeMenuItem(menu, mockContext)

      expect(open).toHaveBeenCalledWith('https://example.com/global')
    })
  })

  describe('Function Tasks', () => {
    it('should execute function task', async () => {
      const mockFn = vi.fn()
      const menu: MenuItem = {
        name: 'Test Function',
        type: 'function',
        task: mockFn,
      }

      await taskHandler.executeMenuItem(menu, mockContext)

      expect(mockFn).toHaveBeenCalledWith({
        env: mockContext.env,
        menuEnv: mockContext.menuEnv,
        inputs: mockContext.inputs,
      })
    })

    it('should handle function errors', async () => {
      const mockFn = vi.fn().mockRejectedValueOnce(new Error('Function failed'))
      const menu: MenuItem = {
        name: 'Failed Function',
        type: 'function',
        task: mockFn,
      }

      await expect(taskHandler.executeMenuItem(menu, mockContext))
        .rejects.toThrow('Function failed')
    })
  })

  describe('Debug Logging', () => {
    beforeEach(() => {
      mockContext.debug = true
    })

    it('should log debug info for command execution', async () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const menu: MenuItem = {
        name: 'Debug Command',
        type: 'command',
        task: 'echo test',
      }

      await taskHandler.executeMenuItem(menu, mockContext)

      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Executing menu item: Debug Command (command)')
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Executing command: echo test')
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG] Menu item Debug Command executed successfully')
    })

    it('should log debug info for errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      vi.mocked(execa).mockRejectedValueOnce(new Error('Test error'))

      const menu: MenuItem = {
        name: 'Debug Error',
        type: 'command',
        task: 'error-command',
      }

      await expect(taskHandler.executeMenuItem(menu, mockContext)).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[DEBUG] Error executing menu item Debug Error:',
        expect.any(Error),
      )
    })
  })
})
