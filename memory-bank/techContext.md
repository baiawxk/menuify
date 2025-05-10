# 技术上下文

## 使用的技术
1. 核心技术栈
   - TypeScript：主要开发语言
   - Node.js：运行环境
   - pnpm：包管理工具

2. 主要依赖
   - dotenv：环境变量加载
   - radash：工具函数库
   - type-fest：类型定义
   - vitest：测试框架

## 开发环境设置
1. 开发工具
   - VSCode：推荐的IDE
   - Node.js：>=16
   - pnpm：包管理器

2. 项目结构
   ```
   src/
   ├── core.ts             # 核心功能
   ├── display.ts         # 显示管理
   ├── editor.ts         # 编辑器
   ├── envResolver.ts    # 环境解析
   ├── generator.ts      # 生成器
   ├── index.ts         # 入口
   ├── taskRunner.ts    # 任务运行
   ├── adapters/        # 适配器
   ├── handlers/        # 处理器
   └── tmpl/           # 模板
   ```

## 技术约束
1. Node.js版本要求
   - 最低版本：16.x
   - 推荐版本：18.x或更高

2. 开发规范
   - 使用TypeScript严格模式
   - 遵循ESLint规则
   - 必须包含单元测试

3. 兼容性要求
   - 支持主流操作系统(Windows, macOS, Linux)
   - 支持不同shell环境

## 依赖管理
1. 核心依赖
   ```json
   {
     "typescript": "主要开发语言",
     "dotenv": "环境变量管理",
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
