import OpenAI from 'openai'
import {ChatCompletion} from 'openai/resources'
import {Hunk} from './code_review_patch'
import * as step from '@flow-step/step-toolkit'
import {getLanguageFromExtension, getPromptForLanguage} from './prompts'

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

    constructor(apiKey: string, modelName: string, llmChatPrompt: string, temperature: any, aiBaseUrl: string) {
        this.openai = new OpenAI(
            {
                apiKey: apiKey,
                baseURL: aiBaseUrl ? aiBaseUrl : 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                timeout: 600000
            }
        )
        this.temperature =
            typeof temperature === 'number' && !isNaN(temperature) && temperature >= 0 && temperature <= 2
                ? temperature
                : 0.2
        this.modelName = modelName
        
        // If llmChatPrompt is provided, use it. Otherwise leave it empty to be determined dynamically per file.
        this.systemPrompt = llmChatPrompt || ''
        
        step.info(`llmChat >>>>>> modelName: ${modelName} temperature: ${temperature}`)
        if (this.systemPrompt) {
             step.info(`llmChat >>>>>> User defined prompt: ${this.systemPrompt}`)
        } else {
             step.info(`llmChat >>>>>> No user defined prompt, will use dynamic language-specific prompts.`)
        }
    }

    /**
     * 异步审查代码函数
     *
     * 本函数将给定的代码变更提交给AI进行审查，旨在识别可能影响系统稳定性、业务流程、安全性或性能的严重问题
     *
     * @param fileContent 原文件内容内容，用于提供代码变更的上下文
     * @param fileName 文件名，用于在审查过程中指明具体文件
     * @param hunks 代码变更块（hunks）的数组，每个元素包含具体的变更内容
     * @returns 返回一个Promise，解析为ReviewResult对象数组或null如果审查没有发现问题或问题不严重
     */
    async reviewCode(fileContent: string, fileName: string, hunks: Hunk[]): Promise<ReviewResult[] | null> {
        if (!hunks || hunks.length === 0) {
            step.error(`llmChat Reviewer >>>>>> 评审警告: file: ${fileName} hunks为空，无法获取行号`)
            return null
        }

        const hunksDiff = hunks.map(h => h.diff).join('\n')

        const prompt = `我提交了一个文件，请你对diff代码块进行评审
                     文件名：【${fileName}】
                     —————————
                     文件内容：【${fileContent}】
                     —————————
                     待审查diff代码块：【${hunksDiff}】
                   `;
        step.info(`llmChat Reviewer >>>>>> 开始评审 file: ${fileName} 差异数：${hunks.length}`)

        const language = getLanguageFromExtension(fileName);
        const systemPrompt = this.systemPrompt && this.systemPrompt.trim().length > 0
            ? this.systemPrompt
            : getPromptForLanguage(language);

        try {
            const completion = await this.retryableCompletionCall(prompt, fileName, systemPrompt)
            const content = completion.choices[0].message.content?.trim() || ''

            if (!content || content === '没问题') {
                step.info(`llmChat Reviewer >>>>>> 评审合格 file: ${fileName}, comment: ${content}`)
                return null;
            }

            // Try to parse JSON
            try {
                // Find JSON content if it's wrapped in markdown code blocks
                let jsonContent = content;
                const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonBlockMatch) {
                    jsonContent = jsonBlockMatch[1];
                }

                const issues = JSON.parse(jsonContent);
                if (Array.isArray(issues)) {
                    const results: ReviewResult[] = [];
                    for (const issue of issues) {
                        const { type, line, content: issueContent, suggestion } = issue;
                        if (type && line && suggestion) {
                             const comment = `**[${type}]**\n${issueContent}\n\n**修复建议：**\n${suggestion}`;
                             results.push(new ReviewResult(fileName, line, comment));
                        }
                    }
                    return results.length > 0 ? results : null;
                }
            } catch (e) {
                step.info(`llmChat Reviewer >>>>>> JSON parsing failed, falling back to raw content. Error: ${e}`);
                // Fallback to legacy parsing if JSON fails (e.g. if user provided a custom prompt that doesn't output JSON)
                 const lineNumber = hunks.length === 1
                    ? hunks[0].lineNumber
                    : hunks[Math.floor(hunks.length / 2)].lineNumber

                 return [new ReviewResult(fileName, lineNumber, content)];
            }
            
            return null;

        } catch (error) {
            step.error(`llmChat Reviewer >>>>>> 评审异常 file: ${fileName}, error: ${error}`);
            return [new ReviewResult(fileName, hunks[0].lineNumber, '模型审核异常,请人工处理')];
        }
    }

    /**
     * 尝试调用OpenAI的chat completions API，并在遇到速率限制错误时自动重试
     *
     * @param prompt 用户提供的提示信息，用于生成chat completion
     * @param fileName 文件名，用于在错误信息中显示
     * @param systemPrompt 系统提示词
     * @returns 返回一个Promise，解析为ChatCompletion对象
     * @throws 当超过最大重试次数或遇到非速率限制错误时，抛出错误
     */
    private async retryableCompletionCall(prompt: string, fileName: string, systemPrompt: string): Promise<ChatCompletion> {
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
                        {role: 'system', content: systemPrompt},
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
                step.error(`llmChat Reviewer >>>>>> ${fileName} 请求被限流，第 ${attempt + 1} 次重试，将在 ${delay / 1000} 秒后重试...`)
                // 等待延迟时间，然后进行下一次尝试
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
        // 如果超过最大重试次数，抛出错误
        throw new Error(`429 You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://help.aliyun.com/zh/dashscope/developer-reference/tongyi-thousand-questions-metering-and-billing. Max retries exceeded: ${maxRetries} for ${fileName}`)
    }


}
