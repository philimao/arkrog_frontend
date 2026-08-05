# 黑流树海地图识别 —— 新工作流落地方案

> 状态：设计完成，待实施
> 前置验证：见文末「已验证事实」，均为 82 张真实样张实测
> 本文档描述的是**重新设计的方案**，不兼容现有 tesseract 实现，实施时整体替换

## 一、目标与约束

把地图截图识别从「后端跑 OCR」改成「云 OCR + 前端推理」，达成：

| 目标 | 手段 |
|---|---|
| 服务器不承担计算 | OCR 交给腾讯云，后端只做签名转发 |
| 不产生 CDN 负担 | 不下发 wasm / 语言包，前端只多几 KB 逻辑代码 |
| 减少 OCR 调用次数 | 单次调用同时得出层数与基底；抢救识别改为拼图单次调用 |
| 控制带宽与成本 | 前端压缩到 ~165KB；走腾讯云内网端点；响应裁剪 |
| 免用户手选层数 | 从截图顶栏层名直接判定 |

## 二、架构

```
┌─ 前端 ────────────────────────────────────────────────┐
│  1. canvas 压缩：长边 1600px + JPEG q85  → ~165KB      │
│                          │                             │
│                          ▼                             │
│                 POST /map-recognition/ocr              │
└──────────────────────────┼─────────────────────────────┘
                           ▼
┌─ 后端（纯代理，CPU≈0）──────────────────────────────────┐
│  鉴权 → 限流 → TC3 签名 → 169.254.1.10（内网端点）      │
│  → 裁剪响应（11KB → 3KB）→ 返回                         │
└──────────────────────────┼─────────────────────────────┘
                           ▼
┌─ 前端本地推理（零额外调用）────────────────────────────┐
│  2. 层名模糊匹配         → zone                        │
│  3. 词表匹配             → 节点标签 + 坐标             │
│  4. fitAxis              → 行列间距标定                │
│  5. canvas getImageData  → 空白过路点                  │
│  6. 候选基底打分         → mapId + 置信度              │
│                          │                             │
│  7. 仅当「零锚点」或「密度<35%」（实测 10%）：          │
│     裁洞 → 拼 sprite sheet → 再走一次代理 → 回填       │
└────────────────────────────────────────────────────────┘
```

**调用次数**：正常 1 次，需抢救时 2 次，平均 1.1 次/识别。

## 三、后端设计

### 3.1 接口契约

```
POST /map-recognition/ocr
Content-Type: application/octet-stream
Body: JPEG 二进制（不用 base64，省 27% 入站流量；app.ts 已配 bodyParser.raw）

200  { code: 0, data: { items: [{ t, x, y, w, h }, ...] } }
400  非 JPEG / 超过体积上限
401  未登录（若启用登录要求）
429  触发限流，附 Retry-After
502  上游 OCR 失败（附腾讯云错误码，不透传原始报错文本）
```

`items` 字段说明（下游只需要这五个值，其余全部丢弃）：

| 字段 | 含义 |
|---|---|
| `t` | `DetectedText`，已去空白 |
| `x`,`y` | `ItemPolygon` 左上角 |
| `w`,`h` | `ItemPolygon` 宽高 |

丢弃 `Polygon`、`AdvancedInfo`、`WordCoordPoint`、`Words`、`Confidence` —— 实测响应从 11KB 降到 3KB。

### 3.2 端点与签名

```
# .env.production
OCR_ENDPOINT_HOST=ocr.internal.tencentcloudapi.com
OCR_REGION=ap-beijing

# 默认值（本地开发 / CI）
OCR_ENDPOINT_HOST=ocr.tencentcloudapi.com
```

**关键：TC3 的规范请求串包含 `host:` 头，换端点必须让签名使用的 host 同步改成内网域名**，否则签名校验失败。不是简单替换 URL。

内网端点只在腾讯云 VPC 内解析（`169.254.1.10`），本地开发必须走公网域名，因此端点做成环境变量而非硬编码。

签名实现放 `utils/tencentApi.ts`，通用 TC3 签名函数，供 OCR 及后续其他云 API 复用。

### 3.3 鉴权与限流

这个接口每次调用直接产生费用，限流是硬要求，不是优化项。

**建议：允许匿名 + 分级限流**。地图工具是面向所有玩家的公共工具，强制登录会显著劝退；但匿名额度要收紧。

