---
last-verified: 2026-07-17
sources:
  - app/routes/RequireAuth.tsx
  - app/routes/AdminLayout.tsx
  - app/routes/HomeLayout.tsx
  - app/routes/RootLayout.tsx
  - app/routes.ts
  - app/modules/PageNav/PageNavbar.tsx
  - app/stores/userInfoStore.ts
  - app/utils/dom.ts
  - app/modules/TopNav/UserOrLogin.tsx
  - app/components/RouteGuard.tsx
  - app/components/GlobalRouteGuard.tsx
  - app/hooks/useRouteGuard.ts
  - app/config/routePermissions.ts
  - app/examples/RouteGuardExamples.tsx
  - app/docs/RouteGuard使用指南.md
  - app/components/RecordCard/RecordCard.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/modules/Tournament/index.tsx
  - ../arkrog_backend/docs/Permission.md
  - ../arkrog_backend/routers/record.js
  - ../arkrog_backend/routers/admin.js
  - ../arkrog_backend/routers/redis-admin.js
  - ../arkrog_backend/routers/user.js
  - ../arkrog_backend/routers/auditLog.js
  - ../arkrog_backend/routers/storage.js
  - ../arkrog_backend/storage/sts.js
  - ../arkrog_backend/routers/permission.ts
  - ../arkrog_backend/permission/grant.ts
---

# 全站鉴权与权限机制

本文回答一个问题：**这个站点上"谁能做什么"到底由哪些代码决定**。结论先行：

1. 权限的唯一数值载体是用户的 `level`（0–6），语义权威在后端 [`arkrog_backend/docs/Permission.md`](../../arkrog_backend/docs/Permission.md)（与本仓库同级目录）。
2. 前端真实生效的守卫只有很少几个：`RequireAuth`、`AdminLayout` 内的 `LevelGuard`、`PageNavbar` 的菜单过滤，以及散落在业务组件里的渲染层隐藏。它们全部是**软守卫**——只影响 UI，不构成安全边界。
3. 真正的安全边界在后端各 router 的中间件与处理器内检查；不同 router 的阈值写法并不一致，且存在无鉴权反例（见第 5 节对照表）。
4. 仓库里另有一整套**看起来像权限系统、实际零生产引用的死代码**（RouteGuard 子系统，见第 4 节）。它的配置不产生任何效果，勿据此理解或修改站点权限。

> 部署提示：本文一律以**本地 HEAD 现行代码**为准。2026-07-17 前后端已部署到当时最新（后端 `ba7fe38`，含 `/record` 三连安全修复与 `/storage` 守卫修复），第 5 节表格"线上（3b04de7）"列描述的安全缺口对该部署**已不适用**；但 **2026-07-17 的记录编辑 + 审计改造（`/record/edit`、`/audit-log` L4 守卫、record 域审计接线）在本文成文时尚未部署**——部署前线上仍无编辑端点、`/audit-log` 仍无鉴权。部署实态见[部署与环境矩阵](deployment-env-matrix.md)，滞后事项登记于[无藏 known-issues](../app/modules/RelicFree/docs/known-issues.md)。

## 1. level 0–6 语义（权威源：后端 Permission.md）

| Level | 名称 | 语义 |
|---|---|---|
| 0 | VISITOR | 游客，无权限 |
| 1 | USER | 注册用户，基础读权限 |
| 2 | LINKED | 绑定账号（B站）的用户，基础读权限 |
| 3 | CONTENT_ADMIN | **内容管理员**：无全局权限，需针对特定资源显式授权（如某个具体赛事） |
| 4 | ADMIN | 模块管理员：自动拥有整个资源类型的读/写/删权限 |
| 5 | SU | 超级管理员，拥有所有权限 |
| 6 | ROOT | 根管理员，拥有所有权限 |

两点纠偏（历史上多个调研切面在此猜错过）：

- **"提交记录门槛 ≥3"的语义是内容管理员**，不是"普通用户攒等级达标"。level 3 不存在自助升级路径。
- level 上限是 6。任何 `>= 10`、`>= 5 即 VIP` 之类的阈值（见第 4 节死代码里的 `permissionCheckers`）都与真实语义无关。

### level 的设置点（全部写路径）

