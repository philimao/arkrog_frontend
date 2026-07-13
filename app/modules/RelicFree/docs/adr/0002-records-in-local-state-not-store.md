---
status: 补记
last-verified: 2026-07-13
sources:
  - app/modules/RelicFree/Stage/index.tsx
  - app/modules/RelicFree/Stage/StageDetail.tsx
  - app/modules/RelicFree/Stage/SubmitRecordForm.tsx
  - app/modules/RecordDisplay/index.tsx
  - app/components/RecordCard/RecordCard.tsx
  - app/stores/recordStore.tsx
  - app/modules/Home/Favorite/index.tsx
---

# ADR-0002：记录列表放局部 state，不进 store

| | |
|---|---|
| 状态 | 补记（2026-07-13） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

本模块的其他数据（character_basic、stagePreview、stageEnemies）都走 zustand store（relicFreeStore），沿这个惯例把记录列表也放 store 是自然备选。但记录列表是**强路由局部**数据：每个 stageId 一份、切关即换、跨页面不共享，进 store 反而要处理缓存失效。

## 决策

记录列表用页面局部 state：`app/modules/RelicFree/Stage/index.tsx` 的 `StagePage` 持有 `useState<RecordType[]>`，`setRecords` 作为 prop 沿两条链下传——`StageDetail → SubmitRecordForm`（提交后用后端返回的全量列表整体替换）与 `RecordDisplay → RecordCard`（删除后本地 splice）。zustand 的 `recordStore` 刻意只存 `activeRecord` 一项（举报弹窗跨组件传当前卡片用），不存列表。

这是**刻意设计**而非疏漏：切换关卡时局部 state 随组件卸载自动丢弃，天然没有失效问题。

## 后果

- 正面：无缓存失效逻辑；数据流向单一（后端返回值 → setState → 渲染）。
- 负面：
  - `setRecords` prop 链穿透三层，RecordCard 作为共享组件被迫把它声明为可选——首页 `IndexRelicFree` 不传 `setRecords`，删除成功后 UI 不刷新（见 [04-record-card-and-display.md](../04-record-card-and-display.md)）；
  - 收藏页 `FavoritePage` 只能自建一套平行的 records state + `mergeArray` 分页合并，孵化了整组缺陷（[known-issues](../known-issues.md) 第四节）；
  - 提交/删除后的 stagePreview 联动无法走同一条 state 链，被迫另立 setTimeout 契约（[ADR-0006](0006-settimeout-2000-refresh-contract.md)）。

## 推翻条件

若要把记录列表收进 store（做跨页缓存或乐观更新），必须先：

1. 给出关卡页/首页/收藏页三个消费入口的统一数据形态与失效策略（尤其收藏页按 id 批量取数与关卡页按 stageId 取数的并存）；
2. 一并重新设计 RecordCard 的 `setRecords?` 可选契约，消除"传了才刷 UI"的分叉；
3. 保证删除路径的 UI 同步不再依赖 `splice(findIndex)`（该写法的 -1 缺陷见 [known-issues](../known-issues.md) 第四节）。
