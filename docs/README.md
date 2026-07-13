---
last-verified: 2026-07-13
sources:
  - docs/glossary.md
  - docs/data-pipeline.md
  - docs/testing.md
  - docs/auth-and-permissions.md
  - docs/deployment-env-matrix.md
  - docs/doc-generation.md
  - docs/TournamentDataSchema.md
  - docs/DamageCalculatorDataSchema.md
  - docs/debuger.md
  - docs/damage-calculator-doc-plan.md
  - docs/relic-free-doc-plan.md
  - CONTRIBUTING.md
  - CLAUDE.md
  - app/modules/Tool/DamageCalculator/docs/README.md
  - app/modules/RelicFree/docs/README.md
  - app/docs/RouteGuard使用指南.md
  - app/hooks/useEditLock.md
  - scripts/docs/5.17 赛事Data修改.md
---

# 全仓库文档索引

arkrog_frontend（明日方舟集成战略工具站前端）的文档总入口。正文文档就近放在各模块内，本目录（顶层 `docs/`）只放全仓库索引、跨模块共享概念（术语表）、跨模块/跨仓库共享流程（数据管线）与仓库级工程说明。文档维护约定见 [../CONTRIBUTING.md](../CONTRIBUTING.md)。

新人请先看本页第三节「Onboarding 阅读顺序」；带着具体任务来的请直接看第二节「按任务导航」。

## 一、文档地图

状态说明：**已验证** = 对照源码核实、frontmatter 带 `last-verified` 的现行正文；**生成物** = 由 `yarn docs:gen` 从源码导出，勿手改；**规划** = 计划/设计文档；**过时待删** = 内容与现行代码不符，过渡期后删除。

### 顶层共享与仓库级

| 路径 | 主题 | 状态 |
|---|---|---|
| `docs/README.md`（本页） | 全仓库文档索引 | 已验证 |
| [docs/glossary.md](glossary.md) | 术语表：游戏域 + 项目域专有名词，「黑板」双义消歧、乘区命名 | 已验证 |
| [docs/data-pipeline.md](data-pipeline.md) | 游戏数据管线与上游更新 Runbook（跨仓库；文首带无藏写路径断裂勘误警示块） | 已验证 |
| [docs/testing.md](testing.md) | 测试运行与工程环境（vitest / 锁文件 / CI 现状） | 已验证 |
| [docs/auth-and-permissions.md](auth-and-permissions.md) | 全站鉴权与权限机制：level 0–6 语义、真实守卫清单、RouteGuard 死代码宣告 | 已验证 |
| [docs/deployment-env-matrix.md](deployment-env-matrix.md) | 部署与环境矩阵：pm2/tsx 入口、nginx `/api` 契约、prod/dev 共库、.env 键矩阵 | 已验证 |
| [docs/doc-generation.md](doc-generation.md) | 文档生成器（docs:gen）架构与新模块扩展手册 | 已验证 |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | 工程约定 +「代码改动 → 必须同步文档」映射表 | 已验证 |
| [../CLAUDE.md](../CLAUDE.md) | AI 协作导航：项目速述、高危约定、命令速查 | 已验证 |
| [docs/damage-calculator-doc-plan.md](damage-calculator-doc-plan.md) | 伤害计算器 doc-as-code 落地计划 | 规划 |
| [docs/relic-free-doc-plan.md](relic-free-doc-plan.md) | 无藏收录 doc-as-code 落地计划 | 规划 |

### 伤害计算器模块正文（`app/modules/Tool/DamageCalculator/docs/`）

模块文档自带索引：[app/modules/Tool/DamageCalculator/docs/README.md](../app/modules/Tool/DamageCalculator/docs/README.md)。

