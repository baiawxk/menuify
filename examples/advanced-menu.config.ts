import type { MenuItem } from '../src/types'
import { defineConfig } from '../src'

export default defineConfig({
  menus: [
    // 基础执行器示例
    {
      name: '基础任务组',
      type: 'listr2',
      tasks: [
        {
          title: '检查Node版本',
          task: 'node --version',
        },
        {
          title: '检查依赖',
          task: 'npm list --depth=0',
        },
      ],
      options: {
        concurrent: false,
        renderer: 'default',
      },
    },

    // 开发工作流示例
    {
      name: '开发环境',
      type: 'concurrently',
      task: [
        { command: 'npm run watch', name: 'TypeScript' },
        { command: 'npm run test:watch', name: 'Tests' },
        { command: 'npm run lint:watch', name: 'ESLint' },
      ],
      options: {
        killOthers: ['failure'],
        restartTries: 3,
        prefix: 'name',
      },
    },

    // 构建流程示例
    {
      name: '构建流程',
      type: 'listr2',
      tasks: [
        {
          title: '清理构建目录',
          task: 'rm -rf dist',
        },
        {
          title: '运行测试',
          task: 'npm test',
        },
        {
          title: '构建项目',
          task: 'npm run build',
        },
        {
          title: '生成文档',
          task: 'npm run docs',
        },
      ],
      options: {
        concurrent: false,
        exitOnError: true,
      },
    },

    // 部署流程示例
    {
      name: '部署流程',
      type: 'listr2',
      tasks: [
        {
          title: '构建检查',
          task: async () => {
            // 自定义检查逻辑
            await checkBuild()
          },
        },
        {
          title: '运行测试',
          task: 'npm test',
        },
        {
          title: '部署到测试环境',
          task: 'npm run deploy:test',
        },
      ],
      options: {
        renderer: 'verbose',
      },
    },
  ] as MenuItem[],
})

// 模拟函数
async function checkBuild() {
  return Promise.resolve()
}
