# CLI Menu 开发进度
## 已完成功能
- 基础变量解析器（EnvResolver）实现（支持输入/菜单/全局变量）
- 任务处理器（TaskHandler）核心逻辑（命令/链接/函数执行）
- 初始测试用例（envResolver.test.ts覆盖85%核心功能）
- 输入适配器基础结构（inquirerAdapter.ts骨架）

## 待完成任务
- 输入适配器完整实现（多选/单选/密码输入）
- TaskHandler超时控制（30s默认）
- CI/CD流水线配置（pnpm publish + vitest coverage）
- 用户手册编写（变量作用域示例）

## 当前状态
- 主分支（main）版本：v0.1.0（alpha测试版）
- 测试覆盖率：85%（目标90%）
- 已知问题：变量解析中特殊字符（如$）未转义

## 决策演变
- 从jest切换至vitest（测试启动速度提升40%）
- 放弃支持Node.js 16（减少维护成本）
- 采用radash替代lodash（体积更小，类型更友好）
