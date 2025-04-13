import { defineMenu } from 'menuify'

export default defineMenu({
  debug: false,
  env: {
    NODE_ENV: 'development'
  },
  menus: [
    {
      name: 'Build Project',
      type: 'command',
      task: 'npm run build',
      description: 'Build the project'
    },
    {
      name: 'Start Dev Server',
      type: 'command',
      task: 'npm run dev',
      description: 'Start development server'
    },
    {
      name: 'Run Tests',
      type: 'command',
      task: ['npm test', 'npm run coverage'],
      description: 'Run tests with coverage',
      confirmMsg: 'Run all tests?'
    }
  ]
})
