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

export interface BaseMenu {
  name: string
  dependsOn?: string[]
  inputs?: TaskInput[]
  env?: Record<string, string>
  runMode?: 'serial' | 'parallel'
  confirmMsg?: string
  show?: boolean
  description?: string
  group?: string
}

export interface CommandMenu extends BaseMenu {
  type: 'command'
  task: string | string[]
  options?: {
    cwd?: string
  }
}

export interface LinkMenu extends BaseMenu {
  type: 'link'
  task: string | string[]
}

export interface FunctionMenu extends BaseMenu {
  type: 'function'
  task: (context: any) => Promise<void>
}

export type MenuItem = CommandMenu | LinkMenu | FunctionMenu

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

export function isCommandMenuItem(menu: MenuItem): menu is CommandMenu {
  return menu.type === 'command'
}

export function isLinkMenuItem(menu: MenuItem): menu is LinkMenu {
  return menu.type === 'link'
}

export function isFunctionMenuItem(menu: MenuItem): menu is FunctionMenu {
  return menu.type === 'function'
}

export interface RunCfgOpt {
  file?: string
  name?: string
}

export async function runConfig(options: RunCfgOpt = {}): Promise<void> {
  console.log({ options })
  const { file, name } = options
  const { config, sources } = await resolveConfig(file)

  if (sources && sources.length > 0) {
    console.log(`Config File: ${sources[0]}`)
  }

  if (!config) {
    await createSampleConfig()
    return
  }

  const taskRunner = new TaskRunner(config)
  let menu: MenuItem | undefined

  if (name) {
    // If name is provided, find the menu directly
    menu = config.menus?.find(m => m.name === name)
    if (!menu) {
      console.error(`Menu "${name}" not found`)
      process.exit(1)
    }
  }
  else {
    // Otherwise use interactive search
    menu = await searchMenu(config)
  }

  await taskRunner.executeTask(menu)
}

async function searchMenu(config: CliConfig) {
  const menu = await search<MenuItem>({
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
  // console.log('🚀 ~ searchMenu ~ menu:', menu)
  return menu
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

export async function resolveConfig(file?: string) {
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
  return config.menus?.filter(m => m.show === undefined || m.show).map((m) => {
    const { name } = m
    return {
      name,
      value: m,
    }
  }) || []
}

export interface InitCfgOpt {
  type?: 'json' | 'ts' | 'js'
}

export function initConfig(options: InitCfgOpt = {}): void {
  const currentFolder = dirname(fileURLToPath(import.meta.url))
  const tmplDir = resolve(currentFolder, './tmpl')
  const type = options.type || 'ts'

  // Validate config type
  if (!['json', 'ts', 'js'].includes(type)) {
    console.error('Invalid config type. Supported types: json, ts, js')
    process.exit(1)
  }

  const configFileName = `cli.config.${type}`
  const source = resolve(tmplDir, 'cli.config.json')
  const target = resolve(process.cwd(), configFileName)

  // Don't overwrite existing config
  if (fs.existsSync(target)) {
    console.error(`Config file ${configFileName} already exists`)
    process.exit(1)
  }

  // For TS/JS, we need to convert the JSON template
  if (type !== 'json') {
    const jsonContent = fs.readFileSync(source, 'utf-8')
    const config = JSON.parse(jsonContent)
    const tsContent = `import { defineMenu } from 'menuify'

export default defineMenu(${JSON.stringify(config, null, 2)})
`
    fs.writeFileSync(target, tsContent)
  }
  else {
    fs.copyFileSync(source, target)
  }

  console.log(`Sample Config Created: ${target}`)
}
