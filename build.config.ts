import fs from 'node:fs'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/bin/cli',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  hooks: {
    'build:done': () => {
      fs.mkdirSync('./dist/tmpl', { recursive: true })
      fs.copyFileSync('./src/tmpl/cli.config.ts', './dist/tmpl/cli.config.ts')
    },
  },
})
