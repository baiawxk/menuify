import type { Variables } from '../types'

/**
 * 简单的字符串变量替换函数
 * 支持 {VAR} 格式的变量替换,如:
 * - "Hello {NAME}" => "Hello World"
 * - "Count: {COUNT}" => "Count: 42"
 */
export function transformString(template: string, vars: Variables): string {
  return template.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = vars[key]
    return value !== undefined ? String(value) : ''
  })
}
