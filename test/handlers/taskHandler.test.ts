import type { MenuItem } from '../../src/core'
import { execa } from 'execa'
import open from 'open'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskHandler } from '../../src/handlers/taskHandler'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))

vi.mock('open', () => ({
  default: vi.fn(),
}))

describe('taskHandler', () => {
  let taskHandler: TaskHandler
  let mockContext: any

  beforeEach(() => {
    vi.clearAllMocks()
    taskHandler = new TaskHandler()
    mockContext = {
      env: { TEST_VAR: 'test_value' },
      inputs: { INPUT_VAR: 'input' },
      debug: false,
    }
  })

  describe('commandTasks', () => {
    it('should execute single command task', async () => {
      const menu: MenuItem = {
        name: 'Test Command',
        type: 'command',
        task: 'echo %INPUT_VAR%',
      }

      await taskHandler.executeMenuItem(menu, mockContext)

      expect(execa).toHaveBeenCalledWith('echo input', {
        shell: true,
        stdio: 'inherit',
        env: expect.objectContaining({
          TEST_VAR: 'test_value',
        }),
      })
    })

    it('should handle array of commands', async () => {
      const menu: MenuItem = {
        name: 'Multiple Commands',
        type: 'command',
        task: ['echo first', 'echo second'],
      }

      await taskHandler.executeMenuItem(menu, mockContext)
      expect(execa).toHaveBeenCalledTimes(2)
    })
  })

  describe('linkTasks', () => {
    it('should execute link task', async () => {
      const menu: MenuItem = {
        name: 'Test Link',
        type: 'link',
        task: 'https://example.com',
      }

      await taskHandler.executeMenuItem(menu, mockContext)
      expect(open).toHaveBeenCalledWith('https://example.com')
    })
  })

  describe('functionTasks', () => {
    it('should execute function task', async () => {
      const mockFn = vi.fn()
      const menu: MenuItem = {
        name: 'Function Task',
        type: 'function',
        task: mockFn,
      }

      await taskHandler.executeMenuItem(menu, mockContext)
      expect(mockFn).toHaveBeenCalledWith({
        env: expect.objectContaining({
          TEST_VAR: 'test_value',
        }),
        inputs: { INPUT_VAR: 'input' },
      })
    })
  })
})
