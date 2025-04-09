#!/usr/bin/env node

import process from 'node:process'
import { cac } from 'cac'
import { displayMenu, initConfig } from '../core'

setupCli()
catchExitException()

function catchExitException() {
  process.on('uncaughtException', (_error) => {
    console.clear()
    // if (error instanceof Error && error.name === 'ExitPromptError') {
    //   console.clear()
    // }
    // else {
    //   // Rethrow unknown errors
    //   throw error
    // }
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

  cli.parse()
}
