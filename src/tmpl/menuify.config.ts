import { defineConfig } from 'menuify'

export default defineConfig({
  menus: [
    {
      name: '测试环境变量',
      type: 'execa',
      shell: 'echo "NODE_ENV: {NODE_ENV}"',
    },
    {
      name: 'test listr2',
      type: 'listr2',
      tasks: [{
        title: '子任务1',
        task: async (ctx, task) => {
          console.log({ ctx })
          task.title = '执行子任务1'
        },
      }, {
        title: '子任务2',
        task: async (ctx, task) => {
          task.title = '执行子任务2'
        },
      }],
      inputs: [
        {
          name: 'NAME',
          message: '请输入姓名',
          type: 'input',
        },
        {
          name: 'AGE',
          message: '请输入年龄',
          type: 'input',
          default: '18',
        },
      ],
    },
    {
      name: '测试用户输入',
      type: 'execa',
      shell: 'echo "Name: {NAME}, Age: {AGE}"',
      inputs: [
        {
          name: 'NAME',
          message: '请输入姓名',
          type: 'input',
        },
        {
          name: 'AGE',
          message: '请输入年龄',
          type: 'input',
          default: '18',
        },
      ],
    },
    {
      name: '测试组合变量',
      type: 'execa',
      shell: 'echo "系统: {OS_TYPE}, 用户: {USER_NAME}"',
      inputs: [
        {
          name: 'USER_NAME',
          message: '请输入用户名',
          type: 'input',
        },
      ],
    },
    {
      name: '测试并行任务',
      type: 'concurrently',
      tasks: [
        { command: 'echo "Task1: {TASK_NAME}"' },
        { command: 'echo "Task2: {USER_NAME}"' },
      ],
      inputs: [
        {
          name: 'TASK_NAME',
          message: '请输入任务名称',
          type: 'input',
          default: 'test-task',
        },
      ],
    },
  ],
})
