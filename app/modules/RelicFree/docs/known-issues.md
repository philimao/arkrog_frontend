---
last-verified: 2026-07-13
sources:
  - app/modules/RelicFree/Stage/index.tsx
  - app/modules/RelicFree/Stage/StageDetail.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/modules/RecordDisplay/index.tsx
  - app/modules/RecordDisplay/ReportModal.tsx
  - app/components/RecordCard/RecordCard.tsx
  - app/components/Modal/ContactUsModal.tsx
  - app/components/Character/Enemy/EnemyAvatar.tsx
  - app/modules/Home/Favorite/index.tsx
  - app/modules/Home/Message/index.tsx
  - app/modules/IndexPage/IndexRelicFree/index.tsx
  - app/stores/relicFreeStore.ts
  - app/stores/recordStore.tsx
  - app/stores/appDataStore.ts
  - app/routes/RelicFreeLayout.tsx
  - app/routes/GlobalModals.tsx
  - app/utils/record.ts
  - app/utils/tools.ts
  - arkrog_backend/routers/record.js
  - arkrog_backend/routers/user.js
  - arkrog_backend/routers/seed.js
  - arkrog_backend/routers/auditLog.js
  - arkrog_backend/routers/admin.js
  - arkrog_backend/routers/relic-free.js
  - arkrog_backend/app.ts
  - arkrog_backend/utils/record.js
  - arkrog_backend/utils/dataCache.js
  - arkrog_backend/utils/appData/db.js
  - arkrog_backend/utils/appData/stagePreview.js
  - arkrog_backend/utils/appData/stageEnemies.js
  - arkrog_backend/docs/Permission.md
  - docs/relic-free-doc-plan.md
---

# 已知问题登记簿（无藏收录）

本文是无藏收录模块的已知问题单一登记处，横跨前后端两仓库。每条问题都已于 `last-verified` 日期打开**现行代码**逐条核实——今日两个提交（前端 def7203、后端 790afd6）已经修掉了部分早期调研结论，本表以核实后的状态为准。

## 维护约定

1. **修复后同 PR 销项**：修掉某条问题的 PR 必须同时删除（或更新）本表对应行，不允许"先修代码、回头再改文档"。
2. **区分本地 HEAD 与线上部署**：本表所有"已确认"针对本地 HEAD 代码；线上服务器仍运行 `3b04de7`（2026-07-13 调研核查），凡标注"待部署"的行，线上行为以旧代码为准。部署完成后须同步更新对应行与 [07-ops-runbook.md](07-ops-runbook.md) 的线上现状段。
3. 处置定性取值：**bug 待修**（应该修，没人反对）；**已修待部署**（本地 HEAD 已修，线上未上）；**设计如此**（有意为之，链接对应 ADR 或正文文档）；**待决策**（修不修、怎么修需要人拍板）。
4. level 语义一律以 `arkrog_backend/docs/Permission.md` 为权威（0=VISITOR / 1=USER / 2=LINKED / 3=CONTENT_ADMIN / 4=ADMIN / 5=SU / 6=ROOT），不要按业务想象另起解释。

