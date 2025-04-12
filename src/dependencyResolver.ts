import type { MenuItem } from './core'

/**
 * Find a menu item by name
 */
export function findMenuByName(menus: MenuItem[], name: string): MenuItem | undefined {
  return menus.find(menu => menu.name === name)
}

/**
 * Standalone function to resolve dependencies for testing
 */
export function resolveDependencies(menus: MenuItem[], targetMenu?: string): MenuItem[] {
  const resolver = new DependencyResolver(menus)

  try {
    if (targetMenu) {
      const menu = findMenuByName(menus, targetMenu)
      if (!menu) {
        throw new Error(`Menu not found: ${targetMenu}`)
      }
      // Validate dependencies and check for cycles
      const visited = new Set<string>()
      const stack = new Set<string>()
      checkCyclicDependencies(targetMenu, menus, visited, stack)

      return resolver.resolveDependencies(targetMenu)
    }

    // Find the root menus (ones with no dependents)
    const rootMenus = menus.filter(menu => !resolver.getDependentMenus(menu.name).length)

    // If no root menus found, just return all menus (for cases with no dependencies)
    if (!rootMenus.length) {
      return menus
    }

    // Resolve dependencies for each root menu and combine results
    const resolved = new Set<MenuItem>()
    for (const menu of rootMenus) {
      const orderedDeps = resolver.resolveDependencies(menu.name)
      orderedDeps.forEach(dep => resolved.add(dep))
    }
    return Array.from(resolved)
  }
  catch (error) {
    throw error
  }
}

function checkCyclicDependencies(
  menuName: string,
  menus: MenuItem[],
  visited: Set<string>,
  stack: Set<string>,
): void {
  if (stack.has(menuName)) {
    const cycle = Array.from(stack).concat(menuName)
    throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`)
  }

  if (visited.has(menuName)) {
    return
  }

  const menu = menus.find(m => m.name === menuName)
  if (!menu) {
    throw new Error(`Dependency not found: ${menuName}`)
  }

  stack.add(menuName)
  visited.add(menuName)

  const dependencies = menu.dependsOn || []
  for (const dep of dependencies) {
    checkCyclicDependencies(dep, menus, visited, stack)
  }

  stack.delete(menuName)
}

export class DependencyResolver {
  private visited: Set<string>
  private stack: Set<string>
  private menuMap: Map<string, MenuItem>
  private dependencyGraph: Map<string, string[]>

  constructor(menus: MenuItem[]) {
    this.visited = new Set()
    this.stack = new Set()
    this.menuMap = new Map()
    this.dependencyGraph = new Map()

    // Build menu map and dependency graph
    for (const menu of menus) {
      this.menuMap.set(menu.name, menu)
      this.dependencyGraph.set(menu.name, menu.dependsOn || [])
    }
  }

  /**
   * Resolve dependencies for a menu
   * Returns array of menu items in correct execution order
   */
  resolveDependencies(menuName: string): MenuItem[] {
    // Reset visited set for fresh resolution
    this.visited.clear()
    this.stack.clear()

    const executionOrder: string[] = []
    this.dfs(menuName, executionOrder)

    // Convert menu names to menu items in correct order
    return executionOrder
      .map(name => this.menuMap.get(name))
      .filter((menu): menu is MenuItem => menu !== undefined)
  }

  /**
   * Find a menu by name
   */
  findMenu(name: string): MenuItem | undefined {
    return this.menuMap.get(name)
  }

  /**
   * Depth-first search with cycle detection
   */
  private dfs(menuName: string, executionOrder: string[]): void {
    // Check if menu exists
    if (!this.menuMap.has(menuName)) {
      throw new Error(`Menu "${menuName}" not found`)
    }

    // Check for cycles
    if (this.stack.has(menuName)) {
      const cycle = Array.from(this.stack).concat(menuName)
      throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`)
    }

    // Skip if already visited in another branch
    if (this.visited.has(menuName)) {
      return
    }

    // Add to current path stack
    this.stack.add(menuName)

    // Process dependencies
    const dependencies = this.dependencyGraph.get(menuName) || []
    for (const dep of dependencies) {
      this.dfs(dep, executionOrder)
    }

    // Remove from stack and mark as visited
    this.stack.delete(menuName)
    this.visited.add(menuName)

    // Add to execution order after all dependencies are processed
    executionOrder.push(menuName)
  }

  /**
   * Get all menus that depend on the given menu
   */
  getDependentMenus(menuName: string): MenuItem[] {
    const dependents: string[] = []
    for (const [name, deps] of this.dependencyGraph.entries()) {
      if (deps.includes(menuName)) {
        dependents.push(name)
      }
    }
    return dependents
      .map(name => this.menuMap.get(name))
      .filter((menu): menu is MenuItem => menu !== undefined)
  }
}
