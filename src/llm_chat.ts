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

    constructor(apiKey: string, modelName: string, llmChatPrompt: string, temperature: any) {
        this.openai = new OpenAI(
            {
                apiKey: apiKey,
                baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                timeout: 600000
            }
        )
        this.temperature =
            typeof temperature === 'number' && !isNaN(temperature) && temperature >= 0 && temperature <= 2
                ? temperature
                : 0.2
        this.modelName = modelName
        if (!llmChatPrompt || llmChatPrompt.trim().length < 1) {
            llmChatPrompt = `你是一位资深 Java 开发工程师和代码评审专家，专注于Web应用的安全性、稳定性与性能。
                             你的任务是对提交的代码变更进行严格审查    
                                仅指出以下类型的严重问题： 
                                  1. 逻辑错误：可能导致业务流程异常、逻辑冲突、数据不一致、死循环、执行逻辑不自洽、逻辑缺陷、边界条件未处理、循环控制不严谨、状态管理混乱等运行时崩溃。 
                                  2. 安全隐患：如 SQL 注入、数据权限绕过、敏感信息泄露等。 
                                  3. 资源泄漏：如数据库连接未关闭、文件流未释放、线程池未正确关闭等
                                  4. 并发问题：是否有较大可能引发并发问题、资源泄漏、性能瓶颈等运行时问题。 
                                  5. SQL性能优化：仅限数据库操作代码，如慢查询、全表扫描、缺少索引、N+1 查询、大结果集处理不当、无分页返回大量数据、无限递归导致栈溢出等。 
                                  6. 对于空指针：只有代码执行逻辑不自洽的空指针才需你评审
                                  7. 关注内容：对于删除内容无需检测只关注新增/修改内容的代码
                                  8. 代码冲突：检测差异代码块的冲突是否解决
                                级别定义补充：
                                  严重 - 逻辑错误/安全隐患/资源泄漏/并发问题导致系统崩溃/数据泄露/性能灾难/循环嵌套深度>3/递归调用逻辑的终止条件/循环中调用接口或数据库
                                  优化 - SQL性能缺陷/可预见的性能瓶颈/大数据量的查询/资源浪费
                                  建议 - 代码风格/可读性/冗余代码/潜在风险点
                                  普通 - 命名规范/空行/日志打印/格式美化/远程调用的超时控制和重试机制  
                                输出规则： 
                                  - 仅列出严重/优化，或影响系统运行、安全、性能的问题。简要说明其影响，并给出优化建议
                                  - 不输出无关紧要的内容（如命名规范、空行、日志打印、格式美化）
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
     * @param fileContent 原文件内容内容，用于提供代码变更的上下文
     * @param fileName 文件名，用于在审查过程中指明具体文件
     * @param hunks 代码变更块（hunks）的数组，每个元素包含具体的变更内容
     * @returns 返回一个Promise，解析为ReviewResult对象或null如果审查没有发现问题或问题不严重
     */
    async reviewCode(fileContent: string, fileName: string, hunks: Hunk[]): Promise<ReviewResult | null> {
        if (!hunks || hunks.length === 0) {
            step.error(`llmChat Reviewer >>>>>> 评审警告: file: ${fileName} hunks为空，无法获取行号`)
            return null
        }

        const hunksDiff = hunks.map(h => h.diff).join('\n')

        const prompt = `请对以下代码变更进行审查：
                    【文件名】：
                     ${fileName}
                      
                    【待审查代码块】：
                     ${hunksDiff}
                   `

        step.info(`llmChat Reviewer >>>>>> 开始评审 file: ${fileName} 差异代码：${hunksDiff}`)

        try {
            const completion = await this.retryableCompletionCall(prompt)
            const content = completion.choices[0].message.content?.trim() || ''

            if (content && content !== '没问题') {
                const lineNumber = hunks.length === 1
                    ? hunks[0].lineNumber
                    : hunks[Math.floor(hunks.length / 2)].lineNumber

                return new ReviewResult(fileName, lineNumber, content)
            } else {
                step.info(`llmChat Reviewer >>>>>> 评审合格 file: ${fileName}, comment: ${content}`)
                return null
            }
        } catch (error) {
            step.error(`llmChat Reviewer >>>>>> 评审异常 file: ${fileName}, error: ${error}`)
            return new ReviewResult(fileName, hunks[0].lineNumber, '模型审核异常,请人工处理')
        }
    }

    /**
     * 尝试调用OpenAI的chat completions API，并在遇到速率限制错误时自动重试
     *
     * @param prompt 用户提供的提示信息，用于生成chat completion
     * @returns 返回一个Promise，解析为ChatCompletion对象
     * @throws 当超过最大重试次数或遇到非速率限制错误时，抛出错误
     */
    private async retryableCompletionCall(prompt: string): Promise<ChatCompletion> {
        // 最大重试次数设置为3次
        const maxRetries = 3
        // 初始延迟 10秒，单位毫秒
        const baseDelay = 10_000

        // 尝试调用API，最多重试maxRetries次
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // 调用OpenAI的chat completions API生成响应
                return await this.openai.chat.completions.create({
                    model: this.modelName,
                    messages: [
                        {role: 'system', content: this.systemPrompt},
                        {role: 'user', content: prompt}
                    ],
                    temperature: this.temperature,
                    top_p: 0.2
                })
            } catch (error: any) {
                // 检查错误是否为速率限制错误（HTTP状态码429）
                const isRateLimitError = error.status === 429
                // 如果不是速率限制错误或已达到最大重试次数，则抛出错误
                if (!isRateLimitError || attempt === maxRetries - 1) {
                    throw error
                }

                // 计算重试延迟时间，使用指数退避策略
                const delay = Math.pow(3, attempt) * baseDelay // 指数增长：10s -> 30s -> 90s
                // 记录重试信息和延迟时间
                step.error(`llmChat Reviewer >>>>>> 请求被限流，第 ${attempt + 1} 次重试，将在 ${delay / 1000} 秒后重试...`)
                // 等待延迟时间，然后进行下一次尝试
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
        // 如果超过最大重试次数，抛出错误
        throw new Error(`429 You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://help.aliyun.com/zh/dashscope/developer-reference/tongyi-thousand-questions-metering-and-billing. Max retries exceeded: ${maxRetries}`)
    }
}
