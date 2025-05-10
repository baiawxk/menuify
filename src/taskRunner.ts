import type { CliConfig, ExecutionContext, MenuItem } from './types'
import { confirm } from '@inquirer/prompts'
import { InputHandler } from './handlers/inputHandler'
import { TaskHandler } from './handlers/taskHandler'

export class TaskRunner {
  private readonly context: ExecutionContext
  private readonly inputHandler: InputHandler
  private readonly taskHandler: TaskHandler
  private readonly isDebug: boolean

  constructor(private readonly config: CliConfig = {}) {
    this.isDebug = process.env.DEBUG === 'true'
    this.context = this.initializeContext()
    this.inputHandler = new InputHandler()
    this.taskHandler = new TaskHandler()

    this.logDebug('TaskRunner initialized')
  }

  private initializeContext(): ExecutionContext {
    return {
      env: Object.fromEntries(
        Object.entries(process.env)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, v as string]),
      ),
      inputs: {},
    }
  }

  private logDebug(...args: any[]): void {
    if (this.isDebug) {
      console.log('[DEBUG]', ...args)
    }
  }

  async executeTask(task: MenuItem): Promise<void> {
    try {
      this.logDebug(`Executing task: ${task.name}`)
      await this.processMenu(task)
      this.logDebug(`Task ${task.name} completed successfully`)
    }
    catch (error) {
      this.logDebug(`Task ${task.name} failed:`, error)
      if (error instanceof Error) {
        this.logDebug(error.stack)
      }
      throw error
    }
  }

  async processMenu(menu: MenuItem): Promise<void> {
    const taskContext = this.createTaskContext(menu)

    try {
      this.logDebug(`Processing menu: ${menu.name}`)
      this.logDebug(`Processing taskContext ${menu.name}`, taskContext)

      if (menu.confirmMsg) {
        const confirmed = await confirm({
          message: menu.confirmMsg,
        })

        if (!confirmed) {
          console.log(`Menu "${menu.name}" execution cancelled by user`)
          return
        }
      }

      await this.processMenuInputs(menu, taskContext)
      await this.taskHandler.executeMenuItem(menu, taskContext)
    }
    finally {
      this.logDebug('Menu execution completed, cleaning up context')
    }
  }

  private createTaskContext(menu: MenuItem): ExecutionContext {
    return {
      ...this.context,
      inputs: {},
    }
  }

  private async processMenuInputs(menu: MenuItem, taskContext: ExecutionContext): Promise<void> {
    if (!menu.inputs?.length) {
      return
    }

    this.logDebug(`Processing inputs for menu ${menu.name}`)
    taskContext.inputs = {}

    for (const input of menu.inputs) {
      await this.inputHandler.processInput(input, taskContext)
    }
  }

  async executeMenus(menus: MenuItem[]): Promise<void> {
    for (const menu of menus) {
      await this.executeTask(menu)
    }
  }
}
