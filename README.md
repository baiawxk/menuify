# menuify

🎯 A CLI menu generator inspired by VSCode Tasks, bringing similar convenience to your terminal workflow.

Do you often need to:
- Repeat complex commands when switching between projects?
- Configure different parameter combinations for different environments?
- Share standardized development workflows with your team?

menuify is inspired by VSCode Tasks, aiming to bring these convenient task management capabilities to your terminal environment. It's still under active development, and we welcome your suggestions and feature requests through Issues.

## ✨ Features

- 😊 Friendly interactive CLI menu with fuzzy search
- 🔧 Automatic config loading via `unconfig`
- ⚡ Execute commands, open links, or run custom functions
- 📝 Rich input types support (input,list)
- 🌍 Cross-platform environment variables support
- 🎛️ VSCode-like task configuration experience

## 🛠️ Installation

```bash
npm install menuify
```

## 🚀 Quick Start

1. Initialize config:
```bash
menuify init
```

2. Or create `menuify.config.ts` manually:

```typescript
import { defineConfig } from 'menuify'

export default defineConfig({
  menus: [
    {
      name: 'Test environment variables',
      type: 'execa',
      shell: 'echo "NODE_ENV: {NODE_ENV}"',
    },
    {
      name: 'open URL with Chrome',
      type: 'open',
      target: 'https://www.baidu.com',
      options: {
        app: {
          name: 'chrome',
        },
      },
    },
    {
      name: 'Test listr2',
      type: 'listr2',
      confirmMsg: 'Execute tasks?',
      options: {
        concurrent: true,
      },
      tasks: [
        {
          title: 'subtask 1',
          task: async (ctx, task) => {
            task.skip('Skip subtask 1')
          },
        },
        {
          title: 'subtask 2',
          task: async (ctx, task) => {
            task.output = 'Executing subtask 2'
          },
        },
      ],
    },
    {
      name: 'Test Input: input',
      type: 'execa',
      shell: 'echo "Hi: {NAME}"',
      inputs: [
        {
          name: 'NAME',
          message: 'Enter your name',
          type: 'input',
        },
      ],
    },
    {
      name: 'Test Input: list',
      shell: '{cmd}',
      type: 'execa',
      inputs: [
        {
          name: 'cmd',
          type: 'list',
          choices: [
            'echo pnpx create vite@latest',
            'echo pnpx create vue@latest',
            'echo pnpx create electron-app@latest',
            'echo pnpx create nuxt-app@latest',
            'echo pnpx create react-app@latest',
            'echo pnpx create next-app@latest',
            'echo pnpx sv create',
            'echo pnpx create-agent-chat-app@latest',
          ],
        },
      ],
    },
    {
      name: 'Test concurrently',
      type: 'concurrently',
      tasks: [
        { command: 'echo 1', prefixColor: 'bgBlue' },
        { command: 'echo 2', prefixColor: 'bgYellow' },
      ],
    },
    {
      name: 'Test function type',
      type: 'function',
      task: async (ctx) => {
        console.log('Executing custom function task')
      },
    },
  ],
})
```

3. Run:
```bash
menuify
```

### Menu Item Types

#### Execa Menu
```typescript
{
  name: 'Execa Example',
  type: 'execa',
  shell: 'echo "Hello, World!"',
  options: {
    cwd: '/path/to/working/directory';
  };
}
```

#### Open Menu
```typescript
{
  name: 'Open Example',
  type: 'open',
  target: 'https://example.com',
  options: {
    app: {
      name: 'chrome';
    };
  };
}
```

#### Listr2 Menu
```typescript
{
  name: 'Listr2 Example',
  type: 'listr2',
  confirmMsg: 'Execute tasks?',
  options: {
    concurrent: true;
  },
  tasks: [
    {
      title: 'Task 1',
      task: async (ctx, task) => {
        task.skip('Skipping Task 1');
      };
    },
    {
      title: 'Task 2',
      task: async (ctx, task) => {
        task.output = 'Executing Task 2';
      };
    };
  ];
}
```

#### Function Menu
```typescript
{
  name: 'Function Example',
  type: 'function',
  task: async (ctx) => {
    console.log('Executing custom function task');
  };
}
```

#### Concurrently Menu
```typescript
{
  name: 'Concurrently Example',
  type: 'concurrently',
  tasks: [
    { command: 'echo Task 1', prefixColor: 'bgBlue' },
    { command: 'echo Task 2', prefixColor: 'bgYellow' },
  ];
}
```

### User Inputs

Supported input types:
- `input`: Text input
- `list`: Single selection from a list
- `confirm`: Yes/No confirmation

```typescript
interface TaskInput {
  name: string // Input identifier
  type: 'input' | 'list' | 'confirm' // Input type
  message?: string // Input prompt message
  default?: string // Default value for input
  choices?: string[] // Options for list type
}
```

## 🛠️ CLI Options

```bash
menuify [options]

Commands:
  [config]             Run config specified in the command line
    -n, --name        Run specific menu

  run [name]          Run the menu directly
    -c, --config     Config file to use

  init                Initialize config file

  edit                Edit config file
    -c, --config     Config file to edit
    -e, --editor     Editor to use (vim|nano|notepad|code|sublime|atom)

  gen                 Generate shell scripts
    -f, --fileName   File name to generate script for
    -o, --outputDir  Output directory for generated scripts
    -c, --config     Config file to generate script for
    -t, --type       Type to generate script for (bash|cmd|ps1|fish|zsh), default: cmd

Options:
  -v, --version       Show version number
  -h, --help         Show help
```

## 🔍 Key Features

- **Advanced Task System**
  - Task dependencies management
  - Serial/Parallel execution modes
  - Custom function support

- **Rich Input Types**
  - String prompts
  - Single/Multiple selection
  - Confirmations

- **Environment Support**
  - Environment variables configuration
  - Working directory customization

- **Flexible Configuration**
  - TypeScript/JavaScript/JSON support
  - Multiple command execution
  - Custom function integration

### 🌱 Environment Variables Best Practices

1. **Using .env files**:
Environment variables are now injected via `.env` files. Ensure you create a `.env` file in your project root with the required variables:

```
NODE_ENV=development
PORT=3000
```

2. **Accessing variables in commands**:
```typescript
{
  name: 'Start Server',
  shell: 'node server.js --env={NODE_ENV} --port={PORT}'
}
```

## 👤 Author

baiawxk <baiawxk@qq.com>

## 📜 License

MIT

## 🔗 Links

- [GitHub Repository](https://github.com/baiawxk/cli-menu)
- [Issue Tracker](https://github.com/baiawxk/cli-menu/issues)
