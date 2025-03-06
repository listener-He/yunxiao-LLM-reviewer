import OpenAI from 'openai'
import {ChatCompletion} from 'openai/resources'
import {Hunk} from './code_review_patch'

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

    constructor(apiKey: string, modelName: string) {
        this.openai = new OpenAI(
            {
                apiKey: apiKey,
                baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                timeout: 600000
            }
        )
        this.modelName = modelName
    }

    async reviewCode(combinedDiff: string, hunk: Hunk): Promise<ReviewResult | null> {
        const prompt = `请扮演资深代码评审专家,结合审查要求进行代码审查任务:
                        
                        [完整Diff]
                        ${combinedDiff}
                        
                        [待审查代码块]
                        ${hunk.diff}
                        
                        审查要求：
                        1. 聚焦代码风格、冗余代码、逻辑错误、安全隐患、潜在问题
                        2. 仅用中文列出具体问题，无需解释原因
                        3. 无问题请直接回复"没问题"
                        4. 禁用Markdown格式
                        5. 禁止多余的前后缀内容`

        const completion: ChatCompletion = await this.openai.chat.completions.create({
            model: this.modelName,
            messages: [
                {role: 'user', content: prompt}
            ],
            temperature: 0.2,
            top_p: 0.2
        })
        const content = completion.choices[0].message.content?.trim() || ''
        return content && content !== '没问题'
            ? new ReviewResult(hunk.fileName, hunk.lineNumber, content)
            : null
    }
}