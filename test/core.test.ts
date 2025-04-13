import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initConfig } from '../src/core'

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  copyFileSync: vi.fn(),
}))

describe('initConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(false)
    vi.mocked(readFileSync).mockReturnValue(`
import { defineMenu } from 'menuify'

export default defineMenu({
  debug: false,
  env: { NODE_ENV: 'development' },
  menus: [
    {
      name: 'Test',
      type: 'command',
      task: 'echo "test"'
    }
  ]
})`)
  })

  it('should create TypeScript config by default', () => {
    initConfig()
    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(
      expect.stringContaining('cli.config.ts'),
      expect.stringContaining('import { defineMenu }'),
      expect.any(String)
    )
  })

  it.each([
    'mts',
    'cts',
    'ts',
    'mjs',
    'cjs',
    'js',
    'json'
  ])('should handle %s config type', (type) => {
    initConfig({ type: type as any })
    expect(vi.mocked(writeFileSync).mock.calls[0][0]).toContain(`cli.config.${type}`)
  })

  it('should throw error for invalid config type', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    initConfig({ type: 'invalid' as any })

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid config type')
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
    mockConsoleError.mockRestore()
  })

  it('should not overwrite existing config file', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    initConfig()

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    )
    expect(mockExit).toHaveBeenCalledWith(1)
    expect(vi.mocked(writeFileSync)).not.toHaveBeenCalled()

    mockExit.mockRestore()
    mockConsoleError.mockRestore()
  })

  it('should remove TypeScript types for JavaScript variants', () => {
    initConfig({ type: 'js' })
    expect(vi.mocked(writeFileSync)).toHaveBeenCalledWith(
      expect.stringContaining('cli.config.js'),
      expect.not.stringContaining(': string'),
      expect.any(String)
    )
  })

  it('should use JSON template for JSON type', () => {
    initConfig({ type: 'json' })
    expect(vi.mocked(copyFileSync)).toHaveBeenCalledWith(
      expect.stringContaining('cli.config.json'),
      expect.stringContaining('cli.config.json')
    )
  })
})