## 一、数据链路断裂与部署滞后

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| **写路径四处断裂（fc2f75f~790afd6 区间）**：①`persistStagePreview`/`persistStageEnemies` 调用被 fc2f75f（2025-11-14）移除的 `dataCacheManager.set` → 增量重算 100% TypeError 且被 `.catch(console.error)` 吞掉、admin 全量重算必 500；②`stagePreviewSingleUpdate` 以已删除的缓存读接口起步；③`stageEnemies.js` 从 `#routers/gamedata.js` 导入已迁移的 `processLevelData` → import 即抛错，`util-scripts/updateGameData.ts` 整体无法启动；④隐藏层：`processLevelData` 已变 async 未 await、`loadAppDataFromSource` 把 `camelToKebab` 函数当映射表下标访问恒 undefined | arkrog_backend/utils/appData/stagePreview.js 的 `stagePreviewSingleUpdate`/`persistStagePreview`；utils/appData/stageEnemies.js 的 `stageEnemiesUpdate`；utils/appData/db.js 的 `loadAppDataFromSource`；utils/dataCache.js 的 `DataCacheManager` | **本地 HEAD 已由 790afd6（2026-07-13）全部修复**：补公有 `set`（Redis 优先、内存保底）、`stagePreviewSingleUpdate` 改用 `getOrLoadAppData` 读取且单关更新时调用 `buildPreloadData` 重建 breadcrumb（调研预告的"增量更新丢面包屑"次级问题在同一提交内一并处理）、`stageEnemies.js` 改从 `#utils/gamedata/level.js` 导入并补 await、camelToKebab 下标误用修复 | 断裂期间：提交/删除记录后"最高难度最少人数"永不更新（前端 2 秒刷新契约落空，见 [adr/0006](adr/0006-settimeout-2000-refresh-contract.md)）、游戏数据更新脚本瘫痪 | **已修待部署 + 待回填**：线上仍跑 3b04de7，Mongo `Data.stage-preview`/`stage-enemies` 尚未回填。回填顺序：部署 790afd6 → L4 管理员 `POST /admin/calculate-stage-preview` 重建 stage-preview → 跑 `util-scripts/updateGameData.ts` 重建 stage-enemies。操作细节见 [07-ops-runbook.md](07-ops-runbook.md)，链路正文见 [06-data-pipeline.md](06-data-pipeline.md) |
| **线上部署滞后（无藏域四个提交）**：线上 3b04de7 不含 4015ad6/15e6de6/6fe4525（record 服务端权限校验、删除收紧 L4、`submitFields` 白名单 + `isValidRecordUrl` 协议校验）与 790afd6（缓存链路修复）；另有 storage 域修复 289baa8 同样未部署，登记于 [../../../../docs/auth-and-permissions.md](../../../../docs/auth-and-permissions.md)。3b04de7 的 `/record/submit` 只查登录不查等级、`record = req.body` 整包落库（mass-assignment）、`/record/delete` 任何登录用户可删 | arkrog_backend/routers/record.js（对比 `git show 3b04de7:routers/record.js`） | 已确认（2026-07-13 git 对比 + 调研核查线上版本；线上版本无法从仓库内直接复核） | 线上实际权限行为与本模块文档描述的现行代码不一致：任何 L1 登录用户可 curl 提交/删除记录并注入任意字段 | **待部署**（部署 runbook 见 [07-ops-runbook.md](07-ops-runbook.md)；权限对照正文见 [02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md)） |

## 二、幻影端点与外链解析

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| **`/api/parse-redirect` 是幻影端点**：`URLValidation` 对 b23.tv 短链 fetch `/api/parse-redirect?url=...`，但该端点后端全历史从未实现（全仓库零命中）、nginx 无对应配置、线上实测 404——b23 短链解析自上线以来一直是坏的 | app/utils/record.ts 的 `URLValidation`（b23.tv 分支） | 已确认（2026-07-13 前后端全仓库检索） | 提交 b23 短链的记录必然失败；**文档措辞规范：这是"待新增端点"，不是"实现在别处"** | bug 待修（需新增后端端点 + nginx 配置；实现约束见 [05-submit-form-and-links.md](05-submit-form-and-links.md)） |
| **`URLValidation` 不校验 `res.ok`**：对 parse-redirect 的响应直接 `await resRaw.text()`，404 的 HTML body 会被当作解析出的 URL 继续走归一化 | app/utils/record.ts 的 `URLValidation` | 已确认（2026-07-13 源码核实） | 404 页面文本混入 url 字段；叠加"警告不阻断"（`URLValidation` 任何分支都返回 newURL，调用方 `if (validatedURL)` 恒真）后，垃圾 URL 一路提交到后端才被 `isValidRecordUrl` 拦下，而前端提交无 try/catch（见第五节）→ 用户只看到弹窗无响应 | bug 待修 |
| **线上 .env 缺 `YoutubeToken`**：`parseYoutubeURL` 以 `process.env.YoutubeToken` 拼 API key，未配置时 `key=undefined` → Google API 报错 → 必走 `code: 400` 失败分支 | arkrog_backend/utils/record.js 的 `parseYoutubeURL` | 代码路径已确认（2026-07-13）；本仓库工作副本的 `.env`/`.env.production` 同样未定义该键；"线上两份 .env 均缺失"来自 2026-07-13 部署实态调研，无法从仓库内复核 | YouTube 链接的记录提交必然失败（`setRaiderInfo` 返回非 0 code → `/record/submit` 抛 BusinessError） | bug 待修（运维项：补配置；见 [07-ops-runbook.md](07-ops-runbook.md)） |

