---
status: 补记
last-verified: 2026-07-13
sources:
  - arkrog_backend/routers/record.js
  - arkrog_backend/utils/record.js
  - arkrog_backend/utils/pendingTournaments/index.js
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
---

# ADR-0001：提交即发布，无审核流

| | |
|---|---|
| 状态 | 补记（2026-07-13） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

无藏记录本质是"外部视频链接 + 队伍组成"的索引条目，正文内容（视频）托管在 B 站/YouTube。备选方案有两种：像赛事域那样走待审核队列（同仓库已有 `utils/pendingTournaments` 的 pending→approve/reject 流程可参照），或提交后直接可见。

## 决策

提交即发布。`arkrog_backend/routers/record.js` 的 `POST /submit` 在 `setRaiderInfo` 解析成功（`data.code === 0`）后直接 `insertOne` 落库并返回该关全部记录；Records 文档没有 status/pending/reviewed 任何审核字段，全仓库也没有针对记录的审核队列或后台页。前端 `SubmitRecordForm.handleSubmit` 拿到返回值即 `setRecords` 上屏——提交者和所有访客同一秒看到新记录。

质量兜底不靠审核，靠**准入门槛**：提交要求 level ≥ 3（CONTENT_ADMIN，语义见 `arkrog_backend/docs/Permission.md`），即提交人本身就是内容管理员；外加提交表单的五步校验链与链接解析（见 [05-submit-form-and-links.md](../05-submit-form-and-links.md)）。

## 后果

- 正面：零审核运营成本；提交者即时看到成果，无"审核中"状态需要维护。
- 负面：
  - 错误/低质记录只能事后删除，而删除门槛是 level ≥ 4 且为硬删除、无审计（见 [known-issues](../known-issues.md) 第七节双缺口）；
  - 举报通道本应是"事后纠错"的补偿机制，实际写入即黑洞（[known-issues](../known-issues.md) 第三节），放大了无审核的风险；
  - 该决策成立的前提是"提交人皆为受信管理员"——线上部署滞后期间 `/record/submit` 只查登录不查等级（[known-issues](../known-issues.md) 第一节），前提实际上被击穿。

## 推翻条件

1. 提交门槛下放到 level 1/2 普通用户之前，**必须**先建审核流（可直接参照赛事域 `pendingTournaments` 的数据形态与审批端点），不允许"先开闸再补审核"；
2. 或出现成规模的恶意/低质提交证据（需要可统计的举报或删除记录——这又以修复举报黑洞与接入删除审计为前提）。
