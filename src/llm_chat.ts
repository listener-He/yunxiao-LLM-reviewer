import OpenAI from "openai";
import { ChatCompletion } from "openai/resources";
import * as step from '@flow-step/step-toolkit'

export class ReviewResult {
  fileName!: string
  lineNumber!: string
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

  async reviewCode(diff: string): Promise<ReviewResult[] | string> {
    // const prompt = '下面是一个git diff，请从代码风格和代码正确性的角度出发，给出评论，直接给出json数组格式的答案，不要输出任何别的东西。json数组中的每个元素包含三个字段：fileName lineNumber comment\n' + diff
    const prompt = '下面是一个代码diff，请从代码风格和代码正确性的角度，用纯文本的格式直接给出改进意见，无需添加任何前置说明\n' + diff
    const completion: ChatCompletion = await this.openai.chat.completions.create({
      model: this.modelName,
      messages: [
          { role: "user", content: prompt }
      ],
    })
    const content = completion.choices[0].message.content!
    try {
      return JSON.parse(completion.choices[0].message.content!) as ReviewResult[]
    } catch(err) {
      step.info('cannot parse result as array, return original content')
      return content
    }
  }
}

