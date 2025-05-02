import type { MenuItem } from './core'

export class DependencyResolver {
  private readonly menuMap: Map<string, MenuItem>
  private readonly dependencyGraph: Map<string, Set<string>>

  constructor(menus: MenuItem[]) {
    this.menuMap = new Map(menus.map(menu => [menu.name, menu]))
    this.dependencyGraph = this.buildDependencyGraph(menus)
  }

  /**
   * Builds an adjacency list representation of the dependency graph
   */
  private buildDependencyGraph(menus: MenuItem[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>()

    for (const menu of menus) {
      graph.set(menu.name, new Set(menu.dependsOn || []))

      // Validate that all dependencies exist
      for (const dep of menu.dependsOn || []) {
        if (!this.menuMap.has(dep)) {
          throw new Error(`Menu "${menu.name}" depends on non-existent menu "${dep}"`)
        }
      }
    }

    return graph
  }

  /**
   * Find a menu by name
   */
  findMenu(name: string): MenuItem | undefined {
    return this.menuMap.get(name)
  }

  /**
   * Get menus that depend on the specified menu
   */
  getDependentMenus(menuName: string): MenuItem[] {
    const dependents: MenuItem[] = []

    for (const [name, deps] of this.dependencyGraph) {
      if (deps.has(menuName)) {
        const menu = this.menuMap.get(name)
        if (menu) {
          dependents.push(menu)
        }
      }
    }

    return dependents
  }

  /**
   * Resolve dependencies for a menu and return them in execution order
   */
  resolveDependencies(menuName: string): MenuItem[] {
    // Validate menu exists
    if (!this.menuMap.has(menuName)) {
      throw new Error(`Menu "${menuName}" not found`)
    }

    const visited = new Set<string>()
    const result: MenuItem[] = []

    // Check for cycles and build execution order
    this.topologicalSort(menuName, visited, new Set(), result)

    return result
  }

  /**
   * Performs topological sort using depth-first search
   * Detects cycles and maintains execution order
   */
  private topologicalSort(
    menuName: string,
    visited: Set<string>,
    stack: Set<string>,
    result: MenuItem[],
  ): void {
    // Check for circular dependencies
    if (stack.has(menuName)) {
      const cycle = Array.from(stack).concat(menuName)
      throw new Error(
        `Circular dependency detected: ${cycle.join(' -> ')}\n`
        + 'Please check your menu dependencies and remove the cycle.',
      )
    }

    // Skip if already processed
    if (visited.has(menuName)) {
      return
    }

    // Add to current path for cycle detection
    stack.add(menuName)

    // Process all dependencies first
    const deps = this.dependencyGraph.get(menuName) || new Set()
    for (const dep of deps) {
      this.topologicalSort(dep, visited, stack, result)
    }

    // Remove from path and mark as visited
    stack.delete(menuName)
    visited.add(menuName)

    // Add to result after all dependencies
    const menu = this.menuMap.get(menuName)
    if (menu) {
      result.push(menu)
    }
  }
}

/**
 * Standalone helper to find a menu by name
 */
export function findMenuByName(menus: MenuItem[], name: string): MenuItem | undefined {
  return menus.find(menu => menu.name === name)
}

/**
 * Standalone helper to resolve dependencies for testing
 */
export function resolveDependencies(menus: MenuItem[], targetMenu?: string): MenuItem[] {
  const resolver = new DependencyResolver(menus)

  if (targetMenu) {
    return resolver.resolveDependencies(targetMenu)
  }

  // Find root menus (ones with no dependents)
  const rootMenus = menus.filter(menu =>
    !resolver.getDependentMenus(menu.name).length)

  // If no root menus, return all menus in dependency order
  if (!rootMenus.length) {
    return menus
  }

  // Resolve dependencies for each root menu
  const resolved = new Set<MenuItem>()
  for (const menu of rootMenus) {
    const orderedDeps = resolver.resolveDependencies(menu.name)
    orderedDeps.forEach(dep => resolved.add(dep))
  }

  return Array.from(resolved)
}
