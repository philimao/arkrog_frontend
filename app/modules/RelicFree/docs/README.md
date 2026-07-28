---
last-verified: 2026-07-13
sources:
  - app/routes.ts
  - app/stores/relicFreeStore.ts
  - docs/relic-free-doc-plan.md
---

# 无藏收录模块文档索引

本目录是无藏收录（RelicFree）模块的正文文档（doc-as-code，单一正文源）。模块代码横跨 `app/modules/RelicFree`、`app/modules/RecordDisplay`、`app/components/RecordCard`、`app/stores/relicFreeStore` 与后端 `arkrog_backend/routers/{relic-free,record}.js` 等；正文统一放在这里，各处只放指针。跨模块共享内容在顶层 `docs/`，见底部链接。

## 全部篇目

### 正文（01~07）

| 篇目 | 内容 |
|---|---|
| [01-architecture-and-data-flow.md](01-architecture-and-data-flow.md) | 架构与数据流总览：Selector/Stage 两页组件树、四 store 分工与端点映射、双保险加载与 loaded 闩锁、缓存不对称 |
| [02-record-lifecycle-and-schema.md](02-record-lifecycle-and-schema.md) | 记录数据契约与生命周期：RecordType/Records 集合 schema、提交即发布、删除副作用矩阵与悬挂收藏、权限对照 |
| [03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md) | stage id 语法权威文档与 navOfZone 八组筛选器逐条语义、跨仓库双份 boss 表同步义务 |
| [04-record-card-and-display.md](04-record-card-and-display.md) | RecordCard/RecordDisplay 复用契约：三消费入口、props 语义、逆向依赖、主题化静态资源 |
| [05-submit-form-and-links.md](05-submit-form-and-links.md) | 提交表单规格：team 字符串解析、五步校验链、URLValidation 归一化、parse-redirect 幻影端点结论 |
| [06-data-pipeline.md](06-data-pipeline.md) | 无藏专有数据链路：三端点与缓存差异、stage-preview 增量/全量双路径、外部素材依赖 |
| [07-ops-runbook.md](07-ops-runbook.md) | 运维操作手册：curl 矩阵、危险端点警告、断裂修复后的回填顺序 |

### 专题与参考

- [known-issues.md](known-issues.md) —— 已确认缺陷登记簿（12 类，横跨两仓库；区分本地 HEAD 与线上部署状态）。**排查任何异常行为先查这里**。
- [version-sensitive-hardcode.md](version-sensitive-hardcode.md) —— 版本敏感硬编码逐项清单（rogueKey 两种写法、双份数量表、主题化素材）。
- [new-topic-checklist.md](new-topic-checklist.md) —— 新主题（ro6+）上线的两仓库散点改动清单。
- [adr/](adr/) —— 架构决策记录。[template.md](adr/template.md) 是模板，0001~0006 是已发生决策的补记，各注明「推翻条件」：
  - [0001](adr/0001-publish-on-submit-no-review.md) 提交即发布无审核流
  - [0002](adr/0002-records-in-local-state-not-store.md) 记录列表局部 state 不进 store
  - [0003](adr/0003-asymmetric-caching-bundle-vs-preview.md) bundle 强缓存 vs stage-preview 无缓存
  - [0004](adr/0004-stage-id-string-parsing-as-taxonomy.md) stage id 字符串解析作分类学基础
  - [0005](adr/0005-frontend-soft-guard-backend-hard-gate.md) 前端软守卫 + 后端硬门槛
  - [0006](adr/0006-settimeout-2000-refresh-contract.md) setTimeout(2000) 时序契约（含修复部署后的推翻条件）

### generated/ —— 脚本生成物，勿手改

[generated/](generated/) 下三份清单由 `pnpm docs:gen` 从源码导出，直接编辑会被下次生成覆盖；改了源码后重跑 `pnpm docs:gen`：

- [api-endpoints.md](generated/api-endpoints.md) —— 端点-调用点对照表
- [stage-filter-rules.md](generated/stage-filter-rules.md) —— navOfZone 筛选规则表
- [hardcode-snapshot.md](generated/hardcode-snapshot.md) —— 版本敏感字面量快照（rogueKey 推导点计数以此为准）

## 阅读顺序

- **新人**：按 [01](01-architecture-and-data-flow.md) → [03](03-stage-taxonomy-and-selector.md) → [02](02-record-lifecycle-and-schema.md) 的顺序读——先建立组件/数据流全景，再掌握贯穿全模块的 stage id 分类学，最后进入记录生命周期细节；其余篇目按需查。
- **带任务来**：查下表直达。

| 任务 | 从这里开始 |
|---|---|
| 排查记录/预览数据不更新 | [07-ops-runbook.md](07-ops-runbook.md) + [known-issues.md](known-issues.md) 第一节 |
| 改关卡筛选器/数量表 | [03-stage-taxonomy-and-selector.md](03-stage-taxonomy-and-selector.md)（注意跨仓库同步义务） |
| 改提交表单/链接解析 | [05-submit-form-and-links.md](05-submit-form-and-links.md) |
| 改 RecordCard 或在新页面复用它 | [04-record-card-and-display.md](04-record-card-and-display.md) |
| 新主题（ro6+）上线 | [new-topic-checklist.md](new-topic-checklist.md) |
| 排查线上缺陷 / 提修复 PR | [known-issues.md](known-issues.md)（修复须同 PR 销项） |
| 想修掉某个"怪设计" | [adr/](adr/) 先读对应条目的推翻条件 |

## 顶层共享文档

- 全仓库文档索引：[../../../../docs/README.md](../../../../docs/README.md)
- 术语表（无藏、StagePreview、悬挂收藏等）：[../../../../docs/glossary.md](../../../../docs/glossary.md)
- 数据管线与上游更新 Runbook：[../../../../docs/data-pipeline.md](../../../../docs/data-pipeline.md)
- 全站权限机制（level 语义、RouteGuard 死代码宣告）：[../../../../docs/auth-and-permissions.md](../../../../docs/auth-and-permissions.md)
