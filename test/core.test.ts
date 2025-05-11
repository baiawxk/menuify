import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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
import { defineConfig } from 'menuify'

export default defineConfig({
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
      expect.stringContaining('menuify.config.ts'),
      expect.stringContaining('import { defineConfig }'),
      expect.any(String),
    )
  })

  it('should not overwrite existing config file', () => {
    vi.mocked(existsSync).mockReturnValue(true)
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    initConfig()

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('already exists'),
    )
    expect(mockExit).toHaveBeenCalledWith(1)
    expect(vi.mocked(writeFileSync)).not.toHaveBeenCalled()

    mockExit.mockRestore()
    mockConsoleError.mockRestore()
  })
})
