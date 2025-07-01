export class CodeReviewPatch {
    commitId!: string
    versionNo!: number
    patchSetName!: string
    patchSetBizId!: string
    relatedMergeItemType!: string
}

/**
 * CodeReviewPatches 类用于封装与代码审查相关的补丁集合，提供获取和操作这些补丁信息的方法
 */
export class CodeReviewPatches {
    // 存储代码审查中涉及的补丁数组
    patches: CodeReviewPatch[]

    /**
     * 构造函数，初始化 CodeReviewPatches 实例
     *
     * @param patches 一个 CodeReviewPatch 对象数组，表示本次审查涉及的所有补丁信息
     */
    constructor(patches: CodeReviewPatch[]) {
        this.patches = patches
    }

    /**
     * 获取基础补丁集（from patch set）的提交 ID
     *
     * @returns 返回基础补丁集的提交 ID，用于作为对比起点
     */
    fromCommitId(): string {
        return this.fromPatchSet().commitId
    }

    /**
     * 确定并返回基础补丁集（from patch set）
     *
     * 如果补丁数量为两个，则返回合并目标（merge target）；
     * 否则返回第二旧的补丁集。
     *
     * @returns 返回基础补丁集对象
     */
    fromPatchSet() {
        if (this.patches.length === 2) {
            return this.mergeTarget()
        }
        return this.mergeSourcesInVersionOrderDesc()[1]
    }

    /**
     * 获取基础补丁集的业务 ID（Biz ID）
     *
     * @returns 返回基础补丁集的业务 ID
     */
    fromPatchSetId(): string {
        return this.fromPatchSet().patchSetBizId
    }

    /**
     * 获取目标补丁集（to patch set）的业务 ID
     *
     * @returns 返回目标补丁集的业务 ID
     */
    toPatchSetId(): string {
        return this.mergeSourcesInVersionOrderDesc()[0].patchSetBizId
    }

    /**
     * 获取目标补丁集的提交 ID
     *
     * @returns 返回目标补丁集的提交 ID
     */
    toCommitId(): string {
        return this.mergeSourcesInVersionOrderDesc()[0].commitId
    }

    /**
     * 获取合并目标补丁（merge target patch）
     *
     * @returns 返回合并目标补丁对象
     */
    mergeTarget(): CodeReviewPatch {
        return this.patches.filter(p => p.relatedMergeItemType === 'MERGE_TARGET')[0]
    }

    /**
     * 筛选出所有合并源补丁（merge source patches），并按版本号从高到低排序
     *
     * @returns 返回按版本号降序排列的合并源补丁数组
     */
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
    fileName: string
    lineNumber: number
    diff: string

    constructor(fileName: string, lineNumber: number, diff: string) {
        this.fileName = fileName
        this.lineNumber = lineNumber
        this.diff = diff
    }
}

const hunkStartReg = /@@ -(\d+),\d+ \+(\d+),\d+ @@/

export class CompareResult {
    diffs: PatchDiff[]
    committerName: string

    constructor(committerName: string, diffs: PatchDiff[]) {
        this.diffs = diffs
        this.committerName = committerName
    }

    getCombinedDiff(): string {
        return this.diffs
            .filter(d => !d.binary && !d.deletedFile)
            .map(d => d.diff).join('\n')
    }

    /**
     * 获取差异块（hunks）
     *
     * 本方法通过处理 `diffs` 属性中的每个差异对象来生成一个包含所有差异块的数组
     * 每个差异对象代表一对文件之间的差异，本方法将这些差异拆分成更小的单位——差异块（hunk）
     * 每个差异块都包含有关文件特定部分更改的信息
     *
     * @returns {Hunk[]} 返回一个包含所有差异块的数组
     */
    getHunks(): Hunk[] {
        return this.diffs.flatMap(diff => {
            // 将差异字符串拆分成行数组
            const lines = diff.diff.split('\n')

            // 判断是否为新增文件（旧文件是 /dev/null）
            const isNewFile = lines[0].startsWith('--- /dev/null')

            // 提取文件名行
            const fileNameLine = isNewFile ? lines[1] : lines[0]

            // 提取文件名
            const fileName = fileNameLine.replace(isNewFile ? '+++ b/' : '--- a/', '')

            // 构建 hunk 头部
            const hunkHead = lines[0] + '\n' + lines[1]

            // 获取 hunks
            return this.getHunksFromDiff(hunkHead, fileName, lines)
        })
    }

