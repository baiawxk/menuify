import type { ExecaMenu, Listr2Menu, MenuItem, Variables } from '../types'
import { cwd } from 'node:process'
import { confirm } from '@inquirer/prompts'
import concurrently from 'concurrently'
import dotenv from 'dotenv'
import { execa } from 'execa'
import { Listr } from 'listr2'
import open from 'open'
import { promptInput } from '../utils/promptInput'
import { transformString } from '../utils/stringTransformer'

dotenv.config()

const isDebug = process.env.DEBUG === 'true'

/**
 * 获取环境变量
 */
function getEnvVariables(): Variables {
  return Object.entries(process.env).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {} as Variables)
}

/**
 * 执行静态任务
 */
async function executeExecaTask(menu: ExecaMenu, variables: Variables): Promise<void> {
  const resolvedTask = transformString(menu.shell, variables)
  if (isDebug) {
    console.log('[DEBUG] 执行任务:', resolvedTask)
  }
  await execa(resolvedTask, {
    shell: true,
    stdio: 'inherit',
    cwd: menu.options?.cwd || cwd(),
  })
}

/**
 * 执行菜单项
 */
export async function executeMenuItem(menu: MenuItem): Promise<void> {
  try {
    if (menu.confirmMsg) {
      const confirmed = await confirm({ message: menu.confirmMsg })
      if (!confirmed) {
        console.log('任务已取消')
        return
      }
    }

    // 1. 收集变量
    const variables = getEnvVariables()

    // 2. 处理用户输入
    if ('inputs' in menu && menu.inputs?.length) {
      for (const input of menu.inputs) {
        const value = await promptInput(input)
        if (value !== undefined) {
          variables[input.name] = value
        }
      }
    }

    // 3. 执行任务
    switch (menu.type) {
      case 'execa':
        await executeExecaTask(menu, variables)
        break

      case 'open':
        await open(transformString(menu.target, variables), menu.options)
        break

      case 'concurrently': {
        const tasks = Array.isArray(menu.task)
          ? menu.task.map(cmd => typeof cmd === 'string'
              ? { command: transformString(cmd, variables) }
              : { ...cmd, command: transformString(cmd.command, variables) })
          : menu.task
        await concurrently(tasks, menu.options)
        break
      }

      case 'function':
        await menu.task(variables)
        break

      case 'listr2':
        await executeListr2(menu, variables)
        break

      default:
        throw new Error(`不支持的任务类型`)
    }
  }
  catch (error) {
    console.error(`执行任务失败 ${menu.name}:`, error)
    throw error
  }
}

async function executeListr2(menu: Listr2Menu, variables: Variables): Promise<void> {
  const runner = new Listr(menu.tasks, menu.options)
  await runner.run(variables)
}