| 触发 | 结果 | 代码位置 |
|---|---|---|
| 注册 `POST /user/register` | level = 1 | `arkrog_backend/routers/user.js` 的 register 处理器 |
| 绑定B站 `POST /user/link` | level = 2（同步更新 session） | 同上文件的 link 处理器 |
| 管理员授权 `POST /permission/grant`（需 L4+ 操作） | 被授权者 level < 3 时自动升为 3 | `arkrog_backend/permission/grant.ts` 的 `grantPermission` |
| level 4+ | **无任何接口路径**，只能直接改 Mongo `Users` 集合 | — |

注意 session 时效：`level` 在登录/注册/绑定时写入 `req.session.level`（`routers/user.js`），改库提升等级**不会**让已有会话即时生效，需重新登录（`/user/link` 例外，它同步改 session）。

## 2. 前端真实守卫清单

全站真实生效的前端守卫就是下面这些，全部围绕 `useUserInfoStore`（`app/stores/userInfoStore.ts`）的 `userInfo` / `loaded` 两个字段：

### 2.1 RequireAuth —— 登录守卫（页面级）

`app/routes/RequireAuth.tsx` 的 `RequireAuth`：

- `loaded === false` → 渲染 `null`（等待用户信息加载，见第 6 节失败模式）；
- `userInfo?.username` 为空 → 渲染内部组件 `RedirectComp`，在 `useEffect` 里 `navigate("/")`；
- 否则渲染 children。

全仓库只有两个挂载点（经 `SidebarLayout` 的 `wrap` prop）：

- `app/routes/HomeLayout.tsx`（`/home/*` 个人中心）；
- `app/routes/AdminLayout.tsx`（`/admin/*`，与 LevelGuard 叠加）。

其余一切路由（含 `/relic-free`、`/tournament/create` 等）**没有页面级登录守卫**——它们公开是因为根本没挂守卫，不是任何配置声明的结果。

### 2.2 LevelGuard —— 管理后台等级守卫

`app/routes/AdminLayout.tsx` 内部定义 `ADMIN_MIN_LEVEL = 4` 与组件 `LevelGuard`：`loaded` 且 `level < 4` 时 `navigate("/", { replace: true })`，未加载或不达标一律渲染 `null`。`AdminLayout` 的包装顺序是 `RequireAuth` 外层、`LevelGuard` 内层。

### 2.3 PageNavbar minLevel —— 纯菜单可见性

`app/modules/PageNav/PageNavbar.tsx` 用 `pages.filter(page => page.minLevel === undefined || userLevel >= page.minLevel)` 过滤顶部导航。`minLevel` 定义在 `app/routes.ts` 的 `pages` 数组，目前**仅 `/admin` 一项**声明了 `minLevel: 4`。

这只是"菜单里看不看得到"，对 URL 直达没有任何拦截作用（`/admin` 直达由 2.2 兜住，其他页面无兜底）。

### 2.4 业务组件级隐藏（渲染层软守卫）

| 操作入口 | 条件 | 代码位置 |
|---|---|---|
| 无藏提交记录表单 | 提交模式 `level < 3` 时整个表单 `return null`；编辑模式（2026-07-17 起同组件复用）要求 `level >= 4` 或（`level >= 3` 且 `record.submitterId === userInfo.userId`） | `app/modules/RelicFree/Stage/SubmitRecordForm.tsx` |
| 记录编辑图标（桌面 + 移动两处，删除图标左侧） | `level >= 4` 或（`level >= 3` 且本人提交），2026-07-17 新增 | `app/components/RecordCard/RecordCard.tsx` |
| 记录删除图标（桌面 + 移动两处） | `level >= 4` 才渲染（`def7203`，2026-07-13 起的现行口径） | `app/components/RecordCard/RecordCard.tsx` |
| 记录收藏 / 举报按钮 | 未登录（`!userInfo?.level`）点击时 `openModal("login")`，见第 7 节 | 同上 |
| 赛事编辑入口 | `level > 3`（即 ≥4）才显示 `editable` | `app/modules/Tournament/index.tsx` 的 `editable` 判断、`app/modules/Tournament/TournamentEdit/index.tsx` |

以上全部只是"不给你看按钮"。绕过 UI 直接调接口时，唯一拦截来自后端（第 5 节）。

## 3. 加载链路：守卫依赖谁

`app/routes/RootLayout.tsx` 在首屏 `useEffect` 里 `await fetchUserInfo()` 后才结束全局 Loading。`fetchUserInfo`（`app/stores/userInfoStore.ts`）调 `POST /user/id`：有会话返回用户信息，无会话返回 204 → 落入 `defaultUserInfo`；两种情况都会 `set({ loaded: true })`。所有守卫的 `loaded` 闩锁都由这一次调用打开。

