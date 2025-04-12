import type { MenuItem, CliConfig, TaskStatus } from './core'
import type { ExecutionContext } from './taskExecutor'
import { Listr } from 'listr2'
import { DependencyResolver } from './dependencyResolver'
import { InputHandler } from './handlers/inputHandler'
import { TaskHandler } from './handlers/taskHandler'

export class TaskRunner {
  private readonly context: ExecutionContext
  private readonly dependencyResolver: DependencyResolver
  private readonly inputHandler: InputHandler
  private readonly taskHandler: TaskHandler

  constructor(private readonly config: CliConfig = {}) {
    this.context = this.initializeContext()
    this.dependencyResolver = new DependencyResolver(config.menus || [])
    this.inputHandler = new InputHandler()
    this.taskHandler = new TaskHandler()
    
    this.logDebug('TaskRunner initialized with global env:', this.context.env)
  }

  private initializeContext(): ExecutionContext {
    return {
      env: this.config.env || {},
      menuEnv: {},
      inputs: undefined,
      taskStatuses: new Map<string, TaskStatus>(),
      debug: this.config.debug,
    }
  }

  private logDebug(...args: any[]): void {
    if (this.context.debug)
      console.log('[DEBUG]', ...args)
  }

  getTaskStatus(taskName: string): TaskStatus {
    return this.context.taskStatuses?.get(taskName) || 'pending'
  }

  private async findTaskByName(name: string): Promise<MenuItem> {
    const task = this.dependencyResolver.findMenu(name)
    if (!task)
      throw new Error(`Task not found: ${name}`)
    return task
  }

  async executeTask(task: MenuItem): Promise<void> {
    try {
      this.logDebug(`Executing task: ${task.name}`)
      
      await this.processDependencies(task)
      await this.executeTaskWithStatus(task)
      
      this.logDebug(`Task ${task.name} completed successfully`)
    }
    catch (error) {
      this.handleTaskError(task.name, error)
      throw error
    }
  }

  private async executeTaskWithStatus(task: MenuItem): Promise<void> {
    this.context.taskStatuses?.set(task.name, 'running')
    await this.processMenu(task)
    this.context.taskStatuses?.set(task.name, 'completed')
  }

  private handleTaskError(taskName: string, error: unknown): void {
    this.context.taskStatuses?.set(taskName, 'failed')
    this.logDebug(`Task ${taskName} failed:`, error)
    if (error instanceof Error)
      this.logDebug(error.stack)
  }

  private async processDependencies(task: MenuItem): Promise<void> {
    if (!task.dependsOn?.length)
      return

    this.logDebug(`${task.name} has dependencies: ${task.dependsOn.join(', ')}`)

    for (const depName of task.dependsOn) {
      const depTask = await this.findTaskByName(depName)
      if (this.getTaskStatus(depName) !== 'completed')
        await this.executeTask(depTask)
    }
  }

  async processMenu(menu: MenuItem): Promise<void> {
    const taskContext = this.createTaskContext(menu)
    
    try {
      this.logDebug(`Processing menu: ${menu.name}`)
      await this.processMenuInputs(menu, taskContext)
      await this.taskHandler.executeMenuItem(menu, taskContext)
      this.updateGlobalContext(taskContext)
    }
    finally {
      this.logDebug('Menu execution completed, cleaning up context')
    }
  }

  private createTaskContext(menu: MenuItem): ExecutionContext {
    return {
      ...this.context,
      menuEnv: menu.env || {},
    }
  }

  private async processMenuInputs(menu: MenuItem, taskContext: ExecutionContext): Promise<void> {
    if (!menu.inputs?.length)
      return

    this.logDebug(`Processing inputs for menu ${menu.name}`)
    taskContext.inputs = {}
    
    for (const input of menu.inputs)
      await this.inputHandler.processInput(input, taskContext)
  }

  private updateGlobalContext(taskContext: ExecutionContext): void {
    this.context.taskStatuses = taskContext.taskStatuses
  }

  async executeMenus(menus: MenuItem[], runMode: 'serial' | 'parallel' = 'serial'): Promise<void> {
    const tasks = this.createListrTasks(menus)
    const listr = new Listr(tasks, {
      concurrent: runMode === 'parallel',
      exitOnError: false,
    })
    await listr.run()
  }

  private createListrTasks(menus: MenuItem[]) {
    return menus.map(menu => ({
      title: menu.name,
      task: async () => await this.processMenu(menu),
    }))
  }
}
