---
last-verified: 2026-08-05
sources:
  - app/modules/Tool/BlackFlowMap/ScreenshotRecognizer.tsx
  - app/modules/Tool/BlackFlowMap/index.tsx
  - app/modules/Tool/BlackFlowMap/mapData.tsx
  - app/modules/Tool/BlackFlowMap/recognition/recognize.ts
  - app/modules/Tool/BlackFlowMap/recognition/compress.ts
  - app/modules/Tool/BlackFlowMap/recognition/ocrClient.ts
  - app/modules/Tool/BlackFlowMap/recognition/detectZone.ts
  - app/modules/Tool/BlackFlowMap/recognition/vocab.ts
  - app/modules/Tool/BlackFlowMap/recognition/grid.ts
  - app/modules/Tool/BlackFlowMap/recognition/blankNodes.ts
  - app/modules/Tool/BlackFlowMap/recognition/matchMap.ts
  - arkrog_backend/routers/mapRecognition.ts
  - arkrog_backend/utils/tencentApi.ts
  - arkrog_backend/middleware/rateLimit.ts
---

# 截图识别地图

用户上传一张游戏内地图截图，**一次云 OCR 调用同时判出层数（zone）与基底（mapId）**，命中后自动切过去。全部推理在前端完成，后端只做 OCR 签名转发。

功能默认对所有用户隐藏，控制台执行 `enableMapRecognizer()` 开启（写 localStorage `show-map-recognizer`），`disableMapRecognizer()` 关闭。入口在 `index.tsx`。

## 一、数据流

```
[前端] compressScreenshot()  长边 1600px + JPEG q85 → ~165KB
          │  同时保留压缩后的 canvas（后续像素运算复用，必须是同一张）
          ▼
       POST /map-recognition/ocr   application/octet-stream，JPEG 二进制
          ▼
[后端] 限流 → TC3 签名 → 腾讯云 GeneralBasicOCR → 裁剪响应 → { items: [{t,x,y,w,h}] }
          ▼
[前端] detectZone()      顶栏层名模糊子串匹配 → zone
       toNodeLabels()    词表匹配 → 节点标签 + 像素中心
       detectBlankNodes() canvas 逐像素 → 空白过路点
       fitAxis()         标定行列间距 → 每个节点吸附到格子
       matchCandidates() 该 zone 的候选基底逐一打分 → mapId + 可信度
```

后端**不接收 zone 参数**——层数由前端自行判定。后端也不解码图片、不做像素运算、不做匹配。

## 二、前端模块职责

| 文件                        | 职责                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `recognition/compress.ts`   | canvas 压缩。返回 `{ blob, canvas }`，canvas 供后续像素运算复用                    |
| `recognition/ocrClient.ts`  | 调后端代理。`OcrRequestError` 带 HTTP 状态码（429 = 限流）                         |
| `recognition/vocab.ts`      | 节点词表、编辑距离、`matchVocab`、`fuzzySubstringMatch`、`ANCHOR_LABELS`           |
| `recognition/detectZone.ts` | 层名 → zone；兜底链：层名 → 罗马数字 `(I)`~`(V)` → 返回 null 由 UI 让用户手选      |
| `recognition/grid.ts`       | `fitAxis` / `snapToAxis`                                                           |
| `recognition/blankNodes.ts` | 空白过路点（白圈黑点、无文字的节点）像素检测                                       |
| `recognition/matchMap.ts`   | `scoreOffset` / `rank` / `correctNodes` / `matchCandidates` / `computeMarginRatio` |
| `recognition/recognize.ts`  | 主流程编排 + `confidenceOf` + `toMarkableNodes`                                    |
| `ScreenshotRecognizer.tsx`  | UI 与三档呈现行为                                                                  |

候选基底直接从 `mapData.tsx` 的 `initialMaps` 按 `zone` 字段筛——`initialMaps` 每项已含 `rows`/`cols`/`start`/`ends`/`battleEnd`/`edges`，就是匹配算法需要的全部字段。**不存在第二份地图拓扑数据。**

## 三、后端接口契约

```
POST /map-recognition/ocr
Content-Type: application/octet-stream
Body: JPEG 二进制，≤ 400KB

200  { code: 0, data: { items: [{ t, x, y, w, h }, ...] } }
400  非 JPEG（按魔数 FF D8 FF 判） / 超过体积上限
429  限流或月度配额耗尽
502  上游 OCR 失败（附 upstreamCode，不透传原始报错文本）
```

`items` 只保留 `DetectedText` 与 `ItemPolygon` 的四个数，`Polygon`/`AdvancedInfo`/`WordCoordPoint` 全部丢弃——响应从 11KB 降到 2~3KB。

**限流**（`middleware/rateLimit.ts`，Redis 固定窗口）：

| 主体                | 每分钟 | 每天 |
| ------------------- | ------ | ---- |
| 匿名（按 IP）       | 2      | 10   |
| 已登录（按 userId） | 5      | 100  |

外加全局月度硬上限 `OCR_MONTHLY_QUOTA`（默认 900，保护腾讯云 1000 次/月免费额度）。

## 四、结果呈现的三档行为

按 `confidenceOf()` 的分档分流，依据是实测的分档正确率：

