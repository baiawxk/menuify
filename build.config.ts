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
})
