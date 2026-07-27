---
last-verified: 2026-06-11
sources:
  - test/DamageCalculator/index.test.ts
  - test/DamageCalculator/data/data_Hoederer_01.json
  - test/DamageCalculator/data/data_Mon3tr_01.json
  - test/DamageCalculator/data/data_Vina_Victoria_01.json
  - test/DamageCalculator/data/data_Wiš'adel_01.json
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/司霆惊蛰.ts
  - app/modules/Tool/DamageCalculator/calculator/simulate/random-probability.ts
  - app/types/gameData.ts
  - app/stores/damageCalculator/calcTypes.ts
  - vite.config.ts
  - package.json
---

# 09 夹具与金值基线管理

本篇回答四个问题：测试为什么现在全红；夹具（fixture）应该长什么样、为什么必须在测试内重建 buff 上下文；金值（golden value，硬编码在断言里的期望输出）从哪来、什么时候允许改；以及如何避免"测试是绿的但其实什么都没测"。

测试怎么跑、vitest 配置从哪来等仓库级工程事实见 [docs/testing.md](../../../../../docs/testing.md)；计算管线本身的结构见 [01-architecture.md](01-architecture.md)；输入输出契约的字段级定义见 [06-data-schema.md](06-data-schema.md)。

## 1. 现状声明：4/4 全红

> ⚠️ **当前测试套件不可作为任何重构的安全网。** `test/DamageCalculator/index.test.ts` 的全部 4 个用例（赫德雷 / Mon3tr / 维娜·维多利亚 / 维什戴尔）在 `yarn test` 下全部失败（2026-06-11 实测复核），统一报错：
>
> ```
> TypeError: Cannot read properties of undefined (reading 'in_game_buff_add')
> ```
>
> 抛错点是各干员实现的第一行乘区读取（如 `charImpl/近卫/维娜·维多利亚.ts` 读 `input.buffContext.in_game_buff_add`）——`buffContext` 整个是 `undefined`。

### 1.1 根因

三条根因叠加，缺一不可解释现状：

1. **夹具是旧输入契约的快照。** `test/DamageCalculator/data/` 下四份 JSON 的顶层结构是 `{ charInput, enemyInput, charData, skillData, uniEquipData, relics }`，对应计算器早期的多份数据契约；而现行 `CalculatorInput`（`app/types/gameData.ts` 的 `CalculatorInput`）要求 `{ buffContext, charInput, charData, enemyInput, enemyData, relics, rogueInput }`。夹具缺 `buffContext`、`enemyData`、`rogueInput` 三个必填字段，多出已不存在的 `skillData`、`uniEquipData` 两个顶层键（技能与模组数据现已内嵌在 `charInput.skill` / `charInput.uniEquip`）。
2. **`BuffContext` 是类实例树，JSON 根本无法承载。** `calculator/buff-context.ts` 的 `BuffContext` 由 `ExpressionGroupNode` / `NumericLiteralNode`（`calculator/ast` 导出）组成，节点带 `calculate()` / `clone()` 方法。即使把现网输入 `JSON.stringify` 后存进夹具，回灌进来的也只是丢失了全部方法的裸对象——干员实现一调 `.calculate()` 就会崩。这是架构决策而非缺陷，背景见 [adr/0003-buffcontext-class-not-serializable.md](adr/0003-buffcontext-class-not-serializable.md)。
3. **旧夹具的子结构也已过时。** 即使补上 `buffContext`，旧夹具仍会在别处崩：
   - 旧 `enemyInput` 是扁平 10 字段（`maxHp`/`atk`/`def`/...），现行 `EnemyInput` 要求嵌套 `attributes: EnemyAttribute`，并带 `id`/`levelType` 等元信息——干员实现读的是 `input.enemyInput.attributes.def`。
   - 旧 `relics[].buffs` 存的是**预分析结果** `{ key, isActive, charResult, enemyResult }`，而现行 `RelicBuff` 是原始词条 `{ key, blackboard }`。
   - 旧 `charInput` 缺现行 `CharInput`（`app/stores/damageCalculator/calcTypes.ts`）的多个必用字段：`name`、`frameIndex`（`calculateOutsidePanel` 取精英化属性帧用）、`charSpec`（`analyzeChar` 无条件 `forEach`）、`attributeModifier`（`analyzeRelics` 开头读取）等。

