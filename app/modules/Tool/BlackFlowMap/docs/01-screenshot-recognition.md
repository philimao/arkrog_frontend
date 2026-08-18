---
last-verified: 2026-08-10
sources:
  - app/modules/Tool/BlackFlowMap/ScreenshotRecognizer.tsx
  - app/modules/Tool/BlackFlowMap/FloatingPreview.tsx
  - app/modules/Tool/BlackFlowMap/index.tsx
  - app/modules/Tool/BlackFlowMap/mapCanvas.tsx
  - app/modules/Tool/BlackFlowMap/mapData.tsx
  - app/modules/Tool/BlackFlowMap/recognition/recognize.ts
  - app/modules/Tool/BlackFlowMap/recognition/compress.ts
  - app/modules/Tool/BlackFlowMap/recognition/ocrClient.ts
  - app/modules/Tool/BlackFlowMap/recognition/shadowReport.ts
  - app/modules/Tool/BlackFlowMap/recognition/detectZone.ts
  - app/modules/Tool/BlackFlowMap/recognition/vocab.ts
  - app/modules/Tool/BlackFlowMap/recognition/grid.ts
  - app/modules/Tool/BlackFlowMap/recognition/blankNodes.ts
  - app/modules/Tool/BlackFlowMap/recognition/matchMap.ts
  - arkrog_backend/routers/mapRecognition.ts
  - arkrog_backend/utils/tencentApi.ts
  - arkrog_backend/utils/localOcr.ts
  - arkrog_backend/middleware/rateLimit.ts
---

# 截图识别地图

用户上传一张游戏内地图截图，**一次 OCR 调用同时判出层数（zone）与基底（mapId）**，命中后自动切过去并把识别到的节点填进去。全部推理在前端完成，后端只负责把图送去 OCR 并归一化响应。

OCR 由**自建的本地服务**（RapidOCR / PP-OCRv6_small，见 [ADR-0003](adr/0003-self-hosted-local-ocr.md)）承担，云 OCR 整条降级链退为兜底。

功能对所有用户可见，区块自身可收起/展开。

## 一、数据流

```
[前端] compressScreenshot()  长边 1600px + JPEG q85 → ~165KB
          │  同时保留压缩后的 canvas（后续像素运算复用，必须是同一张）
          ▼
       POST /map-recognition/ocr   application/octet-stream，JPEG 二进制
          ▼
[后端] 限流 → 本地 OCR（链首）；失败则按策略链签名转发云端（见 3.1）
              → 归一化响应 → { items: [{t,x,y,w,h}] }
          ▼
[前端] detectZone()      顶栏层名模糊子串匹配 → zone
       toNodeLabels()    词表匹配 → 节点标签 + 像素中心
       detectBlankNodes() canvas 逐像素 → 空白过路点
       fitAxis()         标定行列间距 → 每个节点吸附到格子
       matchCandidates() 该 zone 的候选基底逐一打分 → mapId + 可信度
```

后端**不接收 zone 参数**——层数由前端自行判定。后端也不解码图片、不做像素运算、不做匹配。

## 二、模块职责

| 文件                        | 职责                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `recognition/compress.ts`   | canvas 压缩。返回 `{ blob, canvas }`，canvas 供后续像素运算复用                                       |
| `recognition/ocrClient.ts`  | 调后端代理。`OcrRequestError` 带状态码与 `exhausted` 标志                                             |
| `recognition/vocab.ts`      | 节点词表、编辑距离、`matchVocab`、`fuzzySubstringMatch`、`ANCHOR_LABELS`                              |
| `recognition/detectZone.ts` | 层名 → zone；兜底链：层名 → 罗马数字 `(I)`~`(V)` → 返回 null 由 UI 让用户手选                         |
| `recognition/grid.ts`       | `fitAxis` / `snapToAxis`                                                                              |
| `recognition/blankNodes.ts` | 空白过路点（白圈黑点、无文字的节点）像素检测                                                          |
| `recognition/matchMap.ts`   | `scoreOffset` / `rank` / `matchPercentOf` / `correctNodes` / `matchCandidates` / `computeMarginRatio` |
| `recognition/recognize.ts`  | `inferFromItems`（**纯函数**：items + 画布 → 结论）+ 主流程编排 + `confidenceOf` + `toMarkableNodes`                                                       |
| `recognition/shadowReport.ts` | 灰度对照上报（见 3.2），灰度结束即可整个删掉                                                          |
| `ScreenshotRecognizer.tsx`  | 上传交互（点击/拖拽/粘贴）、识别结果展示、候选列表                                                    |
| `FloatingPreview.tsx`       | 主预览滚出视野时浮出的截图小窗，可拖动/缩放/最小化                                                    |
| `index.tsx`                 | 节点标记的落盘与冲突处理、基底/区域上的识别标记、覆盖合并弹窗                                         |

