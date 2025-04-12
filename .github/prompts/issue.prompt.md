# this is a issue prompt

## 问题和建议
- [x] debug 配置放到CliConfig顶级属性中
  - 将debug配置从context移动到CliConfig接口的顶级属性
  - 修改TaskRunner以使用config中的debug设置
  - 添加debug配置的单元测试
  - 更新测试和示例配置文件
  - 完成时间: 2025-04-12 18:28:07
- [x] menuItem.confirmMsg 如果填入值的时候，代表需要使用inquirer的confirm提示，确认之后才执行
  - 添加confirmMsg属性到MenuItem接口
  - 在TaskRunner中实现confirm提示逻辑
  - 添加相关单元测试
  - 更新示例配置
  - 完成时间: 2024-01-17 15:30:00

- [ ] 整理现在代码中的逻辑，尽量保持逻辑简单，代码清晰，要有适当的封装和设计
  - 任务：
    - 重构现有代码结构
    - 提取共用逻辑到独立模块
    - 优化类型定义
    - 添加适当的注释和文档

- [ ] when use functionMenu,all the inputs should be true type . and the env vars keep string type
  - 任务：
    - 修改类型定义以支持非字符串输入
    - 确保环境变量保持字符串类型
    - 添加类型转换逻辑
    - 更新相关测试

- [x] dependsOn not work
  - 任务：
    - 修复任务依赖执行逻辑
    - 实现正确的依赖顺序处理
    - 添加循环依赖检测
    - 补充单元测试

- [ ] 集成Listr2 ，然后inquirer按照Listr2的规范进行修改，使用他提供的适配器
  - 任务：
    - 添加Listr2依赖
    - 重构任务执行逻辑
    - 适配inquirer接口
    - 添加进度显示
    - 更新文档和示例

## instructions
- 我会在**问题和建议**中提出我的想法，你需要逐个分析，并进行修改调整。修改完成之后，需要有对应的单元测试。并且成功之后，需要将以上代办事项的状态改为完成。并在对应条目下面，简单的描述一下修改的内容。以及执行时间，年月日时分秒。
