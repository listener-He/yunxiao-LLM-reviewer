import { CodeReviewPatch, CodeReviewPatches, CompareResult } from "./code_review_patch";
import CodeupClient from "./codeup_client";
import { Chat, ReviewResult } from "./llm_chat";
import { IParams } from "./params";
import * as step from '@flow-step/step-toolkit'

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
  step.info(`Diff data between last two patches:\n ${compareResult.diffs.map(d => d.diff).join("\n")}`);

  step.info(`Will review file diffs, and comment to this MR: ${mrClient.getMRUrl()}`)
  const dashscopeChat = new Chat(params.dashscopeApikey, params.modelName)
  const combinedDiff = compareResult.diffs
    .filter(d => !d.binary && !d.deletedFile)
    .map(d => d.diff).join("\n")
  const result: ReviewResult[] = await dashscopeChat.reviewCode(combinedDiff)
  for(const r of result) {
    await mrClient.commentOnMR(r)
  }
}

export default codeReview;
