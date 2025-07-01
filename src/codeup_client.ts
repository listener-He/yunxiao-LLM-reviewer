import axios, {AxiosResponse} from 'axios'
import * as step from '@flow-step/step-toolkit'
import {ReviewResult} from './llm_chat'
import CodeSource from './code_source'
import {CompareResult} from './code_review_patch'

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
            console.error('Error fetching diff patches:', error)
            throw error
        }
    }

    getMRUrl() {
        return `${this.repoUrl.replace('.git', '')}/change/${this.mrLocalId}`
    }

}

export default CodeupClient
