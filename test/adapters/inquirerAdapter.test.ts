import type { ListrTask } from 'listr2'
import { checkbox, confirm, input, search } from '@inquirer/prompts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InquirerAdapter } from '../../src/adapters/inquirerAdapter'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  search: vi.fn(),
  confirm: vi.fn(),
  MultiSelect: vi.fn(),
  checkbox: vi.fn(),
}))

describe('inquirerAdapter', () => {
  let adapter: InquirerAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = InquirerAdapter.createRenderer([])
  })

  describe('input Processing', () => {
    it('should handle promptString input type', async () => {
      const mockInput = 'test input'
      vi.mocked(input).mockResolvedValueOnce(mockInput)

      const context = {}
      await adapter.processInput({
        id: 'testInput',
        type: 'promptString',
        description: 'Enter test input',
        default: 'default value',
      }, context)

      expect(input).toHaveBeenCalledWith({
        message: 'Enter test input',
        default: 'default value',
      })
      expect(context).toHaveProperty('inputs.testInput', mockInput)
    })

    it('should handle pickString input type', async () => {
      const mockChoice = 'option2'
      vi.mocked(search).mockResolvedValueOnce(mockChoice)

      const context = {}
      await adapter.processInput({
        id: 'selection',
        type: 'pickString',
        description: 'Select an option',
        options: ['option1', 'option2', 'option3'],
        default: 'option1',
      }, context)

      expect(search).toHaveBeenCalled()
      expect(context).toHaveProperty('inputs.selection', mockChoice)
    })

    it('should handle confirm input type', async () => {
      const mockConfirm = true
      vi.mocked(confirm).mockResolvedValueOnce(mockConfirm)

      const context = {}
      await adapter.processInput({
        id: 'confirmation',
        type: 'confirm',
        description: 'Are you sure?',
        default: false,
      }, context)

      expect(confirm).toHaveBeenCalledWith({
        message: 'Are you sure?',
        default: false,
      })
      expect(context).toHaveProperty('inputs.confirmation', mockConfirm)
    })

    it('should handle multiSelect input type', async () => {
      const mockSelected = ['option1', 'option3']
      vi.mocked(checkbox).mockResolvedValueOnce(mockSelected)

      const context = {}
      await adapter.processInput({
        id: 'multiSelect',
        type: 'multiSelect',
        description: 'Select options',
        options: ['option1', 'option2', 'option3'],
        joinSymbol: ';',
      }, context)

      expect(checkbox).toHaveBeenCalledWith({
        message: 'Select options',
        choices: [
          { value: 'option1' },
          { value: 'option2' },
          { value: 'option3' },
        ],
        pageSize: 15,
      })
      expect(context).toHaveProperty('inputs.multiSelect', mockSelected.join(';'))
    })

    it('should throw error for unsupported input type', async () => {
      const context = {}
      await expect(adapter.processInput({
        id: 'invalid',
        type: 'unsupported' as any,
        description: 'Invalid input',
      }, context)).rejects.toThrow('Unsupported input type: unsupported')
    })
  })

  describe('renderer Interface', () => {
    it('should implement required renderer methods', () => {
      expect(adapter.render).toBeDefined()
      expect(adapter.end).toBeDefined()
      expect(InquirerAdapter.nonTTY).toBe(false)
      expect(InquirerAdapter.ttys).toBe(true)
    })

    it('should check input availability', () => {
      expect(adapter.isInputAvailable()).toBe(process.stdin.isTTY === true)
    })
  })

  describe('context Handling', () => {
    it('should initialize inputs object if not exists', async () => {
      const mockInput = 'test'
      vi.mocked(input).mockResolvedValueOnce(mockInput)

      const context = {}
      await adapter.processInput({
        id: 'test',
        type: 'promptString',
        description: 'Test',
      }, context)

      expect(context).toHaveProperty('inputs')
      expect(context).toHaveProperty('inputs.test', mockInput)
    })

    it('should preserve existing inputs in context', async () => {
      const mockInput = 'new value'
      vi.mocked(input).mockResolvedValueOnce(mockInput)

      const context = {
        inputs: {
          existing: 'old value',
        },
      }

      await adapter.processInput({
        id: 'test',
        type: 'promptString',
        description: 'Test',
      }, context)

      expect(context.inputs).toHaveProperty('existing', 'old value')
      expect(context.inputs).toHaveProperty('test', mockInput)
    })
  })
})
