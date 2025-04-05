# menuify

一个简单的CLI菜单生成工具，帮助你快速创建交互式命令行菜单。

## 特性

- 🚀 快速创建交互式CLI菜单
- 📝 支持多种配置文件格式（TypeScript、JavaScript、JSON）
- 🛠️ 支持执行命令和打开链接
- ⚡ 轻量级，易于使用

## 安装

```bash
npm install menuify
# 或者
pnpm add menuify
# 或者
yarn add menuify
```

## 使用方法

### 1. 创建配置文件

在项目根目录创建 `cli.config.ts`（或 `.js`/`.json`）：

```typescript
import { defineMenu } from 'menuify'

export default defineMenu({
  menus: [
    {
      name: '打开项目主页',
      type: 'link',
      value: 'https://github.com/your-project'
    },
    {
      name: '安装依赖',
      type: 'command',
      value: 'npm install',
      options: {
        cwd: './' // 可选，指定命令执行目录
      }
    },
    {
      name: '启动开发服务器',
      type: 'command',
      value: 'npm run dev'
    }
  ]
})
```

### 2. 运行菜单

```bash
menuify
```

你也可以指定自定义配置文件：

```bash
menuify -f path/to/your/config.ts
```

## 配置选项

### MenuOpts

主配置选项接口：

```typescript
interface MenuOpts {
  menus: MenuItem[]
}
```

### MenuItem

菜单项可以是以下两种类型之一：

#### CommandMenu

用于执行命令的菜单项：

```typescript
interface CommandMenu {
  name: string // 显示名称
  type: 'command' // 类型为command
  value: string // 要执行的命令
  options?: {
    cwd?: string // 可选，指定命令执行目录
  }
}
```

#### LinkMenu

用于打开链接的菜单项：

```typescript
interface LinkMenu {
  name: string // 显示名称
  type: 'link' // 类型为link
  value: string // 要打开的URL
}
```

## 功能特点

- 支持命令执行：集成 `execa`，可以执行任何shell命令
- 支持打开链接：集成 `open` 库，可以打开URL或文件
- 智能配置加载：使用 `unconfig` 自动加载配置文件
- 交互式搜索：支持菜单项快速搜索
- 灵活的配置：支持TypeScript、JavaScript和JSON格式的配置文件

## 命令行选项

```bash
Usage: menuify [options]

Options:
  -v, --version        显示版本号
  -f, --file <file>    指定配置文件路径
  -h, --help          显示帮助信息
```

## 许可证

MIT
