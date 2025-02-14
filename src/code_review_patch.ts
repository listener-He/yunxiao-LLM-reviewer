export class CodeReviewPatch {
  commitId!: string
  versionNo!: number
  patchSetName!: string
  relatedMergeItemType!: string
}

export class CodeReviewPatches {
  patches: CodeReviewPatch[]
  
  constructor(patches: CodeReviewPatch[]) {
    this.patches = patches
  }

  fromCommitId(): string {
    if(this.patches.length === 2) {
      return this.mergeTarget().commitId
    }
    return this.mergeSourcesInVersionOrderDesc()[1].commitId
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

export class patchDiff {
  diff!: string
  oldPath!: string
  deletedFile!: boolean
  binary!: boolean
}

export class CompareResult {
  diffs!: patchDiff[]
}