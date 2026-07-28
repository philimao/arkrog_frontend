---
last-verified: 2026-07-17
sources:
  - app/components/RecordCard/RecordCard.tsx
  - app/components/RecordCard/CharAvatar.tsx
  - app/components/RecordCard/RecordTypeLabel.tsx
  - app/modules/RecordDisplay/index.tsx
  - app/modules/RecordDisplay/ReportModal.tsx
  - app/modules/IndexPage/IndexRelicFree/index.tsx
  - app/modules/Home/Favorite/index.tsx
  - app/modules/RelicFree/Stage/index.tsx
  - app/routes/GlobalModals.tsx
  - app/modules/TopNav/UserOrLogin.tsx
  - app/components/Modal/index.tsx
  - app/utils/dom.ts
  - app/utils/tools.ts
  - app/stores/recordStore.tsx
  - app/stores/relicFreeStore.ts
  - app/stores/appDataStore.ts
  - app/stores/gameDataStore.ts
  - app/types/constant.ts
  - public/images/card/
  - arkrog_backend/docs/Permission.md
---

# 04 RecordCard 与 RecordDisplay 复用契约

本文回答一个问题：**记录卡片被哪些页面复用、以什么 props 契约复用，以及"共享组件"名义下藏着哪些模块耦合与延迟引爆点。**

先说三个事关全局的事实：

