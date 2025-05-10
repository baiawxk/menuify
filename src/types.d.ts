/**
 * 菜单和任务相关的所有类型定义
 */

/** 任务输入类型 */
export type TaskInputType = 'promptString' | 'pickString' | 'confirm' | 'multiSelect'

/** 任务输入配置 */
export interface TaskInput {
  id: string
  type: TaskInputType
  description?: string
  default?: string
  options?: string[]
  joinSymbol?: string
}

/** 基础菜单配置 */
export interface BaseMenu {
  name: string
  inputs?: TaskInput[]
  confirmMsg?: string
}

/** Execa命令执行菜单配置 */
export interface ExecaMenu extends BaseMenu {
  type: 'execa'
  task: string
  options?: {
    cwd?: string
  }
}

/** Open链接菜单配置 */
export interface OpenMenu extends BaseMenu {
  type: 'open'
  task: string
}

/** 函数菜单配置 */
export interface FunctionMenu extends BaseMenu {
  type: 'function'
  task: (context: FunctionContext) => Promise<void>
}

/** Listr2任务列表菜单配置 */
export interface Listr2Menu extends BaseMenu {
  type: 'listr2'
  task: import('listr2').ListrTask[]
  options?: import('listr2').ListrOptions
}

/** Concurrently并行任务菜单配置 */
export interface ConcurrentlyMenu extends BaseMenu {
  type: 'concurrently'
  task: import('concurrently').ConcurrentlyCommandInput[]
  options?: import('concurrently').ConcurrentlyOptions
}

/** 函数上下文 */
export interface FunctionContext {
  env: Record<string, string>
  inputs: Record<string, any>
}

/** Listr2任务配置 */
export interface Listr2Task {
  title: string
  task: string | ((ctx: FunctionContext) => Promise<void>)
}

/** Listr2选项 */
export interface Listr2Options {
  concurrent?: boolean
  exitOnError?: boolean
  renderer?: 'default' | 'verbose' | 'silent'
}

/** Concurrently选项 */
export interface ConcurrentlyOptions {
  maxProcesses?: number
  raw?: boolean
  killOthers?: string[]
  restartTries?: number
  restartDelay?: number
}

/** 菜单项类型 */
export type MenuItem = ExecaMenu | OpenMenu | FunctionMenu | Listr2Menu | ConcurrentlyMenu

/** CLI 配置 */
export interface CliConfig {
  menus?: MenuItem[]
}

/** 执行上下文 */
export interface ExecutionContext {
  env: Record<string, string>
  inputs?: Record<string, unknown>
}

/** 任务处理器配置 */
export interface TaskHandlerConfig {
  inputs?: TaskInput[]
  env?: Record<string, string>
}

/** 任务处理器上下文 */
export interface TaskHandlerContext {
  cwd?: string
  inputs?: Record<string, any>
  env: Record<string, string>
}
