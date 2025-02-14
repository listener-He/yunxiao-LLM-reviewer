import * as step from '@flow-step/step-toolkit'
import process from 'process'
import {getParams} from './params'
import codeReview from './code_review'

async function runStep(): Promise<void> {
    const params = getParams()
    step.info(`PIPELINE_ID=${params.pipelineID}`)
    step.info(`PIPELINE_NAME=${params.pipelineName}`)
    step.info(`BUILD_NUMBER=${params.buildNumber}`)
    step.info(`WORK_SPACE=${params.workSpace}`)
    step.info(`PROJECT_DIR=${params.projectDir}`)
    step.info(`BUILD_JOB_ID=${params.buildJobID}`)

    await codeReview(params)
}

runStep()
    .then(function() {
        step.success('run step successfully!')
    })
    .catch(function(err: Error) {
        step.error(err.message)
        process.exit(-1)
    })
