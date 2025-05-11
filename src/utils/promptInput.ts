import type { TaskInput } from '../types'
import { confirm, editor, expand, input, number, password, rawlist, search, select } from '@inquirer/prompts'

export async function promptInput<T extends TaskInput>(taskInput: T): Promise<any> {
  switch (taskInput.type) {
    case 'input':
      return await input(taskInput)
    case 'select':
      return await select(taskInput)
    case 'confirm':
      return await confirm(taskInput)
    case 'rawlist':
      return await rawlist(taskInput)
    case 'editor':
      return await editor(taskInput)
    case 'expand':
      return await expand(taskInput)
    case 'number':
      return await number(taskInput)
    case 'password':
      return await password(taskInput)
    case 'search':
      return await search(taskInput)
    default:
      throw new Error(`不支持的输入类型`)
  }
}
