import type { ExecutionContext, TaskInput } from '../core'
import { checkbox, confirm, input, search } from '@inquirer/prompts'

export class InputHandler {
  /**
   * Process a single input definition
   */
  async processInput(taskInput: TaskInput, context: ExecutionContext): Promise<unknown> {
    let result: unknown

    switch (taskInput.type) {
      case 'promptString':
        result = await this.handlePromptString(taskInput)
        break
      case 'pickString':
        result = await this.handlePickString(taskInput)
        break
      case 'confirm':
        result = await this.handleConfirm(taskInput)
        break
      case 'multiSelect':
        result = await this.handleMultiSelect(taskInput)
        break
      default:
        throw new Error(`Unsupported input type: ${taskInput.type}`)
    }

    // Store result in context
    if (!context.inputs)
      context.inputs = {}
    context.inputs[taskInput.id] = result

    if (context.debug)
      console.log(`[DEBUG] Input ${taskInput.id} processed with value:`, result)

    return result
  }

  private async handlePromptString(taskInput: TaskInput): Promise<string> {
    return await input({
      message: taskInput.description || `Enter value for ${taskInput.id}`,
      default: taskInput.default,
    })
  }

  private async handlePickString(taskInput: TaskInput): Promise<string> {
    if (!taskInput.options?.length)
      return taskInput.default || ''

    return await search({
      message: taskInput.description || `Select value for ${taskInput.id}`,
      initialValue: taskInput.default,
      source: async (term) => {
        if (!term)
          return taskInput.options || []
        return taskInput.options?.filter(opt =>
          opt.toLowerCase().includes(term.toLowerCase()),
        ) || []
      },
    })
  }

  private async handleConfirm(taskInput: TaskInput): Promise<boolean> {
    return await confirm({
      message: taskInput.description || `Confirm ${taskInput.id}?`,
      default: taskInput.default === 'true' || taskInput.default === true
        ? true
        : taskInput.default === 'false' || taskInput.default === false
          ? false
          : undefined,
    })
  }

  private async handleMultiSelect(taskInput: TaskInput): Promise<string> {
    if (!taskInput.options?.length)
      return ''

    const choices = taskInput.options.map(opt => ({ value: opt }))
    const selected = await checkbox({
      message: taskInput.description || `Select values for ${taskInput.id}`,
      choices,
      pageSize: 15,
    })

    return selected?.length ? selected.join(taskInput.joinSymbol || ',') : ''
  }
}
