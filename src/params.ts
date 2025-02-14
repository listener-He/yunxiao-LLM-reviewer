import process from 'process'
import CodeSource from './code_source'

export class IParams {
    pipelineID!: number
    pipelineName!: string
    buildNumber?: number
    workSpace!: string
    projectDir!: string
    buildJobID!: number
    yunxiaoToken!: string
    orgId!: string
    source!: string
    sources!: string
    dashscopeApikey!: string
    modelName!: string

    getCurrentSourceWithMr(): CodeSource | null {
        if(this.sources === null || this.source === null) {
            return null;
        }
        const sources: CodeSource[] = JSON.parse(this.sources!)
        const currentSource = sources.filter(source => source.type === 'codeup' && source.sign === this.source!)
        if(currentSource.length === 1 && !!currentSource[0].data?.codeupMrLocalId) {
            return currentSource[0]
        }
        return null;
    }
}

export function getParams(): IParams {
    let params = new IParams()
    params.pipelineID = Number(process.env.PIPELINE_ID)
    params.pipelineName = process.env.PIPELINE_NAME as string
    params.buildNumber = Number(process.env.BUILD_NUMBER)
    params.workSpace = process.env.WORK_SPACE as string
    params.projectDir = process.env.PROJECT_DIR as string
    params.buildJobID = Number(process.env.BUILD_JOB_ID)
    params.yunxiaoToken = process.env.yunxiaoToken as string
    params.orgId = process.env.ORGANIZATION_ID as string
    params.source = process.env.source as string
    params.sources = process.env.SOURCES as string
    params.dashscopeApikey = process.env.dashScopeToken as string
    params.modelName = process.env.modelName as string
    return params
}