| 主体 | 每分钟 | 每天 |
|---|---|---|
| 匿名（按 IP） | 2 | 10 |
| 已登录（按 userId） | 5 | 100 |

外加**全局月度硬上限**（默认 900，可配）保护免费额度：达到阈值后接口直接返回 429 并附友好提示，同时打日志告警。计数用现成的 Redis，key 形如 `ocr:quota:{yyyy-MM}`、`ocr:rate:{ip|uid}:{窗口}`。

体积上限 400KB（正常载荷 165KB，留 2.4 倍余量）。超限返回 400，提示前端压缩环节出了问题。

### 3.4 后端不再做的事

- 不解码图片、不做任何像素运算
- 不接收 `zone` 参数（层数由前端从 OCR 结果自行判定）
- 不做词表匹配、网格标定、基底打分

## 四、前端设计

### 4.1 文件结构

```
app/modules/Tool/BlackFlowMap/
├── recognition/
│   ├── types.ts          识别相关类型
│   ├── compress.ts       canvas 压缩
│   ├── ocrClient.ts      调后端代理
│   ├── vocab.ts          NODE_VOCAB / editDistance / matchVocab / fuzzySubstringMatch
│   ├── detectZone.ts     层名 → zone
│   ├── grid.ts           fitAxis / snapToAxis
│   ├── blankNodes.ts     空白过路点（canvas 版）
│   ├── rescue.ts         sprite sheet 拼图与坐标反查
│   └── recognize.ts      主流程编排
├── ScreenshotRecognizer.tsx   UI（改：不再传 zone，展示识别出的 zone）
└── mapData.tsx                initialMaps 保持唯一数据源
```

### 4.2 各模块要点

**compress.ts**
```ts
async function compressScreenshot(file: File): Promise<{ blob: Blob; canvas: HTMLCanvasElement }>
```
用 `createImageBitmap`（自动处理 EXIF 方向）→ 长边缩到 1600 → `canvas.toBlob("image/jpeg", 0.85)`。
**同时返回 canvas**：后续空白点检测和抢救裁图都要复用它，避免二次解码。

**detectZone.ts**
```ts
function detectZone(items: OcrItem[], zones: ZoneData[]): { zone: string; confidence: number } | null
```
层名直接取 `ZoneData.name`（gameData 已有，不写死）。用**滑动窗口模糊子串匹配**而非整段编辑距离——实测层名常粘着 UI 噪声（`"FPs受害者腐殖2℃"`），整段匹配会被噪声长度拖累失配，滑窗后 82/82 全中。

兜底链：层名匹配 → 罗马数字 `(I)`~`(V)` → 让用户手选。

**blankNodes.ts**
Jimp `bitmap.data` 换成 `ctx.getImageData().data`，**逐像素判据、连通域 flood fill、尺寸/长宽比/填充率过滤全部逻辑不变**。阈值全部相对 `medianCharWidth`，理论上对分辨率自适应。

**rescue.ts**
```ts
function buildSpriteSheet(canvas, holes, pitch): { sheet: Blob; tiles: TileMap[] }
function mapBackToHoles(items: OcrItem[], tiles: TileMap[]): HoleResult[]
```
把 N 个洞（≤25）裁出后拼成网格，**瓦片之间留足黑边**（≥1 个字宽），防止 OCR 把相邻瓦片的文字连成一行。每块记录 `{holeRow, holeCol, sheetX, sheetY, w, h}`，回来后按检测框中心落在哪块瓦片反查。

单块裁剪尺寸沿用现有推导：`halfW = max(medianCharWidth * 4.5, unitPitch * 0.65)`，`0.65 > 0.5` 让相邻裁框重叠，防止网格标定有半格误差时文字被从中间切开。

**recognize.ts** 主流程
```ts
async function recognizeMap(file: File, zones: ZoneData[]): Promise<RecognizeResult>
```
```
1. { blob, canvas } = compressScreenshot(file)
2. items = await postOcr(blob)
3. zone = detectZone(items, zones)          // 失败 → 要求用户手选
4. labels = items.map(matchVocab).filter()  // 节点标签 + 中心坐标
5. blanks = detectBlankNodes(canvas, bounds, medianCharWidth)
6. { colAxis, rowAxis } = fitAxis(labels)   // 只用文字节点标定，空白点不参与
7. gridNodes = snap(labels ∪ blanks)
8. if (shouldRescue) {
     holes = findHoles(gridNodes, axes)
     { sheet, tiles } = buildSpriteSheet(canvas, holes, pitch)
     gridNodes ∪= mapBackToHoles(await postOcr(sheet), tiles)
   }
9. candidates = initialMaps.filter(m => m.zone === zone)
10. best = rank(scoreOffset(gridNodes, candidates))
11. return { zone, mapId: best.id, confidence, correctedNodes }
```