## 三、举报与反馈通道（写入即黑洞）

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| **举报的 `stageId` 被后端静默丢弃**：ReportModal 提交 `{ stageId, message }`，但 `POST /user/feedback` 的 insertOne 字段清单只有 `userId/username/email/message/date_created` | app/modules/RecordDisplay/ReportModal.tsx 的 `handleSubmit`；arkrog_backend/routers/user.js 的 `POST /feedback` | 已确认（2026-07-13 两端源码核实） | 落库的举报无法定位到任何记录/关卡（且提交的本来就只是 stageId 而非 recordId，即使不丢也只能定位到关） | bug 待修 |
| **Feedback 集合零读取方**：全仓库（前后端）唯一触碰 `Feedback` 集合的代码就是上述 insertOne，无任何查询、后台页或导出脚本 | arkrog_backend/routers/user.js（唯一写入方） | 已确认（2026-07-13 全仓库检索） | 举报写进数据库即进黑洞，无人能看到 | bug 待修（需要读取端/后台页，或至少一个导出脚本） |
| **成功文案承诺不存在的回执**：提交成功 toast 写"反馈回执请在个人中心中查看"，对应的 `/message` 页面是只渲染标题的静态 stub | app/modules/RecordDisplay/ReportModal.tsx、app/components/Modal/ContactUsModal.tsx 的 `handleSubmit`；app/modules/Home/Message/index.tsx 的 `Index` | 已确认（2026-07-13 源码核实） | 用户被引导去一个永远为空的页面等回执 | bug 待修（改文案或实现消息中心） |
| **ContactUsModal 错误复用举报文案**："联系我们"弹窗（全局挂载于 GlobalModals，触发 id `contact-us`）的标题写死"这个记录有问题" | app/components/Modal/ContactUsModal.tsx 的 `ContactUsModal` | 已确认（2026-07-13 源码核实） | 与举报弹窗文案混淆 | bug 待修 |
| **匿名反馈提交必 403**（勘误：早期调研的"匿名 userId=undefined 落库"不成立）：`POST /user/feedback` 位于 `routers/user.js` 的 `router.use` 登录守卫之后，未登录提交直接 403"用户未登录"，不会产生 userId=undefined 的脏数据；但 ContactUsModal 对未登录访客可见可填写，提交时才失败 | arkrog_backend/routers/user.js 的 `router.use` 登录守卫；app/routes/GlobalModals.tsx | 已确认（2026-07-13 源码核实，**推翻早期调研线索**） | 未登录访客填完一整段反馈后才被 403 打回，且该弹窗还收集了 email（暗示可匿名联系） | 待决策（反馈是否应对匿名开放；若开放需把 /feedback 移到守卫之前） |

## 四、悬挂收藏与 Favorite 缺陷组

