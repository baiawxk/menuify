import type { MenuItem, MenuValue } from './core'
import type { ExecutionContext } from './taskExecutor'

export interface EnvResolverOptions {
  globalEnv?: Record<string, string>
  menuEnv?: Record<string, string>
  inputs?: Record<string, unknown>
}

export class EnvResolver {
  private globalEnv: Record<string, string>
  private menuEnv: Record<string, string>
  private inputs: Record<string, unknown>

  constructor(options: EnvResolverOptions = {}) {
    this.globalEnv = options.globalEnv || {}
    this.menuEnv = options.menuEnv || {}
    this.inputs = options.inputs || {}
  }

  /**
   * Resolves environment variables in a menu item's value
   */
  resolveMenu<T extends MenuItem>(menu: T): T {
    if (menu.value === undefined) {
      throw new Error(`Menu ${menu.name} has no value`)
    }

    const resolvedValue = this.resolveValue(menu.value)

    return {
      ...menu,
      value: resolvedValue,
    }
  }

  /**
   * Resolves a menu value which can be a string, string array, or function
   */
  private resolveValue(value: MenuValue): MenuValue {
    if (typeof value === 'function') {
      return value
    }
    return this.resolve(value)
  }

  /**
   * Resolves a single value (string or array of strings)
   */
  resolve(value: string | string[]): string | string[] {
    try {
      if (Array.isArray(value)) {
        return value.map(v => this.resolveString(v))
      }
      return this.resolveString(value)
    }
    catch (error) {
      if (error instanceof Error) {
        throw new TypeError(`Failed to resolve variables: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Validates if a value needs variable resolution
   */
  private needsResolution(value: string): boolean {
    return /(\$\{[\w-]+\}|\{[\w-]+\}|%[\w-]+%)/.test(value)
  }

  /**
   * Resolves variables in a string with proper priority:
   * 1. Input variables (highest priority)
   * 2. Menu-level variables
   * 3. Global variables (lowest priority)
   */
  private resolveString(value: string): string {
    if (typeof value !== 'string') {
      throw new TypeError('Value must be a string')
    }

    // Skip resolution if no variables present
    if (!this.needsResolution(value)) {
      return value
    }

    let result = value

    // Replace input variables (${varName}) - highest priority
    result = this.replaceVariables(result, this.inputs, '${', '}')

    // Replace menu variables ({varName})
    result = this.replaceVariables(result, this.menuEnv, '{', '}')

    // Replace global variables (%varname%)
    result = this.replaceVariables(result, this.globalEnv, '%', '%')

    // Validate no unresolved variables
    this.validateNoUnresolvedVariables(result)

    return result
  }

  /**
   * Replace variables in a string with values from a record
   */
  private replaceVariables(
    str: string,
    values: Record<string, unknown>,
    prefix: string,
    suffix: string,
  ): string {
    let result = str
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`${escapedPrefix}([\\w-]+)${escapedSuffix}`, 'g')

    return result.replace(pattern, (_, key) => {
      const val = values[key]
      return val !== undefined ? String(val) : `${prefix}${key}${suffix}`
    })
  }

  /**
   * Validate that there are no unresolved variables in the string
   */
  private validateNoUnresolvedVariables(str: string): void {
    const unresolved = [
      ...str.matchAll(/\$\{([\w-]+)\}/g),
      ...str.matchAll(/\{([\w-]+)\}/g),
      ...str.matchAll(/%([\w-]+)%/g),
    ].map(match => match[1])

    if (unresolved.length > 0) {
      throw new Error(`Unresolved variables: ${unresolved.join(', ')}`)
    }
  }

  /**
   * Creates a context object for task execution
   */
  createContext(): ExecutionContext {
    return {
      env: { ...this.globalEnv },
      menuEnv: { ...this.menuEnv },
      inputs: { ...this.inputs },
    }
  }

  /**
   * Updates input variables
   */
  setInputs(inputs: Record<string, unknown>): void {
    this.inputs = { ...inputs }
  }

  /**
   * Updates menu environment variables
   */
  setMenuEnv(menuEnv: Record<string, string>): void {
    this.menuEnv = { ...menuEnv }
  }

  /**
   * Updates global environment variables
   */
  setGlobalEnv(globalEnv: Record<string, string>): void {
    this.globalEnv = { ...globalEnv }
  }
}
