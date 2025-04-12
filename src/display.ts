import type { MenuItem, MenuOpts } from './core'
import { search } from '@inquirer/prompts'
import boxen from 'boxen'
import chalk from 'chalk'

export interface DisplayOptions {
  showDescription?: boolean
  showDependencies?: boolean
  groupByType?: boolean
}

export async function displayMenu(config: MenuOpts, options: DisplayOptions = {}): Promise<MenuItem> {
  console.log(createBanner())

  if (config.menus?.length === 0) {
    console.log(chalk.yellow('No menus defined in configuration'))
    process.exit(0)
  }

  const selectedMenu = await searchMenu(config, options)
  if (!selectedMenu) {
    console.log(chalk.red('No menu selected'))
    process.exit(1)
  }

  return selectedMenu
}

export async function searchMenu(config: MenuOpts, options: DisplayOptions): Promise<MenuItem> {
  const menus = config.menus || []
  return await search<MenuItem>({
    message: 'Select a menu to execute',
    placeholder: 'Start typing to search...',
    pageSize: 15,
    source: async (input) => {
      if (!input)
        return formatMenuChoices(menus, options)

      const normalizedInput = input.toLowerCase()
      const filtered = menus.filter(menu =>
        menu.name.toLowerCase().includes(normalizedInput)
        || (options.showDescription && menu.description?.toLowerCase().includes(normalizedInput)),
      )

      return formatMenuChoices(filtered, options)
    },
  })
}

function formatMenuChoices(menus: MenuItem[], options: DisplayOptions): Array<{
  value: MenuItem
  name: string
  description?: string
}> {
  const choices = menus.map(menu => ({
    value: menu,
    name: formatMenuName(menu),
    description: formatMenuDescription(menu, options),
  }))

  if (options.groupByType) {
    choices.sort((a, b) => {
      if (a.value.type === b.value.type) {
        return a.name.localeCompare(b.name)
      }
      return a.value.type.localeCompare(b.value.type)
    })
  }

  return choices
}

function formatMenuName(menu: MenuItem): string {
  const icon = getMenuTypeIcon(menu.type)
  const name = menu.name
  const dependencies = menu.dependsOn?.length
    ? chalk.gray(` (deps: ${menu.dependsOn.join(', ')})`)
    : ''

  return `${icon} ${name}${dependencies}`
}

function formatMenuDescription(menu: MenuItem, options: DisplayOptions): string | undefined {
  // If description exists and showDescription is enabled, use it
  if (options.showDescription && menu.description) {
    return menu.description
  }

  // Otherwise show command value or link URL as fallback description
  if (menu.type === 'command') {
    const value = Array.isArray(menu.value)
      ? menu.value.join(' && ')
      : menu.value as string
    return `$ ${value}`
  }
  else if (menu.type === 'link') {
    return `🔗 ${menu.value}`
  }

  return undefined
}

export function createBanner(): string {
  return boxen(
    `${chalk.cyan.bold('menuify CLI')}\n${chalk.gray('Interactive CLI Menu Generator')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
    },
  )
}

function getMenuTypeIcon(type: string): string {
  switch (type) {
    case 'command':
      return '⚡'
    case 'link':
      return '🔗'
    case 'function':
      return '🔧'
    default:
      return '📄'
  }
}
