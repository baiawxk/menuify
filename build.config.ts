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
      // Create template directory
      fs.mkdirSync('./dist/tmpl', { recursive: true })

      // Copy all config templates
      const templates = [
        'menuify.config.json',
        'menuify.config.ts',
        'menuify.config.mjs',
        'menuify.config.cjs',
      ]

      for (const template of templates) {
        fs.copyFileSync(`./src/tmpl/${template}`, `./dist/tmpl/${template}`)
      }
    },
  },
})
