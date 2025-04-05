export async function defineMenu(opts: MenuOpts): Promise<MenuOpts> {
  return opts
}

export interface MenuOpts {
  menus: MenuItem[]
}

export interface BaseMenu {
  name: string
  value: string
  children?: MenuItem[]
}

export interface CommandMenu extends BaseMenu {
  type: 'command'
  options?: { cwd?: string }
}

export interface LinkMenu extends BaseMenu {
  type: 'link'
}

export type MenuItem = CommandMenu | LinkMenu
