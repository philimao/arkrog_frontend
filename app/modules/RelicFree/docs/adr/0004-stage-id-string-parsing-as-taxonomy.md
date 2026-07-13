---
status: 补记
last-verified: 2026-07-13
sources:
  - app/utils/stageSelector.ts
  - app/modules/RelicFree/Stage/index.tsx
  - app/modules/RelicFree/Stage/StageDetail.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - arkrog_backend/utils/appData/shared.js
  - arkrog_backend/utils/appData/stagePreview.js
---

# ADR-0004：以 stage id 字符串解析作为分类学基础

| | |
|---|---|
| 状态 | 补记（2026-07-13） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

解包数据里的关卡 id（`ro{n}_{类型}_{序号}[_变体]`，如 `ro4_b_5_d`）是全模块唯一稳定的关卡标识。要给关卡分层、分类、生成面包屑，备选是维护一张独立的分类元数据表（每关一行，人工登记层数/类型），或直接解析 id 字符串。

## 决策

直接解析。分段语义的权威文档见 [03-stage-taxonomy-and-selector.md](../03-stage-taxonomy-and-selector.md)；落地点横跨两仓库：

- 前端：`app/utils/stageSelector.ts` 的 `navOfZone` 七组筛选器全部 `stage.id.split("_")` 判段；`StagePage`/`StageDetail`/`SubmitRecordForm`/`RecordCard` 等处从 id 首段推导 rogueKey；
- 后端：`arkrog_backend/utils/appData/shared.js` 的 `skipStage`（前 3 层与三层 boss 不收录）、`stagePreview.js` 的 `buildPreloadData`（breadcrumb 生成）同样按分段解析。

配套的数量表也随之硬编码且**前后端双份**：前端 `stageSelector.ts` 的 `numOfMinorBoss` 与后端 `shared.js` 的 `numOfZone3Boss` 同值双份，必须人工同步。

## 后果

- 正面：新关卡只要符合命名语法即自动被正确分层，零登记成本。
- 负面：
  - rogueKey 推导存在两种写法并存——多数处 `"rogue_" + ro.slice(-1)`（**ro10 上线时产出 rogue_0**），仅 `SubmitRecordForm` 用 `replace("ro", "rogue_")` 安全；具体分布以 [generated/hardcode-snapshot.md](../generated/hardcode-snapshot.md) 为准，正文不写死处数；
  - 双份 boss 数量表漏改一侧即静默错位（筛选器漏关/面包屑错层），登记于 [version-sensitive-hardcode.md](../version-sensitive-hardcode.md)；
  - 上游若变更命名语法，全模块（含后端 skipStage、breadcrumb）同时静默崩坏，无任何报错。

## 推翻条件

1. 上游出现不符合 `ro{n}_…` 语法的关卡 id，或 ro10 主题上线（slice(-1) 写法击穿）——届时至少先把 rogueKey 推导统一为 replace 写法并收敛到单一工具函数，再评估是否需要分类元数据表；
2. 引入元数据表前，须先有对账手段证明表与解包数据一致（可扩展 docs:gen 生成物做对照），否则只是把"解析错误"换成"登记遗漏"。
