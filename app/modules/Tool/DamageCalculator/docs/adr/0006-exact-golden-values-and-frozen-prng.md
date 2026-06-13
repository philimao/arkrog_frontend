---
status: 补记
last-verified: 2026-06-11
sources:
  - test/DamageCalculator/index.test.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/random-probability.ts
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
---

# ADR-0006：精确浮点金值断言 + 冻结的定制 PRNG

| | |
|---|---|
| 状态 | 补记（2026-06-11） |
| 决策归属 | 原作者（未记录，由代码考古补记） |

## 背景

伤害计算器需要两类"可复现性"保障，本条 ADR 把它们合并为一条决策，因为二者服务于同一个目标——让计算结果在输入不变时永远逐位相同，从而能被回归门禁捕捉：

- **回归门禁需求**：期望公式路径（见 [08-simulate-and-legacy.md](../08-simulate-and-legacy.md)）的输出由大量乘区合成、舍入、帧量化叠加而成，任何一处舍入位置或乘区组合顺序的改动都可能在小数末位产生偏移。需要一种断言能让这种偏移**爆红**，而不是被悄悄吞掉。备选方案是 `toBeCloseTo` / 容差断言，但容差恰恰会放过这类"末位漂移"型回归。
- **概率天赋可复现需求**：技能/天赋的百分比触发判定若用 `Math.random()`，同一输入两次运行结果不同，无法做快照测试（现存违例 `charImpl/近卫/司霆惊蛰.ts` 直接掷点，登记在 [known-issues.md](../known-issues.md)）。模拟路径预留了 `calculator/simulate/random-probability.ts`，其文件头注释明言设计意图是"在该种子不变的情况下，判定结果应该保持一致……测试脚本中对于结果的输出可以保持一致"——即用种子化 PRNG 把概率效果变成确定序列。

## 决策

**其一：测试金值用精确浮点字面量做 `toEqual` 全对象比对。**

`test/DamageCalculator/index.test.ts` 的四个用例（赫德雷 / Mon3tr / 维娜·维多利亚 / 维什戴尔）对 `calculator/calculator.ts` 的 `calculator` 返回的完整 `CalculatorOutput` 做 `toEqual`，期望值是带全部浮点尾巴的字面量（如 `4031.7200000000007`、`36228.178263199574`、`4194.024390243902`）。金值的本质是"某数据版本 + 某次实现状态下真实管线输出的观测值"，比对粒度精确到 IEEE-754 末位，没有任何容差。

**其二：概率判定用一份定制且冻结的 xorshift32 PRNG。**

`calculator/simulate/random-probability.ts` 的导出函数 `checkProbability(probability, attemptCount, seed)` 经内部 `mixSeed` 把字符串种子与触发序号哈希混合后喂给内部 `seededRandom`，同 `(seed, attemptCount)` 二元组永远返回同一布尔判定。该实现刻意偏离标准算法的三处是**约定的一部分，不是缺陷**：

| 非标准点 | 落地处 | 行为 |
|---|---|---|
| xorshift32 第二步用**带符号右移** `x >> 17`（标准为无符号 `>>> 17`） | `seededRandom` | 高位补符号位，产出序列与标准 xorshift32 完全不同 |
| 种子混合末尾取 `Math.abs(mixed)`，把负种子折叠到正区间 | `mixSeed` | 损失一位熵、正负哈希会碰撞，但固定了种子到判定的映射 |
| 判定比较用 `<=`（**含端点**）：`randomValue <= probability` | `checkProbability` | `probability = 1` 必定成功，边界判定取闭区间 |

这两项构成一对冻结契约：精确金值是公式路径的回归基线，种子化 PRNG 是（未来）模拟路径金值基线的随机源；二者都以"逐位可复现"为唯一设计目标。

## 决策理由（反推）

- 选精确断言而非容差：容差断言要求维护者预先知道"多大的偏差才算回归"，而期望公式里舍入/顺序型 bug 的偏差往往只在末位，任何非零容差都会放过它；精确比对把这个判断交给机器，代价是数据更新后必须人工回填（见后果）。
- 选定制 PRNG 而非标准库：目标是可复现而非统计质量，只要"同种子同序列"即可；定制实现一旦写定，其非标准点反而成了序列指纹——保持它们不变比换成"更正确"的标准实现更重要。

## 后果

- 正面：
  - 公式路径任何末位级回归都会立即爆红，回归门禁无盲区；
  - 概率效果一旦接入 `checkProbability`，即可像确定性函数一样做快照，模拟路径的金值基线才有可能成立。
- 负面：
  - **任何公式顺序/舍入重构全量爆红**：改动乘区组合顺序、舍入位置、帧量化口径都会让多个金值同时变化，无法区分"无害重构"与"真回归"——必须逐个人工对账（流程见 [09-fixtures-and-baselines.md](../09-fixtures-and-baselines.md) 第 3 节）；
  - **PRNG 非标准点易被误当 bug "修正"**：带符号右移、`Math.abs`、`<=` 看起来都像笔误，好心改成 `>>>`、去掉 `abs`、改成 `<`，会一次性改变全部历史判定序列、击碎所有基于该 PRNG 录制的判定快照，且数值含义的变化无法从 diff 中察觉；
  - 金值并非游戏内实测真值，而是"当时真实管线输出"，因此读金值不能反推游戏正确性，只能反推"实现未变"；
  - 当前四个用例 4/4 全红（夹具为旧 schema、缺 `buffContext`），在修复夹具前这道门禁实际是失效的（现状与修复见 [known-issues.md](../known-issues.md) 与 [09-fixtures-and-baselines.md](../09-fixtures-and-baselines.md)）。

> ⚠️ 看到 `random-probability.ts` 里的带符号右移 / `Math.abs` / `<=` 想"顺手修正"前，先读本条"重启条件"。看到 `index.test.ts` 里一长串浮点尾巴想换成 `toBeCloseTo` 让它"更稳"前，同理。

## 重启条件

**替换 PRNG 或把精确断言改为容差断言**，必须先满足：

1. 走 ADR 流程立新条记录决策，本条标为已废弃并加横幅指向替代者；
2. 在替换前**重录全部基线**：用旧实现导出当前全部判定序列 / 金值作为对账标尺；
3. **新旧双轨对比**：新实现与旧基线逐项 diff，差异为空，或每一项差异都有人工签核记录（写明差异来源与可接受理由）；缺这一步则视为回归而非升级。

**调整金值**（数据更新或确认旧值源于 bug 后回填），必须先满足：

1. **人工确认新值来源**：上游数据变更需与游戏内表现或可信数据源对账；bug 修复需在 PR 写明 bug 与对账依据；
2. 回填与对应的数据/实现变更同一个 PR，PR 描述列出"哪些金值因什么变更回填"；
3. 除上述两种情形外，`yarn test` 出现的任何金值差异一律按回归处理，不许"顺手改基线让它绿"。

（金值回填的完整操作步骤见 [09-fixtures-and-baselines.md](../09-fixtures-and-baselines.md) 第 3 节；PRNG 的接入约定与 `checkProbability` 三参数语义见 [08-simulate-and-legacy.md](../08-simulate-and-legacy.md) 第 5 节。）