- `RecordCard` 虽然放在 `app/components/`，但它**反向依赖无藏模块的 store**（删除后强刷 `relicFreeStore.fetchStagePreview`），不是通用组件，不要当通用组件复用到无藏域之外。
- `setRecords` 是可选 prop，未传时删除成功后卡片留在原地；**三个消费入口现均传入**（首页 `IndexRelicFree` 于 2026-07-13 补传，此前首页删除后卡片不消失）。
- `!record` 灰色占位分支在现有全部调用链**不可达**；曾跟在其后的条件 Hook 已于 2026-07-13 全部提到早退之前，激活占位分支不再有崩溃风险（见 [第 7 节](#7-record-占位分支与条件-hook-违规)）。

> 路径约定：`app/...` 相对于前端仓库根；`arkrog_backend/...` 指后端仓库。引用代码一律"路径 + 导出符号"。
>
> ⚠️ 本篇标注"2026-07-13"的各处修复——**以下修复均未部署**：线上仍运行旧版前端，线上行为以旧代码为准（登记与部署状态见 [known-issues.md](known-issues.md)）。

## 1. 组件分工与三个消费入口

两层组件的职责边界：

- `app/modules/RecordDisplay/index.tsx` 的 `RecordDisplay`：**列表编排层**。按 `app/types/constant.ts` 的 `StageTypes` 键序（normal→elite→boat）把记录分组为 `RecordsByType`，组内排序为"难度降序（`StageLevels` 逆序）→ 人数升序"；`isStagePage` 时渲染组头徽标——`optimalTeamNum`（该作战类型在**最高有记录难度下的最少人数**，`StageLevels` 逐难度取 `min(team.length)` 后 `findLast(num => num < 14)`）；`cols=2` 时套 `xl:grid-cols-2` 网格。
- `app/components/RecordCard/RecordCard.tsx` 的 `RecordCard`：**单卡渲染 + 全部操作**（收藏/举报/删除/跳转原址）。子件 `CharAvatar`（半身像 + 技能/模组角标，`memberData` 缺省时渲染 `noinfo` 占位补齐队形）与 `RecordTypeLabel`（紧急/带船标签，normal 不渲染）。

三个消费入口（全仓仅此三处，`RecordCard` 的直接导入方只有 `RecordDisplay` 与 `IndexRelicFree`）：

| 入口 | 路径 | 经由 | `isStagePage` | `setRecords` | 行为差异 |
|---|---|---|---|---|---|
| 关卡页 | `app/modules/RelicFree/Stage/index.tsx` 的 `StagePage` | `RecordDisplay` | `true` | 传 | 组头徽标渲染；卡片上方**不**渲染关卡名标题行；删除后卡片局部消失 |
| 收藏页 | `app/modules/Home/Favorite/index.tsx` 的 `FavoritePage` | `RecordDisplay cols={2}` | 未传（`undefined`） | 传（包装 setter，把删除换算回槽位数组） | 无组头；卡片尝试反查关卡名标题行；删除后卡片消失（该页分页/合并/无限请求缺陷组已于 2026-07-13 修复，见 [known-issues.md](known-issues.md)） |
| 首页 | `app/modules/IndexPage/IndexRelicFree/index.tsx` 的 `IndexRelicFree` | 直接渲染 `RecordCard` | `false` | 传（2026-07-13 补，按当前标签页取 `setRecommend`/`setLatest`） | 卡片尝试反查关卡名标题行；删除后卡片即时消失（只剔除当前标签页列表——同一记录若同时在"推荐"与"最新"，另一标签页的卡片残留至刷新） |

## 2. props 语义

`RecordCard` 的三个 props 均影响行为分支：

| prop | 类型 | 语义 |
|---|---|---|
| `isStagePage?` | `boolean` | `true`：跳过 `stageData` 反查（关卡页自己有标题）；falsy（含 `undefined`）：`useEffect` 从 `gameDataStore.stages` 按 `record.stageId` 反查关卡名，成功才渲染卡片上方"`{n}人-{类型}-{关卡名}`"标题行 |
| `record?` | `RecordType` | 现有调用链恒有值；`undefined` 走灰色占位分支（仍不可达；Hook 违规已修，第 7 节） |
| `setRecords?` | `Dispatch<SetStateAction<RecordType[]>>` | 删除成功后 `setRecords?.((prev) => prev.filter(...))` 从本地列表剔除，记录不在列表时天然 no-op（2026-07-13 起；此前 `findIndex`+`splice` 在未命中时 `splice(-1, 1)` 会**误删列表末尾元素**）；未传时静默跳过 |

`RecordDisplay` 的 `setRecords` 是必传 prop（类型上无 `?`）；绕过 `RecordDisplay` 直用 `RecordCard` 的首页入口也已补传（2026-07-13），三个入口删除后本地列表均即时剔除。

### 2.1 标题行静默不渲染

反查 `useEffect` 的守卫是 `if (isStagePage || !stages || !record) return`，且依赖数组只有 `[isStagePage]`——**只在挂载时尝试一次，`stages` 后到也不重试**。而 `gameDataStore.fetchGameDataBasic` 只在 `relic-free`/`tool`/`tournament` 路由的 preload 触发（见 [01-architecture-and-data-flow.md](01-architecture-and-data-flow.md) 第 3 节），首页与 `/home/favorite` 都不加载它。结果：

- 冷启动直达首页或收藏页：`stages` 为 `undefined`，标题行**永不出现**，无任何报错；
- 先逛过无藏/工具/赛事页再 SPA 切换过来：`stages` 已就位，标题行正常。

同款静默还有一处：反查用的主题键推导是 `"rogue_" + record.stageId.split("_")[0].slice(-1)`（`ReportModal` 反查关卡名同此写法），ro10 主题会推导出 `rogue_0` 而查空。rogueKey 两种写法的全仓分布以 [generated/hardcode-snapshot.md](generated/hardcode-snapshot.md) 为准，正文见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)。

## 3. 逆向耦合：共享组件依赖模块 store

`RecordCard` 顶部 `useRelicFreeStore` 取 `fetchStagePreview`，删除成功后：

```
setTimeout(() => { fetchStagePreview(true); }, 2000);
```

这意味着：

- **依赖方向倒挂**：`app/components/` 下的"共享"组件依赖 `app/stores/relicFreeStore.ts`（无藏模块状态）。在首页/收藏页删除记录，同样会触发无藏预览的强刷——行为上是对的（删除确实影响选择页徽标），但组件因此**不可脱离无藏域复用**。
- 2 秒 `setTimeout` 是与后端 `stagePreviewSingleUpdate` 增量重算的**时序约定**而非响应驱动（取舍记录见本模块 adr/ 目录 0006）；该后端链路的断裂与修复部署状态见 [known-issues.md](known-issues.md) 与 [06-data-pipeline.md](06-data-pipeline.md)。
- 此外 `RecordCard` 还消费 `gameDataStore.stages`（标题反查）与 `appDataStore.charImages`（背景立绘，第 5 节）——单卡组件横跨三个 store。

## 4. 操作权限矩阵与 openModal DOM-id 契约