## 4. RouteGuard 子系统：死代码宣告

仓库中存在一套从未接入生产的"路由守卫系统"。**其中任何配置都不生效**，包括 `app/config/routePermissions.ts` 里 `"/relic-free": {}`、`"/home": { requireAuth: true }` 之类看似权威的声明。

零生产引用的核实方式：对 `RouteGuard`、`GlobalRouteGuard`、`useRouteGuard`、`routePermissions`、`getRoutePermission`、`permissionCheckers`、`checkRoutePermission`、`withRouteGuard` 做全仓库 grep（核实于 2026-07-13），命中范围是一个封闭的自引用集合，没有任何路由文件、布局或业务组件导入它们：

| 文件 | 内容 | 引用方 |
|---|---|---|
| `app/components/RouteGuard.tsx` | `RouteGuard` 组件、`withRouteGuard` HOC、`RouteGuardConfig` 类型 | 仅下列文件 |
| `app/components/GlobalRouteGuard.tsx` | 按 `getRoutePermission(location.pathname)` 自动套 `RouteGuard` | **零导入方** |
| `app/hooks/useRouteGuard.ts` | `useRouteGuard` Hook、`checkRoutePermission` | 仅 examples |
| `app/config/routePermissions.ts` | `routePermissions` 路由配置表、`getRoutePermission`、`permissionCheckers` | 仅子系统内部 + examples |
| `app/examples/RouteGuardExamples.tsx` | 用法示例 | **零导入方** |
| `app/docs/RouteGuard使用指南.md` | 描述该子系统的使用文档 | （文档） |

从未接入的旁证：`routePermissions.ts` 的 `permissionCheckers.isAdmin` 阈值是 `level >= 10`、`isVIP` 是 `level >= 5`——与第 1 节的真实语义（上限 6，管理员 4）从未对齐过。

**处置**（[无藏文档计划](relic-free-doc-plan.md)第六节问题 2 待维护者裁决"删除 vs 启用"）：

- [`app/docs/RouteGuard使用指南.md`](../app/docs/RouteGuard使用指南.md) 应加"机制从未启用"的过时横幅，过渡期后与上表五个源码文件一并删除；
- 裁决之前的行为准则：新页面若需要权限控制，沿用 `RequireAuth` / `LevelGuard` 模式（第 2 节），**不要**通过给 `routePermissions.ts` 加条目来"配置"权限——那不会有任何效果。

## 5. 前端软守卫 vs 后端硬门槛对照表

后端才是安全边界。下表"后端门槛"以本地 HEAD 为准；"线上"列为 2026-07-13 登服务器核实的 `3b04de7` 部署实态。

| 操作 | 前端软守卫 | 后端硬门槛（本地 HEAD） | 线上（3b04de7） |
|---|---|---|---|
| 读记录 `POST /record/`、`POST /record/ids` | 无 | 无（守卫中间件挂在这两个路由**之后**，属刻意公开） | 同 |
| 提交记录 `POST /record/submit` | SubmitRecordForm `level >= 3` 才渲染 | `routers/record.js` 的 `router.use`：登录 + `level >= 3`；另有 `submitFields` 白名单与 URL 协议校验 | **无守卫** |
| 删除记录 `POST /record/delete` | RecordCard 删除图标 `level >= 4` | 同上 L3 中间件 + 处理器内 `level >= 4` 双守卫；2026-07-17 起写审计 delete | **无守卫** |
| 编辑记录 `POST /record/edit`（2026-07-17 新增） | RecordCard 编辑图标 / 编辑表单：`level >= 4` 或（`level >= 3` 且本人提交） | 同上 L3 中间件 + 处理器内 `level >= 4 \|\| 本人记录` 双守卫；写审计 update | **端点不存在**（未部署） |
| 管理后台 `/admin/*` | LevelGuard `>= 4` + 菜单 `minLevel: 4` | `routers/admin.js` 的 `requireAdminLevel`：登录 + `level >= 4` | 同 |
| 缓存管理 `/redis-admin/*` | 无任何 UI 入口（只能 curl） | `routers/redis-admin.js` 的 `router.use`：`level <= 4` 拒绝 → **实际要求 L5+** | 同 |
| 权限授予/撤销 `POST /permission/grant`、`/revoke` | 赛事权限页（L4+ 才可见） | `routers/permission.ts` 的 `requireAdminLevel`：`level >= 4` | 同 |
| 举报/反馈 `POST /user/feedback` | ReportModal（登录后可用） | 仅 `routers/user.js` 的 `router.use` 登录检查，**无等级门槛**；且 `stageId` 被 insertOne 字段清单丢弃（["写入即黑洞"](../app/modules/RelicFree/docs/known-issues.md)） | 同 |
| 审计日志 `GET /audit-log/*` | 仅 admin 页有展示组件（赛事审计 + 无藏审计，均在 L4 后台内） | `routers/auditLog.js` 前置 `router.use`：登录（401）+ `level >= 4`（403）（2026-07-17 修复；此前完全无鉴权，游客可读全部审计日志） | **无鉴权**（修复未部署） |
| COS 桶信息/临时凭证 `GET /storage/bucket`、`GET /storage/sts` | —（上传 UI 入口仅存在于赛事表单，见 2.4） | `routers/storage.js` 的 `router.use`：登录（401）+ `level >= 3`（403），覆盖两个端点；`/sts` 按调用者实际等级签发凭证（`storage/sts.js` 的 `getSts({ level })`：L3 仅 `tournament/*` 上传，L4+ 才有全桶写 + DeleteObject） | **无守卫**，且按硬编码 `level: 6` 签发最大权限凭证（含删除） |

