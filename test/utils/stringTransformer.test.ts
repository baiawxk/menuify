import { describe, expect, it } from 'vitest'
import { transformString } from '../../src/utils/stringTransformer'

describe('string transformer', () => {
  it('should replace variables with {VAR} format', () => {
    const template = 'Hello {NAME}!'
    const vars = { NAME: 'World' }
    expect(transformString(template, vars)).toBe('Hello World!')
  })

  it('should handle multiple variables', () => {
    const template = 'Hello {FIRST} {LAST}!'
    const vars = { FIRST: 'John', LAST: 'Doe' }
    expect(transformString(template, vars)).toBe('Hello John Doe!')
  })

  it('should handle missing variables', () => {
    const template = 'Hello {NAME} {ACTION}!'
    const vars = { NAME: 'World' }
    expect(transformString(template, vars)).toBe('Hello World !')
  })

  it('should handle non-string variable values', () => {
    const template = 'Count: {COUNT}'
    const vars = { COUNT: 42 }
    expect(transformString(template, vars)).toBe('Count: 42')
  })

  it('should handle boolean values', () => {
    const template = 'Debug mode: {DEBUG}'
    const vars = { DEBUG: true }
    expect(transformString(template, vars)).toBe('Debug mode: true')
  })

  it('should ignore unmatched braces', () => {
    const template = 'Hello {NAME{AGE}'
    const vars = { NAME: 'World', AGE: 25 }
    expect(transformString(template, vars)).toBe('Hello {NAME{AGE}')
  })
})
