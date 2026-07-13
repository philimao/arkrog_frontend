# RecordCard

**这不是通用卡片组件**——它是无藏收录域的记录展示卡，被无藏关卡页、首页（IndexRelicFree）、收藏页（Home/Favorite）三处复用。

- 反向依赖无藏模块 store：删除记录会触发 `relicFreeStore` 的 `fetchStagePreview(true)`（2 秒延迟契约）。
- props 契约（`isStagePage` / `record?` / `setRecords?`，首页不传 `setRecords` 则删除不刷 UI）见正文：[../../modules/RelicFree/docs/04-record-card-and-display.md](../../modules/RelicFree/docs/04-record-card-and-display.md)
- 已知缺陷（条件 Hook 违规、splice(-1) 等）：[../../modules/RelicFree/docs/known-issues.md](../../modules/RelicFree/docs/known-issues.md)
