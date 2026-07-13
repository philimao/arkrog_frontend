---
last-verified: 2026-07-13
sources:
  - app/types/recordType.ts
  - app/types/constant.ts
  - app/modules/RelicFree/Stage/index.tsx
  - app/modules/RelicFree/Stage/StageDetail.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/modules/RecordDisplay/index.tsx
  - app/modules/RecordDisplay/ReportModal.tsx
  - app/components/RecordCard/RecordCard.tsx
  - app/modules/Home/Favorite/index.tsx
  - app/modules/IndexPage/IndexRelicFree/index.tsx
  - app/stores/relicFreeStore.ts
  - app/utils/tools.ts
  - arkrog_backend/routers/record.js
  - arkrog_backend/routers/user.js
  - arkrog_backend/utils/record.js
  - arkrog_backend/utils/appData/stagePreview.js
  - arkrog_backend/utils/appData/db.js
  - arkrog_backend/utils/dataCache.js
  - arkrog_backend/middleware/errorHandler.js
  - arkrog_backend/docs/Permission.md
---

# 记录数据契约与生命周期

本篇是无藏记录（Record）的数据契约权威文档，角色对应赛事模块的 [docs/TournamentDataSchema.md](../../../../docs/TournamentDataSchema.md)：定义 `RecordType`/`TeamMemberData` 前端契约、`Records` 集合真实落库形态，以及记录从提交、展示、收藏、举报到删除的完整生命周期与各端点契约。任何脚本、清理工具与本篇不一致时，以本篇引用的源码符号为准。

提交表单的字段规格与外链归一化规则单独成篇，见 [05-submit-form-and-links.md](05-submit-form-and-links.md)；stagePreview 数据链路见 [06-data-pipeline.md](06-data-pipeline.md)；RecordCard 的展示与操作矩阵见 [04-record-card-and-display.md](04-record-card-and-display.md)。

> ⚠️ **两条阅读前提**
>
> 1. **本篇按本地 HEAD 现行代码成文**。后端 `routers/record.js` 的服务端守卫与字段白名单、`stagePreviewSingleUpdate` 的缓存修复均在本地 HEAD；线上服务器截至 2026-07-13 仍运行旧提交 3b04de7（不含上述修复），线上实际行为差异统一登记在 [known-issues.md](known-issues.md)。
> 2. stage-preview 写路径曾在 fc2f75f（2025-11-14）~790afd6（2026-07-13）区间断裂；本地 HEAD 已修复，线上待部署且 Mongo 数据待回填，回填流程见 [07-ops-runbook.md](07-ops-runbook.md)。

## 1. 生命周期总览

```
提交（POST /record/submit，Level 3+）
  └─ setRaiderInfo 解析外链 → 落库即发布（无审核、无去重、无审计）
       └─ 非阻塞触发 stagePreviewSingleUpdate（最少人数重算）
展示（POST /record 关卡页 / POST /record/ids 首页与收藏页）
收藏（POST /user/favorite，写 Users.favorite）
举报（POST /user/feedback，写入即黑洞，见第 8 节）
删除（POST /record/delete，Level 4+，硬删除）
  └─ 再次触发 stagePreviewSingleUpdate；其余关联数据一概不清理（见第 6 节矩阵）
```

关键定性：**提交即发布**。`routers/record.js` 的 `/submit` 处理器解析成功后直接 `insertOne`，没有待审队列、没有内容审核、没有重复提交检测（同一 URL 可反复落库）、没有审计日志。这是有意为之的轻流程（补记为模块 ADR 0001），代价由删除权限（Level 4+）与举报入口兜底——而举报链路目前是黑洞（第 8 节）。

## 2. 前端契约：RecordType 与 TeamMemberData

均定义于 `app/types/recordType.ts`。

### 2.1 RecordType

