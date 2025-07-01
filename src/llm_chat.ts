import OpenAI from 'openai'
import {ChatCompletion} from 'openai/resources'
import {Hunk} from './code_review_patch'

export class ReviewResult {
    fileName: string;
    lineNumber: number;
    comment: string;

    constructor(fileName: string,
                lineNumber: number,
                comment: string) {
        this.fileName = fileName;
        this.lineNumber = lineNumber;
        this.comment = comment;
    }
}

export class Chat {
    openai: OpenAI
    modelName: string
    systemPrompt: string
    constructor(apiKey: string, modelName: string, llmChatPrompt: string) {
        this.openai = new OpenAI(
            {
                apiKey: apiKey,
                baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                timeout: 600000
            }
        )
        this.modelName = modelName
        if (!llmChatPrompt) {
            llmChatPrompt = `请扮演资深代码评审专家,结合审查要求进行代码审查任务 你的任务是对提交的代码变更进行严格审查
                                聚焦以下维度： 
                                  1. 冗余代码：是否存在无用的条件判断、重复方法调用、死代码、可简化逻辑等。 
                                  2. 逻辑错误：是否有明显逻辑缺陷、边界条件未处理、循环控制不严谨、状态管理混乱等问题。 
                                  3. 潜在问题：是否有较大可能引发并发问题、资源泄漏、性能瓶颈等运行时问题。 
                                  4. SQL性能优化：检查数据库操作相关代码，包括但不限于查询语句效率低下、索引未使用、不必要的全表扫描、大事务等。 
                                  5. 以上内容仅在不影响性能、严重可读性、严重缺陷的情况下其他如注释 代码风格的可忽略仅聚焦严重问题，对于空指针检查范围仅限在方法内执行逻辑不自洽的空指针，其他如参数未判断null可忽略
                                输出规则： 
                                  - 仅使用中文列出具体问题，无需解释原因 
                                  - 若无问题，请直接回复："没问题" 
                                  - 禁止使用任何 Markdown 格式 
                                  - 不添加任何前缀或后缀内容，如“问题如下：”、“建议：”等 - 每个问题单独成行，编号由系统自动生成，你只需按顺序列出即可 
                                  - 如果有多个问题，请分行列出，每行一个问题额外指导： `
        }
        this.systemPrompt = llmChatPrompt
    }

    async reviewCode(combinedDiff: string, fileName: string, hunks: Hunk[]): Promise<ReviewResult | null> {
        const hunksDiff = hunks.map(h => h.diff).join('\n')

        const prompt = `请对以下代码变更进行审查：
                        【文件名】：
                        ${fileName}
                        
                        【合并后的完整代码 diff 内容】：
                        ${combinedDiff}
                      
                        【待审查代码块】：
                        ${hunksDiff}
                       
                        请严格按照审查要求和输出规则进行反馈，并特别关注 SQL 性能优化、业务架构及数据模型的设计合理性。`

        const completion: ChatCompletion = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: [
            {role: 'system', content: this.systemPrompt},
            {role: 'user', content: prompt}
          ],
          temperature: 0.2,
          top_p: 0.2
        })
        const content = completion.choices[0].message.content?.trim() || ''
        return content && content !== '没问题'
          ? new ReviewResult(fileName, hunks[0].lineNumber, content)
          : null
    }
}