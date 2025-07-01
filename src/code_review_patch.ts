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
  diffs: PatchDiff[];
  committerName: string;

  constructor(committerName: string, diffs: PatchDiff[]) {
    this.diffs = diffs;
    this.committerName = committerName
  }

  getCombinedDiff(): string {
    return this.diffs
    .filter(d => !d.binary && !d.deletedFile)
    .map(d => d.diff).join("\n")
  }

  getHunks(): Hunk[] {
    return this.diffs.flatMap(diff => {
      const lines = diff.diff.split('\n');

      // 判断是否为新增文件（旧文件是 /dev/null）
      const isNewFile = lines[0].startsWith('--- /dev/null');

      // 提取文件名行
      const fileNameLine = isNewFile ? lines[1] : lines[0];

      // 提取文件名
      const fileName = fileNameLine.replace(isNewFile ? '+++ b/' : '--- a/', '');

      // 构建 hunk 头部
      const hunkHead = lines[0] + '\n' + lines[1];

      // 获取 hunks
      return this.getHunksFromDiff(hunkHead, fileName, lines);
    });
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
    // 这里只计算目标版本文件的行号，因为comment只会打到目标版本的文件的行上
    // 如果目标版本文件存在添加的行，则取第一个添加的行
    return this.getFirstAdditionLineNumber(lineNumber, lines) || 
    // 否则如果目标版本文件存在删除的行，由于删除的行在目标版本中已经不存在了，所以取目标版本中上面的那一行
           this.getLineBeforeFirstDeletion(lineNumber, lines) ||
    // 如果上面两者都不存在，比如只删除了第一行，就即不存在添加的行，也不存在删除的行的上一行，就取hunk元数据中的目标版本文件中的第一行
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
