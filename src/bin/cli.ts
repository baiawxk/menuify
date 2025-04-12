#!/usr/bin/env node

import process from 'node:process'
import { cac } from 'cac'
import { displayMenu, initConfig } from '../core'
import { editConfig } from '../editor'
import { generateShellScript } from '../generator'

setupCli()
catchExitException()

function catchExitException() {
  process.on('uncaughtException', (error) => {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.clear()
    }
    else {
      // Rethrow unknown errors
      throw error
    }
  })
}

function setupCli(): void {
  const cli = cac()
  cli
    .version('0.0.1')
    .help()

  cli.command('', 'run config file')
    .option('-f, --file <file>', 'config file')
    .action(({ file }) => {
      displayMenu(file)
    })

  cli.command('init', 'init config file')
    .action(() => {
      initConfig()
    })

  cli.command('edit', 'edit config file')
    .option('-f, --file <file>', 'config file to edit')
    .action(({ file }) => {
      editConfig(file)
    })

  cli.command('gen', 'generate shell scripts')
    .option('--menu <menu>', 'menu name to generate script for')
    .option('--platform <platform>', 'platform to generate script for (bash|cmd|ps1|all)', { 
      default: 'all' 
    })
    .action((options) => {
      generateShellScript({
        configFile: options.file,
        outputFile: options.menu ? `menu-${options.menu}` : undefined,
        type: options.platform === 'all' ? undefined : options.platform
      })
    })

  cli.parse()
}
