import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkbox, confirm, input, search } from '@inquirer/prompts'
import { InputHandler } from '../../src/handlers/inputHandler'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  search: vi.fn(),
  confirm: vi.fn(),
  checkbox: vi.fn(),
}))

describe('InputHandler', () => {
  let inputHandler: InputHandler
  let mockContext: any

  beforeEach(() => {
    vi.clearAllMocks()
    inputHandler = new InputHandler()
    mockContext = {
      env: {},
      menuEnv: {},
      debug: false,
    }
  })

  it('should handle promptString input', async () => {
    const mockValue = 'test input'
    vi.mocked(input).mockResolvedValueOnce(mockValue)

    const result = await inputHandler.processInput({
      id: 'testInput',
      type: 'promptString',
      description: 'Enter test input',
      default: 'default',
    }, mockContext)

    expect(input).toHaveBeenCalledWith({
      message: 'Enter test input',
      default: 'default',
    })
    expect(result).toBe(mockValue)
    expect(mockContext.inputs.testInput).toBe(mockValue)
  })

  it('should handle pickString input', async () => {
    const mockValue = 'option2'
    vi.mocked(search).mockResolvedValueOnce(mockValue)

    const result = await inputHandler.processInput({
      id: 'testSelect',
      type: 'pickString',
      description: 'Select an option',
      options: ['option1', 'option2', 'option3'],
      default: 'option1',
    }, mockContext)

    expect(search).toHaveBeenCalled()
    expect(result).toBe(mockValue)
    expect(mockContext.inputs.testSelect).toBe(mockValue)
  })

  it('should handle confirm input', async () => {
    const mockValue = true
    vi.mocked(confirm).mockResolvedValueOnce(mockValue)

    const result = await inputHandler.processInput({
      id: 'testConfirm',
      type: 'confirm',
      description: 'Confirm action?',
      default: 'true',
    }, mockContext)

    expect(confirm).toHaveBeenCalledWith({
      message: 'Confirm action?',
      default: true,
    })
    expect(result).toBe(mockValue)
    expect(mockContext.inputs.testConfirm).toBe(mockValue)
  })

  it('should handle multiSelect input', async () => {
    const mockValue = ['option1', 'option3']
    vi.mocked(checkbox).mockResolvedValueOnce(mockValue)

    const result = await inputHandler.processInput({
      id: 'testMulti',
      type: 'multiSelect',
      description: 'Select options',
      options: ['option1', 'option2', 'option3'],
      joinSymbol: ';',
    }, mockContext)

    expect(checkbox).toHaveBeenCalledWith({
      message: 'Select options',
      choices: [
        { value: 'option1' },
        { value: 'option2' },
        { value: 'option3' },
      ],
      pageSize: 15,
    })
    expect(result).toBe(mockValue.join(';'))
    expect(mockContext.inputs.testMulti).toBe(mockValue.join(';'))
  })

  it('should handle debug logging', async () => {
    const mockValue = 'test'
    vi.mocked(input).mockResolvedValueOnce(mockValue)
    const consoleSpy = vi.spyOn(console, 'log')
    mockContext.debug = true

    await inputHandler.processInput({
      id: 'testDebug',
      type: 'promptString',
      description: 'Test debug',
    }, mockContext)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[DEBUG] Input testDebug processed with value:',
      mockValue,
    )
  })

  it('should throw error for invalid input type', async () => {
    await expect(inputHandler.processInput({
      id: 'invalid',
      type: 'invalid' as any,
      description: 'Invalid type',
    }, mockContext)).rejects.toThrow('Unsupported input type: invalid')
  })
})
