---
status: 补记
last-verified: 2026-07-13
sources:
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/components/RecordCard/RecordCard.tsx
  - app/components/GlobalRouteGuard.tsx
  - arkrog_backend/routers/record.js
  - arkrog_backend/routers/admin.js
  - arkrog_backend/docs/Permission.md
---

# ADR-0005：前端软守卫 + 后端硬门槛的权限分层

| | |
|---|---|
| 状态 | 补记（2026-07-13） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

无藏的写操作需要分级控制：提交记录、删除记录、全量重算。level 语义的权威定义在 `arkrog_backend/docs/Permission.md`（0=VISITOR … 3=CONTENT_ADMIN、4=ADMIN、5=SU、6=ROOT）。备选的前端方案是路由级守卫——仓库里确实存在 RouteGuard/routePermissions 子系统，但 `GlobalRouteGuard` 全仓库零生产引用（纯死代码），**无藏路由公开是因为根本没挂守卫，不是某条路由配置生效的结果**；该子系统的任何配置不得作为生效机制引用（详见 [auth-and-permissions.md](../../../../../docs/auth-and-permissions.md)）。

## 决策

权限分两层，语义不同：

- **前端只做渲染层软守卫**（决定"显示什么"）：`SubmitRecordForm` 在 `userInfo.level < 3` 时整体 `return null`；`RecordCard` 的删除图标仅 `level >= 4` 显示（def7203，2026-07-13，与后端对齐）；收藏/举报按钮对未登录用户改为 `openModal("login")`。
- **后端做硬门槛**（决定"允许什么"）：`routers/record.js` 的 `router.use` 要求登录且 level ≥ 3，`POST /delete` 处理器内再查 level ≥ 4；`routers/admin.js` 的 `requireAdminLevel` 要求 level ≥ 4。

## 后果

- 正面：UI 对低权限用户干净；越权请求（直接 curl）由后端兜底拒绝。
- 负面：
  - 同一阈值散落两端多处魔数，必须人工同步——def7203 本身就是一次"前端补齐对齐后端 15e6de6"的同步补丁；
  - "前端隐藏"与"后端拒绝"之间存在部署时差：线上后端仍是 3b04de7（无等级硬门槛），当前线上的真实防线只有前端隐藏（[known-issues](../known-issues.md) 第一节）；
  - RouteGuard 死代码持续误导读者以为存在路由级权限（已登记待处置）。

## 推翻条件

1. 引入更细粒度权限（如 L3 按资源授权，`Permission.md` 已定义该模型）前，先把散点阈值收敛为共享常量或由后端接口下发，消除双端魔数同步义务；
2. RouteGuard/routePermissions 子系统在未被显式接线并验证生效之前，不得在任何文档或代码注释中作为生效机制引用；启用它属于推翻本决策，需重开 ADR。
