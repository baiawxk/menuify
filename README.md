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
- 📝 Rich input types support (prompt, pick, confirm, multi-select)
- 🔄 Task dependencies and execution modes
- 🌍 Cross-platform environment variables support
- 🎛️ VSCode-like task configuration experience
- 🏗️ Advanced task system with dependencies

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
  env: {
    NODE_ENV: 'development'
  },
  menus: [
    {
      name: 'Install Dependencies',
      type: 'command',
      task: 'npm install'
    },
    {
      name: 'Start Dev',
      type: 'command',
      task: 'npm run dev'
    },
    {
      name: 'Open Docs',
      type: 'link',
      task: 'https://github.com/baiawxk/cli-menu'
    },
    {
      name: 'Run Tests',
      type: 'command',
      task: 'npm test',
      inputs: [
        {
          id: 'testType',
          type: 'pickString',
          description: 'Select test type',
          options: ['unit', 'integration', 'e2e']
        }
      ]
    }
  ]
})
```

3. Run:
```bash
menuify
```

## ⚙️ Advanced Configuration

### Complete Example
```typescript
import { defineConfig } from 'menuify'

export default defineConfig({
  // Environment variables configuration
  env: {
    // Environment options
    NODE_ENV: 'development'
  },
  menus: [
    // Command with user inputs
    {
      name: 'Build Project',
      type: 'command',
      task: 'npm run build --mode {env}',
      inputs: [
        {
          id: 'env',
          type: 'pickString',
          description: 'Select environment',
          options: ['dev', 'staging', 'prod']
        },
        {
          id: 'optimize',
          type: 'confirm',
          description: 'Enable optimization?'
        }
      ],
      dependsOn: ['Install'],
      confirmMsg: 'Start building?',
    },
    // Multiple commands
    {
      name: 'Setup Project',
      type: 'command',
      task: [
        'git init',
        'npm install',
        'npm run prepare'
      ],
    },
    // Custom function
    {
      name: 'Custom Task',
      type: 'function',
      task: async (ctx) => {
        // Custom implementation using context
        console.log('Task inputs:', ctx.inputs)
        console.log('Global env:', ctx.env)
        console.log('Menu env:', ctx.menuEnv)
      }
    }
  ]
})
```

### Menu Item Types

#### Command Menu
```typescript
{
  name: string;              // Display name
  type: 'command';          // Menu type
  task: string | string[]; // Single command or command array
  options?: {
    cwd?: string;          // Working directory
  }
}
```

#### Link Menu
```typescript
{
  name: string // Display name
  type: 'link' // Menu type
  task: string // URL or file path
}
```

#### Function Menu
```typescript
{
  name: string // Display name
  type: 'function' // Menu type
  task: (ctx: ExecutionContext) => Promise<void> // Custom function with context
}
```

### User Inputs

Supported input types:
- `promptString`: Text input
- `pickString`: Single selection
- `confirm`: Yes/No confirmation
- `multiSelect`: Multiple selection

```typescript
interface TaskInput {
  id: string // Input identifier
  type: TaskInputType // Input type
  description?: string // Input description
  default?: string // Default value
  options?: string[] // Options for pick/multiSelect
  joinSymbol?: string // Join symbol for multiSelect
}
```

### Task Dependencies

```typescript
{
  name: 'Deploy',
  type: 'command',
  task: 'npm run deploy',
  dependsOn: ['Build', 'Test'], // Tasks to run before
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
    -t, --type       Config file type (json|ts|js), ts is default

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

1. **Cross-platform variables**:
```typescript
env: {
  // Works consistently across all platforms
  NODE_ENV: 'development',
  // Avoid platform-specific paths
  PATH: '/usr/local/bin' // Platform-dependent, not recommended
}
```

2. **Using variables in commands**:
```typescript
{
  name: 'Start Server',
  type: 'command',
  // Recommended cross-platform variable syntax
  task: 'node server.js --env=$NODE_ENV --port=$PORT'
}
```

## 👤 Author

baiawxk <baiawxk@qq.com>

## 📜 License

MIT

## 🔗 Links

- [GitHub Repository](https://github.com/baiawxk/cli-menu)
- [Issue Tracker](https://github.com/baiawxk/cli-menu/issues)
