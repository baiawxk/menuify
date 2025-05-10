import { defineConfig } from 'menuify'

export default defineConfig({
  debug: false,
  env: {
    NODE_ENV: 'development',
  },
  menus: [
    {
      name: 'Build Project',
      type: 'command',
      task: 'npm run build',
    },
    {
      name: 'Start Dev Server',
      type: 'command',
      task: 'npm run dev',
    },
    {
      name: 'Run Tests',
      type: 'command',
      task: 'npm test',
      confirmMsg: 'Run tests?',
    },
  ],
})
