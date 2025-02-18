export class CodeReviewPatch {
  commitId!: string
  versionNo!: number
  patchSetName!: string
  patchSetBizId!: string
  relatedMergeItemType!: string
}

export class CodeReviewPatches {
  patches: CodeReviewPatch[]
  
  constructor(patches: CodeReviewPatch[]) {
    this.patches = patches
  }

  fromCommitId(): string {
    return this.fromPatchSet().commitId
  }

  fromPatchSet() {
    if(this.patches.length === 2) {
      return this.mergeTarget()
    }
    return this.mergeSourcesInVersionOrderDesc()[1]
  }

  fromPatchSetId(): string {
    return this.fromPatchSet().patchSetBizId
  }

  toPatchSetId(): string {
    return this.mergeSourcesInVersionOrderDesc()[0].patchSetBizId
  }

  toCommitId(): string {
    return this.mergeSourcesInVersionOrderDesc()[0].commitId
  }

  mergeTarget(): CodeReviewPatch {
    return this.patches.filter(p => p.relatedMergeItemType === 'MERGE_TARGET')[0]
  }

  mergeSourcesInVersionOrderDesc(): CodeReviewPatch[] {
    return this.patches.filter(p => p.relatedMergeItemType === 'MERGE_SOURCE').sort((a, b) => a.versionNo - b.versionNo).reverse()
  }
}

export class PatchDiff {
  diff!: string
  oldPath!: string
  newPath!: string
  deletedFile!: boolean
  binary!: boolean
}

export class CompareResult {
  diffs!: PatchDiff[]
}