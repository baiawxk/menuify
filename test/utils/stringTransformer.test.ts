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
})
