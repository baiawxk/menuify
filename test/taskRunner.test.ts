import type { CommandMenu, FunctionMenu, LinkMenu } from '../src/types'
import { checkbox, confirm, input, search } from '@inquirer/prompts'
import open from 'open'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskRunner } from '../src/taskRunner'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  search: vi.fn(),
  confirm: vi.fn(),
  checkbox: vi.fn(),
}))

vi.mock('execa', () => ({
  execa: vi.fn().mockImplementation((command) => {
    if (command.includes('error')) {
      return Promise.reject(new Error('Command failed'))
    }
    return Promise.resolve({ stdout: 'command output' })
  }),
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
  })

  describe('input handling', () => {
    it('should handle promptString input type', async () => {
      const mockInput = 'test input'
      vi.mocked(input).mockResolvedValueOnce(mockInput)

      const task: CommandMenu = {
        name: 'Prompt Task',
        type: 'command',
        task: 'echo %userInput%',
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
        task: 'echo %selectedOption%',
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
        task: 'echo %selected%',
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
        task: 'echo %input1% %input2%',
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
    })
  })

  describe('menu types', () => {
    it('should handle function type menu', async () => {
      const mockFn = vi.fn().mockResolvedValueOnce(undefined)
      const task: FunctionMenu = {
        name: 'Function Task',
        type: 'function',
        task: mockFn,
      }

      await taskRunner.executeTask(task)
      expect(mockFn).toHaveBeenCalled()
    })

    it('should pass inputs to function type menu', async () => {
      const mockFn = vi.fn().mockResolvedValueOnce(undefined)
      vi.mocked(input).mockResolvedValueOnce('test input')

      const task: FunctionMenu = {
        name: 'Function With Input',
        type: 'function',
        task: mockFn,
        inputs: [{
          id: 'testInput',
          type: 'promptString',
          description: 'Enter test input',
        }],
      }

      await taskRunner.executeTask(task)
      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          inputs: { testInput: 'test input' },
        }),
      )
    })

    it('should handle link type menu', async () => {
      const task: LinkMenu = {
        name: 'Link Task',
        type: 'link',
        task: 'https://example.com',
      }

      await taskRunner.executeTask(task)
      expect(open).toHaveBeenCalledWith('https://example.com')
    })
  })
})

describe('debug configuration', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log')
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should enable debug logging when debug is defined in env', async () => {
    process.env.DEBUG = 'true'
    const task: CommandMenu = {
      name: 'Test Task',
      type: 'command',
      task: 'echo "test"',
    }

    const taskRunner = new TaskRunner()
    await taskRunner.executeTask(task)

    expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', expect.any(String))
    process.env.DEBUG = undefined
  })

  it('should not log debug messages when debug is not defined in env', async () => {
    process.env.DEBUG = undefined
    const task: CommandMenu = {
      name: 'Test Task',
      type: 'command',
      task: 'echo "test"',
    }

    const taskRunner = new TaskRunner()
    await taskRunner.executeTask(task)

    expect(consoleSpy).not.toHaveBeenCalledWith('[DEBUG]', expect.any(String))
  })
})
