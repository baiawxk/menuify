import type { CommandMenu, FunctionMenu, LinkMenu, MenuItem } from '../src/core'
import { checkbox, confirm, input, search } from '@inquirer/prompts'
import { Listr } from 'listr2'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskRunner } from '../src/taskRunner'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  search: vi.fn(),
  confirm: vi.fn(),
  checkbox: vi.fn(),
}))

vi.mock('execa', () => ({
  execa: vi.fn().mockImplementation((command) => {
    if (command.includes('error'))
      return Promise.reject(new Error('Command failed'))
    return Promise.resolve({ stdout: 'command output' })
  }),
}))

vi.mock('listr2', () => ({
  Listr: vi.fn().mockImplementation((tasks, options) => ({
    run: async () => {
      if (options?.concurrent) {
        await Promise.all(tasks.map(t => t.task()))
      }
      else {
        for (const task of tasks)
          await task.task()
      }
    },
    tasks,
    options,
  })),
}))

vi.mock('open', () => ({
  default: vi.fn(),
}))

describe('taskRunner', () => {
  let taskRunner: TaskRunner

  beforeEach(() => {
    taskRunner = new TaskRunner()
    vi.clearAllMocks()
  })

  it('should execute a simple command task', async () => {
    const task: CommandMenu = {
      name: 'Test Task',
      type: 'command',
      task: 'echo "test"',
    }

    await taskRunner.executeTask(task)
    expect(taskRunner.getTaskStatus('Test Task')).toBe('completed')
  })

  it('should execute tasks in sequence when dependsOn is specified', async () => {
    const task1: CommandMenu = {
      name: 'Task 1',
      type: 'command',
      task: 'echo "task1"',
    }
    const task2: CommandMenu = {
      name: 'Task 2',
      type: 'command',
      task: 'echo "task2"',
      dependsOn: ['Task 1'],
    }

    // Mock findTaskByName using prototype to avoid type issues
    vi.spyOn(TaskRunner.prototype, 'findTaskByName')
      .mockImplementation(async (name: string) => {
        if (name === 'Task 1')
          return task1
        return undefined
      })

    await taskRunner.executeTask(task2)
    expect(taskRunner.getTaskStatus('Task 1')).toBe('completed')
    expect(taskRunner.getTaskStatus('Task 2')).toBe('completed')
  })

  describe('input Handling', () => {
    it('should handle promptString input type', async () => {
      const mockInput = 'test input'
      vi.mocked(input).mockResolvedValueOnce(mockInput)

      const task: CommandMenu = {
        name: 'Prompt Task',
        type: 'command',
        task: 'echo "${userInput}"',
        inputs: [{
          id: 'userInput',
          type: 'promptString',
          description: 'Enter your input',
          default: 'default value',
        }],
      }

      await taskRunner.executeTask(task)
      expect(input).toHaveBeenCalledWith({
        message: 'Enter your input',
        default: 'default value',
      })
    })

    it('should handle pickString input type', async () => {
      const mockChoice = 'option2'
      vi.mocked(search).mockResolvedValueOnce(mockChoice)

      const task: CommandMenu = {
        name: 'Pick Task',
        type: 'command',
        task: 'echo "${selectedOption}"',
        inputs: [{
          id: 'selectedOption',
          type: 'pickString',
          description: 'Select an option',
          options: ['option1', 'option2', 'option3'],
          default: 'option1',
        }],
      }

      await taskRunner.executeTask(task)
      expect(search).toHaveBeenCalled()
    })

    it('should handle confirm input type', async () => {
      const mockConfirm = true
      vi.mocked(confirm).mockResolvedValueOnce(mockConfirm)

      const task: CommandMenu = {
        name: 'Confirm Task',
        type: 'command',
        task: 'echo "confirmed"',
        inputs: [{
          id: 'confirmed',
          type: 'confirm',
          description: 'Are you sure?',
          default: 'false',
        }],
      }

      await taskRunner.executeTask(task)
      expect(confirm).toHaveBeenCalledWith({
        message: 'Are you sure?',
        default: false,
      })
    })

    it('should handle multiSelect input type', async () => {
      const mockSelected = ['option1', 'option3']
      vi.mocked(checkbox).mockResolvedValueOnce(mockSelected)

      const task: CommandMenu = {
        name: 'MultiSelect Task',
        type: 'command',
        task: 'echo "${selected}"',
        inputs: [{
          id: 'selected',
          type: 'multiSelect',
          description: 'Select options',
          options: ['option1', 'option2', 'option3'],
          joinSymbol: ';',
        }],
      }

      await taskRunner.executeTask(task)
      expect(checkbox).toHaveBeenCalledWith({
        message: 'Select options',
        choices: [
          { value: 'option1' },
          { value: 'option2' },
          { value: 'option3' },
        ],
        pageSize: 15,
      })
    })

    it('should handle multiple inputs in sequence', async () => {
      vi.mocked(input).mockResolvedValueOnce('input1')
      vi.mocked(search).mockResolvedValueOnce('choice1')

      const task: CommandMenu = {
        name: 'Multi Input Task',
        type: 'command',
        task: 'echo "${input1} ${input2}"',
        inputs: [
          {
            id: 'input1',
            type: 'promptString',
            description: 'Enter first input',
          },
          {
            id: 'input2',
            type: 'pickString',
            description: 'Select second input',
            options: ['choice1', 'choice2'],
          },
        ],
      }

      await taskRunner.executeTask(task)
      expect(input).toHaveBeenCalled()
      expect(search).toHaveBeenCalled()
      expect(taskRunner.getTaskStatus('Multi Input Task')).toBe('completed')
    })
  })

  describe('menu Types', () => {
    it('should handle function type menu', async () => {
      const mockFn = vi.fn()
      const task: FunctionMenu = {
        name: 'Function Task',
        type: 'function',
        value: mockFn,
      }

      await taskRunner.processMenu(task)
      expect(mockFn).toHaveBeenCalledWith(undefined)
    })

    it('should pass inputs to function type menu', async () => {
      const mockFn = vi.fn()
      vi.mocked(input).mockResolvedValueOnce('test input')

      const task: FunctionMenu = {
        name: 'Function With Input',
        type: 'function',
        value: mockFn,
        inputs: [
          {
            id: 'testInput',
            type: 'promptString',
            description: 'Enter test input',
          },
        ],
      }

      await taskRunner.processMenu(task)
      expect(mockFn).toHaveBeenCalledWith({ testInput: 'test input' })
    })

    it('should handle link type menu', async () => {
      const task: LinkMenu = {
        name: 'Link Task',
        type: 'link',
        value: 'https://example.com',
      }

      await taskRunner.processMenu(task)
      // Note: We can't really test the link opening since it uses the 'open' package
      // which we don't want to actually execute in tests
    })
  })
})

describe('debug configuration', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log')
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should enable debug logging when debug is true in config', async () => {
    const config: CliConfig = {
      debug: true,
      menus: [{
        name: 'Test Task',
        type: 'command',
        task: 'echo "test"'
      }]
    }

    const taskRunner = new TaskRunner(config)
    const task = config.menus![0]

    await taskRunner.executeTask(task)

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
  })

  it('should not log debug messages when debug is false', async () => {
    const config: CliConfig = {
      debug: false,
      menus: [{
        name: 'Test Task',
        type: 'command',
        task: 'echo "test"'
      }]
    }

    const taskRunner = new TaskRunner(config)
    const task = config.menus![0]

    await taskRunner.executeTask(task)

    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
  })

  it('should not log debug messages when debug is undefined', async () => {
    const config: CliConfig = {
      menus: [{
        name: 'Test Task',
        type: 'command',
        task: 'echo "test"'
      }]
    }

    const taskRunner = new TaskRunner(config)
    const task = config.menus![0]

    await taskRunner.executeTask(task)

    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
  })
})
