# 技术上下文

## 使用的技术
1. 核心依赖精简
   - execa：命令执行
   - open：URL打开
   - listr2：任务列表
   - concurrently：并行任务

2. 移除的依赖
   - inquirer：不再需要复杂的输入处理
   - dotenv：简化环境变量处理

## 技术约束
1. 变量处理
   - 仅支持简单字符串替换
   - 环境变量使用 %VAR% 格式
   - 输入变量使用 {VAR} 格式

2. 类型系统要求
   - 严格区分静态和动态类型
   - 保持类型定义简洁
   - 避免复杂的类型操作

## 依赖管理
1. 核心依赖
   ```json
   {
     "typescript": "主要开发语言",
     "radash": "工具库",
     "type-fest": "类型定义",
     "vitest": "测试框架"
   }
   ```

2. 开发依赖
   ```json
   {
     "eslint": "代码检查",
     "prettier": "代码格式化",
     "@types/node": "Node.js类型"
   }
   ```

## 工具使用模式
1. 代码质量工具
   - ESLint：代码检查
   - Prettier：代码格式化
   - Vitest：单元测试

2. 构建工具
   - TypeScript编译器
   - pnpm构建脚本

3. 文档工具
   - TypeDoc：API文档生成
   - Markdown：文档编写

4. 环境变量
   - .env：环境变量配置
   - .env.local：本地环境配置
   - .env.test：测试环境配置
