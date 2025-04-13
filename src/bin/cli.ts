#!/usr/bin/env node

import process from 'node:process'
import { cac } from 'cac'
import { initConfig, runConfig } from '../core'
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
    .option('-m, --menu <menuName>', 'run specific menu')
    .action(({ file, menuName }) => {
      runConfig({ file, menuName })
    })

  cli.command('run', 'run config file')
    .option('-f, --file <file>', 'config file')
    .option('-m, --menu <menuName>', 'run specific menu')
    .action(({ file, menuName }) => {
      runConfig({ file, menuName })
    })

  cli.command('init', 'init config file')
    .option('-t, --type <type>', 'config file type (json|ts|js), ts is default')
    .action(({ type }) => {
      initConfig({ type })
    })

  cli.command('edit', 'edit config file')
    .option('-f, --file <file>', 'config file to edit, if not pass, will find config file in current directory')
    .action(({ file }) => {
      editConfig(file)
    })

  cli.command('gen', 'generate shell scripts')
    .option('--menu <menu>', 'menu name to generate script for')
    .option('--platform <platform>', 'platform to generate script for (bash|cmd|ps1|all)', {
      default: 'all',
    })
    .action((options) => {
      generateShellScript({
        configFile: options.file,
        outputFile: options.menu ? `menu-${options.menu}` : undefined,
        type: options.platform === 'all' ? undefined : options.platform,
      })
    })

  cli.parse()
}