| 字段 | 类型 | 语义 |
|---|---|---|
| `_id` | `string` | Mongo ObjectId 的字符串序列化，前端作为 key 与收藏/删除的定位符 |
| `url` | `string` | 归一化后的视频/动态链接；`"#"` 表示无链接记录 |
| `raider` | `string` | 攻略者名称，服务端从外链解析；解析失败或不在解析范围时为 `""` |
| `raiderImage` | `string` | 攻略者头像 URL；失败回落 `/images/profile-photo/default-profile-photo.jpg` |
| `raiderLink` | `string` | 攻略者主页；失败回落 `"#"` |
| `stageId` | `string` | 关卡 id（`ro{n}_...` 语法见 [03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md)） |
| `type` | `string` | 作战类型，取值域为 `app/types/constant.ts` 的 `StageTypes` 键（`normal`/`elite`/`boat`），但类型层只是 `string`，后端也不校验取值 |
| `team` | `TeamMemberData[]` | 队伍成员，见 2.2 |
| `note` | `string` | 备注（攻略者 ID、等效情况等自由文本） |
| `level` | `string` | 难度等级，取值域为 `StageLevels`（`N0`/`N15`/`N18`），同样无类型与服务端校验 |
| `submitter` | `string` | 提交者用户名（服务端从 session 写入，前端目前不渲染） |
| `date_created` | `number` | 提交时刻（毫秒时间戳，服务端 `Date.now()`） |
| `date_modified?` | `number` | 现行代码恒等于 `date_created`——不存在编辑端点，该字段没有独立含义 |
| `date_published` | `number` | 视频/动态的发布时刻（毫秒），语义见 3.2 |

**前端契约窄于落库事实**：后端实际下发的文档还带有 `submitterId`（提交者的 Users `_id` 字符串）与 `data`（外链解析器的原始负载，见 3.1），`RecordType` 未声明这两个字段。`POST /record` 与 `/record/ids` 均无 projection，把 Mongo 原始文档整体下发。

### 2.2 TeamMemberData

| 字段 | 类型 | 语义 |
|---|---|---|
| `charId` | `string` | 干员 id（`char_xxx_yyy`） |
| `name` | `string` | 干员中文名（以 `character_basic` 中的规范名落库，非用户原始拼写） |
| `skillId` | `string` | 技能 id；`""` 表示未填技能（小车豁免），**`"error"` 是解析失败哨兵值**，正常只应出现在表单校验阶段、不应落库（校验链见 [05-submit-form-and-links.md](05-submit-form-and-links.md)） |
| `skillStr` | `string` | 用户填写的技能序号原文（如 `"3"`） |
| `skillName` | `string` | 技能中文名 |
| `uniequipId` | `string` | 模组 id；`""` 表示无模组 |
| `uniequipName` | `string` | 模组类型图标名大写（来自 `UniEquipBasicData.typeIcon`） |
| `charData?` | `CharBasicData` | 仅前端运行时存在，`SubmitRecordForm.handleSubmit` 提交前 `delete`，**不落库** |

## 3. Records 集合真实 schema

### 3.1 落库字段与来源

现行 `/submit`（本地 HEAD，含字段白名单）写入的文档形态：

| 字段 | 来源 |
|---|---|
| `stageId`、`url`、`team`、`type`、`level`、`note` | 客户端 `req.body`，按 `routers/record.js` 的 `submitFields` 白名单逐键拷贝 |
| `submitter`、`submitterId` | 服务端 session（`req.session.username` / `userId`） |
| `date_created`、`date_modified` | 服务端 `Date.now()`（两者提交时相同） |
| `raider`、`raiderImage`、`raiderLink`、`date_published`、`data` | 服务端 `utils/record.js` 的 `setRaiderInfo` 派生（第 4 节） |

`data` 是解析器原始负载：B 站视频为 view API 响应裁剪版（删除 `tname`/`desc_v2`/`rights`/`stat`/`dimension`/`no_cache`/`subtitle`/`user_garb`，`pages` 映射为分 P 标题数组）；B 站动态为标题/图/发布时间/作者摘要；YouTube 为 snippet 拼装；不在解析范围内的 URL 为 `{ code: 0, message: "网址不在解析范围内" }`。该负载随 `/record` 全量下发。

### 3.2 三个时间字段的语义

