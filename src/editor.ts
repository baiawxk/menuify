import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { resolveConfig } from './core'

export interface EditorOptions {
  file?: string
}

/**
 * Open config file in user's default editor
 */
export async function editConfig(file?: string): Promise<void> {
  const configFile = await findConfigFile(file)
  if (!configFile) {
    throw new Error('No config file found')
  }

  const editor = process.env.EDITOR || process.platform === 'win32' ? 'notepad' : 'vi'

  return new Promise((resolve, reject) => {
    const child = spawn(editor, [configFile], {
      stdio: 'inherit',
      shell: true,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      }
      else {
        reject(new Error(`Editor exited with code ${code}`))
      }
    })

    child.on('error', reject)
  })
}

async function findConfigFile(file?: string): Promise<string | undefined> {
  if (file) {
    const resolvedPath = resolve(process.cwd(), file)
    return existsSync(resolvedPath) ? resolvedPath : undefined
  }

  const { sources } = await resolveConfig()
  return sources?.[0]
}
