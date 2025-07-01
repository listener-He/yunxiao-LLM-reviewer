import OpenAI from 'openai'
import {ChatCompletion} from 'openai/resources'
import {Hunk} from './code_review_patch'
import * as step from '@flow-step/step-toolkit'

export class ReviewResult {
    fileName: string
    lineNumber: number
    comment: string

    constructor(fileName: string,
                lineNumber: number,
                comment: string) {
        this.fileName = fileName
        this.lineNumber = lineNumber
        this.comment = comment
    }
}

export class Chat {
    openai: OpenAI
    modelName: string
    systemPrompt: string
    temperature: number

    constructor(apiKey: string, modelName: string, llmChatPrompt: string, temperature: number) {
        this.openai = new OpenAI(
            {
                apiKey: apiKey,
                baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                timeout: 600000
            }
        )
        this.temperature = temperature == null || temperature < 0 ? 0.2 : temperature
        this.modelName = modelName
        if (!llmChatPrompt || llmChatPrompt.trim().length < 1) {
            llmChatPrompt = `你是一位资深 Java 开发工程师和代码评审专家，专注于Web应用的安全性、稳定性与性能。
                             你的任务是对提交的代码变更进行严格审查    
                                仅指出以下类型的严重问题： 
                                  1. 逻辑错误：可能导致业务流程异常、数据不一致、死循环、方法内执行逻辑不自洽的空指针、逻辑缺陷、边界条件未处理、循环控制不严谨、状态管理混乱等运行时崩溃。 
                                  2. 安全隐患：如 SQL 注入、数据权限绕过、敏感信息泄露等。 
                                  3. 资源泄漏：如数据库连接未关闭、文件流未释放、线程池未正确关闭等
                                  4. 并发问题：是否有较大可能引发并发问题、资源泄漏、性能瓶颈等运行时问题。 
                                  5. SQL性能优化：仅限数据库操作代码，如慢查询、全表扫描、缺少索引、N+1 查询、大结果集处理不当、无分页返回大量数据、无限递归导致栈溢出等。 
                                  6. 对于空指针：只有代码执行逻辑不自洽的空指针才需你评审
                                  7. 关注内容：对于删除内容无需检测只关注新增/修改内容的代码
                                级别定义补充：
                                  严重 - 逻辑错误/安全隐患/资源泄漏/并发问题导致系统崩溃/数据泄露/性能灾难/循环嵌套深度>3/递归调用逻辑的终止条件/循环中调用接口或数据库
                                  优化 - SQL性能缺陷/可预见的性能瓶颈/大数据量的查询
                                  建议 - 代码风格/可读性/冗余代码/潜在风险点
                                  普通 - 命名规范/空行/日志打印/格式美化                                    
                                输出规则： 
                                  - 仅列出严重影响系统运行、安全或性能的问题
                                  - 不输出无关紧要的内容（如命名规范、空行、日志打印、格式美化）
                                  - 仅使用中文列出具体问题，无需解释原因 
                                  - 若无问题，请直接回复："没问题" 
                                  - 禁止使用任何 Markdown 格式 
                                  - 不添加任何前缀或后缀内容，如“问题如下：”、“建议：”等 
                                  - 如果有多个问题，每个问题单独成行，按编号顺序列出即可`
        }
        this.systemPrompt = llmChatPrompt
        console.log('llmChat >>>>>> prompt: ', llmChatPrompt)
        console.log('llmChat >>>>>> modelName: ', modelName)
        console.log('llmChat >>>>>> temperature: ', temperature)
    }

    /**
     * 异步审查代码函数
     *
     * 本函数将给定的代码变更提交给AI进行审查，旨在识别可能影响系统稳定性、业务流程、安全性或性能的严重问题
     *
     * @param combinedDiff 合并后的完整代码diff内容，用于提供代码变更的上下文
     * @param fileName 文件名，用于在审查过程中指明具体文件
     * @param hunks 代码变更块（hunks）的数组，每个元素包含具体的变更内容
     * @returns 返回一个Promise，解析为ReviewResult对象或null如果审查没有发现问题或问题不严重
     */
    async reviewCode(combinedDiff: string, fileName: string, hunks: Hunk[]): Promise<ReviewResult | null> {
        if (!hunks || hunks.length === 0) {
            step.error(`llmChat Reviewer >>>>>> 评审警告: file: ${fileName} hunks为空，无法获取行号`);
            return null; // 或者根据业务需求返回默认值/抛错
        }
        // 将所有代码变更块的diff合并为一个字符串，以便一次性展示所有待审查的代码
        const hunksDiff = hunks.map(h => h.diff).join('\n')

        // 构造审查提示，包括文件名、合并后的完整代码diff和待审查的代码块
        const prompt = `请对以下代码变更进行审查：
                        【文件名】：
                        ${fileName}
                        
                        【合并后的完整代码 diff 内容】：
                        ${combinedDiff}
                      
                        【待审查代码块】：
                        ${hunksDiff}
                       
                        请严格按照系统提示词中的要求，仅反馈可能影响系统稳定性、业务流程、安全性或性能的严重问题。`

        // 输出审查开始的日志
        step.info(`llmChat Reviewer >>>>>> 开始评审 file: ${fileName} 差异代码：${hunksDiff}`)
        try {
            // 使用OpenAI的Chat API创建会话并获取回复
            const completion: ChatCompletion = await this.openai.chat.completions.create({
                model: this.modelName,
                messages: [
                    {role: 'system', content: this.systemPrompt},
                    {role: 'user', content: prompt}
                ],
                temperature: 0.2,
                top_p: 0.2
            })
            // 提取AI回复的内容并进行修剪
            const content = completion.choices[0].message.content?.trim() || ''
            // 如果AI回复的内容不为空且不是'没问题'，则创建一个新的ReviewResult对象
            if (content && content !== '没问题') {
                 // 获取待审查的代码块的行号
                const lineNumber = hunks.length === 1
                    ? hunks[0].lineNumber
                    : hunks[Math.floor(hunks.length / 2)].lineNumber;
                return new ReviewResult(fileName, lineNumber, content);
            } else {
                // 输出审查合格的日志并返回null
                step.info(`llmChat Reviewer >>>>>> 评审合格 file: ${fileName}, comment: ${content}`)
                return null;
            }
        } catch (error) {
            step.error(`llmChat Reviewer >>>>>> 评审异常 file: ${fileName}, error: ${error}`)
            return new ReviewResult(fileName, hunks[0].lineNumber, "模型审核异常,请人工处理");
        }
    }
}
