

<div align="center">
  <div style="display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:24px;">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" alt="Git" width="24" height="24"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" width="24" height="24"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" width="24" height="24"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" alt="npm" width="24" height="24"/>
  <a href="https://chat.deepseek.com/"><img alt="Chat"
      src="https://img.shields.io/badge/🤖%20Chat-DeepSeek%20V3-536af5?color=536af5&logoColor=white"/></a>
  </div>
</div>

  <h1 align="center">Flow 自定义AI代码审核步骤</h1>
  <p align="center">基于阿里云云效Flow和大模型的自动化代码审核工具，提升代码质量与开发效率</p>

  <div align="center" style="display:flex; justify-content:center; gap:16px; margin:24px 0;">
    <a href="https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/listener-He/yunxiao-LLM-reviewer.svg" alt="License">
    </a>
    <a href="https://github.com/listener-He/yunxiao-LLM-reviewer/stargazers">
      <img src="https://img.shields.io/github/stars/listener-He/yunxiao-LLM-reviewer.svg" alt="Stars">
    </a>
    <a href="https://github.com/listener-He/yunxiao-LLM-reviewer/issues">
      <img src="https://img.shields.io/github/issues/listener-He/yunxiao-LLM-reviewer.svg" alt="Issues">
    </a>
    <a href="https://github.com/listener-He/yunxiao-LLM-reviewer/pulls">
      <img src="https://img.shields.io/github/issues-pr/listener-He/yunxiao-LLM-reviewer.svg" alt="Pull Requests">
    </a>
  </div>

## 🌟 项目介绍

本项目是一个基于 **Flow** 和 **阿里云云效（Yunxiao）** 的自动化 AI 代码审核工具，旨在通过调用大模型（如 Qwen、DeepSeek 等），对 Git 合并请求（MR）中的代码变更进行自动审查，并在发现问题时自动生成评论提交到 MR 中。

云效流水线Flow提供了灵活的集成机制，企业可以在云效Flow内开发一个自定义步骤来调用DeepSeek等大模型，对云效Codeup提交的代码评审进行智能评审，并通过云效的API，将这些评审意见回写到合并请求中。
同时，结合云效流水线Flow的能力还可以对提交的代码进行单元测试、代码扫描等任务，并将这些结果一并展示回云效Codeup的提交历史中，反馈每个commit的代码质量状态

### 🔧 功能亮点

| 特性 | 描述 |
|------|------|
| 💡 **AI 代码审查** | 使用大模型（Qwen、DeepSeek 等）对 MR 进行代码审查 |
| 🔍 **多维度问题检测** | 聚焦于冗余代码、逻辑错误、资源泄漏、SQL 性能优化、潜在安全隐患等关键维度 |
| 🤖 **自动评论生成** | 根据模型输出的问题，自动在 MR 上生成结构化评论 |
| 🔄 **多模型支持** | 可选择不同的大模型进行代码审查，支持模型动态扩展 |
| ⚙️ **高度可定制** | 支持自定义提示词、审查规则和输出格式 |
| 🚀 **流水线集成** | 无缝集成到云效Flow流水线，支持MR触发自动审核 |

### 🚀 解决的痛点
1. **人工评审效率低**：传统的代码评审依赖人工逐行检查，容易遗漏逻辑错误、安全隐患等问题。
2. **提高代码质量**：通过 AI 审查逻辑错误、资源泄漏、SQL 性能问题等关键缺陷，提升整体代码质量。
3. **减少重复性工作**：自动化处理常见的代码规范和逻辑问题，释放开发人员时间用于更复杂的任务。
4. **统一评审标准**：避免人工评审标准不一致的问题，确保代码质量标准的一致性。

### 🔄 工作流程
1. 开发者提交合并请求（Merge Request）到 Codeup
2. 流水线触发后，执行该自定义步骤
3. 工具拉取代码差异，调用大模型分析问题
4. 结果自动反馈至 MR 页面