| 路径 | 主题 | 状态 |
|---|---|---|
| [.../docs/README.md](../app/modules/Tool/DamageCalculator/docs/README.md) | 模块文档索引与阅读顺序 | 已验证 |
| [.../docs/01-architecture.md](../app/modules/Tool/DamageCalculator/docs/01-architecture.md) | 计算管线架构总览 | 已验证 |
| [.../docs/02-buff-context-and-formulas.md](../app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) | 乘区与属性合成公式规格 | 已验证 |
| [.../docs/03-relic-adaptation-guide.md](../app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) | 藏品/通宝增益接入手册 | 已验证 |
| [.../docs/04-char-impl-cookbook.md](../app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md) | 干员实现 Cookbook | 已验证 |
| [.../docs/05-topic-spec-and-enemy-spec.md](../app/modules/Tool/DamageCalculator/docs/05-topic-spec-and-enemy-spec.md) | 主题/敌人特殊词条伪黑板语义表 | 已验证 |
| [.../docs/06-data-schema.md](../app/modules/Tool/DamageCalculator/docs/06-data-schema.md) | 现行计算器输入输出契约 | 已验证 |
| [.../docs/07-debugging.md](../app/modules/Tool/DamageCalculator/docs/07-debugging.md) | 调试与排查手册（已吸收旧 debuger.md） | 已验证 |
| [.../docs/08-simulate-and-legacy.md](../app/modules/Tool/DamageCalculator/docs/08-simulate-and-legacy.md) | 模拟器现状盘点与遗留代码清单 | 已验证 |
| [.../docs/09-fixtures-and-baselines.md](../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md) | 夹具生成与金值基线管理 | 已验证 |
| [.../docs/10-relic-buff-verification.md](../app/modules/Tool/DamageCalculator/docs/10-relic-buff-verification.md) | 新增藏品 buff 量自动验证设计 | 已验证 |
| [.../docs/known-issues.md](../app/modules/Tool/DamageCalculator/docs/known-issues.md) | 已知问题与笔误登记簿 | 已验证 |
| [.../docs/version-sensitive-hardcode.md](../app/modules/Tool/DamageCalculator/docs/version-sensitive-hardcode.md) | 版本敏感硬编码清单 | 已验证 |
| [.../docs/new-topic-checklist.md](../app/modules/Tool/DamageCalculator/docs/new-topic-checklist.md) | 新增肉鸽主题扩展手册 | 已验证 |
| [.../docs/adr/template.md](../app/modules/Tool/DamageCalculator/docs/adr/template.md) | ADR 模板 | 已验证 |
| [.../docs/adr/0001-pure-ts-over-wasm.md](../app/modules/Tool/DamageCalculator/docs/adr/0001-pure-ts-over-wasm.md) | ADR：纯 TS 取代 WASM | 已验证 |
| [.../docs/adr/0002-expectation-formula-vs-frame-simulation.md](../app/modules/Tool/DamageCalculator/docs/adr/0002-expectation-formula-vs-frame-simulation.md) | ADR：期望公式 vs 帧模拟 | 已验证 |
| [.../docs/adr/0003-buffcontext-class-not-serializable.md](../app/modules/Tool/DamageCalculator/docs/adr/0003-buffcontext-class-not-serializable.md) | ADR：BuffContext 类不可序列化 | 已验证 |
| [.../docs/adr/0004-chinese-filename-registry-keys.md](../app/modules/Tool/DamageCalculator/docs/adr/0004-chinese-filename-registry-keys.md) | ADR：中文文件名即注册键 | 已验证 |
| [.../docs/adr/0005-manual-ingame-relic-name-lists.md](../app/modules/Tool/DamageCalculator/docs/adr/0005-manual-ingame-relic-name-lists.md) | ADR：手工局内藏品名单 | 已验证 |
| [.../docs/adr/0006-exact-golden-values-and-frozen-prng.md](../app/modules/Tool/DamageCalculator/docs/adr/0006-exact-golden-values-and-frozen-prng.md) | ADR：精确金值基线与冻结 PRNG | 已验证 |
| [.../docs/adr/0007-relic-adaptation-scope-and-best-case.md](../app/modules/Tool/DamageCalculator/docs/adr/0007-relic-adaptation-scope-and-best-case.md) | ADR：藏品适配范围与"最佳情况"建模口径 | 已验证 |
| [.../docs/generated/relic-blackboard-registry.md](../app/modules/Tool/DamageCalculator/docs/generated/relic-blackboard-registry.md) | 已适配独立黑板清单 | 生成物 |
| [.../docs/generated/allowed-keys.md](../app/modules/Tool/DamageCalculator/docs/generated/allowed-keys.md) | 白名单/黑名单/局内名单/层数同步组 | 生成物 |
| [.../docs/generated/char-impl-coverage.md](../app/modules/Tool/DamageCalculator/docs/generated/char-impl-coverage.md) | 干员×技能实现覆盖矩阵 | 生成物 |

