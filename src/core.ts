import type { CliConfig, MenuItem } from './types'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { confirm, search } from '@inquirer/prompts'
import { loadConfig } from 'unconfig'
import { executeMenuItem } from './handlers/taskHandler'

export function defineConfig(config: CliConfig): CliConfig {
  return config
}

export interface RunCfgOpt {
  config?: string
  name?: string
}

export async function runConfig(options: RunCfgOpt = {}): Promise<void> {
  const resolved = await resolveConfig(options.config)
  const menu = await findMenuBy(resolved.config, options.name)
  await executeMenuItem(menu)
}

async function findMenuBy(config: CliConfig, name?: string) {
  let menu: MenuItem | undefined

  if (name) {
    // 如果提供了名称，直接查找菜单
    menu = config.menus?.find(m => m.name === name)
    if (!menu) {
      console.error(`未找到菜单 "${name}"`)
      process.exit(1)
    }
  }
  else {
    // 否则使用交互式搜索
    menu = await searchMenu(config)
  }
  return menu
}

export async function searchMenu(config: CliConfig, { message } = { message: 'Select a menu to run' }) {
  const menus = getMenu(config)
  return await search<MenuItem>({
    message,
    pageSize: 15,
    source: (input) => {
      if (!input) {
        return menus
      }
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
  return config.menus?.map((m) => {
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