![方案简介](https://ucc.alicdn.com/pic/developer-ecology/cgvoz4n4hwlga_0152973047c547b4940f9c837cb80dc8.jpg)

## 🛠️ 如何使用？

### 1. 安装依赖
```bash
npm install --registry=https://registry.npmmirror.com
```

### 2. 配置参数
配置以下环境变量：
| 参数名称 | 描述 |
| ---- | ---- |
| `modelName` | 大模型名称（例如 qwen、deepseek） |
| `yunxiaoToken` | 云效 Token（可在流水线中配置）为了能够让大模型调用云效API获取合并请求详情，并把Review的结果写到合并请求中，我们需要创建一个云效API的访问令牌。<br/>点击右上角的头像-个人设置-新建令牌，并设置令牌的权限：代码比较设置为只读，合并请求设置为读写 |
| `dashscopeApikey` | 百炼 API Key |
| `llmChatPrompt` | 自定义提示词，控制大模型的审查行为 |
| `temperature` | 模型温度值，控制生成结果的随机性（0-1） |
| `maxConcurrency` | 最大并发请求数（默认30） |

### 3. 构建并运行
```bash
npm run build
node dist/index.js
```

### 4. 配置流水线

1. 安装flow-cli的最新版本（需要本地有安装nodejs）

   ```sh
   # 安装flow-cli最新版本
   npm install -g @flow-step/flow-cli --registry=https://registry.npmmirror.com
   ```

2. 运行flow-cli的登录命令，选择你的云效组织。

   ```sh
   flow-cli login
   ```

3. 修改其中的`step.yaml`文件，修改第4~5行，为步骤id和name, 注意步骤ID为云效全局唯一

4. 命令行切换到代码库的根目录，执行下面的命令以发布步骤。

   ```sh
   flow-cli step publish --auto-version
   ```

   > 注：flow-cli的详细操作可参见文档: https://help.aliyun.com/zh/yunxiao/user-guide/use-flow-cli-to-customize-development-steps
   > 步骤发布后，访问: https://flow.aliyun.com 在步骤管理-组织步骤中可以看到MergeRequestLLMReviewer 步骤，即表示步骤发布成功。如果你看不到步骤管理菜单项，是因为你当前账号没有步骤管理的权限，可以切换为管理员账号或者让管理员赋予你步骤管理的权限。

5. 在云效流水线编辑页的 **变量与缓存** 中配置 `YUNXIAO_TOKEN` 和 `BAILIAN_APIKEY`。选择使用模型

## 🔬 类结构图与设计思路

### 核心类说明
#### 1. [IParams](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/params.ts#L3-L30)
负责从环境变量中读取所有必要的参数，包括 token、API 密钥、文件路径等。

#### 2. [CodeSource](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/code_source.ts#L0-L8)
表示代码来源，包含仓库地址、项目 ID、合并请求 ID 等信息。

#### 3. `CodeReviewPatch / CodeReviewPatches`
封装了 MR 补丁集的相关信息，支持获取基础补丁集和目标补丁集。

#### 4. [CompareResult](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/code_review_patch.ts#L117-L328)
解析 Git Diff 数据，提取变更块（hunk），并提供方法将 diff 转换为 Hunk 对象。

#### 5. [Hunk](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/code_review_patch.ts#L103-L113)
表示一个具体的代码变更块，包含文件名、行号和变更内容。

#### 6. [CodeupClient](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/codeup_client.ts#L6-L142)
与 Codeup 平台交互的核心类，负责：
- 获取差异补丁
- 提交评论到 MR
- 构建 MR URL
- 处理与云效Codeup的API交互

#### 7. `Chat / ReviewResult`
- [Chat](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/llm_chat.ts#L19-L116): 封装与大模型的交互逻辑，发送请求并接收审查结果。
- [ReviewResult](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/llm_chat.ts#L5-L17): 表示模型返回的审查结果，包含文件名、行号和问题描述。

#### 8. [codeReview](https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/code_review.ts#L19-L72)
主流程函数，整合所有组件，函数协调整个流程，控制 MR 审查的开始、执行和结束 完成整个审查流程。

### 🔄 异步并发处理
- 使用 `pLimit` 控制并发数量，防止一次性请求过多影响性能。默认30
- 通过 `concurrency` 参数可调整并发度，平衡审查速度与系统资源消耗

### 🧩 可扩展性
- **模型扩展**：支持多种大模型（Qwen、DeepSeek 等），可通过简单配置添加新模型
- **规则扩展**：提供自定义提示词配置，满足不同团队的代码审查需求
- **功能扩展**：支持插件机制，可轻松添加日志分析、Slack通知等功能

## 🕒 方法调用时序图

![时序图](https://blog-file.hehouhui.cn/202507011616839.png)

## 🚧 自定义开发指南

### 1. 扩展支持的模型
1. 在`step.yaml`中添加新的模型选项
2. 在`src/llm_chat.ts`中实现新模型的API调用逻辑
3. 更新模型选择的配置逻辑

### 2. 自定义提示词
Flow中参数 `llmChatPrompt` ，调整模型的行为逻辑。例如：
```ts
`你是一位资深 Java 开发工程师，专注于安全性和性能优化。请审查以下代码变更，指出可能存在的问题：
1. 逻辑错误
2. 安全隐患
3. 性能问题
4. 代码风格问题
5. 潜在的资源泄漏

请提供具体的行号、问题描述和修复建议。`
```

### 3. 添加新功能
例如增加日志分析或集成 Slack 通知：
1. 创建新的模块处理新功能
2. 在`codeReview`主流程中调用新模块
3. 更新配置参数支持新功能

### 4. 自定义审查规则
修改 `getHunksFromDiff` 或 `reviewCode` 方法，实现特定规则的审查逻辑。例如添加SQL注入检测：
```typescript
// 新增SQL注入检测规则
const sqlInjectionRule: ReviewRule = {
  name: "SQL注入风险检测",
  match: (hunk: Hunk) => hunk.content.includes("sql.concat") || hunk.content.includes("Statement.execute"),
  message: "检测到未使用预编译语句，存在SQL注入风险"
};
```

## 📝 示例输出

### MR 评论格式
```markdown
【AI代码审查结果】
🔍 发现3处潜在问题：
1. SQL性能问题：`src/db/query.ts`第12行
   > 未添加索引条件，建议为`user_id`字段添加索引以提升查询效率

2. 资源泄漏风险：`src/service/file.ts`第45行
   > 文件流未显式关闭，建议在`finally`块中添加`stream.end()`

3. 代码冗余：`src/utils/array.ts`第28-35行
   > 存在重复逻辑，可提取为`filterUnique`工具函数
```

## 📊 总结
该项目通过结合 **Flow + Yunxiao + 大模型** 实现了高效的自动化代码审查机制，解决了传统人工评审效率低、易遗漏等问题。适用于需要高频提交 MR 的团队，尤其适合注重安全性、稳定性与性能的 Web 应用开发场景。

## 🤝 贡献与反馈
欢迎贡献代码或提出建议！请阅读 [贡献指南](CONTRIBUTING.md) 了解如何参与。

## 📄 许可证
本项目采用 [MIT 许可证](LICENSE)。
