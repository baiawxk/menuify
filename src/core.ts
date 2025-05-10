import type { CliConfig, CommandMenu, FunctionMenu, LinkMenu, MenuItem } from './types'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { confirm, search } from '@inquirer/prompts'
import { loadConfig } from 'unconfig'
import { TaskRunner } from './taskRunner'

export function defineConfig(config: CliConfig): CliConfig {
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
  config?: string
  name?: string
}

export async function runConfig(options: RunCfgOpt = {}): Promise<void> {
  const resolved = await resolveConfig(options.config)
  const menu = await findMenuBy(resolved.config, options.name)

  const taskRunner = new TaskRunner(resolved.config)
  await taskRunner.executeTask(menu)
}

async function findMenuBy(config: CliConfig, name?: string) {
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
  return menu
}

export async function searchMenu(config: CliConfig, { message } = { message: 'Select a command to run' }) {
  const menu = await search<MenuItem>({
    message,
    pageSize: 15,
    source: (input) => {
      const menus = getMenu(config)
      if (!input) {
        return menus
      }
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
  if (file && !existsSync(file)) {
    console.error(`config file ${file} not found`)
    process.exit(1)
  }

  const result = await loadConfig<CliConfig>({
    sources: file
      ? [{ files: file }]
      : [{
          files: 'menuify.config',
          extensions: ['ts', 'js', 'json'],
        }],
  })

  const { config, sources } = result

  if (sources && sources.length > 0) {
    console.log(`Config File: ${sources[0]}`)
  }

  if (!config) {
    await createSampleConfig()
    process.exit(0)
  }

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
  type?: 'mts' | 'cts' | 'ts' | 'mjs' | 'cjs' | 'js' | 'json'
}

export function initConfig(options: InitCfgOpt = {}): void {
  const currentFolder = dirname(fileURLToPath(import.meta.url))
  const tmplDir = resolve(currentFolder, './tmpl')
  const type = options.type || 'ts'

  // Map file extensions to base template types
  const templateMap: Record<string, string> = {
    mts: 'ts',
    cts: 'ts',
    ts: 'ts',
    mjs: 'mjs',
    cjs: 'cjs',
    js: 'mjs', // Use ESM by default for .js
    json: 'json',
  }

  // Validate config type
  if (!Object.keys(templateMap).includes(type)) {
    console.error(`Invalid config type. Supported types: ${Object.keys(templateMap).join(', ')}`)
    process.exit(1)
  }

  const configFileName = `menuify.config.${type}`
  const baseTemplate = templateMap[type]
  const source = resolve(tmplDir, `menuify.config.${baseTemplate}`)
  const target = resolve(process.cwd(), configFileName)

  // Don't overwrite existing config
  if (existsSync(target)) {
    console.error(`Config file ${configFileName} already exists`)
    process.exit(1)
  }

  // For non-JSON types, we need to adapt the module syntax
  if (type !== 'json') {
    let content = readFileSync(source, 'utf-8')

    // Handle TypeScript variants
    if (['mts', 'cts', 'ts'].includes(type)) {
      // Template is already in TypeScript format
      writeFileSync(target, content)
    }
    // Handle JavaScript variants
    else {
      // Remove TypeScript-specific syntax if present
      content = content.replace(/: \w+(?=,|\s|$)/g, '')
      writeFileSync(target, content)
    }
  }
  else {
    // For JSON, use the JSON template directly
    const jsonTemplate = resolve(tmplDir, 'menuify.config.json')
    copyFileSync(jsonTemplate, target)
  }

  console.log(`Sample Config Created: ${target}`)
}