### 1.2 为什么 TypeScript 没拦住

> ⚠️ 测试里用了 `calculator(dataXxx as unknown as CalculatorInput)` 双重强转。这层强转让结构早已对不上的夹具悄无声息地通过类型检查——**修复夹具后应当去掉 `as unknown as`，让 TS 重新成为夹具结构漂移的第一道报警**。新增用例严禁复制这个写法。

## 2. 夹具设计原则：只存原始输入，测试内重建上下文

### 2.1 原则

**夹具只存可 JSON 序列化的原始输入；`buffContext`、敌人最终面板、干员局外面板一律在测试内通过真实 analyze 管线重建。** 不要发明"简化版重建"——线上 `CalcCenter.tsx`（`CalcCenter` 组件）怎么调，测试就怎么调，否则测试验证的是另一条不存在的管线。

夹具应当保存的字段：

| 夹具字段 | 类型来源 | 说明 |
|---|---|---|
| `charInput` | `calcTypes.ts` 的 `CharInput` | 按**现行**完整结构，含 `name`/`frameIndex`/`charSpec`/`attributeModifier`/`potential`/`skill`/`uniEquip` 等；不要存 `attribute` 终值（重建时算出） |
| `charData` | `gameData.ts` 的 `CharData` | 干员解包原始数据切片 |
| `relics` | `WrappedRelicItem[]` | `relic/charBuffs` 保持 GameData 原封对象，用户态只有外层 `layer/enable`；直接 buff 位于 `relic.buffs` |
| `rogueInput` | `calcTypes.ts` 的 `RogueInput` | 主题/难度/层数/科技树等 |
| `enemyBase` | `gameData.ts` 的 `EnemyInput` | 嵌套 `attributes` 的敌人基础面板（加成前） |
| `enemyData` | `gameData.ts` 的 `EnemyData` | 敌人解包原始数据 |
| `stageData` / `levelData` / `enemySpec` / `topicSpecItems` | 各自类型 | 可选；用例涉及关卡 rune、敌人特殊词条、岁时/天象/通宝/年代/灵感时必须提供 |

### 2.2 重建管线：按 CalcCenter 的调用顺序

`CalcCenter` 组件内 `useEffect` 的编排顺序就是 headless 重建的权威参照。每一步对应 `calculator/helper.ts` 中 `CalculatorHelper` 的一个静态方法：

```ts
// 入口必须是 calculator/index.ts（即 "~/modules/Tool/DamageCalculator/calculator"）：
// 它的副作用完成干员实现 glob 注册与独立黑板注册，绕过它会得到全零输出/空注册表。
import { calculator, CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";

// ① 干员养成加成（信赖/潜能/模组/天赋/干员特殊配置）
let buffContext = CalculatorHelper.analyzeChar({ charInput, charData });

// ② 藏品加成（三级黑板分发；enemyData 在签名里是必填项）
buffContext = CalculatorHelper.analyzeRelics(
  { charInput, charData, relics, enemyData, stageData },
  buffContext,
);

// ③ 肉鸽难度加成（科技树、逐难度词条、层数指数）
buffContext = CalculatorHelper.analyzeRogueDifficulty({ rogueInput, enemyData }, buffContext);

// ④ 主题特殊项：岁时/天象、通宝、年代、灵感（伪装成藏品复用 applyRelic）
buffContext = CalculatorHelper.analyzeTopicSpec(
  { topicSpecItems, enemyData, charData, charInput, stageData },
  buffContext,
);

// ⑤ 敌人特殊词条 + 关卡 rune
buffContext = CalculatorHelper.analyzeEnemySpec(
  { enemySpec, enemyData, stageData, levelData },
  buffContext,
);

// ⑥ 敌人最终面板（木桩直接透传用户输入，不走加成）
const enemyInput = CalculatorHelper.calculateEnemyAttr({ enemyBase, context: buffContext });

// ⑦ 干员局外面板注入 charInput.attribute，组装现行 CalculatorInput
const input: CalculatorInput = {
  charInput: {
    ...charInput,
    attribute: CalculatorHelper.calculateOutsidePanel({ charInput, context: buffContext }),
  },
  enemyInput,
  charData,
  enemyData,
  relics,
  rogueInput,
  buffContext,
};
const output = calculator(input);
```

