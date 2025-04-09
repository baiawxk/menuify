import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { confirm, search } from '@inquirer/prompts'
import { execa } from 'execa'
import open from 'open'
import { loadConfig } from 'unconfig'

export async function defineMenu(opts: MenuOpts): Promise<MenuOpts> {
  return opts
}

export interface MenuOpts {
  menus: MenuItem[]
}

export interface BaseMenu {
  name: string
  value: string
  children?: MenuItem[]
}

export interface CommandMenu extends BaseMenu {
  type: 'command'
  options?: { cwd?: string }
}

export interface LinkMenu extends BaseMenu {
  type: 'link'
}

export type MenuItem = CommandMenu | LinkMenu

export async function displayMenu(file?: string): Promise<void> {
  if (file && !fs.existsSync(file)) {
    console.error(`config file ${file} not found`)
    process.exit(1)
  }

  const { config, sources } = await loadConfig<MenuOpts>({
    sources: file
      ? [{ files: file }]
      : [{
          files: 'cli.config',
          extensions: ['ts', 'js', 'json'],
        }],
  })

  if (sources && sources.length > 0) {
    console.log(`Config File: ${sources[0]}`)
  }

  if (!config) {
    const confirmToCreate = await confirm({
      message: `Seems no config file found in ${process.cwd()}, create one?`,
    })

    if (confirmToCreate) {
      initConfig()
      process.exit(0)
    }
    else {
      process.exit(0)
    }
  }

  const menu = await search<MenuItem>({
    message: 'Select a command to run',
    source: (input) => {
      const menus = getMenu(config)
      if (!input)
        return menus
      const choices = menus.filter((m) => {
        return m.name.toLowerCase().includes(input.toLowerCase())
      })
      return choices
    },
  })

  const { type, value } = menu
  if (type === 'link') {
    open(value)
  }
  else if (type === 'command') {
    if (menu.options?.cwd) {
      await execa(value, { stdio: 'inherit', cwd: menu.options.cwd })
    }
    else {
      await execa(value, { stdio: 'inherit' })
    }
  }
}
function getMenu(config: MenuOpts) {
  return config.menus.map((m) => {
    const { name } = m
    return {
      name,
      value: m,
    }
  })
}

export function initConfig() {
  const currentFolder = dirname(fileURLToPath(import.meta.url))
  const tmplDir = resolve(currentFolder, './tmpl')
  const configFileName = 'cli.config.json'

  const source = resolve(tmplDir, configFileName)
  const target = resolve(process.cwd(), configFileName)
  fs.copyFileSync(source, target)
  console.log(`Sample Config Created: ${target}`)
}