- `date_created`：提交落库时刻。
- `date_modified`：等于 `date_created`。没有任何更新 `Records` 的端点（全仓库对该集合的写操作只有 `/submit` 的 `insertOne` 与 `/delete` 的 `deleteOne`）。
- `date_published`：`setRaiderInfo` 写入的 `data.pubdate * 1000`——正常取视频/动态的真实发布时刻；三种情况回落为提交时刻：①URL 不在解析范围内；②解析失败但走了含回落的分支；③**B 站分 P 链接（带 `?p=`）被 `parseBilibiliVideo` 显式改写为当前时刻**（源码仅注释 "if it is a part"，未说明动机）。首页"最新"栏目（`latestRecordIds`）按 `date_published` 倒序取前 2 条（`utils/appData/db.js` 的 `loadAppDataFromSource`），RecordCard 展示的日期也是它。

### 3.3 无校验层、无索引

- **无 schema 校验**：Mongo 侧无 validator（全仓库无 `createIndex`/collection validator 调用，2026-07-13 检索核实），应用侧白名单只限定**键名**不校验值——`type`/`level` 传任意字符串照样落库，只是不被 `stagePreview` 的最少人数统计计入（`calculateOptimalNum` 只枚举三类型 × 三难度）。
- **仅 `_id` 默认索引**：`/record` 按 `stageId` 查询、`latestRecordIds` 按 `date_published` 排序均为集合扫描。
- **存量脏数据**：字段白名单由 6fe4525（2026-07-13）引入，此前 `req.body` 全量落库（mass-assignment），存量文档可能携带任意客户端伪造字段；所有读取方必须容忍未知字段。线上未部署该修复前，新增脏数据仍可能产生（[known-issues.md](known-issues.md)）。

## 4. 提交链路与 setRaiderInfo

`POST /record/submit`（`routers/record.js`）的处理顺序：

1. 守卫：前置 `router.use` 要求已登录且 `session.level >= 3`（第 9 节）。
2. `stageId` 缺失 → 404 `"未提供关卡名称！"`；`url` 非 `"#"` 且非 http(s) → 400 `"视频链接格式有误！"`（`isValidRecordUrl`）。
3. 白名单拷贝 + 写入 session 派生字段与时间戳。
4. `await setRaiderInfo(record)`；`record.data.code !== 0` → 以解析器的中文 message 抛 400。
5. `insertOne` → 重新查询该关卡全部记录并作为响应返回（前端 `setRecords` 直接整表替换）。
6. **非阻塞**触发 `stagePreviewSingleUpdate(stageId)`，`.catch(console.error)` 吞错——重算失败不影响提交成功。

### 4.1 setRaiderInfo 的解析分派

`utils/record.js` 的 `setRaiderInfo` 按 URL 特征分派（`raiderImage` 已非空且非 `forceUpdate` 时跳过解析；白名单下 `/submit` 路径不可能带 `raiderImage`，恒走解析）：

| URL 特征 | 解析器 | 成功时写入 |
|---|---|---|
| 含 `www.bilibili.com/video/BV` 且非纯数字 BV（`BV\d+$` 为测试豁免） | `parseBilibiliVideo`（B 站 view API） | `raider`=UP 主名，`raiderImage`=头像+`@96w_96h_1c_1s.webp` 后缀，`raiderLink`=`space.bilibili.com/{mid}` |
| 含 `t.bilibili.com` 或 `www.bilibili.com/opus` | `parseBilibiliDynamic`（动态详情 API） | 同上 |
| 含 `youtube` | `parseYoutubeURL`（YouTube Data API v3，依赖 `YoutubeToken` 环境变量） | `raider`/`raiderImage`/`raiderLink` 取频道信息 |
| 其余（含 `"#"`） | 不解析 | `data={code:0,message:"网址不在解析范围内"}`，`raider=""`、默认头像、`raiderLink="#"`，照常落库 |

### 4.2 错误码 → 中文提示映射

`parseBilibiliVideo` 把 B 站 API 的 `result.code` 取负存入 `data.code` 并改写 message，负值最终归一为 404：

