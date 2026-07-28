---
status: 补记
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
---

# ADR-0005：局内/局外等语义靠人工维护的中文名单，而非数据驱动

| | |
|---|---|
| 状态 | 补记（2026-06-11） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

通用黑板处理一个藏品 buff 时要回答一串语义问题：写局内还是局外乘区、是否吃层数、跨藏品层数是否同步、是否对敌人生效、是否根本无法计算。上游解包数据**没有任何字段显式承载这些语义**——没有"局内生效"标志，没有"可计算性"标志。备选方案是为每个藏品写独立黑板（工作量不可接受）或人工维护语义名单。

## 决策

用集中在 `app/modules/Tool/DamageCalculator/utils.ts` 的一组人工名单承载这些语义：

| 导出符号 | 语义 |
|---|---|
| `allowedBlackboardKeyMap` | 通用黑板可识别的 buff 黑板 key 白名单，兼作中文翻译表（`isBlackboardActiveForChar` 的最后一关） |
| `allowedBlackboardValueStrs` | `buff.key` 以 `global` 开头时放行的 `valueStr`（含按职业拼接的函数项） |
| `blackboardValueStrsForEnemy` / `blackboardValueStrsForChar` | buff 作用对象（敌方/我方）的判定补充 |
| `layerValueStrs` | 带层数效果的 `valueStr` |
| `inGameRelicNames` | **局内生效的藏品中文名名单**（本条 ADR 的核心争议点） |
| `gin_layer_sync` 等 `*_layer_sync` 系列 | 跨藏品层数同步组（金酒之杯/论断/思绪/各协议/伺烛客编队） |
| `disallowedRelicNames` / `disallowedValueStrs` | 黑名单：价值低或无法计入的藏品/词条 |

局内判定的具体规则在 `calculator/blackboard.ts` 的 `commonCharRelicBlackboard`：`inGame = inGameRelicNames.includes(relic.name) || buff.key 含 "buff" 或 "ability"`。命中走局内乘区（`in_game_buff_*`），否则进局外（`relic_rune_*`）。

## 决策理由（反推）

逐藏品人工判读游戏内实际表现（局内外在游戏机制上的差异无法从黑板数值推断），名单是这些判读结论的最小落点：适配一个藏品只需加一行中文名。

## 后果

- 正面：单点可改、零抽象成本；判读结论有据可查（名单即清单）。
- 负面：
  - **静默错算**：新藏品局内生效但既不在 `inGameRelicNames` 也不满足 `buff.key` 含 `buff`/`ability` 时，会被错误归入局外乘算——数值错但不报错，且因局内外乘区在公式中位置不同，偏差可能不易察觉；
  - **上游改名静默失效**：名单按中文名精确匹配，藏品改译名后名单项失配，行为退化且无告警（与 [ADR-0004](0004-chinese-filename-registry-keys.md) 同属一类失败模式）；
  - 名单语义只存在于代码：文档手抄必然漂移，因此名单类内容由 `generated/allowed-keys.md` 脚本生成而非手写（见[藏品接入手册](../03-relic-adaptation-guide.md)）；
  - 每次上游新增藏品都要人工判读并补名单，是数据更新流程中无法自动化的一环（见[新增藏品 buff 验证](../10-relic-buff-verification.md)）。

> ⚠️ 改任何一份名单都必须同 PR 重新生成 `generated/` 清单并核对[藏品接入手册](../03-relic-adaptation-guide.md)对应表格；删名单项前先确认没有藏品依赖它（名单项与藏品是多对多关系，如"黑色郁金香"同时出现在 `inGameRelicNames` 与 `disallowedRelicNames`）。

## 重启条件

改为数据驱动（按上游字段或自建标注数据集判定）需先满足：

1. 现有名单先导出为基线（`pnpm docs:gen` 生成物），作为对账标尺；
2. 新判定逻辑与旧名单**双轨跑全部现存藏品**，逐藏品 diff 为空，或差异项逐个人工签核；
3. 证明候选数据源（上游字段或标注集）在全部历史主题（rogue_2 ~ rogue_5）上覆盖现有名单的全部语义维度（局内外、层数、同步组、作用对象、可计算性），缺一个维度就只能部分替代。
