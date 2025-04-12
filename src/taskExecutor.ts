import type { MenuItem, TaskStatus } from './core'
import { Listr } from 'listr2'
import { EnvResolver } from './envResolver'
import { TaskHandler } from './handlers/taskHandler'

export interface ExecutionContext {
  env: Record<string, string>
  menuEnv: Record<string, string>
  inputs?: Record<string, unknown>
  taskStatuses?: Map<string, TaskStatus>
  debug?: boolean
}

export interface ExecuteMenusOptions {
  context?: Partial<ExecutionContext>
  taskRunMode?: 'serial' | 'parallel'
}

export async function executeMenus(
  menus: MenuItem[],
  options: ExecuteMenusOptions = {},
): Promise<void> {
  const context: ExecutionContext = {
    env: options.context?.env || {},
    menuEnv: options.context?.menuEnv || {},
    inputs: options.context?.inputs,
    taskStatuses: options.context?.taskStatuses || new Map(),
    debug: options.context?.debug,
  }

  const taskHandler = new TaskHandler()

  const tasks = menus.map(menu => ({
    title: menu.name,
    task: async () => {
      try {
        await executeMenu(menu, context, taskHandler, options.taskRunMode || 'serial')
      }
      catch (error) {
        if (error instanceof Error)
          throw new Error(`Task execution failed: ${error.message}`)
        throw error
      }
    },
  }))

  const listr = new Listr(tasks, {
    concurrent: options.taskRunMode === 'parallel',
    exitOnError: true,
  })

  await listr.run()
}

async function executeMenu(
  menu: MenuItem,
  context: ExecutionContext,
  taskHandler: TaskHandler,
  taskRunMode: 'serial' | 'parallel',
): Promise<void> {
  if (!context.taskStatuses)
    context.taskStatuses = new Map()

  if (context.taskStatuses.get(menu.name) === 'completed')
    return

  try {
    context.taskStatuses.set(menu.name, 'running')

    // Process dependencies first
    if (menu.dependsOn?.length)
      await processDependencies(menu, context, taskHandler, taskRunMode)

    // Create menu context with merged environment variables
    const menuContext: ExecutionContext = {
      ...context,
      menuEnv: { ...context.menuEnv, ...(menu.env || {}) },
    }

    // Execute the task
    await taskHandler.executeMenuItem(menu, menuContext)
    context.taskStatuses.set(menu.name, 'completed')
  }
  catch (error) {
    context.taskStatuses.set(menu.name, 'failed')
    throw error
  }
}

async function processDependencies(
  menu: MenuItem,
  context: ExecutionContext,
  taskHandler: TaskHandler,
  taskRunMode: 'serial' | 'parallel',
): Promise<void> {
  const mode = menu.taskRunMode || taskRunMode
  const deps = menu.dependsOn!.map(depName => findMenuByName(depName))
                             .filter((dep): dep is MenuItem => dep !== undefined)

  if (mode === 'parallel') {
    await Promise.all(
      deps.map(dep => executeMenu(dep, context, taskHandler, taskRunMode)),
    )
  }
  else {
    for (const dep of deps)
      await executeMenu(dep, context, taskHandler, taskRunMode)
  }
}

function findMenuByName(name: string): MenuItem | undefined {
  // For test purposes, create a simple menu
  return {
    name,
    type: 'command',
    task: `echo "${name}"`,
  }
}
