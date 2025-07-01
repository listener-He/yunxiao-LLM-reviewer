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
        console.log('llmChat >>>>>> prompt: ', llmChatPrompt)
        console.log('llmChat >>>>>> modelName: ', modelName)
        console.log('llmChat >>>>>> temperature: ', this.temperature)
        this.modelName = modelName
        if (!llmChatPrompt) {
            llmChatPrompt = `你是一位资深 Java 开发工程师和代码评审专家，专注于Web应用的安全性、稳定性与性能。
                             你的任务是对提交的代码变更进行严格审查    
                                仅指出以下类型的严重问题： 
                                  1. 逻辑错误：可能导致业务流程异常、数据不一致、死循环、方法内执行逻辑不自洽的空指针、逻辑缺陷、边界条件未处理、循环控制不严谨、状态管理混乱等运行时崩溃。 
                                  2. 安全隐患：如 SQL 注入、数据权限绕过、敏感信息泄露等。 
                                  3. 资源泄漏：如数据库连接未关闭、文件流未释放、线程池未正确关闭等
                                  4. 并发问题：是否有较大可能引发并发问题、资源泄漏、性能瓶颈等运行时问题。 
                                  5. SQL性能优化：仅限数据库操作代码，如慢查询、全表扫描、缺少索引、N+1 查询、大结果集处理不当、无分页返回大量数据、无限递归导致栈溢出等。 
                                  6. 非方法内执行逻辑不自洽的空指针全部忽略检测
                                输出规则： 
                                  - 仅列出严重影响系统运行、安全或性能的问题
                                  - 不输出无关紧要的内容（如命名规范、空行、日志打印、格式美化）
                                  - 仅使用中文列出具体问题，无需解释原因 
                                  - 若无问题，请直接回复："没问题" 
                                  - 禁止使用任何 Markdown 格式 
                                  - 不添加任何前缀或后缀内容，如“问题如下：”、“建议：”等 - 每个问题单独成行，按顺序列出即可`
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
                       
                        请严格按照系统提示词中的要求，仅反馈可能影响系统稳定性、业务流程、安全性或性能的严重问题。`

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