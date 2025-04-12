import type { Listr } from 'listr2'
import type { InquirerContext } from './adapters/inquirerAdapter'
import type { MenuItem } from './core'
import { execa } from 'execa'
import open from 'open'
import { InquirerAdapter } from './adapters/inquirerAdapter'

export type RunMode = 'serial' | 'parallel'
export type TaskRunMode = 'serial' | 'parallel'

export interface ExecutionContext extends InquirerContext {
  env: Record<string, string>
  menuEnv: Record<string, string>
  inputs?: Record<string, unknown>
  taskStatuses?: Map<string, string>
  debug?: boolean // Add debug mode flag
}

export interface TaskExecutorOptions {
  runMode?: RunMode
  taskRunMode?: TaskRunMode
  context: ExecutionContext
}

/**
 * Executes a list of menus based on the specified run mode
 */
export async function executeMenus(menus: MenuItem[], options: TaskExecutorOptions): Promise<void> {
  const { runMode = 'serial', context } = options

  if (runMode === 'parallel') {
    await Promise.all(menus.map(menu => executeMenu(menu, options)))
  }
  else {
    for (const menu of menus)
      await executeMenu(menu, options)
  }
}

/**
 * Executes a single menu and its tasks based on the specified task run mode
 */
async function executeMenu(menu: MenuItem, options: TaskExecutorOptions): Promise<void> {
  const { taskRunMode = 'serial', context } = options

  // Initialize task status tracking if not exists
  if (!context.taskStatuses) {
    context.taskStatuses = new Map()
  }
  context.taskStatuses.set(menu.name, 'running')

  try {
    // Convert menu to tasks
    const tasks = convertMenuToTasks(menu, context)

    // Execute tasks based on taskRunMode
    if (taskRunMode === 'parallel') {
      await Promise.all(tasks.map(task => executeTask(task, context)))
    }
    else {
      for (const task of tasks)
        await executeTask(task, context)
    }

    context.taskStatuses.set(menu.name, 'completed')
  }
  catch (error) {
    context.taskStatuses.set(menu.name, 'failed')
    throw error
  }
}

/**
 * Converts a menu item to an array of executable tasks
 */
function convertMenuToTasks(menu: MenuItem, context: ExecutionContext): Array<() => Promise<void>> {
  if (menu.type === 'command') {
    if (Array.isArray(menu.task)) {
      return menu.task.map(cmd => async () => {
        const resolvedCmd = resolveVariables(cmd, context)
        if (context.debug) {
          console.log('[DEBUG] Command execution context:', {
            env: context.env,
            menuEnv: context.menuEnv,
            inputs: context.inputs
          })
          console.log(`[DEBUG] Executing command: ${resolvedCmd}`)
        }
        await execa(resolvedCmd, { shell: true, stdio: 'inherit' })
      })
    }
    return [async () => {
      const resolvedCmd = resolveVariables(menu.task as string, context)
      if (context.debug) {
        console.log('[DEBUG] Command execution context:', {
          env: context.env,
          menuEnv: context.menuEnv,
          inputs: context.inputs
        })
        console.log(`[DEBUG] Executing command: ${resolvedCmd}`)
      }
      await execa(resolvedCmd, { shell: true, stdio: 'inherit' })
    }]
  }
  else if (menu.type === 'link') {
    if (Array.isArray(menu.task)) {
      return menu.task.map(link => async () => {
        const resolvedLink = resolveVariables(link, context)
        if (context.debug) console.log(`[DEBUG] Opening link: ${resolvedLink}`)
        await open(resolvedLink)
      })
    }
    return [async () => {
      const resolvedLink = resolveVariables(menu.task as string, context)
      if (context.debug) console.log(`[DEBUG] Opening link: ${resolvedLink}`)
      await open(resolvedLink)
    }]
  }
  else if (menu.type === 'function') {
    return [async () => {
      const ctx = {
        env: context.env,
        menuEnv: context.menuEnv,
        inputs: context.inputs
      }
      if (context.debug) console.log('[DEBUG] Executing function with context:', ctx)
      await menu.task(ctx)
    }]
  }

  throw new Error(`Unsupported menu type: ${menu.type}`)
}

/**
 * Executes a single task with the provided context
 */
async function executeTask(task: () => Promise<void>, context: ExecutionContext): Promise<void> {
  try {
    await task()
  }
  catch (error) {
    if (error instanceof Error) {
      throw new TypeError(`Task execution failed: ${error.message}`)
    }
    throw error
  }
}

/**
 * Resolves variables in a string using context
 * Priority: menuEnv > env > inputs
 */
function resolveVariables(value: string, context: ExecutionContext): string {
  let result = value

  // First replace global env variables
  for (const [key, val] of Object.entries(context.env))
    result = result.replace(new RegExp(`%${key}%`, 'g'), val)

  // Then replace menu env variables (taking precedence over global)
  for (const [key, val] of Object.entries(context.menuEnv))
    result = result.replace(new RegExp(`%${key}%`, 'g'), val)

  // Finally replace input variables (using different pattern)
  for (const [key, val] of Object.entries(context.inputs || {}))
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(val))

  return result
}

/**
 * Execute a single menu item directly
 */
export async function executeMenuItem(menu: MenuItem, options: { envResolver?: any } = {}): Promise<void> {
  if (menu.type === 'command') {
    const value = Array.isArray(menu.task) ? menu.task.join(' && ') : menu.task as string
    const command = options.envResolver ? options.envResolver.resolve(value) : value
     await execa(command, { stdio: 'inherit', shell: true })
  }
  else if (menu.type === 'link') {
    const url = options.envResolver ? options.envResolver.resolve(menu.task as string) : menu.task as string
    await open(url)
  }
  else {
    throw new Error(`Unsupported task type: ${menu.type}`)
  }
}
