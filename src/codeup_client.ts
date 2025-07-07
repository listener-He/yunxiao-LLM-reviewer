import axios, {AxiosResponse} from 'axios'
import * as step from '@flow-step/step-toolkit'
import {ReviewResult} from './llm_chat'
import CodeSource from './code_source'
import {CompareResult} from './code_review_patch'

/**
 * Merge Request 响应类定义
 * 对应阿里云 Yunxiao API 的 GetChangeRequest 查询合并请求接口
 * 文档地址: https://help.aliyun.com/zh/yunxiao/developer-reference/getchangerequest-query-merge-request
 */
export interface MergeRequestResponse {
    /**
     * 当前分支领先目标分支的提交数（即 ahead 的提交数量）
     */
    ahead: number;

    /**
     * 所有合并要求是否都通过，true 表示可以合并，false 表示不能合并
     */
    allRequirementsPass: boolean;

    /**
     * MR 创建者信息
     */
    author: AuthorInfo;

    /**
     * 当前分支落后目标分支的提交数（即 behind 的提交数量）
     */
    behind: number;

    /**
     * 业务 ID，唯一标识一个 MR 的业务编号
     */
    bizId: string;

    /**
     * 是否可以执行 revert 或 cherry pick 操作
     */
    canRevertOrCherryPick: boolean;

    /**
     * 变更大小的分类（S、M、L 等）
     */
    changeSizeBucket: string;

    /**
     * 合并检查项列表
     */
    checkList: CheckListItem[];

    /**
     * MR 的创建来源，例如 WEB、API 等
     */
    createFrom: string;

    /**
     * MR 创建时间（ISO8601 格式）
     */
    createTime: string;

    /**
     * MR 的详细页面 URL
     */
    detailUrl: string;

    /**
     * 是否已经被 revert
     */
    hasReverted: boolean;

    /**
     * 本地 ID，表示 MR 在项目中的唯一编号
     */
    localId: number;

    /**
     * MR 类型，如 CODE_REVIEW、BUG_FIX 等
     */
    mrType: string;

    /**
     * 项目 ID
     */
    projectId: number;

    /**
     * MR 的评审人列表
     */
    reviewers: ReviewerInfo[];

    /**
     * 源分支名称
     */
    sourceBranch: string;

    /**
     * 源项目 ID
     */
    sourceProjectId: number;

    /**
     * MR 当前状态，如 UNDER_REVIEW, MERGED 等
     */
    status: string;

    /**
     * 订阅者列表（当前未使用）
     */
    subscribers: any[];

    /**
     * 是否支持 fast-forward 合并方式
     */
    supportMergeFastForwardOnly: boolean;

    /**
     * 目标分支名称
     */
    targetBranch: string;

    /**
     * 目标项目 ID
     */
    targetProjectId: number;

    /**
     * 目标项目的命名空间 + 名称
     */
    targetProjectNameWithNamespace: string;

    /**
     * 目标项目的命名空间 + 路径
     */
    targetProjectPathWithNamespace: string;

    /**
     * MR 标题
     */
    title: string;

    /**
     * 总评论数
     */
    totalCommentCount: number;

    /**
     * 未解决的评论数
     */
    unResolvedCommentCount: number;

    /**
     * MR 最后更新时间（ISO8601 格式）
     */
    updateTime: string;

    /**
     * 项目主页 URL
     */
    webUrl: string;
}

/**
 * MR 创建者信息
 */
export interface AuthorInfo {
    avatar: string;        // 头像链接
    email: string;         // 邮箱
    id: number;            // 用户 ID
    name: string;          // 用户姓名
    state: string;         // 用户状态（active/inactive）
    userId: string;        // 用户唯一标识
    username: string;      // 登录用户名
}

/**
 * MR 审核人信息
 */
export interface ReviewerInfo {
    avatar: string;        // 头像链接
    email: string;         // 邮箱
    hasCommented: boolean; // 是否已评论
    hasReviewed: boolean;  // 是否已审核
    id: number;            // 用户 ID
    name: string;          // 用户姓名
    reviewTime: null | string; // 审核时间（可能为空）
    state: string;         // 用户状态（active/inactive）
    userId: string;        // 用户唯一标识
    username: string;      // 登录用户名
}

/**
 * MR 合并检查项
 */
export interface CheckListItem {
    needAttentionItems: any[]; // 需要关注的检查项（当前为空）
    requirementRuleItems: RequirementRuleItem[]; // 合并规则检查项
}

/**
 * MR 合并规则检查项
 */
export interface RequirementRuleItem {
    itemType: string;     // 检查类型，如 MERGE_CONFLICT_CHECK、REVIEWER_APPROVED_CHECK、CI_CHECK
    pass: boolean;        // 是否通过检查
}


class CodeupClient {
    private baseUrl: string
    private token: string
    private orgId: string
    private repoUrl: string
    private repoId: number
    private mrLocalId: number

    constructor(token: string, orgId: string, source: CodeSource) {
        this.baseUrl = 'https://openapi-rdc.aliyuncs.com/oapi/v1/codeup'
        this.token = token
        this.orgId = orgId
        this.repoUrl = source.data.repo
        this.repoId = source?.data?.projectId
        this.mrLocalId = source?.data?.codeupMrLocalId
    }

