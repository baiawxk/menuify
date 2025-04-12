import type { Listr } from 'listr2'
import type { InquirerContext } from './adapters/inquirerAdapter'
import type { MenuItem } from './core'
import { spawn } from 'node:child_process'
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
    // Process inputs if available
    if (menu.inputs?.length) {
      const adapter = InquirerAdapter.createRenderer([], {})
      context.inputs = {}
      for (const input of menu.inputs) {
        const value = await adapter.processInput(input)
        if (value !== undefined) {
          context.inputs[input.id] = value
        }
      }
      // If no inputs were collected, set inputs back to undefined
      if (Object.keys(context.inputs).length === 0) {
        context.inputs = undefined
      }
    }

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
    if (Array.isArray(menu.value)) {
      return menu.value.map(cmd => async () => {
        const resolvedCmd = resolveVariables(cmd, context)
        await execa(resolvedCmd, { shell: true })
      })
    }
    return [async () => {
      const resolvedCmd = resolveVariables(menu.value as string, context)
      await execa(resolvedCmd, { shell: true })
    }]
  }
  else if (menu.type === 'link') {
    if (Array.isArray(menu.value)) {
      return menu.value.map(link => async () => {
        const resolvedLink = resolveVariables(link, context)
        await open(resolvedLink)
      })
    }
    return [async () => {
      const resolvedLink = resolveVariables(menu.value as string, context)
      await open(resolvedLink)
    }]
  }
  else if (menu.type === 'function') {
    return [async () => {
      await menu.value({ ...context })
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
 */
function resolveVariables(value: string, context: ExecutionContext): string {
  let result = value

  // Replace global env variables
  for (const [key, val] of Object.entries(context.env))
    result = result.replace(new RegExp(`%${key}%`, 'g'), val)

  // Replace menu env variables
  for (const [key, val] of Object.entries(context.menuEnv))
    result = result.replace(new RegExp(`{${key}}`, 'g'), val)

  // Replace input variables
  for (const [key, val] of Object.entries(context.inputs || {}))
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(val))

  return result
}

/**
 * Execute a single menu item
 */
export async function executeTask(menu: MenuItem, options: { envResolver?: any } = {}): Promise<void> {
  if (menu.type === 'command') {
    const value = Array.isArray(menu.value) ? menu.value.join(' && ') : menu.value as string
    const command = options.envResolver ? options.envResolver.resolve(value) : value
    const child = spawn(command, { stdio: 'inherit', shell: true })
    return new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('close', (code) => {
        if (code === 0)
          resolve()
        else reject(new Error(`Command failed with exit code ${code}`))
      })
    })
  }
  else if (menu.type === 'link') {
    const url = options.envResolver ? options.envResolver.resolve(menu.value as string) : menu.value as string
    await open(url)
  }
  else {
    throw new Error(`Unsupported task type: ${menu.type}`)
  }
}
