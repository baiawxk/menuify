import type { MenuItem, TaskInput, MenuOpts } from './core'
import { input, search, confirm, checkbox } from '@inquirer/prompts'
import { execa } from 'execa'
import open from 'open'

interface ProcessedInputs {
  [key: string]: string
}

export class TaskRunner {
  private runningTasks = new Map<string, { process: any, status: 'running' | 'completed' | 'failed' }>()
  private menuConfig: MenuOpts | undefined

  setConfig(config: MenuOpts) {
    this.menuConfig = config
  }

  async processMenu(menu: MenuItem): Promise<void> {
    const { type, value } = menu

    // Handle task dependencies first
    if (menu.dependsOn?.length) {
      for (const depName of menu.dependsOn) {
        const depTask = await this.findTaskByName(depName)
        if (depTask)
          await this.processMenu(depTask)
      }
    }

    if (type === 'link') {
      if (typeof value === 'string') {
        open(value)
      }
      else {
        console.error('Link type menu items must have a string value')
      }
    }
    else if (type === 'command') {
      try {
        await this.executeTask(menu)
      }
      catch (error) {
        console.error(`Failed to execute task: ${menu.name}`)
        throw error
      }
    }
    else if (type === 'function') {
      if (typeof value !== 'function') {
        console.error('Function type menu items must have a function value')
        return
      }
      try {
        const inputs = menu.inputs ? await this.processInputs(menu.inputs) : undefined
        await value(inputs)
      }
      catch (error) {
        console.error(`Failed to execute function: ${menu.name}`)
        throw error
      }
    }
  }

  async executeTask(task: MenuItem, inputs?: ProcessedInputs): Promise<void> {
    if (task.type !== 'command')
      return

    // Handle task dependencies
    if (task.dependsOn?.length) {
      for (const depName of task.dependsOn) {
        const depTask = await this.findTaskByName(depName)
        if (depTask)
          await this.executeTask(depTask, inputs)
      }
    }

    // Process task inputs if needed
    const processedInputs = await this.processInputs(task.inputs)
    const finalInputs = { ...inputs, ...processedInputs }

    // Check if any confirm inputs returned false
    if (Object.values(finalInputs).includes('false')) {
      console.log('Task cancelled by user')
      return
    }

    // Process options if they exist
    const processedOptions = { ...task.options }

    try {
      if (Array.isArray(task.value)) {
        const commands = task.value.map(cmd => this.replaceInputVariables(cmd, finalInputs))
        
        if (task.runMode === 'parallel') {
          // Run commands in parallel
          const processes = commands.map(cmd => 
            execa(cmd, {
              stdio: 'inherit',
              shell: true,
              ...processedOptions,
            })
          )
          this.runningTasks.set(task.name, { process: processes, status: 'running' })
          await Promise.all(processes)
        } else {
          // Run commands sequentially (default behavior)
          for (const cmd of commands) {
            const process = execa(cmd, {
              stdio: 'inherit',
              shell: true,
              ...processedOptions,
            })
            this.runningTasks.set(task.name, { process, status: 'running' })
            await process
          }
        }
      } else {
        // Handle single command
        const command = this.replaceInputVariables(task.value, finalInputs)
        const process = execa(command, {
          stdio: 'inherit',
          shell: true,
          ...processedOptions,
        })
        this.runningTasks.set(task.name, { process, status: 'running' })
        await process
      }

      this.runningTasks.set(task.name, { process: null, status: 'completed' })
    }
    catch (error) {
      this.runningTasks.set(task.name, { process: null, status: 'failed' })
      throw error
    }
  }

  private replaceInputVariables(command: string, inputs: ProcessedInputs): string {
    let result = command
    Object.entries(inputs || {}).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
    })
    return result
  }

  public async processInputs(inputs?: TaskInput[]): Promise<ProcessedInputs> {
    if (!inputs?.length)
      return {}

    const result: ProcessedInputs = {}

    for (const input of inputs) {
      switch (input.type) {
        case 'promptString':
          result[input.id] = await this.promptString(input)
          break
        case 'pickString':
          result[input.id] = await this.pickString(input)
          break
        case 'confirm':
          result[input.id] = await this.confirmInput(input)
          break
        case 'multiSelect':
          result[input.id] = await this.multiSelect(input)
          break
      }
    }

    return result
  }

  private async promptString(taskInput: TaskInput): Promise<string> {
    const result = await input({
      message: taskInput.description || `Enter value for ${taskInput.id}`,
      default: taskInput.default,
    })
    return result || ''
  }

  private async pickString(taskInput: TaskInput): Promise<string> {
    if (!taskInput.options?.length)
      return taskInput.default || ''

    const result = await search<string>({
      message: taskInput.description || `Select value for ${taskInput.id}`,
      source: async (term) => {
        if (!term)
          return taskInput.options || []
        return taskInput.options?.filter(opt =>
          opt.toLowerCase().includes(term.toLowerCase()),
        ) || []
      },
    })
    return result || taskInput.default || ''
  }

  private async confirmInput(taskInput: TaskInput): Promise<string> {
    const result = await confirm({
      message: taskInput.description || `Confirm ${taskInput.id}?`,
      default: taskInput.default === 'true',
    })
    return result.toString()
  }

  private async multiSelect(taskInput: TaskInput): Promise<string> {
    if (!taskInput.options?.length)
      return ''

    const choices = taskInput.options.map(opt => ({ value: opt }))
    const message = taskInput.description || `Select values for ${taskInput.id}`
    
    const selected = await checkbox({
      message,
      choices,
      pageSize: 15
    })
    
    return selected.join(taskInput.joinSymbol || ',')
  }

  public async findTaskByName(name: string): Promise<MenuItem | undefined> {
    if (!this.menuConfig) return undefined
    return this.menuConfig.menus.find(menu => menu.name === name)
  }

  getTaskStatus(taskName: string) {
    return this.runningTasks.get(taskName)?.status || 'not-started'
  }

  async stopTask(taskName: string): Promise<void> {
    const task = this.runningTasks.get(taskName)
    if (task?.process)
      await task.process.kill()
  }
}