操作按钮的门槛全部是**前端渲染层软守卫**；后端硬门槛在 arkrog_backend/routers/record.js（本地 HEAD 与线上部署版本存在差异），对照表见 [02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md)。等级语义以 arkrog_backend/docs/Permission.md 为权威（0=VISITOR、1=USER、2=LINKED、3=CONTENT_ADMIN、4=ADMIN、5=SU、6=ROOT）。

| 操作 | 前端门槛 | 行为 | 端点 |
|---|---|---|---|
| 收藏（星标） | `!userInfo?.level` 时 `openModal("login")`——未登录**与 level 0（VISITOR）等价对待** | `handleStarRecord` 按当前是否已收藏发 `add`/`remove`，成功后 `updateUserInfo({ favorite })` 就地更新星标 | `POST /user/favorite` |
| 举报 | 同上 | `recordStore.setActiveRecord(record)` → `openModal("report-modal")`；`ReportModal` 从 `recordStore.activeRecord` 取卡片信息 | `POST /user/feedback` |
| 编辑（2026-07-17 新增，删除图标左侧） | `level >= 4` 或（`level >= 3` 且 `record.submitterId === userInfo.userId`），即 **ADMIN 任意记录 / CONTENT_ADMIN 本人记录**（桌面/移动两处同判，`canEdit` 单点计算） | `setIsEditing(true)` → 卡内条件渲染 `SubmitRecordForm`（编辑模式，不走 openModal DOM-id 契约）→ 保存成功按 `_id` 原位更新本地列表 → 2 秒后强刷预览；编辑链路详解见 [02 §4.3](02-record-lifecycle-and-schema.md) | `POST /record/edit` |
| 删除 | `userInfo?.level !== undefined && userInfo?.level >= 4`（**ADMIN 及以上才渲染删除图标**，桌面/移动两处同判） | `window.confirm` → 删除（2026-07-13 补 try/catch，失败 `toast.error` 后中止、不动本地列表）→ `setRecords?.` 剔除 → 自己收藏过该记录时调 `/user/favorite` remove 自清（失败仅 `toast.warning`）→ 2 秒后强刷预览 | `POST /record/delete` |

**openModal 的 DOM-id 全局契约**（`app/utils/dom.ts` 的 `openModal`）：`openModal(id)` 等价于 `document.getElementById(id)?.click()`，点击的是 `app/components/Modal/index.tsx` 的 `ModalTemplate` 渲染的隐藏触发按钮。两个 id 的注册点：

- `"login"` → `app/modules/TopNav/UserOrLogin.tsx` 挂载的 `LoginModal id="login"`（顶部导航常驻）；
- `"report-modal"` → `app/routes/GlobalModals.tsx` 挂载的 `ReportModal id="report-modal"`（RootLayout 常驻）。

id 拼写与挂载位置是隐式约定：改任何一端（id 字符串、GlobalModals 挂载）都会让按钮点击**静默无效**（`?.click()` 吞掉未命中）。另注意 `recordStore.clearActiveRecord` 全仓零调用——举报弹窗关闭后 `activeRecord` 残留，再次打开前若未 `setActiveRecord` 会显示上一张卡。

举报链路的定性：**写入即黑洞**——`Feedback` 集合全仓库无读取方、成功 toast 承诺的"个人中心回执"对应静态 stub。写入侧已修（2026-07-13）：`ReportModal` 按 `{ message, stageId, recordId }` 契约提交、后端 insertOne 落库定位字段（此前 `stageId` 被字段清单丢弃且不提交 recordId）；读取端环节未修。完整登记见 [known-issues.md](known-issues.md)。

## 5. 主题化静态资源清单与背景立绘非确定性

### 5.1 资源清单

卡片主题键 `ro = "rogue_" + record.stageId.split("_")[0].slice(-1)`（2.1 节的 ro10 隐患同样适用）。缺失资源全部表现为 CSS `background-image`/`<img>` 404 **静默失败**，新主题上线对账见 [new-topic-checklist.md](new-topic-checklist.md)。