| B 站 API code | 落库 `data.code` | 提交时抛出的中文提示 |
|---|---|---|
| `0` | `0` | ——（成功） |
| `-400` | `400` | 请求错误，请检查BV号！ |
| `-403` | `403` | BV号有误，视频无访问权限！ |
| `-404` | `404` | 找不到视频，请检查BV号！ |
| `62002`（稿件不可见） | `404` | 稿件已删除 |
| `62003`/`62004`（审核中） | `404` | 稿件尚未发布，请稍后提交 |
| fetch/解析异常 | `400` | 异常名 + 堆栈原文（并经 `reporter` 上报） |

`parseBilibiliDynamic`：解析不到 `card.desc` → 404 `"动态解析失败！可能已经被删除"`；异常 → 400 堆栈原文。

`parseYoutubeURL`：URL 含 `"undefined"` 或无 `?v=` 参数 → 404 `"Invalid URL"`；视频/频道查不到 → 400 `"Failed to parse video info"` / `"Failed to parse channel info"`。**线上两份 .env 均未配置 `YoutubeToken`**，googleapis 返回错误 JSON 后 `listData.items[0]` 取值抛 TypeError，落入异常分支 → 400 堆栈原文——即**线上目前无法提交 YouTube 记录**（[known-issues.md](known-issues.md)）。

> ⚠️ 这些中文提示的送达链路是断的：`BusinessError` 以 JSON `{success:false,message}` 返回，`app/utils/tools.ts` 的 `_post` 对非 2xx 抛 `Error(响应原文)`，而 `SubmitRecordForm.handleSubmit` 与 `RecordCard.handleDeleteRecord` 都**没有 try/catch**——错误变成 unhandled rejection，用户看不到任何提示、Modal 不关闭。对照组：`ReportModal`、`handleStarRecord` 有 try/catch 并 toast。登记见 [known-issues.md](known-issues.md)。

## 5. 读取端点契约

### 5.1 POST /record

- 请求：`{ stageId }`；缺失 → 404 `"未提供关卡ID"`。无鉴权。
- 响应：该关卡全部记录的原始文档数组，无分页、无排序保证、无 projection（含 `data` 与 `submitterId`）。
- 消费方：关卡页 `app/modules/RelicFree/Stage/index.tsx`（局部 `useState`，不进 store——记录列表刻意不做全局状态，`setRecords` 沿 `StageDetail`/`RecordDisplay`/`RecordCard` prop 链下传）。展示排序在前端 `app/modules/RecordDisplay/index.tsx` 完成（难度降序、人数升序）。

### 5.2 POST /record/ids 与三重静默

- 请求：`{ ids }`（ObjectId 字符串数组）；缺失 → 400 `"未接收到索引"`。无鉴权。任一 id 非法（非 24 位 hex）时 `new ObjectId` 抛错 → 整个请求 500。
- 响应：`find({_id: {$in: objectIds}}).limit(80)` 的结果。**三重静默**，调用方必须自行防御：
  1. **缺失 id 不报错**——已删除的记录直接从结果中消失，响应长度可小于请求长度；
  2. **返回顺序是 Mongo 自然序**，与请求 ids 顺序无关；
  3. **`batchSize = 80` 截断**——超过 80 条静默丢弃。
- 消费方：首页 `app/modules/IndexPage/IndexRelicFree/index.tsx`（`recommendRecordIds`/`latestRecordIds` 各 2 条，远低于截断线）；收藏页 `app/modules/Home/Favorite/index.tsx`（每次预取 3 页 60 条 id，也在截断线内；请求体多带一个 `page` 字段，**后端解构时忽略它**）。三重静默与收藏页自身缺陷叠加的后果见第 7 节。

## 6. 删除链路与副作用矩阵

`POST /record/delete`：`{_id}` 缺失 → 404；处理器内二次守卫 `session.level >= 4`；`findOne` 确认存在（否则 404 `"未找到记录"`）后 `deleteOne` **硬删除**，再非阻塞触发 `stagePreviewSingleUpdate(record.stageId)`。

前端入口是 `app/components/RecordCard/RecordCard.tsx` 的 `handleDeleteRecord`：`window.confirm` → `_post` → `setRecords?.(...)` 本地剔除 → `setTimeout(2000)` 后 `fetchStagePreview(true)`（第 10 节）。

