import type { MenuItem, MenuOpts } from '../src/core'
import { search } from '@inquirer/prompts'
import { describe, expect, it, vi } from 'vitest'
import { displayMenu as displayMenuCore } from '../src/core'
import { displayMenu } from '../src/display'

vi.mock('@inquirer/prompts', () => ({
  search: vi.fn(),
  confirm: vi.fn(),
}))

describe('menu search', () => {
  const mockConfig: MenuOpts = {
    menus: [
      {
        name: 'Build',
        type: 'command',
        task: 'npm run build',
        description: 'Build the project',
      },
      {
        name: 'Test',
        type: 'command',
        task: ['npm test', 'npm run coverage'],
        description: 'Run tests with coverage',
      },
      {
        name: 'Docs',
        type: 'link',
        task: 'https://example.com/docs',
        description: 'Open documentation',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should find menu by name', async () => {
    vi.mocked(search).mockImplementationOnce(async (options) => {
      const choices = await options.source('build')
      expect(choices).toHaveLength(1)
      expect(choices[0].value).toBe(mockConfig.menus[0])
      return mockConfig.menus[0]
    })

    await displayMenu(mockConfig, { showDescription: true })
  })

  it('should find menu by description', async () => {
    vi.mocked(search).mockImplementationOnce(async (options) => {
      const choices = await options.source('coverage')
      expect(choices).toHaveLength(1)
      expect(choices[0].value).toBe(mockConfig.menus[1])
      return mockConfig.menus[1]
    })

    await displayMenu(mockConfig, { showDescription: true })
  })

  it('should show command value as description if no description provided', async () => {
    const menuWithoutDesc: MenuItem = {
      name: 'NoDesc',
      type: 'command',
      task: 'echo test',
    }

    vi.mocked(search).mockImplementationOnce(async (options) => {
      const choices = await options.source('')
      const noDescChoice = choices.find(c => c.value === menuWithoutDesc)
      expect(noDescChoice?.description).toBe('$ echo test')
      return menuWithoutDesc
    })

    await displayMenu({ menus: [menuWithoutDesc] }, { showDescription: true })
  })

  it('should show link icon for link type menus without description', async () => {
    const linkMenu: MenuItem = {
      name: 'NoDescLink',
      type: 'link',
      task: 'https://example.com',
    }

    vi.mocked(search).mockImplementationOnce(async (options) => {
      const choices = await options.source('')
      const linkChoice = choices.find(c => c.value === linkMenu)
      expect(linkChoice?.description).toBe('🔗 https://example.com')
      return linkMenu
    })

    await displayMenu({ menus: [linkMenu] }, { showDescription: true })
  })
})
