import type { MenuItem, MenuOpts } from '.'
import { search } from '@inquirer/prompts'
import open from 'open'
import sh from 'shelljs'
import { loadConfig } from 'unconfig'

const { config } = await loadConfig<MenuOpts>({
  sources: [
    // {
    //   files: 'E:\\workspaces\\crawlee_study\\cli.config2.ts',
    // },
    {
      files: 'cli.config',
      extensions: ['ts', 'js', 'json'],
    },
  ],
})

console.log({ config })
// read menu items from config
search({
  message: 'Select menu',
  source: (input) => {
    const menus = config.menus.map((m) => {
      const { name } = m
      return {
        name,
        value: m,
      }
    })
    if (!input)
      return menus
    const choices = menus.filter((m) => {
      return m.name.toLowerCase().includes(input.toLowerCase())
    })
    return choices
  },
}).then(async (menu: MenuItem) => {
  console.log({ menu })
  const { type, value } = menu
  if (type === 'link') {
    open(value)
  }
  else if (type === 'command') {
    if (menu.options) {
      sh.exec(value, { cwd: menu.options.cwd })
    }
    else {
      sh.exec(value)
    }
  }
})
