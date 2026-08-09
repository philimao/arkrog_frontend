---
status: 已接受
last-verified: 2026-08-05
sources:
  - app/modules/Tool/BlackFlowMap/recognition/recognize.ts
  - arkrog_backend/routers/mapRecognition.ts
  - arkrog_backend/utils/tencentApi.ts
---

# ADR-0001：截图识别改用云 OCR + 前端推理，后端只做签名转发

|      |                                                         |
| ---- | ------------------------------------------------------- |
| 状态 | 已接受（2026-08-05）                                    |
| 取代 | 后端本地 tesseract 方案（2026-08-04 上 dev，未上 prod） |

## 背景

初版识别把全部工作放在后端：`tesseract.js` 在服务器本地跑 OCR，加上网格标定、候选打分。三个问题：

1. **服务器扛不住**。这台 CVM 2 核 1.7GB 内存，日常可用约 400MB。OCR 是纯 CPU 密集型，且接口无鉴权无限流、body 上限 10MB、图片不降采样直接全分辨率喂进去。
2. **tesseract worker 会崩掉整个进程**。实测同一个 worker 连续跑 7~8 张图后必然 `RuntimeError: memory access out of bounds`，而这个异常是在 worker 线程里 `process.nextTick` 抛出的——**`try/catch` 接不住，直接杀进程**。而旧实现正是永久复用同一个 cached worker。试过每张图重建 worker，结果是挂起；只有一图一进程才可靠，长驻服务里没有干净解法。
3. **识别率不够**，被迫加了大量补丁：模糊子串匹配、以及逐个「空洞」裁图放大重识别的抢救 pass（最多 25 次额外调用）。

## 决策

改为：**前端压缩 → 后端签名转发到腾讯云 OCR → 前端完成全部推理**。

后端在这条链路上只做三件事：限流、TC3 签名转发、裁剪响应。不解码图片、不做像素运算、不做匹配。

## 被否决的备选

### A. 前端本地跑 tesseract（浏览器 WASM）

零调用成本、零后端负载，且 tesseract.js 本来就是浏览器库，移植成本低。**否决原因：CDN 流量**——每个新用户要下载 wasm core + 语言包约 10MB。

### B. 浏览器直连腾讯云 OCR（前端向后端申请 STS，直连云 API）

这是最初的设想，参照现有 COS 直传的做法。**否决原因：CORS 死路，实测证据充分**：

- `OPTIONS ocr.tencentcloudapi.com` 带 Origin 与预检头 → 200，但**响应头里没有任何 `Access-Control-Allow-*`**
- `POST` 同样无 `Access-Control-Allow-Origin`

云 API 3.0 强制要求 `Authorization`/`X-TC-Action`/`X-TC-Timestamp`/`X-TC-Version` 自定义头，必然触发预检；预检没有 ACAO，浏览器直接拦掉。COS 之所以能直传，是因为它支持**按存储桶配置 CORS 规则**；云 API 网关没有这个机制，设计前提就是服务端调用。

即使绕过 CORS 还有两个更硬的问题：**STS 收敛不了**——COS 的 policy 能收到「某桶+某前缀+只能 PutObject+content-type 限图片」，OCR 只能授到动作级，拿到 token 即可无限调用直接产生账单；而这功能面向所有玩家，套不上 COS 那套 Level 3+ 守卫。

### C. COS 中转 + OCR `ImageUrl`（前端直传 COS，后端只传对象 URL）

技术上可行（CI/OCR 支持 `ImageUrl`，COS 走桶 CORS + STS），能把图片流量完全移出后端。**暂不采用**：服务器在腾讯云内网，改用内网端点后转发流量本就不占公网带宽，再引入窄口径 STS + 桶生命周期清理不划算。若后续观察到上行并发影响站点其他请求，这是既定退路。

## 实测依据

82 张真实样张（`tmp/samples`，文件名自带 ground truth）：

| 指标                          | 结果                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| 腾讯云 GeneralBasicOCR 成功率 | 82/82                                                         |
| 层数可从截图顶栏层名直接判出  | **82/82 = 100%**                                              |
| 基底识别（单次调用）          | 79/82 = 96.3%                                                 |
| 压缩到长边 1600px + JPEG q85  | 检出零损失，上传从最大 8.78MB 降到 ~165KB                     |
| 标签形态                      | 整段返回、置信度 100，**不需要 tesseract 那套 word 合并逻辑** |

「层数可直接判出」是这次调查最有价值的意外发现——它让用户不必先手选层数，也让接口不必接收 zone 参数。

## 后果

**得到**：服务器 CPU 负载归零；tesseract 崩进程的隐患随依赖一并移除；后端手抄的 `ZONE_MAPS` 地图拓扑副本删除（该副本已发生漂移——`4j` 少了 7 条连线），前后端不再双份维护；2.4MB 的 `chi_sim.traineddata` 二进制移出仓库；word 合并逻辑整块删除。

**付出**：识别按次计费（免费额度 1000 次/月），因此**限流从优化项变成功能的一部分**，且需要全局月度硬上限保护额度；多了一个外部依赖，腾讯云 OCR 不可用时功能整体不可用（返回 502）。

**约束**：生产环境走内网端点 `ocr.internal.tencentcloudapi.com`（解析到 169.254.1.10 链路本地地址，不占公网带宽，实测延迟与公网持平）。该域名只在腾讯云 VPC 内解析，本地开发与 CI 必须用公网域名，故端点做成环境变量 `OCR_ENDPOINT_HOST`。**换端点必须同步改签名用的 host**，TC3 的规范请求串含 `host:` 头。
