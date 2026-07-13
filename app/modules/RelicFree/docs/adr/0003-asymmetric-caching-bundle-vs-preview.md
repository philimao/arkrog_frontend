---
status: 补记
last-verified: 2026-07-13
sources:
  - arkrog_backend/routers/relic-free.js
  - arkrog_backend/middleware/optimization.js
  - arkrog_backend/utils/appData/stagePreview.js
  - app/stores/relicFreeStore.ts
---

# ADR-0003：bundle 强缓存 vs stage-preview 无缓存的不对称

| | |
|---|---|
| 状态 | 补记（2026-07-13） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

无藏前端要拉两类数据：一类是纯游戏数据（干员基础数据、关卡敌情），只随游戏版本更新变化，payload 大；另一类是 stagePreview——它混入了用户记录的派生值（各难度最少人数），随每次提交/删除变化。统一缓存策略会顾此失彼：全强缓存则最少人数过期，全不缓存则大 payload 每次重传。

## 决策

按数据性质拆端点、拆缓存（`arkrog_backend/routers/relic-free.js`）：

- `GET /relic-free/bundle`（中间件链 `getCharBasic → getStageEnemies → sendBundle`，只下发 `character_basic` 与 `stageEnemies`）挂 `strongCacheMiddleware(86400)`——HTTP 强缓存 1 天；
- `GET /relic-free/stage-preview` 不挂任何缓存中间件，每次直达服务端（服务端侧仍有 Redis appdata 永久缓存，由写路径主动更新）。

前端镜像这套不对称：`relicFreeStore.fetchRelicFreeData` 以 `relicFreeDataLoaded` 单次闩锁（会话内只拉一次 bundle），`fetchStagePreview` 提供 `force` 参数支持提交/删除后强制重取。`uniequip_basic` 不占端点，由前端从 `character_basic` 摊平派生。

## 后果

- 正面：大 payload 每客户端每天最多传一次；最少人数理论上"准实时"。
- 负面：
  - 游戏数据更新后，bundle 的强缓存导致最长 1 天的可见延迟（运维可感知，见 [07-ops-runbook.md](../07-ops-runbook.md)）；
  - stage-preview 的"无 HTTP 缓存"容易造成"它一定是新的"错觉——它的新鲜度实际取决于服务端写路径，fc2f75f~790afd6 断裂期间表现为**永不更新**而非慢更新（[known-issues](../known-issues.md) 第一节）；
  - 两个端点行为差异未在代码中注释，多次被当成 bug 排查。

## 推翻条件

1. 若 bundle 需要即时生效（如新主题上线当天），先引入版本化 URL 或 ETag 协商再动 maxAge，不要直接调小强缓存时长；
2. 不要"顺手"给 stage-preview 加强缓存——它承载提交后 2 秒刷新契约（[ADR-0006](0006-settimeout-2000-refresh-contract.md)），任何 HTTP 缓存都会让 `fetchStagePreview(true)` 拿到旧数据。
