import type { EnvResolverOptions } from './envResolver'
import fs from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { confirm, search } from '@inquirer/prompts'
import { loadConfig } from 'unconfig'
import { TaskRunner } from './taskRunner'

export type RunMode = 'serial' | 'parallel'

export type TaskInputType = 'promptString' | 'pickString' | 'confirm' | 'multiSelect'

export interface TaskInput {
  id: string
  type: TaskInputType
  description?: string
  default?: string
  options?: string[]
  joinSymbol?: string
}

export type FunctionCtx = {
  inputs?: Record<string, unknown>
  env?: Record<string, string>
  menuEnv?: Record<string, string>
}

export type MenuType = 'command' | 'link' | 'function'
export type TaskValue = string | string[] | ((inputs: FunctionCtx) => Promise<void>)

export interface MenuItem {
  name: string
  type: MenuType
  task: TaskValue
  inputs?: TaskInput[]
  dependsOn?: string[]
  confirmMsg?: string
  taskRunMode?: RunMode
  runMode?:RunMode
  env?: Record<string, string> // Add menu-level environment variables
  description?: string
  group?: string
  options?: {
    cwd?: string
  }
}

export interface CliConfig {
  menus?: MenuItem[]
  env?: Record<string, string>  // Global environment variables
  debug?: boolean               // Global debug flag
}

export async function defineMenu(opts: CliConfig): Promise<CliConfig> {
  return opts
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