候选基底直接从 `mapData.tsx` 的 `initialMaps` 按 `zone` 字段筛——`initialMaps` 每项已含 `rows`/`cols`/`start`/`ends`/`battleEnd`/`edges`，就是匹配算法需要的全部字段。**不存在第二份地图拓扑数据。**

## 三、后端接口契约

```
POST /map-recognition/ocr
Content-Type: application/octet-stream
Body: JPEG 二进制，≤ 400KB

200  { code: 0, data: { items: [{ t, x, y, w, h }, ...], strategy: { account, action }, ms } }
     strategy.account 为 "local" 即由自建服务承担；开了影子还会有 data.shadow（见 3.2）
400  非 JPEG（按魔数 FF D8 FF 判） / 超过体积上限
429  限流；或 exhausted:true 表示本月全部免费额度已用尽
502  上游 OCR 失败（附 upstreamCode，不透传原始报错文本）
```

`items` 是归一化后的文本+外接矩形，原始响应里的其余字段全部丢弃——响应从 11KB 降到 2~3KB。`strategy` 标明本次由哪条策略服务，仅供诊断。

**限流**（`middleware/rateLimit.ts`，Redis 固定窗口）：

| 主体                | 每分钟 | 每天 |
| ------------------- | ------ | ---- |
| 匿名（按 IP）       | 2      | 10   |
| 已登录（按 userId） | 5      | 100  |

它当初防的是「一个人刷光全站共享的**云端**免费额度」；本地无额度、只有 CPU，这条理由已弱化，待单独评估。**没有全局月度硬上限**——账号已关闭后付费，额度耗尽时上游直接拒绝，自设闸门是多余的。

### 3.1 链首是本地服务，云端是兜底

`OCR_LOCAL_FIRST=1` 时先打自建的本地 OCR 服务；**任何失败都静默回落**到云端策略链，用户无感。删掉这个环境变量并重启即整体回到纯云端，不必改代码或重新部署。

本地**刻意不作为 `OCR_STRATEGIES` 的一项**：它没有账号、没有按月额度、不该参与 dead 标记；更要紧的是往数组里插一项会让所有下标位移，而 Redis 游标 `rl:ocr:cursor:*` 存的正是下标。

**熔断**（`rl:ocr:local:open`，连续 3 次失败熔断 60 秒）：影子期本地挂了没人受影响，当上链首之后每挂一次都会让一个用户白等，不能让所有人都去踩同一个坑。本地主力的超时（`OCR_LOCAL_TIMEOUT_MS`，默认 5000）**比影子期短** —— 影子超时只丢一条观测数据，主力超时是用户纯白等的时间，之后还要再走一遍云端。

云端那条链本身不变：免费额度按接口分别计算，所以把可用接口排成一条降级链（`utils/ocrStrategies.ts`，按实测准确率降序），某条被上游告知额度耗尽就自动降到下一条。接口清单与准确率见 [ADR-0002](adr/0002-multi-account-multi-action-ocr-chain.md)。**`exhausted` 现在意味着「本地不可用**且**云端全月耗尽」**，比接入本地前罕见得多。

**降级判据是上游的错误码，不是自己的调用计数**——本地计数只覆盖自己发出的请求，跟账号真实用量必然有偏差，拿它当判据会误降级或漏降级。错误码分类见 `classifyOcrError`；判定耗尽用的码取自官方文档但尚未在真实耗尽场景下验证过，故另有正则兜底，未识别的码会打 WARN 日志便于补充。

Redis 状态（都在 `rl:` 前缀下，**已被 `app.ts` 的启动清缓存豁免**，重启不丢）：

| 键                    | 作用                                           |
| --------------------- | ---------------------------------------------- |
| `rl:ocr:cursor:*`     | 当前可用策略下标，命中即前移，避免每次从头试起 |
| `rl:ocr:dead[-day]:*` | 耗尽标记，按月/按日过期，直接跳过              |
| `rl:ocr:used:*`       | 调用计数，仅供观测，不参与判据                 |

单次请求最多真打 3 次上游，防止一条链走到底把延迟拖爆。

多账号可选：配置 `SECRET_ID_2` / `SECRET_KEY_2` 后链长翻倍，未配置时相关策略静默跳过，不影响功能。

