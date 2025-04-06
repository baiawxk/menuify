#!/usr/bin/env node
import type { MenuItem, MenuOpts } from '..'
import fs from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { search } from '@inquirer/prompts'
import { cac } from 'cac'
import { execa } from 'execa'
import open from 'open'
import { loadConfig } from 'unconfig'

const PROMPT_MSG = 'Select a command to run'
const PAGE_SIZE = 20
const cwd = process.cwd()
const currentFile = fileURLToPath(import.meta.url)
const tmplDir = resolve(currentFile, '../../tmpl')
const configFileName = 'cli.config.ts'

setupCli()

process.on('uncaughtException', (error) => {
  if (error instanceof Error && error.name === 'ExitPromptError') {
    // console.log('done')
  }
  else {
    // Rethrow unknown errors
    throw error
  }
})

function setupCli(): void {
  const cli = cac()
  cli
    .version('0.0.1')
    .help()

  cli.command('', 'run config file')
    .option('-f, --file <file>', 'config file')
    .action(({ file }) => {
      runConfig(file)
    })

  cli.command('init', 'init config file')
    .action(() => {
      const source = resolve(tmplDir, configFileName)
      const target = resolve(cwd, configFileName)
      fs.copyFileSync(source, target)
      console.log(`Sample config created: ${target}`)
    })

  cli.parse()
}

async function runConfig(file?: string): Promise<void> {
  if (file && !fs.existsSync(file)) {
    console.error(`config file ${file} not found`)
    process.exit(1)
  }
  const { config } = await loadConfig<MenuOpts>({
    sources: file
      ? [{ files: file }]
      : [{
          files: 'cli.config',
          extensions: ['ts', 'js', 'json'],
        }],
  })

  await search({
    pageSize: PAGE_SIZE,
    message: PROMPT_MSG,
    source: (input) => {
      const menus = getMenu(config)
      if (!input)
        return menus
      const choices = menus.filter((m) => {
        return m.name.toLowerCase().includes(input.toLowerCase())
      })
      return choices
    },
  }).then(async (menu: MenuItem) => {
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
  })
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