要点：

- **`/admin`（`>= 4`）与 `/redis-admin`（`> 4`）阈值一字之差**：前者 L4 可用，后者实际要求 L5。若这是刻意设计（Redis 操作只留给 SU），应在改动任一侧前先确认；若是笔误，属待修复项。
- `/user/feedback` 是"前端看起来受控、后端只设登录"的反例，评审任何新端点时以它为鉴。`/audit-log` 与 `/storage/sts` 曾是另外两个反例：`/storage/sts` 于 2026-07-13 修复（登录 + L3 守卫、按实际等级签发凭证，已随 2026-07-17 部署上线）；`/audit-log` 于 2026-07-17 修复（登录 + L4 守卫，**尚未部署**）。
- 前端阈值改动必须与后端同步评审：`def7203` 把删除图标从旧阈值收紧到 `level >= 4`，正是为了与后端 `/record/delete` 的 L4 硬门槛对齐。

## 6. 失败模式：fetchUserInfo 失败 → 受守卫页面永久空白

`fetchUserInfo`（`app/stores/userInfoStore.ts`）的 `catch` 分支只 `console.error` + toast（"加载用户信息失败！"），**不设置 `loaded: true`**。后果链：

1. `RootLayout` 的预载 `run()` 因错误被吞而正常 resolve，全局 Loading 结束，页面外壳照常渲染；
2. 但 `RequireAuth` 与 `LevelGuard` 都以 `!loaded → return null` 兜底，闩锁永远打不开；
3. `/home/*`、`/admin/*` 从此渲染空白，无重试、无提示（除了早已消失的 toast）。

排查特征：站点其他页面一切正常、仅个人中心/后台空白 → 优先查 `/user/id` 请求是否异常（网络层失败或非 2xx 均走 catch）。

## 7. 未登录引导约定：openModal("login")

组件内"操作级"拦截统一走 `app/utils/dom.ts` 的 `openModal("login")`：它按 DOM id 找到触发按钮并 `click()`，弹出登录框（`app/modules/TopNav/LoginModal.tsx`，由 `app/modules/TopNav/UserOrLogin.tsx` 以 `id="login"` 挂载）。RecordCard 的收藏/举报、SeedCard、种子提交表单等均沿用此约定。

两条纪律：

- **页面级**用 `RequireAuth`（静默重定向回首页），**操作级**用 `openModal("login")`（留在原地弹登录框）——不要混用；
- `openModal` 是 DOM-id 全局契约：目标 modal 未挂载时 `document.getElementById(id)?.click()` 静默 no-op，不会报错。新增调用点前确认对应 modal 在当前布局树内。

## 相关文档

- [部署与环境矩阵](deployment-env-matrix.md) —— 线上部署版本、进程与端口实态
- [无藏记录生命周期与 schema](../app/modules/RelicFree/docs/02-record-lifecycle-and-schema.md) —— 记录提交/删除的完整权限与副作用
- [无藏 known-issues](../app/modules/RelicFree/docs/known-issues.md) —— 部署滞后、举报黑洞等登记簿
- [`arkrog_backend/docs/Permission.md`](../../arkrog_backend/docs/Permission.md) —— level 语义与资源授权模型权威源
