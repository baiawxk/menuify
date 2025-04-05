#!/usr/bin/env node

import type { MenuItem, MenuOpts } from '..'
import fs from 'node:fs'
import process from 'node:process'
import { search } from '@inquirer/prompts'
import { cac } from 'cac'
import open from 'open'
import sh from 'shelljs'
import { loadConfig } from 'unconfig'

const PromptMsg = 'Select a command to run'

setupCli()

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
    message: PromptMsg,
    source: (input) => {
      const menus = config.menus.map((m) => {
        const { name } = m
        return {
          name,
          value: m,
        }
      })
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
        sh.exec(value, { cwd: menu.options.cwd })
      }
      else {
        sh.exec(value)
      }
    }
  })
}