| 资源 | 路径模式 | 托管 | 消费方 |
|---|---|---|---|
| 左上装饰 / 右下装饰 / 主题 logo（每主题三图） | `/images/card/{ro}_deco_l.png`、`{ro}_deco_r.png`、`{ro}_logo.png` | 前端 `public/images/card/` | `RecordCard` 装饰层 styled components |
| 点阵层 | `/images/card/dots.png` | 同上 | `RecordCard`（主题无关） |
| 头像底图 / 占位 | `/images/card/noinfo.png`、`noinfo-bust.png`、`no-uniequip.png` | 同上 | `CharAvatar` |
| 半身像 / 技能图标 / 模组小图 | `imageHost + getPath("半身像_{干员名}_1.png")` 等（MD5 分桶路径） | **外部 prts.wiki** | `CharAvatar`（外链依赖，见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)） |
| 背景立绘 | `${VITE_API_BASE_URL}/images/char/{charId}.png`，兜底 `char_1035_wisdel` | 后端 `public/images/char/` | `RecordCard` 背景 |
| 主题横幅 | `${VITE_API_BASE_URL}/images/topic_banner/{topicId}.jpg` | 后端 `public/images/topic_banner/` | **`SelectorBanner`（关卡选择页），列入本表仅为主题化资源对账完整**；卡片本体不用它 |

截至本文核实日（见 frontmatter），前端 `public/images/card/` 仅有 `rogue_1`~`rogue_4` 的三图，**`rogue_5`（界园）三图缺失**——界园记录卡当前渲染为无装饰、无 logo 的裸卡，无任何报错。

### 5.2 背景立绘：team ∩ charImages 随机选取

背景立绘的选取逻辑：

```
availableBg = findDuplicates([...record.team.map(m => m.charId), ...(charImages || [])])
charId = availableBg.length ? availableBg[Math.floor(availableBg.length * Math.random())] : "char_1035_wisdel"
```

即取**队伍干员与后端已裁剪立绘清单（`appDataStore.charImages`，来自 `GET /app/bundle`）的交集**，再 `Math.random()` 随机挑一张；交集为空则默认维什戴尔。两层非确定性：

1. **每次 render 重新掷骰**——`showNote` 切换、resize 触发的 state 变化都会换背景，同一张卡两次打开不保证同图；
2. **依赖导航历史**——`fetchAppData` 只在首页 preload 触发（无藏路由不加载它），冷启动直达关卡页时 `charImages` 为 `undefined`，交集恒空，**背景恒为维什戴尔**；先逛过首页再进来才有随机立绘。

## 6. 桌面/移动双套操作栏

操作栏存在**两份重复实现**，同改必须两处同步：

- 桌面：卡片内右侧 `StyledCardActions`（`hidden sm:flex`），收藏/举报/编辑/删除四图标 + "跳转原址"；
- 移动：卡片下方独立条（`flex sm:hidden`），同样四图标 + "跳转原址"，另加"查看备注"开关（`showNote`，桌面版备注直接内嵌在左信息区）。

各按钮的 onClick 逻辑（含登录守卫、level 判断）在两处**逐字重复**——改权限门槛或换弹窗 id 时漏改另一套是现实风险（编辑按钮的 `canEdit` 已提升为组件级单点计算，两处只重复渲染判断）。移动条里还挂着一个 `ModalTemplate triggerId={record._id}` 的备注弹窗，其隐藏触发按钮全仓无人 `openModal(record._id)`，属死标记。

## 7. `!record` 占位分支与条件 Hook 违规

`RecordCard` 组件体中段（全部 Hook 之后）有：

```
if (!record) {
  return <div className="w-full h-72 mb-4 p-8 last-of-type:mb-0 bg-[#181818CC]"></div>;
}
```

两个事实：

1. **现有调用链不可达**：三个入口都在 `records.map` 中渲染卡片，`record` 恒有值。这个灰色占位块看上去是为"骨架屏/加载占位"预留的，但从未被启用。
2. **Hook 违规已修（2026-07-13）**：该 early return 曾位于 `useState(singleRow)`、`useState(doubleRowPatchNum)`、`useEffect`（resize 监听）三次 Hook 调用**之前**，占位/有值两条渲染路径 Hook 数量不同——一旦调用点让同一实例在 `undefined` 与有值间切换（占位 → 数据到达），React 直接抛 "Rendered more hooks than during the previous render"。现三次 Hook 已全部提到早退之前（初始值以 `record?.team.length ?? 0` 兜底，resize handler 对 `!record` 直接 return），启用占位分支不再需要前置改造。修复状态见 [known-issues.md](known-issues.md)。
