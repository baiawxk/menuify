/**
 * 菜单和任务相关的所有类型定义
 */

import type { confirm, editor, expand, input, number, password, rawlist, search, select } from '@inquirer/prompts'

/** 基础菜单配置 */
interface BaseMenu {
  name: string
  confirmMsg?: string
}

/** 用户输入配置 */

export interface BaseInput {
  name: string
}

export type ConfirmInput = BaseInput & Parameters<typeof confirm>[0] & { type: 'confirm' }

export type SearchInput = BaseInput & Parameters<typeof search>[0] & { type: 'search' }

export type NumberInput = BaseInput & Parameters<typeof number>[0] & { type: 'number' }

export type RawlistInput = BaseInput & Parameters<typeof rawlist>[0] & { type: 'rawlist' }

export type SelectInput = BaseInput & Parameters<typeof select>[0] & { type: 'select' }

export type PasswordInput = BaseInput & Parameters<typeof password>[0] & { type: 'password' }

export type ExpandInput = BaseInput & Parameters<typeof expand>[0] & { type: 'expand' }

export type EditorInput = BaseInput & Parameters<typeof editor>[0] & { type: 'editor' }

export type PromptInput = BaseInput & Parameters<typeof input>[0] & { type: 'input' }

export type TaskInput = ConfirmInput | SearchInput | NumberInput | RawlistInput | SelectInput | PasswordInput | ExpandInput | EditorInput | PromptInput

/** 静态菜单项基础配置 */
interface InputAble {
  inputs?: TaskInput[]
}

/** Execa命令执行菜单配置 */
export interface ExecaMenu extends BaseMenu, InputAble {
  type: 'execa'
  shell: string
  options?: {
    cwd?: string
  }
}

/** Open链接菜单配置 */
export interface OpenMenu extends BaseMenu, InputAble {
  type: 'open'
  target: string
  options?: import('open').Options
}

/** Concurrently并行任务菜单配置 */
export interface ConcurrentlyMenu extends BaseMenu, InputAble {
  type: 'concurrently'
  tasks: import('concurrently').ConcurrentlyCommandInput[]
  options?: import('concurrently').ConcurrentlyOptions
}

/** 函数菜单配置 */
export interface FunctionMenu extends BaseMenu, InputAble {
  type: 'function'
  task: (context: Variables) => Promise<void>
}

/** Listr2任务列表菜单配置 */
export interface Listr2Menu extends BaseMenu, InputAble {
  type: 'listr2'
  tasks: import('listr2').ListrTask[]
  options?: import('listr2').ListrOptions
}

/** 菜单项类型 */
export type MenuItem = ExecaMenu | OpenMenu | ConcurrentlyMenu | FunctionMenu | Listr2Menu

/** CLI 配置 */
export interface CliConfig {
  menus?: MenuItem[]
}

/** 变量集合类型 */
export type Variables = Record<string, any>

/** 简单的字符串转换函数类型 */
export type StringTransformer = (input: string, vars: Variables) => string
