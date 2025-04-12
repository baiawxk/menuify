# CLI 菜单工具技术设计

## 程序执行逻辑

```mermaid
flowchart TD
    A[启动 CLI] --> B{是否加载配置文件?}
    B -- 是 --> C[加载配置文件]
    B -- 否 --> D[生成默认配置文件]
    C --> E[选择菜单]
    D --> E
    E --> F{菜单是否需要确认?}
    F -- 是 --> G[显示确认提示]
    G -- 确认 --> H[解析输入]
    F -- 否 --> H
    H --> I[解析环境变量]
    I --> J[转化为 Task 数组]
    J --> K{是否有依赖?}
    K -- 是 --> L[按依赖顺序执行]
    K -- 否 --> M[直接执行 Task]
    L --> N[执行完成]
    M --> N
    N --> O[生成输出或结果]
```

## 系统组件对应关系

```mermaid
classDiagram
    class CLI {
        +init()
        +edit()
        +run()
        +gen()
    }

    class ConfigManager {
        +loadConfig()
        +saveConfig()
        +validateConfig()
    }

    class Menu {
        +displayMenu()
        +confirmMenu()
        +parseInput()
    }

    class TaskRunner {
        +convertToTasks()
        +executeTasks()
    }

    class EnvManager {
        +parseGlobalEnv()
        +parseMenuEnv()
    }

    class Listr2Adapter {
        +runSerial()
        +runParallel()
    }

    CLI --> ConfigManager : 管理配置文件
    CLI --> Menu : 处理菜单逻辑
    Menu --> EnvManager : 解析环境变量
    Menu --> TaskRunner : 转化为任务
    TaskRunner --> Listr2Adapter : 调度任务
```

## 说明

1. **程序执行逻辑**：
   - 程序从 CLI 启动，判断是否加载配置文件。
   - 根据用户选择的菜单，解析输入和环境变量。
   - 将菜单转化为任务数组，并根据依赖关系和执行模式（串行或并行）执行任务。
   - 最终生成输出或结果。

2. **系统组件对应关系**：
   - **CLI**：负责处理用户输入的核心指令（如 `init`、`edit`、`run`、`gen`）。
   - **ConfigManager**：负责加载、保存和验证配置文件。
   - **Menu**：负责菜单的显示、确认和输入解析。
   - **TaskRunner**：负责将菜单转化为任务数组，并调度任务执行。
   - **EnvManager**：负责解析全局和菜单级环境变量。
   - **Listr2Adapter**：封装 `listr2` 的串行和并行执行逻辑。
