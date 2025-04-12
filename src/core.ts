import type { EnvResolverOptions } from './envResolver'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { confirm, search } from '@inquirer/prompts'
import { loadConfig } from 'unconfig'
import { TaskRunner } from './taskRunner'

export type TaskInputType = 'promptString' | 'pickString' | 'confirm' | 'multiSelect'

export interface TaskInput {
  id: string
  type: TaskInputType
  description?: string
  default?: string
  options?: string[]
  joinSymbol?: string
}

export type TaskValue = string | string[] | ((context: any) => Promise<void>)

export interface BaseMenuItem {
  name: string
  dependsOn?: string[]
  inputs?: TaskInput[]
  env?: Record<string, string>
  runMode?: 'serial' | 'parallel'
  confirmMsg?: string
  description?: string
}

export interface CommandMenuItem extends BaseMenuItem {
  type: 'command'
  task: string | string[]
}

export interface LinkMenuItem extends BaseMenuItem {
  type: 'link'
  task: string | string[]
}

export interface FunctionMenuItem extends BaseMenuItem {
  type: 'function'
  task: (context: any) => Promise<void>
}

export type MenuItem = CommandMenuItem | LinkMenuItem | FunctionMenuItem

export interface ExecutionContext {
  env: Record<string, string>
  menuEnv: Record<string, string>
  inputs?: Record<string, unknown>
  taskStatuses?: Map<string, TaskStatus>
  debug?: boolean
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface CliConfig {
  debug?: boolean
  env?: Record<string, string>
  menus?: MenuItem[]
}

export function defineMenu(config: CliConfig): CliConfig {
  return config
}

export function isCommandMenuItem(menu: MenuItem): menu is CommandMenuItem {
  return menu.type === 'command'
}

export function isLinkMenuItem(menu: MenuItem): menu is LinkMenuItem {
  return menu.type === 'link'
}

export function isFunctionMenuItem(menu: MenuItem): menu is FunctionMenuItem {
  return menu.type === 'function'
}

export async function displayMenu(file?: string): Promise<void> {
  const { config, sources } = await resolveConfig(file)

  if (sources && sources.length > 0) {
    console.log(`Config File: ${sources[0]}`)
  }

  if (!config) {
    await createSampleConfig()
    return
  }
  const taskRunner = new TaskRunner(config)
  const menu = await searchMenu(config)
  await taskRunner.processMenu(menu)
}

async function searchMenu(config: CliConfig) {
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

export async function resolveConfig(file: string | undefined) {
  if (file && !fs.existsSync(file)) {
    console.error(`config file ${file} not found`)
    process.exit(1)
  }

  const result = await loadConfig<CliConfig>({
    sources: file
      ? [{ files: file }]
      : [{
          files: 'cli.config',
          extensions: ['ts', 'js', 'json'],
        }],
  })
  return result
}

function getMenu(config: CliConfig) {
  return config.menus?.map((m) => {
    const { name } = m
    return {
      name,
      value: m,
    }
  }) || []
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
