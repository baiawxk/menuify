import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { resolveConfig } from './core'

export type EditorType = 'vim' | 'nano' | 'notepad' | 'code' | 'sublime' | 'atom'

export interface EditCfgOpts {
  config?: string
  editor?: string
}

function getDefaultEditor(): string {
  // Platform specific defaults
  if (process.platform === 'win32') {
    return 'notepad'
  }

  // Try common editors on Unix systems
  if (process.platform === 'darwin') {
    return 'nano'
  } // More user-friendly default for macOS

  return 'vim' // Default for Unix-like systems
}

function validateEditor(editor: string): EditorType | string {
  const knownEditors: EditorType[] = ['vim', 'nano', 'notepad', 'code', 'sublime', 'atom']

  // If it's a known editor type, return as is
  if (knownEditors.includes(editor as EditorType)) {
    return editor
  }

  // For custom editors, validate that they exist in PATH
  // This is a basic check that could be enhanced
  return editor
}

/**
 * Open config file in user's default editor
 */
export async function editConfig({ config, editor }: EditCfgOpts): Promise<void> {
  const configFile = await findConfigFile(config)
  if (!configFile) {
    throw new Error('No config file found')
  }

  // Determine which editor to use
  const selectedEditor = validateEditor(editor || getDefaultEditor())

  // Map editor commands to actual process names
  const editorCommand = (() => {
    switch (selectedEditor) {
      case 'code':
        return 'code'
      case 'sublime':
        return process.platform === 'win32' ? 'subl' : 'sublime'
      case 'atom':
        return 'atom'
      default:
        return selectedEditor
    }
  })()

  // Add any editor-specific arguments
  const editorArgs = (() => {
    switch (selectedEditor) {
      case 'code':
        return ['--wait', configFile] // VSCode needs --wait to block
      case 'sublime':
      case 'atom':
        return ['--wait', configFile]
      default:
        return [configFile]
    }
  })()

  return new Promise((resolve, reject) => {
    const child = spawn(editorCommand, editorArgs, {
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

    child.on('error', (error) => {
      if (error.message.includes('ENOENT')) {
        reject(new Error(`Editor "${selectedEditor}" not found. Please ensure it's installed and in your PATH.`))
      }
      else {
        reject(error)
      }
    })
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
