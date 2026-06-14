---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/utils.ts
---

# 伤害计算器模块文档索引

本目录是伤害计算器模块的正文文档（doc-as-code，单一正文源）。跨模块共享的术语表与数据管线在顶层 `docs/`，见底部链接。全仓库文档索引见 [../../../../../docs/README.md](../../../../../docs/README.md)。

## 阅读顺序（01~10）

新人按编号顺序读即可，前序文档为后序铺设术语与背景：

1. [01-architecture.md](01-architecture.md) —— 计算管线架构总览（五段 analyze 编排、双 BuffContext 同步、store 重算链路、干员自动注册）。
2. [02-buff-context-and-formulas.md](02-buff-context-and-formulas.md) —— 各乘区定义与 operator 语义、属性合成顺序。
3. [03-relic-adaptation-guide.md](03-relic-adaptation-guide.md) —— 藏品/通宝增益接入手册（通用黑板 vs 独立黑板决策树）。
4. [04-char-impl-cookbook.md](04-char-impl-cookbook.md) —— 干员实现 Cookbook（命名铁律、乘区读取样板）。
5. [05-topic-spec-and-enemy-spec.md](05-topic-spec-and-enemy-spec.md) —— 主题/敌人特殊词条伪黑板语义表。
6. [06-data-schema.md](06-data-schema.md) —— 现行计算器输入输出契约（替换旧 WASM 文档）。
7. [07-debugging.md](07-debugging.md) —— 调试与排查手册（已吸收旧 `docs/debuger.md`）。
8. [08-simulate-and-legacy.md](08-simulate-and-legacy.md) —— 模拟器现状盘点与三代遗留代码清单。
9. [09-fixtures-and-baselines.md](09-fixtures-and-baselines.md) —— 夹具生成与金值基线管理。
10. [10-relic-buff-verification.md](10-relic-buff-verification.md) —— 新增藏品 buff 量自动验证设计。

## 专题与参考

- [known-issues.md](known-issues.md) —— 已确认笔误与缺陷登记簿（自动化对账前提）。排查异常数值时先查这里。
- [version-sensitive-hardcode.md](version-sensitive-hardcode.md) —— 十余处版本敏感硬编码逐项清单 + 触发更新的上游变更类型。上游平衡性调整后核对这里。
- [new-topic-checklist.md](new-topic-checklist.md) —— 新增肉鸽主题的散点改动清单。
- [adr/](adr/) —— 架构决策记录（ADR）。`template.md` 是模板，`0001`~`0006` 是已发生决策的补记，`0007` 是藏品适配范围与"最佳情况"建模口径，各注明「推翻条件」。理解「为什么是现在这样」时看这里。

## generated/ —— 脚本生成物，勿手改

[generated/](generated/) 下三份清单（[relic-blackboard-registry.md](generated/relic-blackboard-registry.md) 已适配独立黑板清单、[allowed-keys.md](generated/allowed-keys.md) 白名单/黑名单/局内名单/层数同步组、[char-impl-coverage.md](generated/char-impl-coverage.md) 干员×技能覆盖矩阵）由 `yarn docs:gen` 从源码（`calculator/blackboard.ts`、`utils.ts`、`calculator/charImpl/`）导出。**不要手改**——直接编辑会被下次生成覆盖，且 CI 校验其与源码一致；改了源码后重跑 `yarn docs:gen`。

## 顶层共享文档

- 术语表：[../../../../../docs/glossary.md](../../../../../docs/glossary.md)
- 数据管线与上游更新 Runbook：[../../../../../docs/data-pipeline.md](../../../../../docs/data-pipeline.md)
