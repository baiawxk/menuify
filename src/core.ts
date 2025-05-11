import type { CliConfig, MenuItem } from './types'
import { copyFileSync, existsSync } from 'node:fs'
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
  const typeOrder: MenuItem['type'][] = ['execa', 'open', 'function', 'concurrently', 'listr2']
  const menus = getMenu(config).sort((a, b) => {
    return typeOrder.indexOf(a.value.type) - typeOrder.indexOf(b.value.type)
  })

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
      name: formatMenuName(name, m.type),
      value: m,
    }
  }) || []
}

export function initConfig(): void {
  const currentFolder = dirname(fileURLToPath(import.meta.url))
  const tmplDir = resolve(currentFolder, './tmpl')

  const configFileName = `menuify.config.ts`
  const source = resolve(tmplDir, configFileName)
  const target = resolve(process.cwd(), configFileName)

  // Don't overwrite existing config
  if (existsSync(target)) {
    console.error(`Config file ${configFileName} already exists`)
    process.exit(1)
  }

  copyFileSync(source, target)

  console.log(`Sample Config Created: ${target}`)
}

function formatMenuName(name: string, type: MenuItem['type']): string {
  const icon = getMenuTypeIcon(type)
  return `${icon} ${name}`
}

function getMenuTypeIcon(type: MenuItem['type']): string {
  switch (type) {
    case 'execa':
      return '🟩'
    case 'open':
      return '🟧'
    case 'function':
      return '🟪'
    case 'concurrently':
      return '🟦'
    case 'listr2':
      return '🟨'
    default:
      return ''
  }
}