### 无藏收录模块正文（`app/modules/RelicFree/docs/`）

模块文档自带索引：[app/modules/RelicFree/docs/README.md](../app/modules/RelicFree/docs/README.md)。

| 路径 | 主题 | 状态 |
|---|---|---|
| [.../docs/README.md](../app/modules/RelicFree/docs/README.md) | 模块文档索引与阅读顺序 | 已验证 |
| [.../docs/01-architecture-and-data-flow.md](../app/modules/RelicFree/docs/01-architecture-and-data-flow.md) | 架构与数据流总览 | 已验证 |
| [.../docs/02-record-lifecycle-and-schema.md](../app/modules/RelicFree/docs/02-record-lifecycle-and-schema.md) | 记录数据契约与生命周期 | 已验证 |
| [.../docs/03-stage-taxonomy-and-selector.md](../app/modules/RelicFree/docs/03-stage-taxonomy-and-selector.md) | stage id 语法与关卡分层筛选 | 已验证 |
| [.../docs/04-record-card-and-display.md](../app/modules/RelicFree/docs/04-record-card-and-display.md) | RecordCard/RecordDisplay 复用契约 | 已验证 |
| [.../docs/05-submit-form-and-links.md](../app/modules/RelicFree/docs/05-submit-form-and-links.md) | 提交表单规格与外链解析 | 已验证 |
| [.../docs/06-data-pipeline.md](../app/modules/RelicFree/docs/06-data-pipeline.md) | 无藏专有数据链路 | 已验证 |
| [.../docs/07-ops-runbook.md](../app/modules/RelicFree/docs/07-ops-runbook.md) | 运维操作手册（curl 矩阵 + 回填流程） | 已验证 |
| [.../docs/known-issues.md](../app/modules/RelicFree/docs/known-issues.md) | 已确认缺陷登记簿 | 已验证 |
| [.../docs/version-sensitive-hardcode.md](../app/modules/RelicFree/docs/version-sensitive-hardcode.md) | 版本敏感硬编码清单 | 已验证 |
| [.../docs/new-topic-checklist.md](../app/modules/RelicFree/docs/new-topic-checklist.md) | 新主题上线无藏侧手册 | 已验证 |
| [.../docs/adr/template.md](../app/modules/RelicFree/docs/adr/template.md) | ADR 模板 | 已验证 |
| [.../docs/adr/0001-publish-on-submit-no-review.md](../app/modules/RelicFree/docs/adr/0001-publish-on-submit-no-review.md) | ADR：提交即发布、无审核流 | 已验证 |
| [.../docs/adr/0002-records-in-local-state-not-store.md](../app/modules/RelicFree/docs/adr/0002-records-in-local-state-not-store.md) | ADR：记录列表局部 state 不进 store | 已验证 |
| [.../docs/adr/0003-asymmetric-caching-bundle-vs-preview.md](../app/modules/RelicFree/docs/adr/0003-asymmetric-caching-bundle-vs-preview.md) | ADR：bundle 强缓存 vs stage-preview 无缓存的不对称 | 已验证 |
| [.../docs/adr/0004-stage-id-string-parsing-as-taxonomy.md](../app/modules/RelicFree/docs/adr/0004-stage-id-string-parsing-as-taxonomy.md) | ADR：stage id 字符串解析作为分类学基础 | 已验证 |
| [.../docs/adr/0005-frontend-soft-guard-backend-hard-gate.md](../app/modules/RelicFree/docs/adr/0005-frontend-soft-guard-backend-hard-gate.md) | ADR：前端软守卫 + 后端硬门槛 | 已验证 |
| [.../docs/adr/0006-settimeout-2000-refresh-contract.md](../app/modules/RelicFree/docs/adr/0006-settimeout-2000-refresh-contract.md) | ADR：setTimeout(2000) 时序契约 | 已验证 |
| [.../docs/generated/api-endpoints.md](../app/modules/RelicFree/docs/generated/api-endpoints.md) | 端点-调用点对照表 | 生成物 |
| [.../docs/generated/stage-filter-rules.md](../app/modules/RelicFree/docs/generated/stage-filter-rules.md) | navOfZone 筛选规则表 | 生成物 |
| [.../docs/generated/hardcode-snapshot.md](../app/modules/RelicFree/docs/generated/hardcode-snapshot.md) | 版本敏感字面量快照 | 生成物 |

