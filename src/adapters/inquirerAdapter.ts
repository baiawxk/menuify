import type { ListrOptions, ListrRenderer, ListrRendererFactory, ListrTask } from 'listr2'
import type { TaskInput } from '../core'
import process from 'node:process'
import * as inquirer from '@inquirer/prompts'

export interface InquirerContext {
  inputs?: Record<string, any>
  env: Record<string, string>
  menuEnv: Record<string, string>
}

export class InquirerAdapter implements ListrRenderer {
  private tasks: ListrTask<InquirerContext, typeof InquirerAdapter>[]
  private options?: ListrOptions<InquirerContext, typeof InquirerAdapter>

  constructor(
    tasks: ListrTask<InquirerContext, typeof InquirerAdapter>[],
    options?: ListrOptions<InquirerContext, typeof InquirerAdapter>,
  ) {
    this.tasks = tasks
    this.options = options
  }

  async processInput(taskInput: TaskInput, ctx?: InquirerContext): Promise<any> {
    let result: any

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

    // Store result in context if provided
    if (ctx) {
      if (!ctx.inputs)
        ctx.inputs = {}
      ctx.inputs[taskInput.id] = result
    }

    return result
  }

  private async handlePromptString(taskInput: TaskInput): Promise<string> {
    return await inquirer.input({
      message: taskInput.description || `Enter value for ${taskInput.id}`,
      default: taskInput.default,
    })
  }

  private async handlePickString(taskInput: TaskInput): Promise<string> {
    if (!taskInput.options?.length)
      return taskInput.default || ''

    return await inquirer.search({
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
    return await inquirer.confirm({
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
    const selected = await inquirer.checkbox({
      message: taskInput.description || `Select values for ${taskInput.id}`,
      choices,
      pageSize: 15,
    })

    return selected?.length ? selected.join(taskInput.joinSymbol || ',') : ''
  }

  // Required ListrRenderer static properties
  static nonTTY = false
  static ttys = true
  static rendererOptions = {
    showSubtasks: true,
    collapse: false,
    clearOutput: false,
  }

  static rendererTaskOptions = {}

  render(): void {
    // Implementation not needed as we use inquirer for rendering
  }

  end(): void {
    // Implementation not needed as we use inquirer for rendering
  }

  // Helper method to check if input is available
  isInputAvailable(): boolean {
    return process.stdin.isTTY === true
  }

  // Factory method for listr2
  static createRenderer: ListrRendererFactory = (
    tasks,
    options,
  ) => {
    return new InquirerAdapter(tasks, options)
  }
}

// Export standalone handleInput function for direct usage
export async function handleInput(taskInput: TaskInput): Promise<any> {
  switch (taskInput.type) {
    case 'promptString':
      return await inquirer.input({
        message: taskInput.description || `Enter value for ${taskInput.id}`,
        default: taskInput.default,
      })
    case 'pickString':
      if (!taskInput.options?.length)
        return taskInput.default || ''

      return await inquirer.select({
        message: taskInput.description || `Select value for ${taskInput.id}`,
        choices: taskInput.options.map(opt => ({ name: opt, value: opt })),
      })
    case 'confirm':
      return await inquirer.confirm({
        message: taskInput.description || `Confirm ${taskInput.id}?`,
        default: taskInput.default ? taskInput.default === 'true' : undefined,
      })
    default:
      throw new Error(`Unknown input type: ${taskInput.type}`)
  }
}
