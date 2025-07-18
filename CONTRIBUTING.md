# 贡献指南

欢迎为 `yunxiao-LLM-reviewer` 项目贡献代码或提出建议！本指南将帮助你了解如何参与项目开发和贡献。

## 目录
1. [贡献前准备](#贡献前准备)
2. [贡献流程](#贡献流程)
3. [代码审查规则](#代码审查规则)
4. [代码风格与规范](#代码风格与规范)
5. [问题反馈与建议](#问题反馈与建议)

## 贡献前准备
### 1. 克隆仓库
首先，你需要将项目仓库克隆到本地：
```bash
git clone https://github.com/listener-He/yunxiao-LLM-reviewer.git
cd yunxiao-LLM-reviewer
```

### 2. 安装依赖
使用 `npm` 安装项目所需的依赖：
```bash
npm install
```

## 贡献流程
### 1. 创建新分支
在开始贡献之前，创建一个新的分支用于你的更改。分支命名应具有描述性，例如：
```bash
git checkout -b feature/add-new-rule
```

### 2. 进行更改
在新分支上进行你的代码更改。确保你的更改遵循项目的代码风格和规范。

### 3. 提交更改
完成更改后，提交你的代码并添加有意义的提交信息：
```bash
git add .
git commit -m "Add new rule for SQL injection detection"
```

### 4. 推送分支
将你的分支推送到远程仓库：
```bash
git push origin feature/add-new-rule
```

### 5. 创建合并请求（MR）
在 GitHub 上创建一个新的合并请求，将你的分支合并到 `main` 分支。在 MR 描述中详细说明你的更改内容和目的。

### 6. 等待审查
项目维护者将对你的 MR 进行审查，并提供反馈。根据反馈进行必要的修改，直到 MR 被批准并合并。

## 代码审查规则
项目使用大模型进行代码审查，关注以下关键问题：
- **严重问题**：逻辑错误、安全隐患、资源泄漏、并发问题导致系统崩溃、数据泄露、性能灾难、循环嵌套深度 > 3、递归调用逻辑无终止条件、循环中调用接口或数据库。
- **优化问题**：SQL 性能缺陷、可预见的性能瓶颈、大数据量的查询。

在提交代码时，请确保你的更改不会引入上述问题。如果有必要，可以在 MR 描述中说明你的更改如何避免或解决这些问题。

## 代码风格与规范
### 1. 代码格式
使用项目中配置的代码格式化工具（如 Prettier）确保代码格式一致。你可以在提交代码前运行以下命令进行格式化：
```bash
npm run format
```

### 2. 命名规范
遵循一致的命名规范，变量、函数和类名应具有描述性，易于理解。

### 3. 注释
添加必要的注释来解释代码的功能和设计思路，特别是复杂的逻辑或关键的实现细节。

## 问题反馈与建议
如果你在使用项目过程中遇到问题，或者有改进建议，可以在项目的 [Issues](https://github.com/listener-He/yunxiao-LLM-reviewer/issues) 页面提交新的问题。在提交问题时，请提供详细的描述和复现步骤，以便项目维护者更好地理解和解决问题。

感谢你的贡献！我们期待与你共同改进 `yunxiao-LLM-reviewer` 项目。