删除记录的完整副作用矩阵（谁被清理、谁不被清理）见 [02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md)，本表只登记缺陷本身。

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| **分页控件永不渲染 → 收藏只能看前 60 条**：渲染条件是 `title === "record"`/`title === "seed"`，而 `title` 的实际取值是 navs 里的 `"记录收藏"`/`"种子收藏"`，字符串比较永 false；page 停在 0，只发出首次预载请求（`recordIds.slice(0, 60)`，注释"预加载4页"实为 3 页），另有后端 `/record/ids` 的 `batchSize = 80` 截断兜底 | app/modules/Home/Favorite/index.tsx 的 `FavoritePage`（Pagination 渲染条件）；arkrog_backend/routers/record.js 的 `POST /ids` | 已确认（2026-07-13 源码核实） | 收藏超过 60 条的用户永远看不到第 61 条以后的内容，且无任何提示 | bug 待修（比较 navs 的 title 常量即可） |
| **`mergeArray` 是从索引 0 起的按位覆盖**：`merged[index] = item` 逐位写入，与"把第 N 页数据放进第 N 页槽位"的意图不符；且 `/record/ids` 返回按 Mongo `$in` 命中顺序、悬挂 id 直接缺位，返回数组与请求 id 数组既不同序也不同长 | app/utils/tools.ts 的 `mergeArray`；调用方 app/modules/Home/Favorite/index.tsx | 已确认（2026-07-13 源码核实） | 翻页加载会把后页数据覆盖到前页槽位（当前因分页控件缺陷未触发，属**潜伏缺陷**——修复分页后立刻引爆） | bug 待修（修分页时必须一并修，否则修一个引爆另一个） |
| **前 60 条全悬挂时无限 POST 循环**：`isCurrentPageLoaded` 依据 `records.some(index 在当前页窗口内)` 判断；当预载批次全部是悬挂 id（已删除记录）时 `/record/ids` 返回 `[]`，`setRecords(mergeArray([], []))` 仍产生新数组引用，而 effect 依赖数组包含 `records` → 判定恒 false → 无限重发请求 | app/modules/Home/Favorite/index.tsx 的 `FavoritePage`（加载 effect） | 已确认（2026-07-13 源码核实，逻辑推演） | 收藏页对该用户变成自我 DDoS；收藏数少且全部悬挂的用户即可触发 | bug 待修 |
| **RecordCard 条件 Hook 违规（延迟引爆）**：`if (!record) return <占位/>` 早退位于 `useState(singleRow)`/`useState(doubleRowPatchNum)`/resize `useEffect` 之前，两条渲染路径的 Hook 数量不同；当前所有调用点（关卡页/首页/收藏页）都传入 record，占位分支不可达，故未爆 | app/components/RecordCard/RecordCard.tsx 的 `RecordCard` | 已确认（2026-07-13 源码核实 + 全部调用点排查） | 任何未来调用方让同一组件实例在 record 缺失↔存在间切换（如骨架屏方案）都会触发 React "Rendered more hooks" 崩溃 | bug 待修（把早退移到全部 Hook 之后，或拆占位组件；组件契约见 [04-record-card-and-display.md](04-record-card-and-display.md)） |
| **`handleDeleteRecord` 的 splice(findIndex=-1) 误删末元素**：删除成功后 `updated.splice(updated.findIndex(r => r._id === record._id), 1)`；当卡片对应记录已不在列表里（mergeArray 错位覆盖、并发刷新等）findIndex 返回 -1，`splice(-1, 1)` 语义是删除**最后一个**元素 | app/components/RecordCard/RecordCard.tsx 的 `handleDeleteRecord` | 已确认（2026-07-13 源码核实；触发前置条件依赖列表与卡片脱钩，现网触发路径受分页缺陷抑制） | UI 上消失的是另一条无辜记录 | bug 待修（findIndex 为 -1 时应 no-op） |
| **删除不清理收藏（悬挂收藏永久残留）**：后端 `POST /record/delete` 只删 Records 文档，不动 `Users.favorite`；前端 `handleDeleteRecord` 也不调 `/user/favorite` remove（包括删除者自己的收藏）；收藏页对悬挂 id 不渲染卡片 → 用户没有任何取消收藏的 UI 入口 | arkrog_backend/routers/record.js 的 `POST /delete`；app/components/RecordCard/RecordCard.tsx 的 `handleDeleteRecord` | 已确认（2026-07-13 两端源码核实） | 悬挂收藏无限累积，是上面"无限 POST 循环"的原料；存量需连生产库量化 | 待决策（后端删除时 `$pull` 全体用户 favorite vs 一次性清理脚本 + 读侧过滤） |

