# CLI Menu 技术上下文
## 技术栈
- 编程语言：TypeScript 5.3+（严格模式）
- 包管理：pnpm 8.0+（使用workspace协议）
- 构建工具：tsup（输出ESModule/CommonJS双格式）
- 测试框架：vitest 0.34+（覆盖率报告使用c8）
- 类型增强：type-fest 3.2+（补充标准库类型定义）

## 核心依赖
- radash 0.8.0+（函数式工具库，替代lodash）
- execa 8.0.0+（跨平台子进程执行）
- inquirer 9.2.0+（交互式输入支持）
- open 9.2.0+（系统默认程序打开链接）

## 开发约束
- 代码风格：使用ESLint+Prettier（配置继承@antfu/eslint-config）
- 类型检查：tsc --noEmit（提交前必须通过）
- 测试要求：新增功能需同步添加测试用例（覆盖率≥90%）
- 兼容性：支持Node.js 18+ LTS版本
