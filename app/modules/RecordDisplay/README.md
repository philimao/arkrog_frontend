# RecordDisplay

**这不是通用列表组件**——它是无藏收录域的记录列表展示层（按作战类型分组渲染 RecordCard + 举报弹窗 ReportModal），被无藏关卡页与收藏页复用。

- 通过 `setRecords` prop 链反向联动上层局部 state；卡片删除会触发 `relicFreeStore` 的 `fetchStagePreview(true)`。
- 复用契约与三消费入口的差异见正文：[../RelicFree/docs/04-record-card-and-display.md](../RelicFree/docs/04-record-card-and-display.md)
- 举报链路的已知缺陷（写入即黑洞）：[../RelicFree/docs/known-issues.md](../RelicFree/docs/known-issues.md)
