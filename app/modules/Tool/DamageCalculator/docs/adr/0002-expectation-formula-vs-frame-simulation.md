---
status: 补记
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/赫德雷.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/狙击/寒芒克洛丝.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate-core.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/Hoederer_beta.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/simulate-core.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/timeline.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/frame.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/char/近卫/赫德雷.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/random-probability.ts
---

# ADR-0002：生产路径用期望公式，逐帧模拟仅为预留方向

| | |
|---|---|
| 状态 | 补记（2026-06-11） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

DPS 计算有两条技术路线：闭式期望公式（一次性解析求值）与逐帧模拟（离散时间推进、逐事件结算）。概率触发、buff 持续时间覆盖、叠层类藏品效果用期望公式难以精确表达，原作者为此做过两次模拟尝试，但均未完成。

## 决策

生产 DPS 的唯一路径是期望公式：`calculator/calculator.ts` 的 `calculator` 按干员名分发到 `charImpl/` 手写公式实现。概率效果一律期望化折算——例如 `charImpl/狙击/寒芒克洛丝.ts` 把暴击天赋按 `(1-p)×普通伤害 + p×暴击伤害` 加权。逐帧模拟保留为预留方向：`calculator.ts` 预留了 `calculator_beta` 入口（按 `appellation + "_beta"` 查找实现），全仓库零调用。两代模拟代码未删除，与现行架构混居。

## 后果

三代模拟残骸并存，状态如下（详细盘点与可复用资产见[模拟器现状](../08-simulate-and-legacy.md)）：

| 代际 | 位置 | 状态 |
|---|---|---|
| 一代原型 | `calculator/simulate-core.ts` 的 `simulate` | 毫秒制（每轮 +17ms）硬编码赫德雷 demo；末尾调用本文件未定义也未导入的 `printDamageRecords`，无法运行 |
| 一代分叉 | `calculator/charImpl/Hoederer_beta.ts` | 与一代逐行同源的复制分叉；文件内自行 `registerCalculatorImpl("Hoederer_beta", ...)`，但 `calculator/index.ts` 的 glob 只扫 `charImpl` 子目录，该文件位于根目录，永不加载，注册永不发生 |
| 二代骨架 | `calculator/simulate/` 的 `SimulateCore`/`SimulateContext`/`Timeline`/`Frame` | 60 秒 × 30fps = 1800 帧的推进循环骨架，每帧只创建空 `Frame`，不做任何结算；`simulate/char/近卫/赫德雷.ts` 为空 stub 且引用未导入的 `SimulateContext` |

负面后果：

- 两个同名 `simulate-core.ts` 是代际关系不是分层关系，极易被误读为现行机制；
- 一代的 17ms/帧（约 58.8fps）与游戏逻辑帧率 30fps 体系冲突（公式路径的攻击间隔取整 `atkFrame/30.0` 与二代 `Timeline` 的 `frame_rate` 默认值都是 30）；
- 期望与采样对同一概率天赋给出不同数值，两路径对账时数值不一致**不是 bug**。

> ⚠️ 不要在一代原型或 `Hoederer_beta.ts` 上继续开发——前者无法编译运行，后者永远不会被注册。也不要把 `simulate/` 目录当作生产代码理解：生产 DPS 没有任何部分走模拟。

## 重启条件

在二代骨架（`calculator/simulate/`）上重启模拟路线，需先满足：

1. 固定 30fps 离散化规范并成文：攻击间隔帧取整、技力逐帧结算、buff 持续时间帧数化，且与公式路径的 `atkFrame/30.0` 口径对齐；
2. 定义伤害记录到 `CalculatorOutput`（attack/skill/cycle 三段）的聚合口径——这是目前完全缺失的一环；
3. 概率判定一律走 `simulate/random-probability.ts` 的 `checkProbability`，遵守 [ADR-0006](0006-exact-golden-values-and-frozen-prng.md) 的 PRNG 冻结契约；
4. 与期望路径在无概率用例上做双轨一致性测试，差异为零后才允许接入 `calculator_beta`。
