import type { CliConfig, MenuItem } from '../src/core'
import { search } from '@inquirer/prompts'
import { describe, expect, it, vi } from 'vitest'
import { displayMenu, searchMenu } from '../src/display'

vi.mock('@inquirer/prompts', () => ({
  search: vi.fn(),
}))

describe('display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockMenus: CliConfig = {
    menus: [
      {
        name: 'Test Command',
        type: 'command',
        task: 'echo "test"',
        description: 'A test command',
      },
      {
        name: 'Test Function',
        type: 'function',
        task: async () => {},
      },
      {
        name: 'Test Link',
        type: 'link',
        task: 'https://example.com',
      },
    ],
  }

  describe('searchMenu', () => {
    it('should format menu choices correctly', async () => {
      vi.mocked(search).mockResolvedValueOnce(mockMenus.menus[0])

      await searchMenu(mockMenus, { showDescription: true })

      expect(search).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Select a menu to execute',
        pageSize: 15,
      }))
    })

    it('should filter menus based on search input', async () => {
      vi.mocked(search).mockImplementationOnce(async (options) => {
        const choices = await options.source('command')
        expect(choices).toHaveLength(1)
        expect(choices[0].value).toEqual(mockMenus.menus[0])
        return mockMenus.menus[0]
      })

      await searchMenu(mockMenus, {})
    })

    it('should include dependencies in menu name when showDependencies is true', async () => {
      vi.mocked(search).mockImplementationOnce(async (options) => {
        const choices = await options.source('')
        const functionMenu = choices.find(c => c.value.type === 'function')
        expect(functionMenu?.name).toContain('(deps: Test Command)')
        return mockMenus.menus[1]
      })

      await searchMenu(mockMenus, { showDependencies: true })
    })

    it('should group menus by type when groupByType is true', async () => {
      vi.mocked(search).mockImplementationOnce(async (options) => {
        const choices = await options.source('')
        const types = choices.map(c => c.value.type)
        expect(types).toEqual(['command', 'function', 'link'])
        return mockMenus.menus[0]
      })

      await searchMenu(mockMenus, { groupByType: true })
    })
  })

  describe('displayMenu', () => {
    it('should exit when no menus are defined', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      await displayMenu({ menus: [] })

      expect(exitSpy).toHaveBeenCalledWith(0)
    })

    it('should exit when no menu is selected', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
      vi.mocked(search).mockResolvedValueOnce(undefined as any)

      await displayMenu(mockMenus)

      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('should return selected menu when valid', async () => {
      const selectedMenu = mockMenus.menus[0]
      vi.mocked(search).mockResolvedValueOnce(selectedMenu)

      const result = await displayMenu(mockMenus)

      expect(result).toBe(selectedMenu)
    })
  })
})