## 五、页面崩溃与静默失败

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| **StageDetail 非空断言崩溃**：`Object.keys(stagePreview!)` 在 `stagePreview === undefined` 时抛 TypeError。`fetchStagePreview` 失败时只 toast 不置数据，而 RelicFreeLayout 的 `Promise.all(...).then(setLoaded(true))` 因 store 内部吞错**永远 resolve** → 页面照常渲染并崩溃 | app/modules/RelicFree/Stage/StageDetail.tsx 的 `StageDetail`（stageIds 计算）；app/stores/relicFreeStore.ts 的 `fetchStagePreview`；app/routes/RelicFreeLayout.tsx 的 `RelicFreeLayout` | 已确认（2026-07-13 源码核实） | stage-preview 请求失败 = 关卡详情页整页白屏 | bug 待修（空值兜底） |
| **上一关/下一关依赖后端键序**：导航序即 `Object.keys(stagePreview)` 的顺序，也就是后端全量重算时 stages 解包数据的遍历插入序，前端未做任何排序 | app/modules/RelicFree/Stage/StageDetail.tsx 的 `StageDetail`；arkrog_backend/utils/appData/stagePreview.js 的 `stagePreviewFullUpdate` | 已确认（2026-07-13 两端源码核实） | 后端遍历顺序变化（数据源重排、单关增量插入新键置尾）会改变前端导航顺序；单关增量更新对**已存在**键做原位替换不改变键序，但对新关卡会追加到末尾 | 设计如此 + 待决策（是隐式契约，登记于 [01-architecture-and-data-flow.md](01-architecture-and-data-flow.md)；是否改为前端显式排序待裁决） |
| **提交/删除无 try/catch，失败纯静默**：`SubmitRecordForm.handleSubmit` 与 `RecordCard.handleDeleteRecord` 的 `await _post(...)` 均无 try/catch；`_post` 对非 2xx 抛错 → 未处理的 Promise rejection 只进 console。提交失败：弹窗不关、无 toast、setTimeout 刷新不执行；删除失败：确认框点完后无任何反馈 | app/modules/RelicFree/Stage/SubmitRecordForm.tsx 的 `handleSubmit`；app/components/RecordCard/RecordCard.tsx 的 `handleDeleteRecord`；对照组：同文件 `handleStarRecord` 有 try/catch + toast | 已确认（2026-07-13 源码核实） | 后端 4xx（链接校验失败、权限不足等）用户完全无感知 | bug 待修 |
| **store 吞错的两种终态**：①StagePage 的记录请求失败 → `recordsLoaded` 永 false → 无限 Loading（有 toast）；②`fetchRelicFreeData`/`fetchStagePreview` 失败 → toast 后 loaded 闩锁不置位、无重试入口，后续页面拿 undefined 数据（见本节第一行的白屏） | app/modules/RelicFree/Stage/index.tsx 的 `StagePage`；app/stores/relicFreeStore.ts 的 `fetchRelicFreeData`/`fetchStagePreview` | 已确认（2026-07-13 源码核实） | 一次网络抖动后用户只能整页刷新自救 | bug 待修（失败态 UI / 重试机制） |

## 六、缓存与硬编码

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| **`recommendRecordIds` 硬编码两枚 ObjectId**：首页"推荐"栏的记录 id 直接写死在源码里 | arkrog_backend/utils/appData/db.js 的 `loadAppDataFromSource`（`recommendRecordIds` 分支） | 已确认（2026-07-13 源码核实） | 推荐位内容只能改代码重启更换；若这两条记录被删除，首页推荐栏静默变空 | 待决策（挪进 Data 集合 + 后台入口，或接受现状登记于 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)） |
| **`latestRecordIds` 永久缓存不失效**："最新"栏在 appdata 缓存冷加载时查一次 Records（`date_published` 倒序取 2），此后进 Redis 永久缓存；`/record/submit`/`/delete` 均不失效该键 | arkrog_backend/utils/appData/db.js 的 `loadAppDataFromSource`（`latestRecordIds` 分支）；arkrog_backend/routers/record.js | 已确认（2026-07-13 源码核实） | 首页"最新记录"停留在缓存建立那一刻，直到重启后端或手动刷缓存；新提交的记录永远上不了"最新" | bug 待修（提交/删除时 `refreshCache("latestRecordIds", "appdata")`） |

## 七、后端工程缺陷

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| **Express 4 裸 async 处理器（请求挂起）**：`POST /user/favorite` 与 `POST /seed/ids` 未包 `asyncHandler`；`new ObjectId(非法字符串)` 抛错后 Express 4 不接管 async 异常 → 请求既无响应也无错误页，挂到客户端超时。对照组：`routers/record.js` 全部处理器已用 `asyncHandler` | arkrog_backend/routers/user.js 的 `POST /favorite`；arkrog_backend/routers/seed.js 的 `POST /ids`；arkrog_backend/middleware/errorHandler.js 的 `asyncHandler` | 已确认（2026-07-13 源码核实；express ^4.21.2） | 构造非法 id 的请求可无限占用连接；前端 `handleStarRecord` 的 try/catch 对挂起请求无效（Promise 永不 settle） | bug 待修（统一包 asyncHandler） |
| **`/audit-log` 无鉴权 + 无藏无审计（双缺口）**：①`app.ts` 挂载 `/audit-log` 无任何守卫，`routers/auditLog.js` 自身也无 session 检查 → 任何访客可查全部审计日志（含操作者用户名）；②记录域的 submit/delete 根本不写审计——`logResourceOperation` 的调用方只有赛事域（utils/tournament、utils/pendingTournaments） | arkrog_backend/app.ts（router 挂载段）；arkrog_backend/routers/auditLog.js；arkrog_backend/routers/record.js（无审计调用） | 已确认（2026-07-13 全仓库检索） | 有审计的资源日志对外裸奔，需要审计的无藏操作（谁删了记录）反而无日志——删除是硬删除，事后完全不可追溯 | bug 待修（端点加 L4 守卫；record 写路径接入审计。权限机制见 [../../../../docs/auth-and-permissions.md](../../../../docs/auth-and-permissions.md)） |

