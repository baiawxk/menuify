import type { MenuItem } from '../core'
import type { ExecutionContext } from '../taskExecutor'
import { execa } from 'execa'
import open from 'open'
import { EnvResolver } from '../envResolver'

export class TaskHandler {
  private envResolver: EnvResolver

  constructor() {
    this.envResolver = new EnvResolver()
  }

  async executeMenuItem(menu: MenuItem, context: ExecutionContext): Promise<void> {
    if (context.debug)
      console.log(`[DEBUG] Executing menu item: ${menu.name} (${menu.type})`)

    // Initialize env resolver with current context and menu env
    // Menu env should override global env
    const menuEnv = { ...context.menuEnv, ...(menu.env || {}) }
    this.envResolver = new EnvResolver({
      globalEnv: context.env,
      menuEnv,
      inputs: context.inputs,
    })

    try {
      switch (menu.type) {
        case 'command':
          await this.executeCommand(menu.task, context)
          break
        case 'link':
          await this.executeLink(menu.task)
          break
        case 'function':
          await this.executeFunction(menu.task, context)
          break
        default:
          throw new Error(`Unsupported menu type: ${menu.type}`)
      }

      if (context.debug)
        console.log(`[DEBUG] Menu item ${menu.name} executed successfully`)
    }
    catch (error) {
      if (context.debug)
        console.error(`[DEBUG] Error executing menu item ${menu.name}:`, error)
      throw error
    }
  }

  private async executeCommand(command: string | string[], context: ExecutionContext): Promise<void> {
    const commands = Array.isArray(command) ? command : [command]

    for (const cmd of commands) {
      const resolvedCmd = this.envResolver.resolve(cmd) as string
      if (context.debug)
        console.log(`[DEBUG] Executing command: ${resolvedCmd}`)

      await execa(resolvedCmd, {
        shell: true,
        stdio: 'inherit',
      })
    }
  }

  private async executeLink(url: string | string[]): Promise<void> {
    if (Array.isArray(url)) {
      for (const u of url)
        await this.executeLink(u)
      return
    }

    if (typeof url !== 'string')
      throw new TypeError('Link URL must be a string')
    
    const resolvedUrl = this.envResolver.resolve(url) as string
    await open(resolvedUrl)
  }

  private async executeFunction(fn: unknown, context: ExecutionContext): Promise<void> {
    if (typeof fn !== 'function')
      throw new TypeError('Task value must be a function for function type menu')

    const ctx = {
      env: { ...context.env },
      menuEnv: { ...context.menuEnv },
      inputs: context.inputs ? { ...context.inputs } : undefined,
    }

    await fn(ctx)
  }
}