### 3.2 影子对照（`OCR_SHADOW=1`，默认关闭）

切换主次之前用过的对照机制，留着以备将来再换引擎。开启后会与权威路径**并发**打一份本地识别放进 `data.shadow`，前端拿它用**同一张画布**再调一次 `inferFromItems`，把层数/基底/可信度档位的差异 POST 到 `/map-recognition/shadow-report`，聚合进 Redis 哈希 `rl:ocr:shadow:{月份}`。不上传图片，不带用户标识。

差异必须在前端比 —— 两边的分歧不在 OCR 文本层面，而在跑完识别管线之后的**结论**。

⚠️ **本地已是链首之后不要开它**：影子打的也是本地服务，开了等于对同一张图打两遍本地。

## 四、结果呈现

### 4.1 无条件自动填入

识别成功后**不分可信度档位，一律切层切图并填入节点**。可信度只决定「要不要展示候选列表」：

```ts
function isAmbiguous(result) {
  return result.confidence.tone !== "high" && result.topCandidates.length > 1;
}
```

> ⚠️ 这是有意的取舍：中低档基底正确率 92.3% / 88.9%，**基底一旦选错，那一批自动填入的节点会整体错位**（平均约 16 个）。防错不靠「没把握就不填」，而靠 4.2 的可辨识 + 可撤销机制与 Top-2 候选。要加回门槛，判据在 `ScreenshotRecognizer.tsx` 调 `onMatched` 处。

### 4.2 节点标记的两层模型

`index.tsx` 对每个基底各存两份（都是 `ByMap` 版本，**切基底不丢**）：

| 状态                        | 含义                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `markedNodesByMap[mapId]`   | 最终展示的标记，用户手改会写这里                             |
| `detectedNodesByMap[mapId]` | **本次识别产出的基线**，只记"这次识别出了什么"，不掺用户手改 |

由二者推出的派生量：

- `autoFilledKeys` = 两份取值相同的格子 → 即"这格是自动填的"，可一键隐藏（`autoFilledHiddenByMap`，纯展示，不删数据）
- `hasUserMarkedNodes(mapId)` = 存在 `marked[key] !== detected[key]` 的格子 → 即"这个基底上有用户自己的东西"

### 4.3 覆盖 / 合并

识别结果要落到一个**已经有用户手填节点**的基底上时，弹窗强制二选一：

- **合并**（`applyDetectedNodes` 的默认 mode）：用户层压在识别层之上，用户手动标过的格子不被识别结果盖掉
- **覆盖**：不管原来是什么，一律换成这次识别的结果

### 4.4 候选的静默预填

识别结果一出来，**所有候选（不只第一名）各自的节点都会预填一份**，这样用户直接点基底缩略图切过去也能立刻看到识别结果，不必非得先点候选按钮。

但预填不能替用户做冲突决定：若某候选基底本身已有用户手填节点，预填会被推迟到 `pendingCandidateDetections`，等用户**真的切过去**时再弹跟主结果一样的覆盖/合并弹窗。

用户选「没有正确地图，取消」时，`onCancel` 会带出本次涉及的**全部**候选 mapId，外层逐个清干净——否则静默预填过的那些基底会留下孤儿标记。

### 4.5 其它呈现

- **匹配度百分比**：候选列表与基底缩略图上显示 `matchPercentOf()`（格子命中率与连线命中率的均值），按 85/70 分档上色（`percentTone`）。**刻意不用 `rank()` 的排序分**——那里掺了越界惩罚等只在候选间比较才有意义的项，数值本身不能读作"这张图有多像"。
- **区域选择条与基底缩略图**上会画出本次识别的候选标记；这份状态跟着识别结果走，切区域/切基底都不清，只有「清除图片」才清。
- **基底缩略图的黄色角标**标记用户改过的基底。
- **低密度提示**：网格填充密度 < 0.35 时提示「截图信息不足，请截取完整地图」。
- **截图浮窗**：主预览完全滚出可视范围时浮出小窗继续展示截图，可拖动/缩放/最小化；主预览重新进入视野即消失。覆盖/合并弹窗打开期间用 `suppressFloatingPreview` 压住，不跟弹窗抢注意力。

## 五、关键不变量（改动前必读）

**`险路尽头` 是游戏内的显示状态，不是地图固有属性。** 未探明的出口会被遮蔽成「未知的诡秘」（图标也不同）。所以一张图能看到几个锚点取决于玩家进度——**不能用「检出锚点数 < 该 zone 应有数」来判断识别是否完整**，这个判据对每图 3 个出口的 zone_4 会 100% 误触发。

