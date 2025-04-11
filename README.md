# menuify

A simple CLI menu generation tool to help you quickly create interactive command-line menus.

## Features

- 🚀 Quickly create interactive CLI menus
- 📝 Supports multiple configuration file formats (TypeScript, JavaScript, JSON)
- 🛠️ Execute commands and open links
- 🎯 Interactive inputs and selections
- ⏱️ Task scheduling and dependency management
- ⚡ Lightweight and easy to use
- 🎨 Displays a customizable banner and formatted menu groups

## Installation

```bash
npm install menuify
# or
pnpm add menuify
# or
yarn add menuify
```

## Usage

### 1. Create a Configuration File

Create a `cli.config.ts` (or `.js`/`.json`) file in the project root:

```typescript
import { defineMenu } from 'menuify'

export default defineMenu({
  menus: [
    {
      name: 'Build Project',
      type: 'command',
      value: 'npm run build ${env}',
      inputs: [
        {
          id: 'env',
          type: 'pickString',
          description: 'Select build environment',
          options: ['development', 'staging', 'production'],
          default: 'development'
        }
      ]
    },
    {
      name: 'Deploy Project',
      type: 'command',
      value: 'deploy.sh ${version}',
      inputs: [
        {
          id: 'version',
          type: 'promptString',
          description: 'Enter version number',
          default: '1.0.0'
        }
      ]
    },
    {
      name: 'Open Documentation',
      type: 'link',
      value: 'https://example.com/docs'
    },
    {
      name: 'Run Custom Function',
      type: 'function',
      value: async (inputs) => {
        console.log('Custom function executed with inputs:', inputs)
      },
      inputs: [
        {
          id: 'input1',
          type: 'promptString',
          description: 'Enter a value for input1'
        }
      ]
    }
  ]
})
```

### 2. Run the Menu

```bash
menuify
```

You can also specify a custom configuration file:

```bash
menuify -f path/to/your/config.ts
```

## Configuration Options

### MenuOpts

Main configuration options:

```typescript
interface MenuOpts {
  menus: MenuItem[]
  version?: string
}
```

### MenuItem

Menu item types:

#### CommandMenu

For executing commands:

```typescript
interface CommandMenu {
  name: string // Display name
  type: 'command' // Type is command
  value: string // Command to execute
  inputs?: TaskInput[] // Input configuration
  options?: {
    cwd?: string // Optional, specify command execution directory
  }
}
```

#### LinkMenu

For opening links:

```typescript
interface LinkMenu {
  name: string // Display name
  type: 'link' // Type is link
  value: string // URL to open
}
```

#### FunctionMenu

For executing custom functions:

```typescript
interface FunctionMenu {
  name: string // Display name
  type: 'function' // Type is function
  value: (inputs?: Record<string, string>) => Promise<void> // Function to execute
  inputs?: TaskInput[] // Input configuration
}
```

### TaskInput

Task input configuration:

```typescript
interface TaskInput {
  id: string // Input identifier
  type: 'promptString' | 'pickString' | 'command' // Input type
  description?: string // Input description
  default?: string // Default value
  options?: string[] // Options for pickString type
  command?: string // Command for command type
}
```

## Input Types

### promptString
Interactive prompt to get user input.

### pickString
Provide a list of options for the user to select.

### command
Get input value by executing a command.

## Advanced Features

### Task Dependencies
Use `dependsOn` to specify task dependencies, supporting sequential and parallel execution.

### Variable Replacement
Use `${variableName}` syntax to reference input values in commands.

### Custom Banner and Menu Groups
Displays a customizable banner and formatted menu groups for better terminal output.

## License

MIT
