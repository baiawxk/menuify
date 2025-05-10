import type { CommandMenu, ExecutionContext, MenuItem } from '../types'
import { cwd } from 'node:process'
import { execa } from 'execa'
import open from 'open'
import { EnvResolver } from '../envResolver'

export class TaskHandler {
  private envResolver: EnvResolver
  private readonly isDebug: boolean

  constructor() {
    this.envResolver = new EnvResolver()
    this.isDebug = process.env.DEBUG === 'true'
  }

  async executeMenuItem(menu: MenuItem, context: ExecutionContext): Promise<void> {
    if (this.isDebug) {
      console.log(`[DEBUG] Executing menu item: ${menu.name} (${menu.type})`)
    }

    // Initialize env resolver with current context
    this.envResolver = new EnvResolver({
      inputs: context.inputs,
    })

    try {
      switch (menu.type) {
        case 'command':
          await this.executeCommand(menu, context)
          break
        case 'link':
          await this.executeLink(menu.task)
          break
        case 'function':
          await this.executeFunction(menu.task, context)
          break
        default:
          throw new Error(`Unsupported menu type: ${menu}`)
      }

      if (this.isDebug) {
        console.log(`[DEBUG] Menu item ${menu.name} executed successfully`)
      }
    }
    catch (error) {
      console.error(`Failed to execute menu item ${menu.name}:`, error)
      throw error
    }
  }

  private async executeCommand(menu: CommandMenu, context: ExecutionContext): Promise<void> {
    const resolvedCmd = this.envResolver.resolve(menu.task) as string
    if (this.isDebug) {
      console.log(`[DEBUG] Executing command: ${resolvedCmd}`)
    }

    await execa(resolvedCmd, {
      shell: true,
      stdio: 'inherit',
      cwd: menu.options?.cwd || cwd(),
      env: { ...process.env, ...context.env },
    })
  }

  private async executeLink(url: string): Promise<void> {
    const resolvedUrl = this.envResolver.resolve(url) as string
    await open(resolvedUrl)
  }

  private async executeFunction(fn: unknown, context: ExecutionContext): Promise<void> {
    if (typeof fn !== 'function') {
      throw new TypeError('Task value must be a function for function type menu')
    }

    const ctx = {
      env: { ...process.env, ...context.env },
      inputs: context.inputs ? { ...context.inputs } : undefined,
    }

    await fn(ctx)
  }
}
