#!/usr/bin/env node

import process from 'node:process'
import { cac } from 'cac'
import { initConfig, runConfig } from '../core'
import { editConfig } from '../editor'
import { genShell } from '../generator'

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

  cli.command('[config]', 'run config specified in the command line')
    .option('-n, --name <name>', 'run specific menu')
    .action((config, { name }) => {
      runConfig({ config, name })
    })

  cli.command('run [name]', 'run the menu directly')
    .option('-c, --config <config>', 'run config specified in the command line')
    .action((name, { config }) => {
      runConfig({ config, name })
    })

  cli.command('init', 'init config file')
    .option('-t, --type <type>', 'config file type (json|ts|js), ts is default')
    .action(({ type }) => {
      initConfig({ type })
    })

  cli.command('edit', 'edit config file')
    .option('-c, --config <config>', 'config file to edit')
    .option('-e, --editor <editor>', 'editor to use (vim|nano|notepad|code|sublime|atom)')
    .action(({ config, editor }) => {
      editConfig({ config, editor })
    })

  cli.command('gen <name>', 'generate shell scripts')
    .option('-f, --fileName <fileName>', 'file name to generate script for')
    .option('-c, --config <config>', 'config file to generate script for')
    .option('-t, --type <type>', 'type to generate script for (bash|cmd|ps1|all)', {
      default: 'cmd',
    })
    .action((name: string, { fileName, config, type }) => {
      genShell({
        shell: `menuify run ${name} ${config ? `--config ${config}` : ''}`,
        cmdName: name,
        fileName,
        type,
      })
    })

  cli.parse()
}