**`fitAxis` 只能传文字节点的坐标。** 空白过路点检测有像素噪声，可能凭空造出一个多余的簇，而「簇数超上限就合并相邻最近两簇」的兜底会不分青红皂白地把两个真实行/列合并掉。空白点只用标定好的间距「对号入座」。

**`unitPitch` 取相邻簇间距的中位数**，不是平均或最小值——中间几列整个漏检时，实测间距会是单格间距的整数倍，中位数能让这些大间隙不污染标定。

**送去 OCR 的图与做像素运算的 canvas 必须是同一张。** `compressScreenshot` 一次返回两者就是为此；OCR 返回的坐标在压缩后的坐标系里，用原图 canvas 会整体错位。

**`rank()` 里 anchorRate 的分母是「本图总共检测到几个锚点」**，不是各候选自己的 `anchorTotal`——否则某候选的偏移让一个真实锚点越界时，它的 `anchorTotal` 会同步减少，导致「只解释对一半锚点」的候选反而拿到 100% 命中率。

**`detectedNodesByMap` 是识别基线，不要拿它跟用户手改合并后再写回。** 4.2 的两个派生量（哪些是自动填的、这个基底有没有用户的东西）全靠"识别基线保持纯净"才成立；一旦把用户手改混进去，隐藏功能和覆盖/合并弹窗都会失准。

**后端换 OCR 端点必须走 `callTencentApi` 的 `host` 参数。** TC3 的规范请求串包含 `host:` 头，只改最终请求的 URL 会导致签名校验失败。生产用内网端点 `ocr.internal.tencentcloudapi.com`（解析到 169.254.1.10，不占公网带宽），该域名只在腾讯云 VPC 内解析，故默认值必须是公网域名。

## 六、实测基线

82 张真实样张（文件名自带 ground truth，如 `zone4_c_2.png` → zone_4 / 基底 4c），核实于 2026-08-05：

| 指标                              | 结果                                                |
| --------------------------------- | --------------------------------------------------- |
| OCR 成功率                        | 82/82                                               |
| 层数识别                          | **82/82 = 100%**                                    |
| 基底识别（单次调用，无抢救 pass） | **79/82 = 96.3%**                                   |
| Top-2 命中                        | **82/82 = 100%** —— 判错的 3 张正确答案全排第 2     |
| 压缩 1600px + q85                 | 检出与原图零损失，上传 220~280KB（原图最大 8.78MB） |
| 单次耗时                          | 压缩后 0.6~1.6s                                     |
| 每图节点检出                      | 平均 17.8                                           |

分档正确率：**高 100%（51 张）/ 中 92.3%（13 张）/ 低 88.9%（18 张）**。判错的 3 张 margin 分别是 0.10% / 0.21% / 0.68%，**没有一张落在「高」档**——即系统不会自信地给出错误答案。

自动填入的节点质量：非锚点节点里 99.1% 通过 `toMarkableNodes` 的过滤，同格冲突 0 处，地图数据里的固定作战位 37/37 全部标对。

换 OCR 引擎时用同一套脚手架重测即可（直接调 `inferFromItems`，与线上同一条代码路径）：[tools/ocr-eval](../../../../../tools/ocr-eval/README.md)。自建本地引擎实测 **80/82 = 97.6%**，高于云端。

## 七、有意不做的事

**没有「抢救识别」**——即对识别不全的格子逐个裁图放大后重新 OCR。实测只有 5/82 会触发且这批本就有 80% 正确率，而云 OCR 下每次抢救都是一次额外调用与网络往返。若将来要做，应把多个待救区域拼成一张图一次识别，而不是逐个调用。

**没有调 `rank()` 的打分权重。** 扫过 `outOfBounds` 惩罚系数 0~1000，最优值也只多对 1 张，而 Top-2 命中率在整个区间恒为 100%——为一张图去动一个在其余 79 张上都正常的系数是过拟合，展示候选才是结构性解法。

## 八、相关

- 决策背景（为什么是云 OCR + 前端推理）：[adr/0001-cloud-ocr-frontend-inference.md](adr/0001-cloud-ocr-frontend-inference.md)
- 为什么要自建本地 OCR：[adr/0003-self-hosted-local-ocr.md](adr/0003-self-hosted-local-ocr.md)
- 部署与环境变量：[../../../../../docs/deployment-env-matrix.md](../../../../../docs/deployment-env-matrix.md)