重建时的三个易错点：

- **可变性不一致是现状，照抄顺序即可绕开**：`analyzeChar` / `analyzeRelics` 对传入 context 先 `clone()` 再写，而 `analyzeRogueDifficulty` / `analyzeTopicSpec` / `analyzeEnemySpec` 直接原地修改并返回同一个对象。只要像上面那样始终接收返回值、不复用中间变量，就不会踩到。
- **`analyzeRelics` 的 `enemyData` 是签名必填**（藏品对敌人的生效判定需要它）；`charInput`/`charData`/`stageData` 可选，但缺了会改变部分藏品的生效判定结果——夹具里有什么就传什么，并保证与金值生成时一致。
- `CalcCenter` 还会构建第二个不含干员养成的 context（Buff 一览面板用），它**不是**计算器输入的一部分，测试无需重建；区别见 [01-architecture.md](01-architecture.md)。

### 2.3 夹具的来源与目标

四份现存夹具当年是在浏览器控制台经 `CalculatorHelper.print` 打印后手工拷贝的，没有生成脚本。过渡期内新增夹具仍可走"页面配好 → 控制台导出原始输入字段"的路子，但导出的必须是 2.1 表中的**原始字段**而非整包 `CalculatorInput`（整包里混着类实例）。中期目标是提供导出脚本/按钮直接产出合规夹具，归属 [10-relic-buff-verification.md](10-relic-buff-verification.md) 的实施路线。

## 3. 金值基线管理

### 3.1 精确浮点断言是有意的回归门禁

用例对完整 `CalculatorOutput` 做 `toEqual` 精确比对，期望值是 `4031.7200000000007` 这种带全部浮点尾巴的字面量。**这不是偷懒，是设计**：期望公式计算里舍入位置、乘区组合顺序的任何变化都应该爆红，`toBeCloseTo` 或容差断言恰恰会吞掉这类回归。背景与推翻条件见 [adr/0006-exact-golden-values-and-frozen-prng.md](adr/0006-exact-golden-values-and-frozen-prng.md)。

由此推出两条纪律：

- 金值**只在两种情况下允许更新**：(a) 上游游戏数据变更（干员/技能/藏品数值调整），且新值已与游戏内表现或可信数据源人工对账；(b) 确认旧值源于实现 bug，修复后以新值为准（需在 PR 里写明 bug 与对账依据）。
- 除上述两种情况外，`yarn test` 出现的任何金值差异一律按回归处理，不许"顺手改基线让它绿"。

### 3.2 金值从哪来

金值的本质是**某个数据版本 + 某次实现状态下真实管线输出的观测值**，不是游戏内实测真值。建立一条新基线的完整动作是：

1. 在计算器页面（或重建管线脚本）配置目标场景，取得输出；
2. **人工对账**：与游戏内实测/已知正确的计算结果核对量级与关键值（普攻 dph 至少要对得上面板攻击减防御的手算）；
3. 对账通过后，把输出整对象作为 `toEqual` 字面量写进用例，并在用例注释里记录数据版本与对账日期。

### 3.3 数据更新后的审核与回填流程

上游数据更新落地（流程见 [docs/data-pipeline.md](../../../../../docs/data-pipeline.md)）后：

1. 跑 `yarn test`，收集全部金值差异；
2. 对每个红用例，判断差异来源：上游数值变更（预期内）还是计算实现回归（预期外）——用 [07-debugging.md](07-debugging.md) 的 `printAdditionContext` 表格逐乘区对比新旧加成来源；
3. 预期内的差异：按 3.2 的对账步骤确认新值，更新用例字面量（"回填"）；
4. 预期外的差异：先修实现，再回到第 1 步；
5. 回填与对应的数据/实现变更**同一个 PR 提交**，PR 描述里列出"哪些金值因什么变更回填"。
6. 若本次更新含新增藏品/通宝，先走 [10-relic-buff-verification.md](10-relic-buff-verification.md) 的报告与签核流程，签核确认的数值才能进入金值。

