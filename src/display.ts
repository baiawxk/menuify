import boxen from 'boxen'
import chalk from 'chalk'
import type { MenuOpts, MenuItem } from './core'

export function createBanner(): string {
  return boxen(chalk.cyan.bold('menuify CLI') + '\n' + chalk.gray('Interactive CLI Menu Generator'), {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'cyan',
  })
}

export function formatMenuGroups(config: MenuOpts): string {
  const groups = new Map<string, MenuItem[]>()
  
  // Group menus
  config.menus.forEach((menu) => {
    const group = menu.group || 'default'
    if (!groups.has(group)) {
      groups.set(group, [])
    }
    groups.get(group)?.push(menu)
  })

  // Format output
  let output = ''
  groups.forEach((menus, groupName) => {
    output += '\n' + chalk.cyan.bold(`📂 ${groupName.toUpperCase()}`) + '\n'
    menus.forEach((menu) => {
      const icon = getMenuTypeIcon(menu.type)
      output += chalk.gray(`  ${icon} ${menu.name}`) + '\n'
    })
  })

  return output
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
