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

/** 命令菜单配置 */
export interface CommandMenu extends BaseMenu {
  type: 'command'
  task: string
  options?: {
    cwd?: string
  }
}

/** 链接菜单配置 */
export interface LinkMenu extends BaseMenu {
  type: 'link'
  task: string
}

/** 函数菜单配置 */
export interface FunctionMenu extends BaseMenu {
  type: 'function'
  task: (context: FunctionContext) => Promise<void>
}

/** 函数上下文 */
export interface FunctionContext {
  env: Record<string, string>
  inputs: Record<string, any>
}

/** 菜单项类型 */
export type MenuItem = CommandMenu | LinkMenu | FunctionMenu

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