### 3.4 防假绿

> ⚠️ **未注册的干员不会报错，只会输出全 0。** `calculator/calculator.ts` 的 `calculator` 按 `input.charData.name` 查注册表，查不到时 `calculator/impls.ts` 的 `getCalculatorImpl` 返回 `CalculatorHelper.createCalculatorOutput()` 的全零兜底（仅 `console.warn`）。注册键来自 `charImpl/<职业>/<干员名>.ts` 的**文件名**（`calculator/index.ts` 的 glob 注册，详见 [04-char-impl-cookbook.md](04-char-impl-cookbook.md)）——文件名错一个字，或夹具里 `charData.name` 与文件名不一致，输出就是全零。
>
> 危险组合：基线里本来就有大段 0。现存 Mon3tr 用例的 `attack` 段全为 0（技能型输出干员），若有人只断言这类天然为 0 的字段，干员注册彻底失效时测试照样绿。

防假绿规则：

1. **每个用例必须至少断言一个非零字段**（对完整输出做 `toEqual` 的现有写法天然满足；新增"只挑字段断言"的用例时必须自查）；
2. 可在 `describe` 级加一条前置断言：对夹具干员调用 `calculator` 后检查 `skill.dps` 任一通道非零，零则直接 fail 并提示"干员可能未注册"；
3. 注意 `analyzeChar` 内部调用 `getCharImpl(charData.name).applyTalent`，未注册时走 `console.warn` 兜底——**天赋加成静默缺失会让金值偏低而不是报错**，对账时如果数值莫名低一截，先查注册。

## 4. 非确定性处理

> ⚠️ `charImpl/近卫/司霆惊蛰.ts` 的二技能分支直接调 `Math.random()` 决定天赋落雷是否触发（全仓库计算链路中唯一一处，2026-06-11 复核），同一输入两次运行输出不同——**对它做精确金值断言必然间歇性爆红**。

处理策略分两档：

- **短期（隔离）**：不为司霆惊蛰建金值用例；若必须覆盖，在用例内 `vi.spyOn(Math, "random")` 固定返回值，并在用例注释标明"被 mock 的概率语义"。新增干员实现禁止引入新的 `Math.random()`（checklist 见第 5 节）。
- **目标态（种子化）**：仓库里已经躺着为此而写的工具——`calculator/simulate/random-probability.ts` 的 `checkProbability(probability, attemptCount, seed)`（xorshift32 种子随机，同种子同序列），文件头注释明言"在该种子不变的情况下，判定结果应该保持一致……测试脚本中对于结果的输出可以保持一致"。它目前**没有被任何计算实现接入**。把司霆惊蛰的 `Math.random()` 替换为种子化判定属于实现改造，归属 simulate 路线图，见 [08-simulate-and-legacy.md](08-simulate-and-legacy.md)；冻结 PRNG 的决策背景见 [adr/0006-exact-golden-values-and-frozen-prng.md](adr/0006-exact-golden-values-and-frozen-prng.md)。

## 5. 新增干员用例 checklist

按顺序逐项核对：

- [ ] 干员实现文件存在且**文件名 = `charData.name`**（中文名，位于 `charImpl/<职业>/` 子目录下；命名铁律与 glob 范围见 [04-char-impl-cookbook.md](04-char-impl-cookbook.md)）；
- [ ] 实现中没有 `Math.random()`；有概率机制的，先按第 4 节处理；
- [ ] 夹具命名 `data_<干员名>_<NN>.json`，放在 `test/DamageCalculator/data/`，**只含 2.1 表中的原始输入字段**；
- [ ] 用例内按 2.2 的七步管线重建 `CalculatorInput`，不使用 `as unknown as` 强转；
- [ ] 金值已按 3.2 完成人工对账，用例注释记录数据版本与对账日期；
- [ ] 用例至少断言一个非零字段（防假绿，见 3.4）；
- [ ] 本地 `yarn test` 通过（过渡期内：至少不新增红，存量 4 红的修复进度见 [10-relic-buff-verification.md](10-relic-buff-verification.md) 实施路线阶段 0）；
- [ ] 夹具、用例、（如有）实现改动在同一个 PR。
