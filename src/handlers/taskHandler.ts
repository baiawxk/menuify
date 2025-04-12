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

  /**
   * Execute a menu item based on its type
   */
  async executeMenuItem(menu: MenuItem, context: ExecutionContext): Promise<void> {
    if (context.debug)
      console.log(`[DEBUG] Executing menu item: ${menu.name} (${menu.type})`)

    // Update env resolver with current context
    this.envResolver.setGlobalEnv(context.env)
    this.envResolver.setMenuEnv(context.menuEnv)
    this.envResolver.setInputs(context.inputs || {})

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
      // First replace input variables, then environment variables
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
    
    const resolvedUrl = this.envResolver.resolve(url) as string
    await open(resolvedUrl)
  }

  private async executeFunction(func: any, context: ExecutionContext): Promise<void> {
    if (typeof func !== 'function')
      throw new TypeError('Task value must be a function for function type menu')

    const ctx = {
      env: { ...context.env },
      menuEnv: { ...context.menuEnv },
      inputs: context.inputs ? { ...context.inputs } : undefined,
    }
    await func(ctx)
  }
}