| 关联数据 | 删除时是否清理 | 位置与后果 |
|---|---|---|
| `Records` 文档 | ✓ 硬删除，无软删/回收站 | `routers/record.js` `/delete` |
| stagePreview 最少人数徽标 | ✓ 触发单关重算（fire-and-forget） | `utils/appData/stagePreview.js` 的 `stagePreviewSingleUpdate`；fc2f75f~790afd6 区间 100% TypeError 被吞，本地 HEAD 已修复，**线上待部署**（[07-ops-runbook.md](07-ops-runbook.md)） |
| `Users.favorite` 中指向该记录的条目 | ✗ 永久残留 | 悬挂收藏，完整链路见第 7 节 |
| 各在线 session 的 `favorite` 副本 | ✗ | session 仅在登录与 `/user/favorite` 操作时刷新 |
| appdata `latestRecordIds` 缓存 | ✗ 不失效 | `utils/dataCache.js` 的 `getOrLoadAppData` 为**永久缓存**，删除"最新记录"后首页仍请求已删 id（`/record/ids` 静默少返回→该卡片消失），直至后端重启或手动清缓存 |
| 前端本地记录列表 | 视 `setRecords` 是否传入 | 首页 `IndexRelicFree` 不传 `setRecords` → 删除后 UI 不刷新；另有 `findIndex` 未命中时 `splice(-1, 1)` 误删末元素的隐患（[known-issues.md](known-issues.md)） |

## 7. 悬挂收藏完整链路

1. **写入**：`RecordCard.handleStarRecord` → `POST /user/favorite`（add）→ `Users.favorite` 追加 `{_id, type: "record"}`。
2. **记录被删**：`/record/delete` 不触碰 `Users.favorite` → 条目悬挂。
3. **读取**：收藏页 `Home/Favorite` 从 `userInfo.favorite` 提取 recordIds → `POST /record/ids` → 悬挂 id 被三重静默之一（缺失不报错）吞掉，返回数比请求数少。
4. **无清理出口**：
   - 服务端没有任何悬挂清理任务或删除时的级联 `$pull`；
   - 前端取消收藏的唯一入口是已渲染卡片上的星标（`handleStarRecord` 的 remove 分支），而悬挂记录**永远不会渲染成卡片**——用户无法取消收藏一条已删除的记录；
   - `/user/favorite` 的 remove 分支本身是无条件 `$pull`（第 8 节），技术上可清理悬挂条目，但没有 UI 调用它。
5. **叠加缺陷放大**：收藏页 `mergeArray`（`app/utils/tools.ts`）是从索引 0 起的按位覆盖，少返回导致页内错位；分页控件因 `title === "record"` 与实际标题 `"记录收藏"` 的字符串比较永不渲染（只能看前 60 条）；若前 60 个收藏全部悬挂，`records` 恒为空触发 effect 无限重复 POST。这些缺陷的登记与处置见 [known-issues.md](known-issues.md)。

## 8. /user/favorite 与 /user/feedback 契约

两端点都在 `routers/user.js`，共用前置 `router.use` 登录守卫（未登录 → 403 `"用户未登录"`，无等级要求）。

### 8.1 POST /user/favorite

- 请求：`{ operate: "add" | "remove", item: { _id, type: "record" | "seed" } }`；参数非法 → 400 `"非法的参数"`。
- **add**：先在 `Records`/`Seeds` 中确认目标存在（不存在 → 404），再 `$addToSet`（天然去重）。
- **remove**：**无条件 `$pull`**，不校验存在性——这是清理悬挂条目在服务端唯一可行的写路径，但前端无入口（第 7 节）。
- 响应：重新查询后的完整 `favorite` 数组，同时刷新 `req.session.favorite`；前端 `handleStarRecord` 以响应整体覆盖 `userInfo.favorite`。

### 8.2 POST /user/feedback（举报黑洞）

