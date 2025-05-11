/**
 * 菜单和任务相关的所有类型定义
 */

/** 基础菜单配置 */
interface BaseMenu {
  name: string
  confirmMsg?: string
}

/** 用户输入配置 */
export interface TaskInput {
  name: string
  message?: string
  type?: 'input' | 'list'
  choices?: string[]
  default?: string
  validate?: (input: any) => boolean | string | Promise<boolean | string>
}

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
  task: string[] | import('concurrently').ConcurrentlyCommandInput[]
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
export type Variables = Record<string, string>

/** 简单的字符串转换函数类型 */
export type StringTransformer = (input: string, vars: Variables) => string
