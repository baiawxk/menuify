# 使用 listr2 重构 CLI 菜单工具

## 概念

1. **最小执行单元：Task**
   - Task 是 CLI 菜单的核心执行单元，分为以下 3 种类型：
     - `command`：使用 `execa` 库执行 Shell 命令。value 是命令字符串或命令数组。
     - `link`：使用 `open` 库打开链接。value 是链接字符串或链接字符串数组。
     - `function`：执行自定义的 JavaScript 函数。value 是函数。
   - Task 输入：
     - 读取全局环境变量： `%varname%`
     - 通过菜单环境变量输入： `{varName}`
     - 如果 value 是一个函数，函数第一个参数是 ctx，`ctx.env` 代表全局环境变量，`ctx.menuEnv` 代表菜单环境变量。
     - 如果 value 是一个字符串，字符串中的 `%varname%` 会被替换为全局环境变量，`{varName}` 会被替换为菜单环境变量。
     - 如果 value 是一个字符串数组，数组中的每个字符串中的 `%varname%` 会被替换为全局环境变量，`{varName}` 会被替换为菜单环境变量。
  

2. **菜单：Menu**
   - Menu 是在 `cli.config.ts` 中定义的菜单配置。
   - 可选配置 `confirmMsg`，如果配置了，代表会使用 `inquirer` 库的 `confirmInput` 进行确认。如果用户输入 `y`，则执行这个菜单，否则不执行。
   - Menu 的特点：
     - **不可嵌套**：每个菜单是独立的。
     - **依赖管理**：通过 `dependsOn` 属性指定依赖的菜单，确保执行顺序。
     - **执行模式**：支持串行和并行：
       - `serial`：串行执行，默认值。
       - `parallel`：并行执行。
     - **类型支持**：Menu 的类型可以是 `command`、`link` 或 `function`。
     - **任务映射**：Menu 的 `value` 对应一个或多个 Task。
       - 如果 Menu 类型为 `command`，则 `value` 可以是一个字符串或字符串数组，映射到一个或多个 Task。

3. **环境变量：Env**
   - Env 是在 `cli.config.ts` 中定义的环境变量。
   - Env 的特点：
     - **全局环境变量**：适用于所有菜单。
     - **菜单级环境变量**：仅适用于特定菜单。

4. **任务调度器：Listr2**
   - 使用 `listr2` 库进行任务调度，支持串行和并行两种方式。
   - `listr2` 支持适配器（adapter）进行适配 `inquirer`。

5. **输入处理器：Input**
   - 通过 `inquirer` 库获取用户输入，支持以下类型：
     - `inputString`：用户输入字符串。
     - `pickString`：从选项中选择。
     - `confirmInput`：返回一个布尔值。
     - `multiSelect`：从选项中选择一个或者多个选项。

## 核心指令

1. **初始化配置**
   - 使用以下命令生成默认的配置文件：
   - 通过 `type` 参数生成的 `cli.config.*` 的模版文件，支持 `ts`、`js`、`json`。
     ```bash
     menuify init --type <type>
     ```

2. **编辑配置**
   - 使用以下命令打开加载的配置文件并进行修改：
     ```bash
     menuify edit
     ```

3. **运行菜单**
   - 使用以下命令启动菜单：
   - `run` 指令可以省略，默认执行 `run`。
     ```bash
     menuify
     ```
     或
     ```bash
     menuify run
     ```
    - 执行顺序：
      1. **选择菜单**：通过 `displayMenu` 选择菜单。
      2. **确认执行**：如菜单配置了 `confirmMsg`，使用 `inquirer` 库的 `confirmInput` 进行确认，否则不执行。
      3. **输入解析**：如菜单配置了 `input`，通过 `listr2` 适配器适配 `inquirer` 进行输入解析，解析成功后存储在 `ctx.input`。
      4. **环境变量解析**：如菜单配置了 `env`，解析成功后存储在 `ctx.env` 或 `ctx.menuEnv`。
      5. **转化为 Task**：将 Menu 转化为一个或多个 Task，形成 Task 数组。
         - 假设 MenuA（对应 TaskA[]）依赖于 MenuB（对应 TaskB[]）和 MenuC（对应 TaskC[]），MenuB 依赖于 MenuD（对应 TaskD[]）。
         - 执行顺序为：MenuD -> MenuB -> MenuC -> MenuA。
         - MenuB 和 MenuC 是否并行执行，取决于 MenuA 的 `runMode`。
      6. **执行 Task**：通过以上步骤，将 Menu 转化为 Task 数组，然后通过 `listr2` 执行。

4. **生成跨平台 Shell 脚本**
   - 使用以下命令生成跨平台脚本：
   - 可通过 `--platform` 参数指定生成的脚本平台，默认值为 `all`，表示生成所有平台的脚本。
     ```bash
     menuify gen --menu <menuName> --platform <platform>
     ```

## 约束条件

- Menu 不支持嵌套。
- 必须通过 `cli.config.ts` 定义所有菜单和环境变量。
- Task 的输入依赖于 `inquirer` 库，需确保输入类型与配置一致。
- Task 的调度依赖于 `listr2` 库，需确保任务的执行顺序。
- `listr2` 通过适配器适配 `inquirer`，不能单独使用。

## 输出样例

以下是一个示例输出：

```plaintext
? Select build environment: (Use arrow keys)
❯ development
  staging
  production
