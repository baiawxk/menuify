#!/usr/bin/env node

import type { MenuItem, MenuOpts } from '..'
import fs from 'node:fs'
import { search } from '@inquirer/prompts'
import { Command } from 'commander'
import open from 'open'
import sh from 'shelljs'
import { loadConfig } from 'unconfig'

const PromptMsg = 'Select menu'

setupCli()

function setupCli(): void {
  const program = new Command()

  program
    .version('0.0.1')
    .description('use defineMenu to create cli menu or use -f to load different configs')
    .action(() => {
      runConfig()
    })

  program
    .option('-f, --file <file>', 'config file path')
    .action(async ({ file }) => {
      runConfig(file)
    })

  program.parse()
}

async function runConfig(file?: string): Promise<void> {
  if (file && !fs.existsSync(file)) {
    throw new Error(`config file ${file} not found`)
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
