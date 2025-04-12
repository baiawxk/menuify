import { describe, expect, it, vi } from 'vitest'
import { resolveDependencies, findMenuByName } from '../src/dependencyResolver'

describe('dependencyResolver', () => {
  const mockMenus = [
    { name: 'install', dependsOn: [] },
    { name: 'build', dependsOn: ['install'] },
    { name: 'test', dependsOn: ['build'] },
    { name: 'deploy', dependsOn: ['test'] },
    { name: 'clean', dependsOn: [] }
  ]

  it('should resolve simple dependencies', () => {
    const result = resolveDependencies(mockMenus, 'deploy')
    expect(result).toEqual([
      { name: 'install', dependsOn: [] },
      { name: 'build', dependsOn: ['install'] },
      { name: 'test', dependsOn: ['build'] },
      { name: 'deploy', dependsOn: ['test'] }
    ])
  })

  it('should find menu by name', () => {
    const result = findMenuByName(mockMenus, 'build')
    expect(result).toEqual({ name: 'build', dependsOn: ['install'] })
  })

  it('should throw error for circular dependencies', () => {
    const circularMenus = [
      { name: 'a', dependsOn: ['b'] },
      { name: 'b', dependsOn: ['a'] }
    ]
    expect(() => resolveDependencies(circularMenus, 'a'))
      .toThrow('Circular dependency detected: a -> b -> a')
  })



  it('should return empty array for menu without dependencies', () => {
    const result = resolveDependencies(mockMenus, 'clean')
    expect(result).toEqual([{ name: 'clean', dependsOn: [] }])
  })

  it('should throw error for non-existent menu', () => {
    expect(() => resolveDependencies(mockMenus, 'nonexistent'))
      .toThrow('Menu not found: nonexistent')
  })
})