### 4.3 结果呈现的三档行为

识别完成后按可信度分流，依据是实测的分档正确率（高档 51 张 **100%**、中 92.3%、低 88.9%）：

| 可信度 | 行为 |
|---|---|
| 高 | 直接切层切图 + **自动填入节点**（`toMarkableNodes`：只填坐标未经修正、非结构性锚点的节点） |
| 中 / 低 / 无法确认 | 切图但**不填节点**，改为展示 **Top-2 候选**（各带小地图预览）。用户点选后填入该候选自己那套节点，**候选区保持展开**允许反复切换对照，点「确认」才收起 |

展示 Top-2 而不是调打分参数，依据是：判错的 3 张里正确答案**全部排第 2**，且该结论与 `outOfBounds` 惩罚系数无关（扫 0~1000，Top-2 命中率恒为 100%）。调参把 500 改成 100 只多对 1 张，在 82 样本上属于噪声，不值得为此改动一个在其余 79 张上都正常的系数。

另外网格填充密度低于 **0.35** 时顶部给黄条提示「截图信息不足，请截取完整地图」——该阈值实测把正确率 80% 与 97.4% 两组分开。

### 4.4 抢救触发判据（**与旧实现不同**）

```ts
const shouldRescue = !hasAnchor || occupiedRatio < 0.35;
```

**去掉 `anchorCountShort`。** 旧实现要求「检出锚点数 ≥ 该 zone 应有数」，但实测证明 `险路尽头` 不是地图固有属性而是**游戏内显示状态**——未探明的出口渲染成「未知的诡秘」，图标都不同。zone_4 每图 3 个出口却常只显示 1~2 个，该判据会 100% 误触发且抢救永远救不回来（字根本不在图上）。

去掉后触发率从 24/82 (29%) 降到 8/82 (10%)。

### 4.4 数据来源统一

`ZONE_MAPS` 不再存在。候选基底直接从 `initialMaps` 按 `zone` 字段筛选——`initialMaps` 每项已含 `zone`/`rows`/`cols`/`start`/`ends`/`battleEnd`/`edges`，就是匹配算法需要的全部字段。

这消除了后端手抄一份地图拓扑的隐患（现存副本已漂移：`4j` 少了 7 条连线）。

## 五、分阶段实施

| 阶段 | 内容 | 状态 |
|---|---|---|
| **0** | 端到端准确率验证（缓存 OCR + 文件名 ground truth 离线跑，零成本） | ✅ **79/82 = 96.3%** |
| 1 | 后端 `utils/tencentApi.ts` + `/map-recognition/ocr` + Redis 限流 | ✅ 已完成 |
| 2 | 前端 `recognition/` 全套 + 主流程（不含抢救） | ✅ 已完成 |
| 3 | 抢救 sprite sheet | ⏸ 见第九节，价值存疑 |
| 4 | 清理旧实现（见第七节） | ✅ 已完成 |
| 5 | 部署 + 灰度 | 待做 |

上线沿用现有的 localStorage feature flag 灰度（控制台 `enableMapRecognizer()`），验证稳定后再移除开关。

### 部署前必做

1. 生产 `.env` 加 `OCR_ENDPOINT_HOST=ocr.internal.tencentcloudapi.com` 与 `OCR_REGION=ap-beijing`（不加会走公网域名，功能正常但占公网带宽）
2. 确认 nginx **覆盖**而非透传客户端的 `X-Real-IP` / `X-Forwarded-For`，否则匿名限流可被伪造头绕过
3. 确认生产密钥有 `ocr:GeneralBasicOCR` 权限（开发密钥已授 `QcloudOCRFullAccess`）
4. 本地无 Redis，限流逻辑尚未实跑，首次部署到 dev 后手工验一次 429

## 六、验证计划

