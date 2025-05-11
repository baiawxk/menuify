#!/usr/bin/env node

import process from 'node:process'
import { cac } from 'cac'
import { initConfig, resolveConfig, runConfig, searchMenu } from '../core'
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
    .action(() => {
      initConfig()
    })

  cli.command('edit', 'edit config file')
    .option('-c, --config <config>', 'config file to edit')
    .option('-e, --editor <editor>', 'editor to use (vim|nano|notepad|code|sublime|atom)')
    .action(({ config, editor }) => {
      editConfig({ config, editor })
    })

  cli.command('gen', 'generate shell scripts')
    .option('-f, --fileName <fileName>', 'file name to generate script for')
    .option('-o, --outputDir <dir>', 'output directory for generated scripts')
    .option('-c, --config <config>', 'config file to generate script for')
    .option('-t, --type <type>', 'type to generate script for (bash|cmd|ps1|fish|zsh)', {
      default: 'cmd',
    })
    .action(async ({ fileName, config, type, outputDir }) => {
      const resolved = await resolveConfig(config)
      const menu = await searchMenu(resolved.config, { message: 'Select a menu to generate script for' })
      genShell({
        shell: `menuify run "${menu.name}" -c "${config ? `${config}` : resolved.sources[0]}"`,
        cmdName: menu.name,
        fileName,
        type: type as any,
        outputDir,
      })
    })

  cli.parse()
}
