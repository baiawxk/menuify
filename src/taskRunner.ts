import type { MenuItem, MenuOpts, TaskInput } from './core'
import type { ExecutionContext } from './taskExecutor'
import { execa } from 'execa'
import { Listr } from 'listr2'
import open from 'open'

import { InquirerAdapter } from './adapters/inquirerAdapter'
import { DependencyResolver } from './dependencyResolver'
import { executeMenus } from './taskExecutor'

export class TaskRunner {
  private menuConfig: MenuOpts
  private inquirerAdapter: InquirerAdapter
  private context: ExecutionContext
  private dependencyResolver: DependencyResolver

  constructor(config?: MenuOpts) {
    this.menuConfig = config || {}
    this.inquirerAdapter = InquirerAdapter.createRenderer([])
    this.context = {
      env: {},
      menuEnv: {},
      inputs: undefined,
      taskStatuses: new Map(),
    }
    // Initialize with empty array to allow executing individual tasks
    this.dependencyResolver = new DependencyResolver([])
  }

  /**
   * Get the status of a task
   */
  getTaskStatus(taskName: string): string {
    return this.context.taskStatuses?.get(taskName) || 'pending'
  }

  /**
   * Find a task by name
   */
  async findTaskByName(name: string): Promise<MenuItem | undefined> {
    return this.dependencyResolver.findMenu(name)
  }

  /**
   * Execute a single task
   */
  async executeTask(task: MenuItem): Promise<void> {
    try {
      // Handle dependencies first
      if (task.dependsOn?.length) {
        for (const depName of task.dependsOn) {
          const depTask = await this.findTaskByName(depName)
          if (!depTask) {
            throw new Error(`Dependency not found: ${depName}`)
          }
          // Only execute if not already completed
          if (this.getTaskStatus(depName) !== 'completed') {
            await this.executeTask(depTask)
          }
        }
      }

      // Mark task as running
      this.context.taskStatuses?.set(task.name, 'running')

      // Process inputs if available
      if (task.inputs?.length) {
        this.context.inputs = {}
        for (const input of task.inputs) {
          const value = await this.inquirerAdapter.processInput(input)
          if (value !== undefined) {
            this.context.inputs[input.id] = value
          }
        }
      }

      // Execute the task
      await executeMenus([task], {
        context: this.context,
        taskRunMode: task.taskRunMode || 'serial',
      })

      // Mark task as completed
      this.context.taskStatuses?.set(task.name, 'completed')
    }
    catch (error) {
      this.context.taskStatuses?.set(task.name, 'failed')
      throw error
    }
  }

  /**
   * Process a menu item
   */
  async processMenu(menu: MenuItem): Promise<void> {
    // Reset inputs for each menu execution
    this.context.inputs = undefined

    // Process inputs if available
    if (menu.inputs?.length) {
      const inputs: Record<string, unknown> = {}
      for (const input of menu.inputs) {
        const value = await this.inquirerAdapter.processInput(input)
        if (value !== undefined) {
          inputs[input.id] = value
        }
      }
      // Only set inputs if we collected any values
      if (Object.keys(inputs).length > 0) {
        this.context.inputs = inputs
      }
    }

    // Execute based on menu type
    if (menu.type === 'function') {
      // For function type, only pass the inputs
      await menu.value(this.context.inputs)
    }
    else {
      await this.executeTask(menu)
    }
  }

  /**
   * Execute a list of menus
   */
  async executeMenus(menus: MenuItem[], runMode: 'serial' | 'parallel' = 'serial'): Promise<void> {
    await executeMenus(menus, {
      context: this.context,
      runMode,
      taskRunMode: 'serial',
    })
  }

  /**
   * Create a task list with Listr2
   */
  static createTaskList(menu: MenuItem, tasks: Array<() => Promise<void>>, context: ExecutionContext): Listr {
    const taskWrappers = tasks.map((task, index) => ({
      title: `Task ${index + 1}`,
      task: async () => {
        await task()
      },
    }))

    return new Listr(taskWrappers, {
      concurrent: menu.taskRunMode === 'parallel',
      exitOnError: false,
      renderer: InquirerAdapter,
    })
  }

  /**
   * Execute tasks with proper run mode
   */
  static async executeTasks(menu: MenuItem, tasks: Array<() => Promise<void>>, context: ExecutionContext): Promise<void> {
    const taskList = TaskRunner.createTaskList(menu, tasks, context)
    await taskList.run()
  }

  /**
   * Create a menu task list with proper run mode
   */
  static createMenuTaskList(menus: MenuItem[], runMode: 'serial' | 'parallel'): Listr {
    const menuWrappers = menus.map(menu => ({
      title: menu.name,
      task: async () => {
        const taskList = TaskRunner.createTaskList(menu, menu.tasks || [], { env: {}, menuEnv: {} })
        return taskList
      },
    }))

    return new Listr(menuWrappers, {
      concurrent: runMode === 'parallel',
      exitOnError: false,
      renderer: InquirerAdapter,
    })
  }
}
