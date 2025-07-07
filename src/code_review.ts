import {CodeReviewPatch, CodeReviewPatches, CompareResult, Hunk} from './code_review_patch'
import CodeupClient, {MergeRequestResponse} from './codeup_client'
import {Chat} from './llm_chat'
import {IParams} from './params'
import * as step from '@flow-step/step-toolkit'
import pLimit from 'p-limit'

/**
 * 执行代码审查的异步函数
 * @param params 包含必要参数的对象，用于代码审查流程
 *
 * 该函数流程：
 * 1. 获取当前源代码仓库信息
 * 2. 如果源代码不是由合并请求触发，则跳过审查
 * 3. 创建代码审查客户端，用于与代码平台交互
 * 4. 获取差异补丁，准备进行代码审查
 * 5. 通过AI辅助审查代码，生成评论
 * 6. 将评论发布到合并请求中
 */
const codeReview = async (params: IParams) => {
    // 获取当前源代码仓库信息，包括合并请求相关信息
    const source = params.getCurrentSourceWithMr()
    // 检查是否有源代码信息，如果没有则跳过审查
    if (!source) {
        step.info('Repository in current folder is not triggered by MergeRequest. Skip')
        return
    }
    step.info(`Repository in current folder is triggered by MergeRequest: ${source.data.codeupMrLocalId}`)

    // 创建代码审查客户端，用于与代码平台交互
    const mrClient = new CodeupClient(params.yunxiaoToken, params.orgId, source)

    // 获取差异补丁，准备进行代码审查
    const patches: CodeReviewPatch[] = await mrClient.getDiffPatches()
    const crPatches = new CodeReviewPatches(patches)
    // 获取两个补丁之间的差异详细信息
    const compareResult: CompareResult = await mrClient.getDiff(crPatches.fromCommitId(), crPatches.toCommitId())
    // 输出差异信息
    step.info(`Diff data between last two patches: ${compareResult.diffs.length} 个差异`)

    // 准备开始代码审查，并提供合并请求的链接
    step.info(`Will review file diffs, and comment to this MR: ${mrClient.getMRUrl()}`)
    // 创建聊天客户端，用于代码审查的AI辅助
    const dashscopeChat = new Chat(params.dashscopeApikey, params.modelName, params.llmChatPrompt, params.temperature, params.aiBaseUrl)
    const mergeRequestDetail: MergeRequestResponse = await mrClient.getMergeRequest();
    if (mergeRequestDetail != null) {
        step.info(`Diff Request >>>>>> Merge Title: ${mergeRequestDetail.title}`)
    }

    // 将差异信息按文件名分组
    const hunksByFile = compareResult.getHunks().reduce((acc, hunk) => {
        if (!acc[hunk.fileName]) {
            acc[hunk.fileName] = []
        }
        acc[hunk.fileName].push(hunk)
        return acc
    }, {} as Record<string, Hunk[]>)

    // 创建一个并发限制器，限制同时进行的代码审查数量
    const limit = pLimit(30)

    // 对每个文件的差异进行代码审查，并发布评论
    const promises = Object.entries(hunksByFile).map(async ([fileName, hunks]) => {
        return limit(async () => {
            const afterFileContent = await mrClient.getFileBlob(fileName, mergeRequestDetail.sourceBranch)
            // 使用AI辅助审查代码，并获取审查结果 // compareResult.getCombinedDiff()
            const result = await dashscopeChat.reviewCode(afterFileContent, fileName, hunks)
            // 如果审查结果为空，则不执行任何操作
            if (!result) {
                return
            }
            // 将审查结果作为评论发布到合并请求中
            await mrClient.commentOnMR(result, crPatches.fromPatchSetId(), crPatches.toPatchSetId())
        })
    })

    // 等待所有代码审查和评论发布任务完成
    await Promise.all(promises)
}


export default codeReview
