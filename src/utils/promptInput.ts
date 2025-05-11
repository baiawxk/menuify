import type { TaskInput } from '../types'
import { input, select } from '@inquirer/prompts'

export async function promptInput(taskInput: TaskInput): Promise<string | undefined> {
  const { type = 'input', message, name, choices = [] } = taskInput
  const prompt = message || `请输入 ${name}`

  try {
    switch (type) {
      case 'input':
        return await input({ message: prompt, default: taskInput.default as string })
      case 'list':
        return await select({
          message: prompt,
          choices: choices.map(choice => ({
            value: choice,
            label: choice,
          })),
        })
      default:
        throw new Error(`不支持的输入类型: ${type}`)
    }
  }
  catch (error) {
    console.error(`输入处理错误:`, error)
    return taskInput.default
  }
}
