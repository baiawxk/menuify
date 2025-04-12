import type { MenuItem, TaskValue } from './core'
import type { ExecutionContext } from './taskExecutor'

export interface EnvResolverOptions {
  globalEnv?: Record<string, string>
  menuEnv?: Record<string, string>
  inputs?: Record<string, unknown>
}

export class EnvResolver {
  private readonly globalEnv: Record<string, string>
  private readonly menuEnv: Record<string, string>
  private readonly inputs: Record<string, unknown>

  constructor(options: EnvResolverOptions = {}) {
    this.globalEnv = options.globalEnv || {}
    this.menuEnv = options.menuEnv || {}
    this.inputs = options.inputs || {}
  }

  resolveMenu<T extends MenuItem>(menu: T): T {
    if (menu.task === undefined)
      throw new Error(`Menu "${menu.name}" has no task defined`)

    return {
      ...menu,
      task: this.resolveValue(menu.task),
    }
  }

  private resolveValue(value: TaskValue): TaskValue {
    if (typeof value === 'function')
      return value

    return Array.isArray(value)
      ? value.map(v => this.resolveString(v))
      : this.resolveString(value)
  }

  resolve(value: string | string[]): string | string[] {
    try {
      return Array.isArray(value)
        ? value.map(v => this.resolveString(v))
        : this.resolveString(value)
    }
    catch (error) {
      if (error instanceof Error)
        throw new Error(`Failed to resolve variables: ${error.message}`)
      throw error
    }
  }

  private resolveString(value: string): string {
    if (typeof value !== 'string')
      throw new TypeError('Value must be a string')

    // Skip resolution if no variables present
    if (!this.containsVariables(value))
      return value

    // Resolve variables in order of precedence
    let result = value
    result = this.processInputVariables(result)
    result = this.processMenuVariables(result)
    result = this.processGlobalVariables(result)

    // Check for any unresolved variables
    this.validateNoUnresolvedVariables(result)

    return result
  }

  private containsVariables(value: string): boolean {
    return /(\$\{[\w-]+\}|\{[\w-]+\}|%[\w-]+%)/.test(value)
  }

  private processInputVariables(value: string): string {
    return this.replaceVariables(value, this.inputs, '${', '}')
  }

  private processMenuVariables(value: string): string {
    return this.replaceVariables(value, this.menuEnv, '{', '}')
  }

  private processGlobalVariables(value: string): string {
    return this.replaceVariables(value, this.globalEnv, '%', '%')
  }

  private replaceVariables(
    str: string,
    values: Record<string, unknown>,
    prefix: string,
    suffix: string,
  ): string {
    const pattern = this.createVariablePattern(prefix, suffix)
    return str.replace(pattern, (match, key) => {
      const value = values[key]
      return value !== undefined ? String(value) : match
    })
  }

  private createVariablePattern(prefix: string, suffix: string): RegExp {
    const escapedPrefix = this.escapeRegExp(prefix)
    const escapedSuffix = this.escapeRegExp(suffix)
    return new RegExp(`${escapedPrefix}([\\w-]+)${escapedSuffix}`, 'g')
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private validateNoUnresolvedVariables(str: string): void {
    const unresolved = this.findUnresolvedVariables(str)
    if (unresolved.length > 0) {
      throw new Error(
        'Unresolved variables found: ' +
        `${unresolved.join(', ')}\n` +
        'Make sure all required variables are defined in the appropriate scope.',
      )
    }
  }

  private findUnresolvedVariables(str: string): string[] {
    const patterns = [
      /\$\{([\w-]+)\}/g, // Input variables
      /\{([\w-]+)\}/g,   // Menu variables
      /%([\w-]+)%/g,     // Global variables
    ]

    const unresolved = new Set<string>()
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(str)) !== null)
        unresolved.add(match[1])
    }

    return Array.from(unresolved)
  }

  createContext(): ExecutionContext {
    return {
      env: { ...this.globalEnv },
      menuEnv: { ...this.menuEnv },
      inputs: { ...this.inputs },
    }
  }

  setInputs(inputs: Record<string, unknown>): void {
    Object.assign(this.inputs, inputs)
  }

  setMenuEnv(menuEnv: Record<string, string>): void {
    Object.assign(this.menuEnv, menuEnv)
  }

  setGlobalEnv(globalEnv: Record<string, string>): void {
    Object.assign(this.globalEnv, globalEnv)
  }
}
