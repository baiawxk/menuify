# CLI Menu 活跃上下文
## 当前工作焦点
- 完善输入适配器（inquirerAdapter）的交互逻辑
- 提升EnvResolver测试覆盖率至95%
- 优化TaskHandler的错误处理机制

## 最近更改
- EnvResolver新增输入变量类型校验（支持数字/布尔值）
- TaskHandler添加命令执行超时控制（默认30s）
- 修复变量解析中连字符变量名（my-var）的匹配问题

## 下一步计划
1. 完成inquirerAdapter的多选/单选组件支持（截止v0.2.0）
2. 实现CI/CD流水线（pnpm publish + vitest coverage）
3. 编写用户手册（包含变量作用域示例和菜单项配置指南）

## 重要决策
- 采用mermaid图表记录系统架构（提升文档可读性）
- 限制输入变量类型为原始值（避免函数注入风险）
- 测试框架选择vitest替代jest（启动速度提升40%）
