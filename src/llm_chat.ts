import OpenAI from "openai";
import { ChatCompletion } from "openai/resources";
import * as step from '@flow-step/step-toolkit'

export class ReviewResult {
  fileName!: string
  lineNumber?: number
  comment!: string
}

export class Chat {
  openai: OpenAI
  modelName: string

  constructor(apiKey: string, modelName: string) {
    this.openai = new OpenAI(
        {
            apiKey: apiKey,
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
            timeout: 600000
        }
    );
    this.modelName = modelName
  }

  async reviewCode(diff: string): Promise<ReviewResult[]> {
    const prompt = '下面是一段代码Git Diff。请找出明显的代码风格问题、工程实践问题，和代码正确性问题。用纯文本（非markdown）的json数组格式，针对每个hunk给出改进意见（如果有），无需添加任何前置说明。json数组中的每个元素包含三个字段：fileName lineNumber comment。注意lineNumber应该是有修改的行，而非未修改的行\n' + diff
    const completion: ChatCompletion = await this.openai.chat.completions.create({
      model: this.modelName,
      messages: [
          { role: "user", content: prompt }
      ],
      temperature: 0.2,
      top_p: 0.1,
    })
    const content = completion.choices[0].message.content!
    try {
      return JSON.parse(content) as ReviewResult[]
    } catch(err) {
      step.info('cannot parse result as array, return original content')
      const result = new ReviewResult()
      result.comment = content
      return [result]
    }
  }
}

