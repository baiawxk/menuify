import { describe, expect, it, vi } from 'vitest'
import { handleInput } from '../src/adapters/inquirerAdapter'
import { input, select, confirm } from '@inquirer/prompts'

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  MultiSelect: vi.fn()
}))

describe('inquirerAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle promptString input', async () => {
    vi.mocked(input).mockResolvedValue('test input')
    const result = await handleInput({
      id: 'name',
      type: 'promptString',
      description: 'Enter your name'
    })
    expect(input).toHaveBeenCalledWith({
      message: 'Enter your name',
      default: undefined
    })
    expect(result).toBe('test input')
  })

  it('should handle pickString input', async () => {
    vi.mocked(select).mockResolvedValue('option1')
    const result = await handleInput({
      id: 'env',
      type: 'pickString',
      description: 'Select environment',
      options: ['option1', 'option2']
    })
    expect(select).toHaveBeenCalledWith({
      message: 'Select environment',
      choices: [
        { name: 'option1', value: 'option1' },
        { name: 'option2', value: 'option2' }
      ]
    })
    expect(result).toBe('option1')
  })

  it('should handle confirm input', async () => {
    vi.mocked(confirm).mockResolvedValue(true)
    const result = await handleInput({
      id: 'confirm',
      type: 'confirm',
      description: 'Are you sure?'
    })
    expect(confirm).toHaveBeenCalledWith({
      message: 'Are you sure?',
      default: undefined
    })
    expect(result).toBe(true)
  })

  it('should handle default values', async () => {
    vi.mocked(input).mockResolvedValue('default value')
    await handleInput({
      id: 'test',
      type: 'promptString',
      description: 'Test input',
      default: 'default value'
    })
    expect(input).toHaveBeenCalledWith({
      message: 'Test input',
      default: 'default value'
    })
  })

  it('should throw error for invalid input type', async () => {
    await expect(handleInput({
      id: 'test',
      type: 'invalidType' as any,
      description: 'Test'
    })).rejects.toThrow('Unknown input type: invalidType')
  })
})
