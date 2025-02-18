import OpenAI from "openai";
import { ChatCompletion } from "openai/resources";
import { CompareResult, Hunk } from "./code_review_patch";

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
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
            timeout: 600000
        }
    );
    this.modelName = modelName
  }

  async reviewCode(combinedDiff: string, hunk: Hunk): Promise<ReviewResult | null> {
    const prompt = `下面是一段代码Git Diff\n${combinedDiff}\n下面是这段Diff中的一部分局部Diff\n${hunk.diff}\n请结合完整的Diff，在上面的局部Diff中找出可能存在的问题，比如不良的代码风格、无用的代码，错误的逻辑等。用普通文本（非Markdown）直接说明存在的问题（不要加多余的前后缀内容）即可，没问题的部分不用说。如果没有任何问题，则回复'没问题'三个字`
    const completion: ChatCompletion = await this.openai.chat.completions.create({
      model: this.modelName,
      messages: [
          { role: "user", content: prompt }
      ],
      temperature: 0.2,
      top_p: 0.2,
    })
    const content = completion.choices[0].message.content!
    if('没问题' === content) {
      return null;
    }
    return new ReviewResult(hunk.fileName, hunk.lineNumber, content)
  }
}

