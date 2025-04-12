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
      env: this.menuConfig.env || {},  // Get global env from config
      menuEnv: {},
      inputs: undefined,
      taskStatuses: new Map(),
      debug: true
    }
    // Initialize with empty array to allow executing individual tasks
    this.dependencyResolver = new DependencyResolver(config?.menus || [])
    if (this.context.debug) console.log('[DEBUG] TaskRunner initialized with global env:', this.context.env)
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
      if (this.context.debug) console.log(`[DEBUG] Executing task: ${task.name}`)
      
      // Handle dependencies first
      if (task.dependsOn?.length) {
        if (this.context.debug) console.log(`[DEBUG] ${task.name} has dependencies: ${task.dependsOn.join(', ')}`)
        for (const depName of task.dependsOn) {
          const depTask = await this.findTaskByName(depName)
          if (!depTask) {
            throw new Error(`Dependency not found: ${depName}`)
          }
          if (this.context.debug) console.log(`[DEBUG] Executing dependency ${depName} for ${task.name}`)
          // Only execute if not already completed
          if (this.getTaskStatus(depName) !== 'completed') {
            await this.processMenu(depTask) // Changed from executeTask to processMenu for proper context handling
          } else {
            if (this.context.debug) console.log(`[DEBUG] Dependency ${depName} already completed, skipping`)
          }
        }
      }

      // Mark task as running
      this.context.taskStatuses?.set(task.name, 'running')
      if (this.context.debug) console.log(`[DEBUG] Task ${task.name} status set to running`)

      // Execute the task
      await executeMenus([task], {
        context: this.context,
        taskRunMode: task.taskRunMode || 'serial',
      })

      // Mark task as completed
      this.context.taskStatuses?.set(task.name, 'completed')
      if (this.context.debug) console.log(`[DEBUG] Task ${task.name} completed successfully`)
    }
    catch (error) {
      this.context.taskStatuses?.set(task.name, 'failed')
      if (this.context.debug) {
        console.log(`[DEBUG] Task ${task.name} failed:`, error)
        if (error instanceof Error) console.log(error.stack)
      }
      throw error
    }
  }

  /**
   * Process a menu item
   */
  async processMenu(menu: MenuItem): Promise<void> {
    try {
      if (this.context.debug) console.log(`[DEBUG] Processing menu: ${menu.name}`)
      
      // Set menu-level environment variables
      this.context.menuEnv = menu.env || {}
      if (this.context.debug) {
        console.log('[DEBUG] Menu environment:', this.context.menuEnv)
        console.log('[DEBUG] Global environment:', this.context.env)
      }

      // Process inputs if available
      if (menu.inputs?.length) {
        if (this.context.debug) console.log(`[DEBUG] Processing inputs for menu ${menu.name}`)
        this.context.inputs = {}
        for (const input of menu.inputs) {
          const value = await this.inquirerAdapter.processInput(input)
          if (value !== undefined) {
            this.context.inputs[input.id] = value
            if (this.context.debug) console.log(`[DEBUG] Input ${input.id} set to:`, value)
          }
        }
        // If no inputs were collected, set inputs back to undefined
        if (Object.keys(this.context.inputs).length === 0) {
          this.context.inputs = undefined
          if (this.context.debug) console.log(`[DEBUG] No inputs collected, setting inputs to undefined`)
        }
      }

      // Execute based on menu type
      if (menu.type === 'function') {
        if (this.context.debug) console.log(`[DEBUG] Executing function type menu with context:`, {
          env: this.context.env,
          menuEnv: this.context.menuEnv,
          inputs: this.context.inputs
        })
        await menu.task({
          env: this.context.env,
          menuEnv: this.context.menuEnv,
          inputs: this.context.inputs
        })
      }
      else {
        if (this.context.debug) console.log(`[DEBUG] Executing ${menu.type} type menu`)
        await this.executeTask(menu)
      }
    }
    finally {
      // Clear inputs and menu environment after execution
      this.context.inputs = undefined
      this.context.menuEnv = {}
      if (this.context.debug) console.log(`[DEBUG] Menu execution completed, inputs and menu env cleared`)
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
      options: {
        persistentOutput: true,
        bottomBar: Infinity,
      },
    }))

    return new Listr(taskWrappers, {
      concurrent: menu.taskRunMode === 'parallel',
      exitOnError: false,
      renderer: InquirerAdapter,
      rendererOptions: {
        showSubtasks: true,
        collapse: false,
        clearOutput: false,
      },
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
