import {CodeReviewPatch, CodeReviewPatches, CompareResult, Hunk} from './code_review_patch'
import CodeupClient from "./codeup_client";
import { Chat } from "./llm_chat";
import { IParams } from "./params";
import * as step from '@flow-step/step-toolkit'
import pLimit from 'p-limit';

const codeReview = async (params: IParams) => {
  const source = params.getCurrentSourceWithMr()
  if(!source) {
    step.info('Repository in current folder is not triggered by MergeRequest. Skip')
    return
  }

  const mrClient = new CodeupClient(params.yunxiaoToken, params.orgId, source);

  const patches: CodeReviewPatch[] = await mrClient.getDiffPatches()
  const crPatches = new CodeReviewPatches(patches)
  const compareResult: CompareResult = await mrClient.getDiff(crPatches.fromCommitId(), crPatches.toCommitId());
  step.info(`Diff data between last two patches:\n ${compareResult.getCombinedDiff()}`);
  
  step.info(`Will review file diffs, and comment to this MR: ${mrClient.getMRUrl()}`)
  const dashscopeChat = new Chat(params.dashscopeApikey, params.modelName, params.llmChatPrompt)
  
  const hunksByFile = compareResult.getHunks().reduce((acc, hunk) => {
    if (!acc[hunk.fileName]) {
      acc[hunk.fileName] = []
    }
    acc[hunk.fileName].push(hunk)
    return acc
  }, {} as Record<string, Hunk[]>)

  const limit = pLimit(30);

  const promises = Object.entries(hunksByFile).map(async ([fileName, hunks]) => {
    return limit(async () => {
      const result = await dashscopeChat.reviewCode(compareResult.getCombinedDiff(), fileName, hunks)
      if (!result) {
        return
      }
      await mrClient.commentOnMR(result, crPatches.fromPatchSetId(), crPatches.toPatchSetId())
    })
  })

  await Promise.all(promises)
}

export default codeReview;