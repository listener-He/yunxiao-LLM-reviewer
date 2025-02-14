# Flow Custom Step Command 

Flow 自定义步骤示例工程

- step.yaml: 步骤模板配置示例，包含基本属性和常见的 items 
- system envs: 输出 PIPELINE_ID、PIPELINE_NAME、BUILD_NUMBER 等系统基础环境变量
- flow-step-toolkit: 步骤 sdk 调用，更多请参考 [Flow Step Toolkit](https://atomgit.com/flow-step/step-js-toolkit.git)

# Quickstart
初始化工程
```bash
npm install --registry=https://registry.npmmirror.com
```

## 下载依赖 & 测试
```bash
npm run test
```
```
...

> MyCustomStep@1.0.0 test
> mocha -r ts-node/register test/**/*.spec.ts



  convertToUpperCase test
    ✔ should return upper string


  1 passing (8ms)
```

## 运行
```bash
npm run build
node dist/index.js
```
```
...

2024-09-25 15:04:45 [INFO] PIPELINE_ID=NaN
2024-09-25 15:04:45 [INFO] PIPELINE_NAME=undefined
2024-09-25 15:04:45 [INFO] BUILD_NUMBER=NaN
2024-09-25 15:04:45 [INFO] WORK_SPACE=undefined
2024-09-25 15:04:45 [INFO] PROJECT_DIR=undefined
2024-09-25 15:04:45 [INFO] BUILD_JOB_ID=NaN
2024-09-25 15:04:45 [INFO] Hello from flow-step MyCustomStep, custom param abc=, upper value=
2024-09-25 15:04:45 [INFO] Log other step.yaml item value
2024-09-25 15:04:45 [INFO] your_password=undefined
2024-09-25 15:04:45 [INFO] exclusion=undefined
2024-09-25 15:04:45 [INFO] select_version=undefined
2024-09-25 15:04:45 [INFO] edf=undefined
2024-09-25 15:04:45 [INFO] toggle=undefined
2024-09-25 15:04:45 [SUCCESS] run step successfully!
```
