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
  const repositoryId = source?.data?.projectId;
  const localId = source?.data?.codeupMrLocalId;

  const mrClient = new CodeupClient(params.yunxiaoToken, params.orgId, repositoryId, localId);
  try {
    const patches: CodeReviewPatch[] = await mrClient.getDiffPatches()

    const crPatches = new CodeReviewPatches(patches)
    const compareResult: CompareResult = await mrClient.getDiff(crPatches.fromCommitId(), crPatches.toCommitId());
    step.info(`Diff data between last two patches: ${JSON.stringify(compareResult)}`);

    step.info('Will review file diffs one by one, and write comment to MR')
    const dashscopeChat = new Chat(params.dashscopeApikey, params.modelName)
    for(const diff of compareResult.diffs) {
      if(diff.binary || diff.deletedFile) {
        step.info(`${diff.oldPath} is deleted or a binary file, no need to review`)
        continue
      }
      const result = await dashscopeChat.reviewCode(diff.diff)
      if(Array.isArray(result)) {
        const reviewResults = result as ReviewResult[]
        for(const r of reviewResults) {
          await mrClient.commentOnMR(r)
        }
      } else {
        await mrClient.commentOnMR(result)
      }
    }
  } catch(error) {
    console.error('Error:', error);
  }
}

export default codeReview;