    /**
     * 从差异中提取变更块信息
     *
     * 此函数旨在解析给定文件的差异输出，从中提取出各个变更块（hunk）的信息这些信息包括文件名、变更块的起始行号以及变更的具体内容
     * 变更块是文件对比中连续更改的部分，通常由版本控制系统（如Git）在比较文件差异时使用
     *
     * @param hunkHead 差异头部信息，通常包含版本控制系统的元数据
     * @param fileName 正在处理的文件名
     * @param lines 文件差异的行数组，每行代表差异输出中的一行
     * @returns 返回一个Hunk对象数组，每个对象代表一个变更块
     */
    getHunksFromDiff(hunkHead: string, fileName: string, lines: string[]): Hunk[] {
        // 存储解析出的变更块
        const hunks: Hunk[] = []

        // 初始化行号为2，假设差异输出的前两行是版本控制系统的元数据，不包含实际的文件差异
        let lineNumber = 2
        // 遍历差异输出的每一行，寻找变更块的开始
        while (lineNumber < lines.length) {
            // 检查当前行是否为变更块的开始
            if (lines[lineNumber].match(hunkStartReg)) {
                // 获取目标文件变更块的起始行号
                const startLine = this.getTargetFileHunkStartLine(lineNumber, lines)
                // 获取变更块的差异内容
                const hunkDiff = this.getHunkDiff(hunkHead, lineNumber, lines)
                // 创建Hunk对象并添加到变更块数组中
                hunks.push(new Hunk(fileName, startLine, hunkDiff))
            }
            // 移动到下一行继续检查
            lineNumber++
        }
        // 返回解析出的所有变更块
        return hunks
    }

    /**
     * 获取目标文件hunk的起始行号
     *
     * 此函数旨在计算目标版本文件中的行号，以便确定评论应附加的位置
     * 它按照以下顺序尝试确定起始行号：
     * 1. 如果目标版本文件中有添加的行，则选择第一行添加的行号
     * 2. 如果没有添加的行，但有删除的行，则选择目标版本中删除的行上面的那一行
     * 3. 如果上述两种情况都不存在，例如只删除了第一行，既没有添加的行，也没有删除的行的上一行，
     *    则选择hunk元数据中目标版本文件中的第一行
     *
     * @param lineNumber 当前行号
     * @param lines 文件的行数组
     * @returns 目标文件hunk的起始行号
     */
    getTargetFileHunkStartLine(lineNumber: number, lines: string[]) {
        // 这里只计算目标版本文件的行号，因为comment只会打到目标版本的文件的行上
        // 如果目标版本文件存在添加的行，则取第一个添加的行
        return this.getFirstAdditionLineNumber(lineNumber, lines) ||
            // 否则如果目标版本文件存在删除的行，由于删除的行在目标版本中已经不存在了，所以取目标版本中上面的那一行
            this.getLineBeforeFirstDeletion(lineNumber, lines) ||
            // 如果上面两者都不存在，比如只删除了第一行，就即不存在添加的行，也不存在删除的行的上一行，就取hunk元数据中的目标版本文件中的第一行
            parseInt(lines[lineNumber].match(hunkStartReg)![2], 10)
    }

