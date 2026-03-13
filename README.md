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
 
 <h1 align="center">Flow 自动 AI 代码审核步骤（超级智能体版）</h1> 
 <p align="center">基于阿里云云效 Flow 和大模型的自动化代码审核工具，内置多语言架构师级评审能力</p> 
 
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
 
 **最新升级：** 本项目已升级为“超级智能体”，具备多语言架构师级评审能力，内置了针对 Java, C++, C, Go, Python, Node.js, Vue 等主流语言的深度评审逻辑，并解决了传统 AI 评审中的 Diff 混淆、定位不准等痛点。
 
 云效流水线 Flow 提供了灵活的集成机制，企业可以在云效 Flow 内开发一个自定义步骤来调用 DeepSeek 等大模型，对云效 Codeup 提交的代码评审进行智能评审。
 
 ### 🔧 功能亮点 

 | 特性 | 描述 | 
 |------|------| 
 | 💡 **架构师级评审** | 内置 Java/Go/C++/Vue 等多语言专家 Prompt，覆盖架构设计、开发规范、安全与性能 | 
 | 🎯 **精准行号定位** | 采用结构化 JSON 输出与 Diff 上下文感知，彻底解决“评论打错行”与“误判删除代码”问题 | 
 | ⚡ **智能并发控制** | 动态限流（pLimit=5）与重试机制，防止触发大模型 API Rate Limit，保障流程稳定性 | 
 | 🔍 **多维度问题检测** | 聚焦逻辑错误、资源泄漏、SQL 性能优化、并发安全、架构设计等关键维度 | 
 | 🤖 **自动评论生成** | 自动解析模型返回的 JSON，生成清晰的 Markdown 格式评论回写到 MR | 
 | 🔄 **多模型支持** | 支持 Qwen-max, DeepSeek-v3 等多种大模型 | 
 | 📄 **上下文增强** | 结合 `getFileBlob` 获取文件全内容，提供更完整的代码上下文 | 

 
 ### 🚀 解决的痛点 
 1. **人工评审效率低**：传统的代码评审依赖人工逐行检查，容易遗漏逻辑错误、安全隐患等问题。 
 2. **多语言栈挑战**：单一评审规则难以适配多语言项目，本工具内置多语言专家知识库，一站式解决。
 3. **AI 幻觉与误判**：通过严格的上下文约束和 JSON 结构化输出，大幅降低 AI 的误报率。
 4. **统一评审标准**：内置阿里巴巴、Google、Uber 等业界权威开发规范，确保代码质量标准的一致性。 
 
 ### 🔄 工作流程 
 1. 开发者提交合并请求（Merge Request）到 Codeup。 
 2. 流水线触发后，自动识别文件语言类型。
 3. 加载对应的“架构师”提示词，拉取代码差异与全量内容。
 4. 调用大模型进行深度分析，解析 JSON 结果。
 5. 自动在 MR 页面精准行号处生成评论。 
 
 ![](https://ucc.alicdn.com/pic/developer-ecology/cgvoz4n4hwlga_0152973047c547b4940f9c837cb80dc8.jpg) 
 
 ## 🛠️ 如何使用？ 
 ### 1. 安装依赖 
 ```bash 
 npm install --registry=https://registry.npmmirror.com 
 ``` 
 
 ### 2. 配置参数 
 配置以下环境变量： 
 | 参数名称 | 描述 | 
 | ---- | ---- | 
 | `modelName` | 大模型名称（例如 qwen-max、deepseek-v3） | 
 | `yunxiaoToken` | 云效 Token（需具备代码只读、MR读写权限） | 
 | `dashscopeApikey` | 大模型 API Key | 
 | `llmChatPrompt` | **[新特性]** 自定义提示词。**强烈建议留空**，系统会自动根据文件类型加载内置的架构师级 Prompt。 | 
 | `temperature` | 模型温度值（建议 0.2 以保持输出稳定性） | 
 | `aiBaseUrl` | 大模型 API 的基础 URL（可选，默认值为 `https://dashscope.aliyuncs.com/compatible-mode/v1`） | 
 
 ### 3. 构建并运行 
 ```bash 
 npm run build 
 node dist/index.js 
 ``` 
 
 ### 4. 配置流水线 
 #### 4.1 安装 flow-cli 
 ```sh 
 npm install -g @flow-step/flow-cli --registry=https://registry.npmmirror.com 
 ``` 
 
 #### 4.2 登录 flow-cli 
 ```sh 
 flow-cli login 
 ``` 
 
 #### 4.3 修改 `step.yaml` 文件 
 确保 `step.yaml` 中的步骤 ID 和 Name 配置正确。 
 
 #### 4.4 发布步骤 
 ```sh 
 flow-cli step publish --auto-version 
 ``` 
 
 #### 4.5 配置变量 
 在云效流水线编辑页的 **变量与缓存** 中配置 `YUNXIAO_TOKEN` 和 `BAILIAN_APIKEY`。 
 
 ## 🔬 类结构图与设计思路 
 ### 🧩 可扩展性 
 - **多语言适配**：通过 `src/prompts.ts` 轻松扩展新的编程语言支持。
 - **模型扩展**：支持多种大模型接口，只需配置 BaseURL。
 
 ### 核心类说明 
 #### 1. `https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/code_source.ts` 
 `CodeSource` 类：表示代码来源，包含仓库地址、项目 ID、合并请求 ID 等信息，解析流水线环境变量。
 
 #### 2. `https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/codeup_client.ts` 
 `CodeupClient` 类：与 Codeup 平台交互的核心类。
 - **增强功能**：集成 `getFileBlob` 方法，支持获取文件完整内容，为 AI 提供更丰富的上下文。
 - 负责获取 Diff 补丁、MR 详情及回写评论。
 
 #### 3. `https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/code_review_patch.ts` 
 `CodeReviewPatch` / `CompareResult` 类：Diff 解析与处理。
 - **增强功能**：优化了 `Hunk` 行号计算逻辑，特别适配了 Python 缩进变更、Go 结构体新增等复杂场景，确保行号定位精准。
 
 #### 4. `https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/llm_chat.ts` 
 `Chat` 类：智能体核心逻辑。
 - **架构师大脑**：集成 `prompts.ts`，根据文件后缀动态加载对应的专家 Prompt。
 - **JSON 解析引擎**：负责解析模型的结构化 JSON 输出，并包含容错回退机制。
 - **智能重试**：封装了带指数退避的重试逻辑，处理 API 限流。
 
 #### 5. `https://github.com/listener-He/yunxiao-LLM-reviewer/blob/main/src/prompts.ts` 
 **[新增]** 提示词管理模块。
 - 内置 Java, C++, Go, Python, Vue 等语言的架构设计与开发规范提示词库。
 
 ### 🕒 方法调用时序图 
 ![时序图](https://blog-file.hehouhui.cn/202507011616839.png) 
 
 ## 🚧 自定义开发指南 
 ### 1. 扩展支持的模型 
 修改 `step.yaml` 的模型枚举值，并在环境变量中配置对应的 API Key。
 
 ### 2. 自定义提示词 
 虽然建议使用内置 Prompt，但您仍可通过 `llmChatPrompt` 覆盖。若自定义，请确保要求模型输出 JSON 格式以保证功能正常：
 ```json
 [
   {
     "type": "缺陷类型",
     "line": 10,
     "content": "问题描述",
     "suggestion": "修复建议"
   }
 ]
 ```
 
 ### 3. 添加新功能 
 例如增加 SQL 注入专项检测，可在 `prompts.ts` 的 `General` 或特定语言 Prompt 中追加相关指令。
 
 ## 📝 示例输出 
 
 ### MR 评论格式 
 ```markdown 
 【本评论来自大模型】
 **[安全隐患]**
 `String sql = "select * from user where name = " + name;`

 **修复建议：**
 使用 PreparedStatement 预编译 SQL，防止 SQL 注入。
 ``` 
 
 ## 📊 总结 
 本项目已升级为 **超级智能体**，通过 **Flow + Yunxiao + 多语言架构师大模型**，实现了高精度、高稳定性的自动化代码审查。它不仅能发现代码 bug，更能从架构和规范层面提升团队工程质量。
 
 ## 🤝 贡献与反馈 
 欢迎贡献代码或提出建议！请阅读 [贡献指南](CONTRIBUTING.md) 了解如何参与。 
 
 ## 📄 许可证 
 本项目采用 [MIT 许可证](LICENSE)。
