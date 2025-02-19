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

export class Hunk {
  fileName: string;
  lineNumber: number;
  diff: string;
  
  constructor(fileName: string, lineNumber: number, diff: string) {
    this.fileName = fileName
    this.lineNumber = lineNumber
    this.diff = diff
  }
}

const hunkStartReg = /@@ -(\d+),\d+ \+(\d+),\d+ @@/

export class CompareResult {
  diffs: PatchDiff[]

  constructor(diffs: PatchDiff[]) {
    this.diffs = diffs;
  }

  getCombinedDiff(): string {
    return this.diffs
    .filter(d => !d.binary && !d.deletedFile)
    .map(d => d.diff).join("\n")
  }

  getHunks(): Hunk[] {
    return this.diffs.flatMap(diff => {
      const lines = diff.diff.split('\n')
      const fileName = lines[0].replace('--- a/', '')
      const hunkHead = lines[0] + '\n' + lines[1]
      return this.getHunksFromDiff(hunkHead, fileName, lines)
    })
  }

  getHunksFromDiff(hunkHead: string, fileName: string, lines: string[]): Hunk[] {
    const hunks: Hunk[] = [];

    let lineNumber = 2
    while(lineNumber < lines.length) {
      if(lines[lineNumber].match(hunkStartReg)) {
        const startLine = this.getTargetFileHunkStartLine(lineNumber, lines)
        const hunkDiff = this.getHunkDiff(hunkHead, lineNumber, lines)
        hunks.push(new Hunk(fileName, startLine, hunkDiff));
      }
      lineNumber++
    }
    return hunks
  }

  getTargetFileHunkStartLine(lineNumber: number, lines: string[]) {
    return this.getFirstAdditionLineNumber(lineNumber, lines) || 
           this.getLineBeforeFirstDeletion(lineNumber, lines) ||
           parseInt(lines[lineNumber].match(hunkStartReg)![2], 10);
  }

  getLineBeforeFirstDeletion(lineNumber: number, lines: string[]) {
    if(lines[lineNumber + 1].startsWith('-')) {
      return null
    }

    const hunkMatch = lines[lineNumber].match(hunkStartReg);
    let lineInCurrentHunk = parseInt(hunkMatch![2], 10);

    lineNumber++

    while(lineNumber < lines.length && !(lines[lineNumber].match(hunkStartReg))) {
      if(lines[lineNumber].startsWith('-')) {
        break;
      }
      lineInCurrentHunk++
      lineNumber++
    }
    if(lineNumber < lines.length && lines[lineNumber ].startsWith('-')) {
      return lineInCurrentHunk - 1
    }
    return null;
  }

  getFirstAdditionLineNumber(lineNumber: number, lines: string[]) {
    const hunkMatch = lines[lineNumber].match(hunkStartReg);
    let lineInCurrentHunk = parseInt(hunkMatch![2], 10);
    lineNumber++

    while(lineNumber < lines.length && 
      !(lines[lineNumber].match(hunkStartReg)) &&
      !lines[lineNumber].startsWith('+')
    ) {
      if(!lines[lineNumber].startsWith('-') && lineNumber !== lines.length - 1) {
        lineInCurrentHunk++
      }
      lineNumber++
    }
    if(lineNumber < lines.length && lines[lineNumber].startsWith('+')) {
      return lineInCurrentHunk
    }
    return null;
  }

  getHunkDiff(hunkHead: string, lineNumber: number, lines: string[]) {
    let hunkDiffLines = [hunkHead, lines[lineNumber]]

    lineNumber++
    while(lineNumber < lines.length && 
      !(lines[lineNumber].match(hunkStartReg))
    ) {
      hunkDiffLines.push(lines[lineNumber])
      lineNumber++
    }
    return hunkDiffLines.join("\n")
  }
}