    /**
     * 获取在第一次删除操作之前的行号
     *
     * 此函数旨在处理diff文本的解析，寻找第一个删除操作(-)之前的有效行号
     * 它通过遍历给定的行集合，根据特定的规则确定行号
     *
     * @param lineNumber 起始行号，从这一行开始检查
     * @param lines 包含diff信息的行数组
     * @returns 返回第一个删除操作之前的行号，如果没有找到删除操作，则返回null
     */
    getLineBeforeFirstDeletion(lineNumber: number, lines: string[]) {
        // 检查下一行是否以删除操作开始，如果是，则返回null
        if (lines[lineNumber + 1].startsWith('-')) {
            return null
        }

        // 通过正则表达式匹配当前行是否为hunk的开始，如果是，提取行号
        const hunkMatch = lines[lineNumber].match(hunkStartReg)
        let lineInCurrentHunk = parseInt(hunkMatch![2], 10)

        // 移动到下一行
        lineNumber++

        // 遍历行，直到找到下一个hunk的开始或文件结束
        while (lineNumber < lines.length && !(lines[lineNumber].match(hunkStartReg))) {
            // 如果找到删除操作，停止遍历
            if (lines[lineNumber].startsWith('-')) {
                break
            }
            // 更新当前行号
            lineInCurrentHunk++
            lineNumber++
        }
        // 检查是否找到删除操作，如果是，返回删除操作前的行号
        if (lineNumber < lines.length && lines[lineNumber].startsWith('-')) {
            return lineInCurrentHunk - 1
        }
        // 如果没有找到删除操作，返回null
        return null
    }

    /**
     * 获取第一个添加行的行号
     *
     * 该函数旨在解析给定行号和行数组，找到当前代码块中第一个被添加的行的行号
     * 它主要用于处理diff输出，帮助定位修改的位置
     *
     * @param lineNumber 当前处理的行号
     * @param lines 文件的行数组
     * @returns 如果找到第一个添加的行，则返回其在当前hunk中的行号；否则返回null
     */
    getFirstAdditionLineNumber(lineNumber: number, lines: string[]) {
        // 匹配hunk开始的正则表达式
        const hunkMatch = lines[lineNumber].match(hunkStartReg)
        // 解析当前hunk中的起始行号
        let lineInCurrentHunk = parseInt(hunkMatch![2], 10)
        lineNumber++

        // 遍历当前hunk，寻找第一个添加的行
        while (lineNumber < lines.length &&
            !(lines[lineNumber].match(hunkStartReg)) &&
            !lines[lineNumber].startsWith('+')
            ) {
            // 如果当前行不是删除的行，并且不是文件的最后一行，则行号递增
            if (!lines[lineNumber].startsWith('-') && lineNumber !== lines.length - 1) {
                lineInCurrentHunk++
            }
            lineNumber++
        }
        // 如果找到添加的行，则返回其在当前hunk中的行号
        if (lineNumber < lines.length && lines[lineNumber].startsWith('+')) {
            return lineInCurrentHunk
        }
        // 如果没有找到添加的行，则返回null
        return null
    }

    /**
     * 获取差异块的字符串
     *
     * 此函数从给定的行号开始，收集差异块（hunk）的行，直到遇到下一个差异块的头部或文件结束
     * 它首先将差异块的头部和指定行号的行内容添加到结果中，然后继续向下遍历，收集所有属于当前差异块的行
     *
     * @param hunkHead 差异块的头部字符串，用于标识差异块的开始
     * @param lineNumber 开始收集差异块行的行号
     * @param lines 文件的所有行，作为数组提供
     * @returns 返回包含整个差异块的字符串
     */
    getHunkDiff(hunkHead: string, lineNumber: number, lines: string[]) {
        // 初始化差异块行数组，包含差异块头部和指定行的内容
        let hunkDiffLines = [hunkHead, lines[lineNumber]]

        // 递增行号以开始遍历差异块的其余部分
        lineNumber++
        // 继续遍历直到到达文件末尾或下一个差异块的开始
        while (lineNumber < lines.length &&
            !(lines[lineNumber].match(hunkStartReg))
            ) {
            // 将当前行添加到差异块行数组中
            hunkDiffLines.push(lines[lineNumber])
            // 递增行号以遍历下一行
            lineNumber++
        }
        // 将差异块行数组连接成单个字符串并返回
        return hunkDiffLines.join('\n')
    }
}
