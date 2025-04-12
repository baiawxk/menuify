import type { MenuItem } from '../src/core'
import { describe, expect, it } from 'vitest'
import { EnvResolver } from '../src/envResolver'

describe('envResolver', () => {
  it('should resolve global variables', () => {
    const resolver = new EnvResolver({
      globalEnv: { test: 'value' },
    })

    expect(resolver.resolve('test %test%')).toBe('test value')
  })

  it('should resolve menu variables', () => {
    const resolver = new EnvResolver({
      menuEnv: { test: 'value' },
    })

    expect(resolver.resolve('test %test%')).toBe('test value')
  })

  it('should give menu variables precedence over global variables', () => {
    const resolver = new EnvResolver({
      globalEnv: { test: 'global' },
      menuEnv: { test: 'menu' },
    })

    expect(resolver.resolve('%test% abc')).toBe('menu abc')
  })

  it('should resolve multiple occurrences of the same variable', () => {
    const resolver = new EnvResolver({
      globalEnv: { test: 'value' },
    })

    expect(resolver.resolve('%test% and %test%')).toBe('value and value')
  })

  it('should resolve variables in array of strings', () => {
    const resolver = new EnvResolver({
      globalEnv: { test: 'global' },
      menuEnv: { menu: 'menu' },
    })

    expect(resolver.resolve(['%test%', '%menu%'])).toEqual(['global', 'menu'])
  })

  it('should create context with both global and menu environments', () => {
    const resolver = new EnvResolver({
      globalEnv: { global: 'value1' },
      menuEnv: { menu: 'value2' },
    })

    const context = resolver.createContext()
    expect(context.env).toEqual({ global: 'value1' })
    expect(context.menuEnv).toEqual({ menu: 'value2' })
  })

  it('should not modify original environment objects', () => {
    const globalEnv = { test: 'global' }
    const menuEnv = { test: 'menu' }
    const resolver = new EnvResolver({ globalEnv, menuEnv })

    const context = resolver.createContext()
    context.env.modified = 'new'
    context.menuEnv.modified = 'new'

    expect(globalEnv).not.toHaveProperty('modified')
    expect(menuEnv).not.toHaveProperty('modified')
  })

  describe('input variable handling', () => {
    it('should resolve input variables with highest priority', () => {
      const resolver = new EnvResolver({
        globalEnv: { var: 'global' },
        menuEnv: { var: 'menu' },
        inputs: { var: 'input' },
      })

      expect(resolver.resolve('${var} %var%')).toBe('input menu')
    })

    it('should handle non-string input values', () => {
      const resolver = new EnvResolver({
        inputs: { num: 42, bool: true },
      })

      expect(resolver.resolve('number: ${num}, boolean: ${bool}')).toBe('number: 42, boolean: true')
    })
  })

  describe('error handling', () => {
    it('should throw error for unresolved variables', () => {
      const resolver = new EnvResolver({
        globalEnv: { test: 'value' },
      })

      expect(() => resolver.resolve('%missing%')).toThrowErrorMatchingInlineSnapshot(`
        [Error: Failed to resolve variables: Unresolved variables found: missing
        Make sure all required variables are defined in the appropriate scope.]
      `)
    })

    it('should throw error for missing menu value', () => {
      const resolver = new EnvResolver()
      const menu: MenuItem = {
        name: 'test',
        type: 'command',
        task: undefined as any,
      }

      expect(() => resolver.resolveMenu(menu)).toThrowErrorMatchingInlineSnapshot(`[Error: Menu "test" has no task defined]`)
    })

    it('should handle empty input values', () => {
      const resolver = new EnvResolver({
        inputs: { empty: '' },
      })

      expect(resolver.resolve('value: ${empty}')).toBe('value: ')
    })
  })

  describe('menu resolution', () => {
    it('should preserve function values', () => {
      const resolver = new EnvResolver()
      const fn = async () => {}
      const menu: MenuItem = {
        name: 'test',
        type: 'function',
        task: fn,
      }

      const resolved = resolver.resolveMenu(menu)
      expect(resolved.task).toBe(fn)
    })

    it('should resolve variables in command menu values', () => {
      const resolver = new EnvResolver({
        globalEnv: { cmd: 'echo' },
        inputs: { arg: 'hello' },
      })

      const menu: MenuItem = {
        name: 'test',
        type: 'command',
        task: '%cmd% ${arg}',
      }

      const resolved = resolver.resolveMenu(menu)
      expect(resolved.task).toBe('echo hello')
    })

    it('should handle array of commands', () => {
      const resolver = new EnvResolver({
        menuEnv: { prefix: 'cmd' },
      })

      const menu: MenuItem = {
        name: 'test',
        type: 'command',
        task: ['%prefix%1', '%prefix%2'],
      }

      const resolved = resolver.resolveMenu(menu)
      expect(resolved.task).toEqual(['cmd1', 'cmd2'])
    })
  })

  describe('variable validation', () => {
    it('should skip resolution for strings without variables', () => {
      const resolver = new EnvResolver({
        globalEnv: { test: 'value' },
      })

      expect(resolver.resolve('plain text')).toBe('plain text')
    })

    it('should handle variables with hyphens in names', () => {
      const resolver = new EnvResolver({
        menuEnv: { 'my-var': 'value' },
      })

      expect(resolver.resolve('%my-var%')).toBe('value')
    })
  })
})
