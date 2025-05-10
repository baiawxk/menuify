import type { MenuItem, TaskValue } from './types'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { isEmpty } from 'radash'

export interface EnvResolverOptions {
  inputs?: Record<string, unknown>
}

export class EnvResolver {
  private readonly inputs: Record<string, unknown>

  constructor(options: EnvResolverOptions = {}) {
    this.loadDotEnv()
    this.inputs = options.inputs || {}
  }

  private loadDotEnv() {
    const envPaths = ['.env', '.env.local']
    for (const path of envPaths) {
      const fullPath = resolve(process.cwd(), path)
      if (existsSync(fullPath)) {
        config({ path: fullPath })
      }
    }
  }

  resolveMenu<T extends MenuItem>(menu: T): T {
    if (menu.task === undefined) {
      throw new Error(`Menu "${menu.name}" has no task defined`)
    }

    return {
      ...menu,
      task: this.resolveValue(menu.task),
    }
  }

  private resolveValue(value: TaskValue): TaskValue {
    if (typeof value === 'function') {
      return value
    }

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
      if (error instanceof Error) {
        throw new TypeError(`Failed to resolve variables: ${error.message}`)
      }
      throw error
    }
  }

  private resolveString(value: string): string {
    if (typeof value !== 'string') {
      throw new TypeError(`Value must be a string, but got: ${typeof value}`)
    }

    // Skip resolution if no variables present
    if (!this.containsVariables(value)) {
      return value
    }

    // Resolve variables in order of precedence
    let result = value
    result = this.processInputVariables(result)
    result = this.processEnvVariables(result)

    // Check for any unresolved variables
    this.validateNoUnresolvedVariables(result)

    return result
  }

  private containsVariables(value: string): boolean {
    return /\{[\w-]+\}|%[\w-]+%/.test(value)
  }

  private processInputVariables(value: string): string {
    if (isEmpty(this.inputs)) {
      return value
    }
    return this.replaceVariables(value, this.inputs, '{', '}')
  }

  private processEnvVariables(value: string): string {
    return this.replaceVariables(value, process.env, '%', '%')
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
    const prefixEscaped = this.escapeRegExp(prefix)
    const suffixEscaped = this.escapeRegExp(suffix)
    return new RegExp(`${prefixEscaped}([\\w-]+)${suffixEscaped}`, 'g')
  }

  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private validateNoUnresolvedVariables(str: string): void {
    const unresolved = this.findUnresolvedVariables(str)
    if (unresolved.length > 0) {
      throw new Error(
        `Unresolved variables found: ${unresolved.join(', ')}\n`
        + 'Make sure all required variables are defined in the appropriate scope.',
      )
    }
  }

  private findUnresolvedVariables(str: string): string[] {
    const patterns = [
      /\{([\w-]+)\}/g, // Input variables
      /%([\w-]+)%/g, // Environment variables
    ]

    const unresolved = new Set<string>()
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(str)) !== null) {
        unresolved.add(match[1])
      }
    }

    return Array.from(unresolved)
  }

  setInputs(inputs: Record<string, unknown>): void {
    Object.assign(this.inputs, inputs)
  }
}