    /**
     * 获取指定仓库中某个文件的内容
     *
     * @param filePath 文件在仓库中的路径
     * @param ref 指定的ref，可以是分支名或提交ID
     * @returns 返回一个Promise，解析为文件内容
     */
    public async getFileBlob(filePath: string, ref: string): Promise<string> {
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/files/${encodeURIComponent(filePath)}?ref=${ref}`
        try {
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token
                }
            })
            // 假设返回的数据结构中 content 字段包含文件内容
            if (!response.data) {
                return "";
            }
            if (!response.data.content) {
                return "";
            }
            if (!response.data.encoding || response.data.encoding === 'text') {
                return response.data.content
            }
            // content base64
            return Buffer.from(response.data.content, 'base64').toString('utf-8')
        } catch (error) {
            step.error(`Query ref: ${ref} fileContent path: ${filePath} Error fetching file ${filePath} blob: ${error}`, )
            return "";
        }
    }


    /**
     * 获取当前合并请求的详细信息
     *
     * @returns 返回一个Promise，解析为合并请求的详细信息对象
     */
    public async getMergeRequest(): Promise<MergeRequestResponse> {
        // 构造请求URL
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/changeRequests/${this.mrLocalId}`

        try {
            // 发送GET请求获取MR详情
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token
                }
            })

            // 返回响应数据
            return response.data
        } catch (error) {
            // 输出错误信息到控制台
            console.error('Error fetching merge request details:', error)
            // 抛出错误，以便调用者处理
            throw error
        }
    }


    /**
     * 异步获取差异补丁信息
     *
     * 本函数通过发送HTTP GET请求，获取指定组织、仓库和变更请求的差异补丁信息
     * 使用Axios库进行网络请求，并处理响应结果或潜在错误
     *
     * @returns {Promise<any>} 返回一个Promise对象，解析为API响应的数据
     * @throws {Error} 当网络请求失败或处理错误时，抛出错误
     */
    public async getDiffPatches(): Promise<any> {
        // 构造请求URL
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/changeRequests/${this.mrLocalId}/diffs/patches`
        try {
            // 发送GET请求，获取差异补丁信息
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token
                }
            })

            // 返回响应数据
            return response.data
        } catch (error) {
            // 输出错误信息到控制台
            console.error('Error fetching diff patches:', error)
            // 抛出错误，以便调用者处理
            throw error
        }
    }

    /**
     * 异步获取两个提交之间的差异信息
     *
     * 本函数通过调用API来获取指定的两个提交（fromCommitId和toCommitId）之间的差异信息，包括提交者姓名和差异内容
     * 主要用于比较代码库中两个提交版本的差异
     *
     * @param fromCommitId 起始提交的ID，用于比较的起点
     * @param toCommitId 结束提交的ID，用于比较的终点
     * @returns Promise 返回一个Promise，解析为CompareResult对象，包含提交者姓名和差异内容
     * @throws 当API请求失败或解析响应出错时，抛出错误
     */
    public async getDiff(fromCommitId: string, toCommitId: string): Promise<CompareResult> {
        // 构造请求URL，包含组织ID、仓库ID和比较的提交ID
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/compares?from=${fromCommitId}&to=${toCommitId}`
        try {
            // 发起GET请求到构造的URL，同时设置请求头，包含内容类型和认证信息
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token
                }
            })

            // 返回响应数据，创建CompareResult对象，传入提交者姓名和差异内容
            return new CompareResult(response.data.committerName, response.data.diffs)
        } catch (error) {
            // 打印错误信息到控制台，以便调试和日志记录
            console.error('Error fetching diff patches:', error)
            // 抛出错误，以便调用者处理
            throw error
        }
    }

    /**
     * 在合并请求中发表评论
     *
     * 该函数负责将给定的评论内容发布到指定的合并请求中它会对评论内容进行HTML转义，以确保评论文本中的特殊字符不会被错误解析
     * 函数还会处理网络请求的错误，并将错误信息输出到控制台
     *
     * @param r 包含评论信息的对象，包括评论文本、文件名和行号等信息
     * @param fromPatchSetId 评论来源的补丁集ID
     * @param toPatchSetId 评论目标的补丁集ID
     */
    async commentOnMR(r: ReviewResult, fromPatchSetId: string, toPatchSetId: string) {
        // 构建用于提交评论的URL
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/changeRequests/${this.mrLocalId}/comments`
        try {
            // 对评论内容进行HTML转义，以避免XSS攻击
            const escapedComment = r.comment
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;')
            // 构建最终的评论内容
            const comment = `【本评论来自大模型】\n${escapedComment}`

            // 发送POST请求到目标URL，提交评论
            await axios.post(url, {
                comment_type: 'INLINE_COMMENT',
                content: comment,
                file_path: r.fileName,
                line_number: r.lineNumber == -1 ? null : r.lineNumber,
                from_patchset_biz_id: fromPatchSetId,
                to_patchset_biz_id: toPatchSetId,
                patchset_biz_id: toPatchSetId,
                draft: false,
                resolved: false
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token
                }
            })

            // 输出评论信息到控制台，用于调试和日志记录
            step.info(`Has Commented on ${r.fileName}, line: ${r.lineNumber}:\n${escapedComment}`)
        } catch (error) {
            // 输出错误信息到控制台，并抛出错误，以便调用者处理
            step.error(`Error fetching diff ${r.fileName} patches: ${error}`)
            throw error
        }
    }

    getMRUrl() {
        return `${this.repoUrl.replace('.git', '')}/change/${this.mrLocalId}`
    }

}

export default CodeupClient
