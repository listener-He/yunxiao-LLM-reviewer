import axios, { AxiosResponse } from 'axios';
import * as step from '@flow-step/step-toolkit'
import { ReviewResult } from './llm_chat';
import CodeSource from './code_source';

class CodeupClient {
    private baseUrl: string;
    private token: string;
    private orgId: string;
    private repoUrl: string;
    private repoId: number;
    private mrLocalId: number;

    constructor(token: string, orgId: string, source: CodeSource) {
        this.baseUrl = 'https://openapi-rdc.aliyuncs.com/oapi/v1/codeup';
        this.token = token;
        this.orgId = orgId;
        this.repoUrl = source.data.repo
        this.repoId = source?.data?.projectId;
        this.mrLocalId = source?.data?.codeupMrLocalId;
    }

    // 获取 diff patches
    public async getDiffPatches(): Promise<any> {
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/changeRequests/${this.mrLocalId}/diffs/patches`;
        try {
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token,
                },
            });

            return response.data; // 返回响应数据
        } catch (error) {
            console.error('Error fetching diff patches:', error);
            throw error; // 抛出错误，以便调用者处理
        }
    }

    public async getDiff(fromCommitId: string, toCommitId: string): Promise<any> {
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/compares?from=${fromCommitId}&to=${toCommitId}`;
        try {
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token,
                },
            });

            return response.data; // 返回响应数据
        } catch (error) {
            console.error('Error fetching diff patches:', error);
            throw error; // 抛出错误，以便调用者处理
        }
    }

    async commentOnMR(r: ReviewResult) {
        const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/changeRequests/${this.mrLocalId}/review`;
        try {
            const escapedComment = r.comment
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&apos;");
            const comment = `【本评论来自大模型】\n${escapedComment}`
            await axios.post(url, {
                reviewComment: comment
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-yunxiao-token': this.token,
                },
            });

            step.info(`Has Commented on ${r.fileName}:\n${escapedComment}`)
        } catch (error) {
            console.error('Error fetching diff patches:', error);
            throw error; // 抛出错误，以便调用者处理
        }
    }

    getMRUrl() {
        return `${this.repoUrl.replace('.git', '')}/change/${this.mrLocalId}`
    }
  
}

export default CodeupClient
