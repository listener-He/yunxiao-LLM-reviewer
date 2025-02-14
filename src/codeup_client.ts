import axios, { AxiosResponse } from 'axios';
import * as step from '@flow-step/step-toolkit'
import { ReviewResult } from './llm_chat';

class CodeupClient {
    private baseUrl: string;
    private token: string;
    private orgId: string;
    private repoId: number;
    private mrLocalId: number;

    constructor(token: string, orgId: string, repoId: number, mrLocalId: number) {
        this.baseUrl = 'https://openapi-rdc.aliyuncs.com/oapi/v1/codeup';
        this.token = token;
        this.orgId = orgId;
        this.repoId = repoId;
        this.mrLocalId = mrLocalId;
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

    async commentOnMR(r: ReviewResult | string) {
        if(typeof(r) === 'string') {
            const url = `${this.baseUrl}/organizations/${this.orgId}/repositories/${this.repoId}/changeRequests/${this.mrLocalId}/review`;
            try {
                const comment = `【本评论来自大模型】\n${r}`
                const response: AxiosResponse = await axios.post(url, {
                    reviewComment: comment
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-yunxiao-token': this.token,
                    },
                });

                if(response.status !== 200) {
                    step.info(`failed to review merge request: ${JSON.stringify(response.data)}`)
                }
            } catch (error) {
                console.error('Error fetching diff patches:', error);
                throw error; // 抛出错误，以便调用者处理
            }
        }
    }
    
}

export default CodeupClient
