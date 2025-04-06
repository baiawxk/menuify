#!/usr/bin/env node
import type { MenuItem, MenuOpts } from '..'
import fs from 'node:fs'
import process from 'node:process'
import { search } from '@inquirer/prompts'
import { cac } from 'cac'
import { execa } from 'execa'
import open from 'open'
import { loadConfig } from 'unconfig'

const PROMPT_MSG = 'Select a command to run'
const PAGE_SIZE = 20

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
  const program = cac()
  program
    .option('-f, --file <file>', 'config file path')
    .version('0.0.1')
    .help()

  const { options } = program.parse()
  const { file } = options
  runConfig(file)
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
