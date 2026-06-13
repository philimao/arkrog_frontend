---
status: 补记
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/ast/index.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/types/gameData.ts
  - test/DamageCalculator/index.test.ts
  - test/DamageCalculator/data/data_Hoederer_01.json
---

# ADR-0003：BuffContext 设计为带方法的类，不可 JSON 序列化

| | |
|---|---|
| 状态 | 补记（2026-06-11） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

通用黑板的容器 `BuffContext` 需要同时支撑三件事：乘区数值求值、UI 公式渲染（敌人面板悬浮公式）、加成来源溯源（Buff 一览、藏品有效性标注）。备选方案是可序列化的纯数据结构（求值逻辑外置），或携带行为的对象树。

## 决策

`calculator/buff-context.ts` 的 `BuffContext` 是带方法的类：每个乘区桶持有 `ExpressionGroupNode` 表达式树（`calculator/ast/index.ts`），节点提供 `calculate`/`printExpression`/`structure`/`clone` 方法；节点 `tooltip` 字符串兼作溯源标识符（`CalculatorHelper.printRelic` 用 `child.tooltip === relicName` 匹配），`source` 字段可携带 `{relic, buff}` 原始对象引用。克隆用手写的 `BuffContext.clone()` 逐字段深拷贝。`CalculatorInput.buffContext`（`app/types/gameData.ts`）直接携带活实例进入干员实现。类上未提供 `toJSON`/`fromJSON`。

## 后果

- 正面：AST 三职责（求值 / UI 渲染 / 溯源）在一棵树上完成，干员实现里 `context.in_game_buff_add.atk.calculate()` 一类读法直接可用，乘区语义详见[乘区与公式规格](../02-buff-context-and-formulas.md)。
- 负面：
  - **JSON fixture 无法承载 context**：`JSON.stringify` 丢方法与原型、断开 `source` 引用，回灌后第一次 `calculate()` 调用即抛错。fixture 只能存原始输入，测试内必须用 `CalculatorHelper` 的 `analyzeChar → analyzeRelics → analyzeRogueDifficulty → analyzeTopicSpec → analyzeEnemySpec` 真实管线 headless 重建（与 `CalcCenter.tsx` 的编排一致）——这是[夹具与基线](../09-fixtures-and-baselines.md)的核心方案；
  - 现存 fixture 是 WASM 时代旧 schema（顶层无 `buffContext`），干员实现第一行读 `input.buffContext.in_game_buff_add` 即抛 `TypeError`，4/4 测试全红即源于此；
  - **新增乘区三同步**：`IBuffContext` 接口、字段初始化、`clone()` 三处必须同时改；漏改 `clone()` 不报错，但会让新乘区在克隆后共享引用或丢失，造成隐蔽的跨计算污染。

> ⚠️ 不要"好心"给 `BuffContext` 加一个朴素的 fromJSON / 序列化补丁（例如 `Object.assign` 回灌或把字段改成纯数据）——会丢失方法与 `source` 引用、破坏 `tooltip` 溯源语义，并与 `clone()` 的深拷贝约定冲突。`structure()` 是单向导出（供 UI 渲染），不是序列化方案，不含 `source`，不可逆。

## 重启条件

若要让 `BuffContext` 可序列化（为 fixture 直存或跨进程传递），需先满足：

1. [夹具与基线](../09-fixtures-and-baselines.md)的"原始输入 + 测试内重建"管线已落地且测试全绿，作为对照基线；
2. 设计覆盖全部节点类型的完整 round-trip（含操作符、`tooltip`、层级结构，并明确 `source` 对象引用的取舍），而非只覆盖当前用到的字段；
3. 重录全部金值并双轨对比：序列化-回灌路径与重建路径对同一输入的 `CalculatorOutput` 逐项一致（见 [ADR-0006](0006-exact-golden-values-and-frozen-prng.md)）。