## 八、杂项（不产出错误数据，但埋坑）

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| `recordStore.clearActiveRecord` 零调用：举报弹窗关闭后 `activeRecord` 残留 | app/stores/recordStore.tsx 的 `clearActiveRecord` | 已确认（2026-07-13 全仓库检索） | 死代码 + 状态残留（下次打开举报弹窗前短暂显示旧记录信息的隐患） | bug 待修（关闭时调用或删除） |
| console.log 残留多处：提交 payload 整包打印（`handleSubmit`）、store 全量数据打印、`setTitle`/`onOpenChange` 调试输出 | app/modules/RelicFree/Stage/SubmitRecordForm.tsx 的 `handleSubmit`；app/stores/relicFreeStore.ts 的 `fetchRelicFreeData`；app/stores/appDataStore.ts 的 `fetchAppData`；app/modules/Home/Favorite/index.tsx 的 `setTitle` 回调；app/modules/RecordDisplay/ReportModal.tsx 的 `onOpenChange`；arkrog_backend/utils/appData/stagePreview.js 的 `persistStagePreview`（打印整个 stagePreview 对象） | 已确认（2026-07-13 源码核实） | 生产环境噪音；后端整对象打印在全量重算时刷屏 | bug 待修 |
| 模组"继承上次选择"死逻辑：`setMemberDataArray` 里 `prevData` 的 uniequipId 继承赋值**紧接着**被无条件的"默认选择最新模组"赋值覆盖 | app/modules/RelicFree/Stage/SubmitRecordForm.tsx 的 team 解析 `useEffect` | 已确认（2026-07-13 源码核实） | 注释宣称的继承行为从未生效：每次改动队伍字符串都重置为最新模组 | 待决策（补 else 恢复继承语义，或删继承分支承认现状） |
| 敌情列表布局依赖 falsy 短路：`[...enemies, ...Array(5).fill(0)]` 用数字 0 填充占位，靠 `EnemyAvatar` 的 `if (!name) return null` 兜底不渲染 | app/modules/RelicFree/Stage/StageDetail.tsx 的敌方情报渲染段；app/components/Character/Enemy/EnemyAvatar.tsx 的 `EnemyAvatar` | 已确认（2026-07-13 源码核实） | `name` prop 类型声明是 `string \| null` 却传入 `0`；EnemyAvatar 的空值守卫一旦被"修理"，敌情区渲染 5 个损坏头像 | 待决策（改用 CSS 占位或显式 null 填充） |
| 背景立绘 `Math.random` 非确定性：每次渲染在"队伍成员 ∩ 可用立绘"交集里重抽一张，无 memo | app/components/RecordCard/RecordCard.tsx 的 `availableBg`/`charId` 计算（渲染体内） | 已确认（2026-07-13 源码核实） | 任何触发重渲染的操作（收藏、resize、父组件刷新）都会随机换背景图并重新发起图片请求 | 待决策（设计上"随机立绘"可能是特性，但至少应按 record._id 稳定取样；见 [04-record-card-and-display.md](04-record-card-and-display.md)） |

## 相关文档

- 删除副作用矩阵与记录生命周期：[02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md)
- 数据链路正文与缓存拓扑：[06-data-pipeline.md](06-data-pipeline.md)、顶层 [data-pipeline.md](../../../../docs/data-pipeline.md)
- 修复部署与回填操作：[07-ops-runbook.md](07-ops-runbook.md)
- rogueKey 两种写法等版本敏感硬编码：[version-sensitive-hardcode.md](version-sensitive-hardcode.md)（计数以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 为准）
- "为什么是现在这样"：[adr/](adr/)