| 可信度   | 判据                      | 实测基底正确率    | 行为                            |
| -------- | ------------------------- | ----------------- | ------------------------------- |
| 高       | 越界 = 0 且 margin ≥ 2%   | **100%**（51 张） | 切层切图 + **自动填入节点**     |
| 中       | 越界 ≤ 1 且 margin ≥ 0.5% | 92.3%（13 张）    | 切图但不填节点，展示 Top-2 候选 |
| 低       | 其余                      | 88.9%（18 张）    | 同上                            |
| 无法确认 | 未检出任何锚点            | —                 | 同上                            |

`marginRatio = (best 得分 − 最高分的「不同基底」候选得分) / best 得分`，衡量的是**本次匹配有没有歧义**，不是识别有多准。

**Top-2 候选的交互**：用户点选后填入**该候选自己那套** `correctedNodes`（不同 offset 对应不同节点位置，不是共用第一名的），候选区保持展开允许反复切换对照，点「确认」才收起。

自动填入的节点由 `toMarkableNodes()` 挑选：只要坐标未经修正、非无解点、非结构性锚点的。用户可用侧边栏「清除已选节点」撤销。

**低密度提示**：网格填充密度 < 0.35 时顶部黄条提示「截图信息不足，请截取完整地图」。

## 五、关键不变量（改动前必读）

**`险路尽头` 是游戏内的显示状态，不是地图固有属性。** 未探明的出口会被遮蔽成「未知的诡秘」（图标也不同）。所以一张图能看到几个锚点取决于玩家进度——**不能用「检出锚点数 < 该 zone 应有数」来判断识别是否完整**。旧实现有过这个判据（`anchorCountShort`），对 zone_4（每图 3 个出口）100% 误触发。

**`fitAxis` 只能传文字节点的坐标。** 空白过路点检测有像素噪声，可能凭空造出一个多余的簇，而「簇数超上限就合并相邻最近两簇」的兜底会不分青红皂白地把两个真实行/列合并掉。空白点只用标定好的间距「对号入座」。

**`unitPitch` 取相邻簇间距的中位数**，不是平均或最小值——中间几列整个漏检时，实测间距会是单格间距的整数倍，中位数能让这些大间隙不污染标定。

**送去 OCR 的图与做像素运算的 canvas 必须是同一张。** `compressScreenshot` 一次返回两者就是为此；OCR 返回的坐标在压缩后的坐标系里，用原图 canvas 会整体错位。

**`rank()` 里 anchorRate 的分母是「本图总共检测到几个锚点」**，不是各候选自己的 `anchorTotal`——否则某候选的偏移让一个真实锚点越界时，它的 `anchorTotal` 会同步减少，导致「只解释对一半锚点」的候选反而拿到 100% 命中率。

**后端换 OCR 端点必须走 `callTencentApi` 的 `host` 参数。** TC3 签名的规范请求串包含 `host:` 头，只改最终请求 URL 会导致签名校验失败。生产用内网端点 `ocr.internal.tencentcloudapi.com`（解析到 169.254.1.10，不占公网带宽），该域名只在腾讯云 VPC 内解析，故默认值必须是公网域名。

## 六、实测基线

82 张真实样张（文件名自带 ground truth，如 `zone4_c_2.png` → zone_4 / 基底 4c）：

| 指标                              | 结果                                                |
| --------------------------------- | --------------------------------------------------- |
| OCR 成功率                        | 82/82                                               |
| 层数识别                          | **82/82 = 100%**                                    |
| 基底识别（单次调用，无抢救 pass） | **79/82 = 96.3%**                                   |
| Top-2 命中                        | **82/82 = 100%** —— 判错的 3 张正确答案全排第 2     |
| 压缩 1600px + q85                 | 检出与原图零损失，上传 220~280KB（原图最大 8.78MB） |
| 单次耗时                          | 压缩后 0.6~1.6s                                     |
| 每图节点检出                      | 平均 17.8                                           |

判错的 3 张：`zone2_b_2`→2d（margin 0.10%）、`zone5_a_3`→5h（margin 0.21%，密度仅 22%）、`zone5_i_2`→5f（margin 0.68%）。**三张的可信度分档都不是「高」**，即系统不会自信地给出错误答案。

## 七、有意不做的事

**抢救识别（rescue pass）没有实现。** 旧方案在主识别之外逐个「空洞」裁图放大再 OCR（最多 25 次额外调用）。换云 OCR 后实测只有 5/82 会触发、且这批已有 80% 正确率，而远程 OCR 下每次抢救都是计费调用 + 网络往返，性价比不成立。若未来要做，正确形态是把 N 个洞的裁图拼成一张 sprite sheet 一次识别，而不是逐个调用。

**没有调 `rank()` 的打分权重。** 扫过 `outOfBounds` 惩罚系数 0~1000：500→100 只多对 1 张（79→80），而 Top-2 命中率在整个区间恒为 100%。为一张图去动一个在其余 79 张上都正常的系数是对 82 样本的过拟合；展示候选是结构性解法。

## 八、相关

- 决策背景（为什么是云 OCR + 前端推理）：[adr/0001-cloud-ocr-frontend-inference.md](adr/0001-cloud-ocr-frontend-inference.md)
- 部署与环境变量：[../../../../../docs/deployment-env-matrix.md](../../../../../docs/deployment-env-matrix.md)