`ReportModal`（`app/modules/RecordDisplay/ReportModal.tsx`）提交 `{ stageId, message }`，但该端点的 `insertOne` 字段清单只取 `userId`/`username`/`email`/`message`/`date_created`——**`stageId` 被静默丢弃**，举报无法定位到具体记录（message 里用户自己写了才有线索）；`Feedback` 集合全仓库零读取方；成功 toast 承诺的"反馈回执请在个人中心中查看"对应 `modules/Home/Message` 静态 stub。定性为**写入即黑洞**，四重断裂详情见 [known-issues.md](known-issues.md)。（同端点还被 `ContactUsModal` 用作联系表单，那个调用只发 `{message, email}`，与后端字段吻合。）

## 9. 权限对照表

level 数值语义的**唯一权威源**是 `arkrog_backend/docs/Permission.md`（0=VISITOR / 1=USER / 2=LINKED / 3=CONTENT_ADMIN / 4=ADMIN / 5=SU / 6=ROOT）。"提交门槛 ≥3"的语义是**内容管理员**而非普通达标用户。前端 `routePermissions`/`RouteGuard` 子系统零生产引用（死代码），下表不含其任何配置；全站真实守卫机制见 [docs/auth-and-permissions.md](../../../../docs/auth-and-permissions.md)。

| 操作 | 前端软守卫（渲染层） | 后端硬守卫（本地 HEAD 现行代码） |
|---|---|---|
| 查看记录（`/record`、`/record/ids`） | 无 | 无（公开端点） |
| 提交（`/record/submit`） | `SubmitRecordForm` 在 `userInfo.level < 3` 时返回 `null`（按钮不渲染） | `routers/record.js` 前置 `router.use`：未登录 401 `"未登录"`；`level < 3` → 403 `"等级不足"` |
| 删除（`/record/delete`） | `RecordCard` 删除图标仅 `level >= 4` 显示（def7203，2026-07-13，桌面/移动两处操作栏一致） | 前置 `router.use`（≥3）+ 处理器内 `level < 4` → 403 `"无权删除该记录"` |
| 收藏（`/user/favorite`） | 未登录点击星标 → `openModal("login")` | 登录即可，无等级要求 |
| 举报（`/user/feedback`） | 未登录点击 → `openModal("login")` | 登录即可 |

> ⚠️ **线上部署滞后**：线上运行的 3b04de7 早于 4015ad6/15e6de6/6fe4525 三个安全修复——线上 `/submit` 与 `/delete` **没有任何服务端等级校验**，且 `/submit` 无字段白名单（mass-assignment：客户端可伪造 `raiderImage` 使 `setRaiderInfo` 跳过解析、伪造 `data.code` 绕过失败拦截）。前端软守卫只是渲染层隐藏，不构成防线。此差异登记在 [known-issues.md](known-issues.md)，部署后应同步销项。

## 10. 提交/删除后的 2 秒强刷时序契约

提交成功与删除后，前端都执行：

```
setTimeout(() => fetchStagePreview(true), 2000)
```

（`SubmitRecordForm.handleSubmit` 与 `RecordCard.handleDeleteRecord`；`fetchStagePreview` 为 `app/stores/relicFreeStore.ts` 导出 store 的 action，`force=true` 绕过 `stagePreviewLoaded` 闩锁重新 GET `/relic-free/stage-preview`——该端点无 HTTP 缓存头，见 [06-data-pipeline.md](06-data-pipeline.md)。）

契约语义：后端的最少人数重算是 fire-and-forget（第 4、6 节），响应里不含重算结果；前端赌"2 秒内后端算完"，到点强刷预览数据以更新关卡列表徽标。三点注意：

1. **2000ms 是经验值**，没有任何响应驱动的完成确认；重算慢于 2 秒时刷回旧数据（决策补记与推翻条件见模块 ADR 0006，修复断裂后再裁决是否改为响应驱动）。
2. 重算失败时该契约**静默落空**——fc2f75f~790afd6 断裂期间即如此，线上在部署修复并按 [07-ops-runbook.md](07-ops-runbook.md) 回填前仍然如此。
3. `_post` 抛错时（无 try/catch）根本执行不到 `setTimeout`，本地列表与预览都不会刷新。
