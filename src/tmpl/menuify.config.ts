import { defineConfig } from 'menuify'

export default defineConfig({
  menus: [
    {
      name: 'Test environment variables',
      type: 'execa',
      shell: 'echo "NODE_ENV: {NODE_ENV}"',
    },
    {
      name: 'open URL with Chrome',
      type: 'open',
      target: 'https://www.baidu.com',
      options: {
        app: {
          name: 'chrome',
        },
      },
    },
    {
      name: 'open URL with default browser',
      type: 'open',
      target: 'https://www.baidu.com',
    },
    {
      name: 'Test listr2',
      type: 'listr2',
      confirmMsg: 'Execute tasks?',
      options: {
        concurrent: true,
      },
      tasks: [{
        title: 'subtask 1',
        task: async (ctx, task) => {
          task.skip('Skip subtask 1')
        },
      }, {
        title: 'subtask 2',
        task: async (ctx, task) => {
          task.output = 'Executing subtask 2'
        },
      }],
    },
    {
      name: 'Test Input: input',
      type: 'execa',
      shell: 'echo "Hi: {NAME}"',
      inputs: [
        {
          name: 'NAME',
          message: 'Enter your name',
          type: 'input',
        },
      ],
    },
    {
      name: 'Test Input: list',
      shell: '{cmd}',
      type: 'execa',
      inputs: [
        {
          name: 'cmd',
          type: 'list',
          choices: [
            'echo pnpx create vite@latest',
            'echo pnpx create vue@latest',
            'echo pnpx create electron-app@latest',
            'echo pnpx create nuxt-app@latest',
            'echo pnpx create react-app@latest',
            'echo pnpx create next-app@latest',
            'echo pnpx sv create',
            'echo pnpx create-agent-chat-app@latest',
          ],
        },
      ],
    },
    {
      name: 'Test concurrently',
      type: 'concurrently',
      tasks: [
        { command: 'echo 1', prefixColor: 'bgBlue' },
        { command: 'echo 2', prefixColor: 'bgYellow' },
      ],
    },
    {
      name: 'Test function type',
      type: 'function',
      task: async (ctx) => {
        console.log('Executing custom function task')
      },
    },
  ],
})
