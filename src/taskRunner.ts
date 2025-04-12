import type { MenuItem, CliConfig } from './core'
import type { ExecutionContext } from './taskExecutor'
import { Listr } from 'listr2'
import { DependencyResolver } from './dependencyResolver'
import { InputHandler } from './handlers/inputHandler'
import { TaskHandler } from './handlers/taskHandler'

export class TaskRunner {
  private menuConfig: CliConfig
  private context: ExecutionContext
  private dependencyResolver: DependencyResolver
  private inputHandler: InputHandler
  private taskHandler: TaskHandler

  constructor(config?: CliConfig) {
    this.menuConfig = config || {}
    this.context = {
      env: this.menuConfig.env || {},
      menuEnv: {},
      inputs: undefined,
      taskStatuses: new Map(),
      debug: this.menuConfig.debug,
    }
    this.dependencyResolver = new DependencyResolver(config?.menus || [])
    this.inputHandler = new InputHandler()
    this.taskHandler = new TaskHandler()

    if (this.context.debug)
      console.log('[DEBUG] TaskRunner initialized with global env:', this.context.env)
  }

  getTaskStatus(taskName: string): string {
    return this.context.taskStatuses?.get(taskName) || 'pending'
  }

  async findTaskByName(name: string): Promise<MenuItem | undefined> {
    return this.dependencyResolver.findMenu(name)
  }

  async executeTask(task: MenuItem): Promise<void> {
    try {
      if (this.context.debug)
        console.log(`[DEBUG] Executing task: ${task.name}`)

      // Process dependencies first
      await this.processDependencies(task)

      // Process the task itself
      this.context.taskStatuses?.set(task.name, 'running')
      await this.processMenu(task)
      this.context.taskStatuses?.set(task.name, 'completed')

      if (this.context.debug)
        console.log(`[DEBUG] Task ${task.name} completed successfully`)
    }
    catch (error) {
      this.context.taskStatuses?.set(task.name, 'failed')
      if (this.context.debug) {
        console.log(`[DEBUG] Task ${task.name} failed:`, error)
        if (error instanceof Error)
          console.log(error.stack)
      }
      throw error
    }
  }

  private async processDependencies(task: MenuItem): Promise<void> {
    if (task.dependsOn?.length) {
      if (this.context.debug)
        console.log(`[DEBUG] ${task.name} has dependencies: ${task.dependsOn.join(', ')}`)


     
      // Execute dependencies in series
      for (const depName of task.dependsOn) {
        const depTask = await this.findTaskByName(depName)
        if (!depTask)
          throw new Error(`Dependency not found: ${depName}`)

        if (this.getTaskStatus(depName) !== 'completed')
          await this.executeTask(depTask)
      }
    }
  }

  async processMenu(menu: MenuItem): Promise<void> {
    const taskContext = { ...this.context }
    try {
      if (this.context.debug)
        console.log(`[DEBUG] Processing menu: ${menu.name}`)

      // Set menu-level environment variables
      taskContext.menuEnv = menu.env || {}

      // Process inputs if available
      if (menu.inputs?.length) {
        if (this.context.debug)
          console.log(`[DEBUG] Processing inputs for menu ${menu.name}`)

        taskContext.inputs = {}
        for (const input of menu.inputs)
          await this.inputHandler.processInput(input, taskContext)
      }

      // Execute the menu item with updated context
      await this.taskHandler.executeMenuItem(menu, taskContext)

      // Update global context with any changes
      this.context.taskStatuses = taskContext.taskStatuses
    }
    finally {
      // Clear task-specific context after execution
      if (this.context.debug)
        console.log(`[DEBUG] Menu execution completed, cleaning up context`)
    }
  }

  async executeMenus(menus: MenuItem[], runMode: 'serial' | 'parallel' = 'serial'): Promise<void> {
    const tasks = menus.map(menu => ({
      title: menu.name,
      task: async () => {
        await this.processMenu(menu)
      },
    }))

    const listr = new Listr(tasks, {
      concurrent: runMode === 'parallel',
      exitOnError: false,
    })

    await listr.run()
  }
}
