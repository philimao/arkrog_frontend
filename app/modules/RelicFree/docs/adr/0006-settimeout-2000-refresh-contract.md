---
status: 补记
last-verified: 2026-07-13
sources:
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/components/RecordCard/RecordCard.tsx
  - app/stores/relicFreeStore.ts
  - arkrog_backend/routers/record.js
  - arkrog_backend/utils/appData/stagePreview.js
---

# ADR-0006：setTimeout(2000) 时序契约

| | |
|---|---|
| 状态 | 补记（2026-07-13） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

提交/删除记录后，关卡的"最高难度最少人数"（stagePreview）需要重算。后端把重算做成**非阻塞旁路**：`routers/record.js` 的 `/submit`、`/delete` 先返回响应，`stagePreviewSingleUpdate(stageId).catch(...)` 在后台执行，完成时间对前端不可知。前端需要一个时机去重取 stagePreview，备选：轮询、后端在响应里带回重算结果、或赌一个固定延迟。

## 决策

赌固定延迟。前端两处写操作成功后 `setTimeout(() => fetchStagePreview(true), 2000)`：

- `app/modules/RelicFree/Stage/SubmitRecordForm.tsx` 的 `handleSubmit`；
- `app/components/RecordCard/RecordCard.tsx` 的 `handleDeleteRecord`。

`fetchStagePreview(true)` 的 `force` 参数绕过 store 闩锁强制重取（该端点无 HTTP 缓存，见 [ADR-0003](0003-asymmetric-caching-bundle-vs-preview.md)），赌的是后端 2 秒内完成单关重算并写回缓存。

## 后果

- 正面：实现只有三行，覆盖了绝大多数情况（单关重算通常远快于 2 秒）。
- 负面：
  - 契约建立在猜测上：重算慢于 2 秒（冷缓存、DB 抖动）时用户看到旧的最少人数，且无重试；
  - fc2f75f~790afd6 断裂期间后端重算 100% 失败，这个 2 秒刷新**每次都拿回旧数据**——契约完全落空却无任何报错（[known-issues](../known-issues.md) 第一节）；
  - 提交/删除的 `_post` 无 try/catch，请求失败时抛错早退，setTimeout 根本不会注册——失败路径与成功路径的行为差异是隐式的（[known-issues](../known-issues.md) 第五节）。

## 推翻条件

**790afd6 部署且数据回填完成后，本契约应被推翻，改为响应驱动**：

1. 后端 `/submit`、`/delete` 等待（或在完成后另行通知）`stagePreviewSingleUpdate`，在响应中直接返回重算后的 `stagePreview[stageId]`；
2. 前端据响应更新 store，删除两处 setTimeout；
3. 验证方法：提交后立即断网，最少人数仍正确更新（证明不再依赖二次请求）。

在此之前（尤其线上仍跑断裂代码期间），保持 2 秒契约现状，**不要调小延迟或加轮询**——那只会更频繁地拿回旧数据。
