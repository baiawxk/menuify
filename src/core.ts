import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { confirm, search } from '@inquirer/prompts'
import { loadConfig } from 'unconfig'
import { TaskRunner } from './taskRunner'

export async function defineMenu(opts: MenuOpts): Promise<MenuOpts> {
  return opts
}

export interface MenuOpts {
  menus: MenuItem[]
}

export interface TaskInput {
  id: string
  type: 'promptString' | 'pickString' | 'confirm' | 'multiSelect'
  description?: string
  default?: string
  options?: string[]
  joinSymbol?: string
}

export interface BaseMenu {
  name: string
  description?: string
  children?: MenuItem[]
  group?: string
  dependsOn?: string[]
  inputs?: TaskInput[]
}

export interface CommandMenu extends BaseMenu {
  type: 'command'
  value: string | string[]
  runMode?: 'sequential' | 'parallel'
  options?: {
    cwd?: string
  }
}

export interface LinkMenu extends BaseMenu {
  type: 'link'
  value: string
}

export interface FunctionMenu extends BaseMenu {
  type: 'function'
  value: (inputs?: Record<string, string>) => Promise<void>
}

export type MenuItem = CommandMenu | LinkMenu | FunctionMenu

const taskRunner = new TaskRunner()

export async function displayMenu(file?: string): Promise<void> {
  const { config, sources } = await resolveConfig(file)

  if (sources && sources.length > 0) {
    console.log(`Config File: ${sources[0]}`)
  }

  if (!config) {
    await createSampleConfig()
    return
  }

  taskRunner.setConfig(config)
  const menu = await searchMenu(config)
  await taskRunner.processMenu(menu)
}

async function searchMenu(config: MenuOpts) {
  return await search<MenuItem>({
    message: 'Select a command to run',
    pageSize: 15,
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
}

async function createSampleConfig() {
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

async function resolveConfig(file: string | undefined) {
  if (file && !fs.existsSync(file)) {
    console.error(`config file ${file} not found`)
    process.exit(1)
  }

  const result = await loadConfig<MenuOpts>({
    sources: file
      ? [{ files: file }]
      : [{
          files: 'cli.config',
          extensions: ['ts', 'js', 'json'],
        }],
  })
  return result
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