| 项 | 方法 | 通过标准 |
|---|---|---|
| 端到端基底准确率 | 82 份缓存 OCR + 文件名 ground truth 离线跑 | ✅ **79/82 = 96.3%**（单次调用，无抢救） |
| 层数识别 | 同上 | ✅ 已验证 82/82 |
| 压缩无损 | 已验证 4 张 × 3 档宽度 | ✅ 1600px 检出持平 |
| 空白点检测在 1600px 下 | 82 张全量跑，原图 vs 压缩图对比端到端准确率 | ✅ **均为 79/82，压缩不影响** |
| 前端模块移植保真度 | 前端模块跑 82 份缓存，与参考实现逐图对比 | ✅ **完全一致**（同样 3 张判错、margin 相同） |
| 浏览器端真实链路 | dev server + 真实截图 + 桩 OCR | ✅ 层数/基底/可信度均正确，上传 137KB 二进制，1 次调用 |
| sprite sheet 抢救 | 挑触发抢救的样张实跑 | **未做**（见第九节，价值存疑） |
| 限流与配额 | 单测 + 手工压测 | **未做**（本地无 Redis） |

## 七、清理清单

**后端删除**
- `utils/mapRecognition/matchMap.ts`（631 行）
- `utils/mapRecognition/blankNodes.ts`
- `utils/mapRecognition/zoneMaps.ts`
- `utils/mapRecognition/tessdata/chi_sim.traineddata`（2.4MB 二进制）
- `package.json` 移除 `tesseract.js`（**`jimp` 保留**，`utils/autochess-detector/` 与 `scripts/autochess/` 大量使用）
- `pnpm-workspace.yaml` 的 `allowBuilds` 移除 `tesseract.js`

**前端修改**
- `ScreenshotRecognizer.tsx`：移除 `zone` 入参与传参，改为展示识别出的层数

**顺带解决的历史问题**
- tesseract worker 跨图复用导致 wasm `memory access out of bounds`、且异常在 worker 线程 `process.nextTick` 抛出、`try/catch` 接不住、**直接杀进程** —— 随 tesseract 一并移除
- 后端 `ZONE_MAPS` 与前端 `initialMaps` 双份维护及已发生的漂移

## 八、已验证事实

全部基于 `D:\repo\arkrog\tmp\samples` 的 82 张真实样张（文件名自带 ground truth）。

| 事实 | 数据 |
|---|---|
| 腾讯云 GeneralBasicOCR 可用性 | 82/82 成功，零失败 |
| 节点检出 | 平均 17.8/图（zone_3/4/5 约 20） |
| 标签形态 | **整段返回、置信度 100**，无需 word 合并逻辑 |
| 层数识别 | **82/82 (100%)**（模糊子串匹配） |
| 压缩 1600px + q85 | 检出零损失，上传 220~280KB（原图最大 8.78MB） |
| 抢救触发率 | 修正判据后 8/82 (10%) |
| 内网端点 | 服务器 `ins-n4p381cz` @ ap-beijing，`ocr.internal.tencentcloudapi.com` → `169.254.1.10`，**真实签名请求 HTTP 200、43 段、0.64s** |
| 内网 vs 公网延迟 | 持平（46ms vs 47ms 空请求） |
| `险路尽头` 语义 | **显示状态而非地图属性**，未探明时渲染为「未知的诡秘」（图标亦不同） |

## 九、未决事项

1. **客户端上行阻塞**：165KB 上传对服务器入站是小量，但并发上传是否影响站点其他请求未评估。带宽不额外计费，故暂缓；若上线后观察到影响，可用 COS 直传 + OCR `ImageUrl` 把图片流量完全移出后端（腾讯云 OCR 支持 `ImageUrl`，现有 COS/STS 基建可复用，需另建窄口径 STS + 桶生命周期清理）。
2. **抢救 pass 是否值得做**：阶段 0 实测下，去掉 `anchorCountShort` 后只有 5/82 会触发抢救，且这 5 张的正确率已有 80%。为 6% 的样本引入 sprite sheet 拼图 + 坐标反查 + 第二次调用这一整套复杂度，收益上限很有限。建议先上线观察真实数据，确有需要再补。
3. ~~空白点检测在压缩图上的准确性~~ —— 已验证：82 张全量对比，原图与 1600px 压缩图的端到端准确率同为 79/82，压缩不影响。