### 存量文档

| 路径 | 主题 | 状态 |
|---|---|---|
| [docs/TournamentDataSchema.md](TournamentDataSchema.md) | 赛事数据 schema | 已验证（存量，本索引收录） |
| [docs/debuger.md](debuger.md) | 旧调试断点教程 | 过时待删（已并入[模块 07](../app/modules/Tool/DamageCalculator/docs/07-debugging.md)） |
| [docs/DamageCalculatorDataSchema.md](DamageCalculatorDataSchema.md) | 旧 WASM 接口 schema（描述不存在的接口） | 过时待删（现行契约见[模块 06](../app/modules/Tool/DamageCalculator/docs/06-data-schema.md)） |
| [app/docs/RouteGuard使用指南.md](../app/docs/RouteGuard使用指南.md) | 路由守卫使用指南 | 过时待删（描述从未启用的机制，见 [auth-and-permissions.md](auth-and-permissions.md)） |
| [app/hooks/useEditLock.md](../app/hooks/useEditLock.md) | 编辑锁 hook 用法 | 已验证（存量） |
| [scripts/docs/5.17 赛事Data修改.md](../scripts/docs/5.17%20赛事Data修改.md) | 赛事数据修改操作记录 | 存量（本地文件，`scripts/*` 被 gitignore，未纳入版本控制） |

## 二、按任务导航

| 你要做的事 | 起点 → 后续 |
|---|---|
| 上游游戏数据更新（关卡/藏品/干员上架） | [data-pipeline.md](data-pipeline.md) → [模块 09](../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md) → [模块 10](../app/modules/Tool/DamageCalculator/docs/10-relic-buff-verification.md) |
| 适配新藏品/通宝（含独立黑板注册判定） | [模块 03](../app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) → [模块 02](../app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) → [known-issues](../app/modules/Tool/DamageCalculator/docs/known-issues.md) |
| 新增干员实现 | [模块 04](../app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md) |
| 排查藏品「看似生效实际无效果」 | [模块 07](../app/modules/Tool/DamageCalculator/docs/07-debugging.md) |
| 新增肉鸽主题（计算器侧） | [new-topic-checklist](../app/modules/Tool/DamageCalculator/docs/new-topic-checklist.md) |
| 新主题上线（无藏侧） | [无藏 new-topic-checklist](../app/modules/RelicFree/docs/new-topic-checklist.md) |
| 排查无藏记录/预览数据不更新 | [无藏模块 07 运维手册](../app/modules/RelicFree/docs/07-ops-runbook.md) → [data-pipeline.md](data-pipeline.md) 文首勘误警示块 |
| 改无藏关卡筛选/收录范围 | [无藏模块 03](../app/modules/RelicFree/docs/03-stage-taxonomy-and-selector.md)（注意跨仓库双份表同步义务） |
| 无藏提交表单/链接解析改动 | [无藏模块 05](../app/modules/RelicFree/docs/05-submit-form-and-links.md) |

## 三、Onboarding 阅读顺序

1. [docs/glossary.md](glossary.md) —— 先建立术语共识（藏品/通宝/岁时/年代/灵感、乘区、独立黑板/通用黑板/伪黑板、「黑板」双义消歧）。
2. [模块 01 架构总览](../app/modules/Tool/DamageCalculator/docs/01-architecture.md) —— 看清计算管线五段编排与双 BuffContext 同步义务。
3. [模块 02 乘区与公式](../app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) —— 各乘区定义与属性合成顺序。
4. [模块 03 藏品接入手册](../app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) —— 第一项常见上手任务的落地手册。

## 四、维护约定

文档新增/更新/删除规则、frontmatter 要求、「代码改动 → 必须同步文档」映射表，统一见 [../CONTRIBUTING.md](../CONTRIBUTING.md)。
