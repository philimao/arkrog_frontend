---
last-verified: 2026-06-11
sources:
  - app/types/gameData.ts
  - app/stores/damageCalculator/calcTypes.ts
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/OperatorSection/ResultDisplay.tsx
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/赫德雷.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/狙击/维什戴尔.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/狙击/莱伊.ts
---

# 现行计算器输入输出契约

本篇定义现行**纯 TypeScript** 伤害计算器的输入输出 schema，是测试 fixture（见 [09-fixtures-and-baselines.md](./09-fixtures-and-baselines.md)）与藏品 buff 验证报告（见 [10-relic-buff-verification.md](./10-relic-buff-verification.md)）的**权威 schema 依据**。任何 fixture、导出脚本、验证报告与本篇不一致时，以本篇（及其引用的源码符号）为准。

旧文档 `docs/DamageCalculatorDataSchema.md` 描述的 WASM `calculate` 接口从未在生产接入，已加过时横幅、将在过渡期后删除；与它的逐项差异见[第 6 节](#6-与旧-wasm-文档的差异对照)。

路径约定：本文中 `calculator/...`、`OperatorSection/...` 等相对路径均基于模块根 `app/modules/Tool/DamageCalculator/`；跨模块文件（如 `app/types/gameData.ts`）用仓库根相对路径。

## 1. 入口签名与分发机制

总入口是 `calculator/calculator.ts` 导出的 `calculator`：

```ts
function calculator(input: CalculatorInput): CalculatorOutput
```

它本身不做任何计算，只做一次按干员分发：

1. 用 `input.charData.name`（干员中文名）调用 `calculator/impls.ts` 的 `getCalculatorImpl`，从 `implMap` 取出该干员的实现函数；
2. 实现的注册发生在 `calculator/index.ts` 顶层：`import.meta.glob("./charImpl/*/**.ts", { eager: true })` 扫描子目录下所有干员脚本，**注册键 = 文件名去掉 `.ts` 后缀**，取模块的 `export const calculator` 或 `export default` 作为计算函数；
3. 因此契约成立的前提是：**干员脚本文件名必须严格等于 `charData.name`**，且文件必须放在 `charImpl/<子目录>/` 下（glob 模式不匹配 `charImpl` 根目录）。命名与目录铁律详见 [04-char-impl-cookbook.md](./04-char-impl-cookbook.md)。

> ⚠️ **未注册干员静默返回全零输出**。`getCalculatorImpl` 找不到实现时只 `console.warn`，并返回 `CalculatorHelper.createCalculatorOutput()`（`calculator/helper.ts`）构造的全 0 结果——UI 不报错。写自动验证时若基线恰好为 0（如某些干员 `attack` 段全 0），可能掩盖"实现丢失"这一故障，断言前应先确认实现已注册。

`calculator/calculator.ts` 还导出一个 `calculator_beta`（按 `charData.appellation + "_beta"` 查找实现），**全仓库无任何调用点**，属于模拟器遗留方向，见 [08-simulate-and-legacy.md](./08-simulate-and-legacy.md)。

类型的物理位置需要注意：`CalculatorInput`/`CalculatorOutput`/`DamageData`/`DamageByType`/`RelicUiState`/`EnemyInput` 定义或转出于 `app/types/gameData.ts`，共享 `WrappedRelicItem` 契约来自 `@arkrog/arknights-knowledge-graph/formula`；`CharInput`/`RogueInput`/`CharSpecConfig` 定义在 `app/stores/damageCalculator/calcTypes.ts`；`BuffContext` 定义在 `calculator/buff-context.ts`。`app/types/gameData.ts` 反向 import 了后两处——类型层仍不是完全独立，单独抽取计算契约时必须连同 store 与模块内类型一起处理。

## 2. CalculatorInput 全字段

`CalculatorInput`（`app/types/gameData.ts`）在生产中只有一个组装现场：`calculator/CalcCenter.tsx` 的 `CalcCenter`（无渲染组件）中标注为"计算器核心计算"的 effect。下表的"组装来源"全部指向该组件内的代码。

| 字段 | 类型 | 语义 | 组装来源 |
|---|---|---|---|
| `buffContext` | `BuffContext` | 通用黑板实例，承载五段分析汇总后的全部加成乘区 | store 的 `globalAnalysisResult`，由 CalcCenter"计算全局Buff上下文"effect 按 `analyzeChar → analyzeRelics → analyzeRogueDifficulty → analyzeTopicSpec → analyzeEnemySpec`（均为 `calculator/helper.ts` 的 `CalculatorHelper` 静态方法）链式构建 |
| `charInput` | `CharInput & { attribute: CharAttribute }` | 干员养成输入 + 局外面板数值 | store 的 `charInput` 展开后，现场补 `attribute: CalculatorHelper.calculateOutsidePanel({ charInput, context: buffContext })` |
| `charData` | `CharData` | 干员解包原始数据；其 `name` 同时是分发键 | store 的 `charData`（calcTypes.ts 的 `SlicedCalcCharState`） |
| `enemyInput` | `EnemyInput` | 敌人**最终面板**（已应用加成；属性嵌套在 `attributes` 内） | CalcCenter 内 `useMemo` 调 `CalculatorHelper.calculateEnemyAttr({ enemyBase, context: globalAnalysisResult })`，不入 store |
| `enemyData` | `EnemyData` | 敌人解包原始数据（字段为 `DefinedData<T>` 包装） | store 的 `enemyData`（`SlicedCalcEnemyState`） |
| `relics` | `WrappedRelicItem[]` | 当前选中且用户启用的包装藏品 | CalcCenter 的 `selectedRelics` `useMemo`：`rogueInput[topic].relics` 的 id 列表 × 当前主题 `relics`，并过滤 `enable=false` |
| `rogueInput` | `RogueInput` | 肉鸽主题与局内环境输入（难度/层数/科技树/通宝等） | store 的 `rogueInput`（`SlicedCalcGameDataState`） |

表外几点说明：

- **`buffContext` 用的是含养成的那份**。CalcCenter 维护两份上下文：`globalAnalysisResult`（含干员养成，进 `CalculatorInput`）与 `relicAnalysisResult`（不含养成，仅供 Buff 一览面板展示），后者**不参与**计算器调用。双上下文的同步义务见 [01-architecture.md](./01-architecture.md)。
- **`charInput.attribute` 的声明类型窄于运行时值**：`calculateOutsidePanel` 实际返回 `CharAttributeExt`（即 `CharAttribute & { damageScale: number }`，均见 `app/types/gameData.ts`），但 `CalculatorInput` 把它声明成 `CharAttribute`。运行时对象上有 `damageScale` 字段，类型上看不见。
- **木桩直通**：`calculateEnemyAttr` 在 `enemyBase.name === "木桩"` 时原样返回用户输入，不应用任何加成；其余敌人会被应用乘区并写入合成后的 `attributes.damageResistance`（物理法术减伤，合成公式见 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md)）。
- `EnemyInput.attributes` 的类型是 `EnemyAttribute`（`app/types/gameData.ts`），干员实现里以 `input.enemyInput.attributes.def` 这类嵌套路径读取——旧 fixture 的扁平 `enemyInput` 正是因此失效，见第 6 节。

### 2.1 relics 元素结构

`relics` 数组的每个元素都是共享 `WrappedRelicItem`：

| 字段 | 内容 | 约束 |
|---|---|---|
| `id` / `name` | 稳定 ID 与中文名 | 黑名单和 tooltip 按名称匹配 |
| `pinyin` | backend 同规则生成的拼音 | `tiny-pinyin`、下划线分隔、统一小写 |
| `relic` | `items[itemId]` 与 `relics[itemId]` 的合并对象 | `usage` 保证为字符串，原值为 `null` 时导出为 `""`；其余物品字段与 `buffs` 保持原值 |
| `charBuffs` | GameData 原封关联角色 buff 数组 | 保留一对多关系，禁止改写 |
| `layer` / `enable` | 用户态包装字段 | `layer` 默认 0；`enable=false` 完全不参与计算 |

效果描述通过 `WrappedRelicItem.relic.usage` 读取，搜索拼音直接使用 `WrappedRelicItem.pinyin`。`disabled/hasLayer/isFavorite/initials` 存在独立 `relicUiStateMap`，类型为 `RelicUiState`。

`RelicBuff` 为 `{ key: string; blackboard: BlackboardData[] }`，`BlackboardData` 为 `{ key: string; value: number; valueStr: string | null }`。独立黑板的注册键取 `blackboard` 中 `key === "key"` 词条的 `valueStr`（`calculator/impls.ts` 的 `getRelicBlackboard`；**该词条缺失时默认键为 `"char"`，未注册键静默返回 no-op**）。藏品 buff 的完整分发规则见 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)。

### 2.2 RogueInput 结构

`RogueInput`（`app/stores/damageCalculator/calcTypes.ts`）= `{ topic: RogueTopic }` 加上**每个主题一份**的输入记录（`Record<RogueKey, {...}>`，`rogue_1` 到 `rogue_5` 五份并存，计算时按 `topic` 取当前主题那份）：

| 字段 | 类型 | 语义 |
|---|---|---|
| `zone` | `string` | 区域 |
| `layer` | `string` | 层数选择 |
| `tech` | `string` | 科技树档位 |
| `difficulty` | `number` | 肉鸽难度 |
| `stage` | `string` | 关卡 id（源码注释自述"似乎从没更新过"） |
| `enemyName` | `string` | 敌人名称 |
| `relics` | `string[]` | 选中藏品 id 列表 |
| `thoughtLoad` | `"NORMAL" \| "CONFUSION" \| "STAGNATION"` | 思维负荷（清晰/混乱/阻滞） |
| `inspiration` | `string?` | 当前生效灵感（rogue_4） |
| `disaster` | `string?` | 年代（rogue_4） |
| `wraths` | `string[]` | 岁时（rogue_5） |
| `coppers` | `string[]` | 通宝（rogue_5） |

注意：年代/灵感/岁时/通宝在进入 `buffContext` 时已经由 `analyzeTopicSpec` 处理完毕，`rogueInput` 里这些 id 列表主要供干员实现做存在性判断和供 UI 回显；难度词条的具体数值规则见 [05-topic-spec-and-enemy-spec.md](./05-topic-spec-and-enemy-spec.md)。

## 3. CharInput 结构

`CharInput`（`app/stores/damageCalculator/calcTypes.ts`）是干员侧的全部用户输入。`attribute` 字段**不属于** `CharInput` 本身，只在 `CalculatorInput.charInput` 这个交叉类型上出现（见第 2 节）。

| 字段 | 类型 | 语义 |
|---|---|---|
| `name` | `string` | 干员名称（中文，与 `charData.name` 一致） |
| `phases` | `CharPhase[]` | 精英化阶段选项 |
| `phaseLevel` | `number` | 精英化等级 |
| `phase` | `CharPhase` | 当前精英化阶段数据 |
| `frameIndex` | `number` | 干员等级（`keyFrames` 下标） |
| `keyFrames` | `AttributeKeyFrame[]` | 干员等级选项（属性关键帧） |
| `potential` | `number` | 潜能 |
| `skillKey` | `string` | 技能键名（干员实现内 `switch` 的分支键） |
| `skills` | `SkillData[]` | 技能选项 |
| `skillLevels` | `{ key: number; name: string }[]` | 技能等级选项 |
| `skillLevel` | `number` | 技能等级 |
| `skill` | `SkillLevelData` | 当前技能等级数据 |
| `uniEquipId` | `string` | 模组 ID |
| `equips` | `UniEquipData[]` | 模组选项 |
| `uniEquipLevel` | `number` | 模组等级 |
| `uniEquip` | `UniEquipPhaseData?` | 当前模组阶段数据（可缺省） |
| `uniEquipName` | `string` | 模组名称 |
| `attributeModifier` | `CharAttributeModifier` | 属性额外修改（`atkOutPercent`/`atkInPercent`/`atkFinal`/`atkSpd`） |
| `candleHolder` | `boolean` | 是否为伺烛客（rogue_5 限定） |
| `dygmnyTile` | `boolean` | 是否在化境地块上 |
| `charSpec` | `CharSpec[]` | 干员特殊配置生效项（由各干员 `charSpecConfigs` 的 `apply` 产生） |

## 4. CalculatorOutput 结构

`CalculatorOutput`（`app/types/gameData.ts`）：

| 字段 | 类型 | 语义 |
|---|---|---|
| `attack` | `DamageData` | 普攻段 |
| `skill` | `DamageData` | 技能段 |
| `cycle` | `DamageData` | 周期段（一个"技能持续 + 回转"周期的期望） |
| `logs` | `string[]` | 名义上是"运算过程"，**恒为空数组**（见 4.3） |

`DamageData`：

| 字段 | 类型 | 语义 |
|---|---|---|
| `dph` | `number` | JSDoc 写"面板攻击力"，实际各干员口径不一（见 4.2） |
| `dps` | `DamageByType` | 每秒伤害，按伤害类型拆分 |
| `total_damage` | `DamageByType` | 该段总伤害，按伤害类型拆分 |

`DamageByType` 四个字段**均为必填 `number`**（旧 WASM 文档中是可选字段，已变更）：`phy`（物理）、`mag`（法术）、`pure`（真实）、`ep`（元素）。干员实现只写自己涉及的类型，其余保持 `createCalculatorOutput` 初始化的 0。

### 4.1 三段输出的口径

`attack`/`skill`/`cycle` 的数值全部由各干员脚本手写产出，公共约定只有"空输出"形状（`CalculatorHelper.createCalculatorOutput` 把三段的 `dph` 与四类 `dps`/`total_damage` 全部置 0）。同一字段在不同干员实现间的统计口径（如 `attack.total_damage` 是单发还是回转期内总和）并不完全一致，编写与核对口径的规范见 [04-char-impl-cookbook.md](./04-char-impl-cookbook.md)。

### 4.2 dph 的真实语义

> ⚠️ **`dph` 不是稳定契约字段，禁止跨干员比较或做统一断言。** 类型上的 JSDoc（"面板攻击力"）与多数实现的实际写法不符，且各实现口径已分化。

实测的代表性写法：

| 实现 | `attack.dph` | `skill.dph` |
|---|---|---|
| `calculator/charImpl/近卫/赫德雷.ts` | 不写（恒 0） | 含技能倍率的攻击数值（未扣防御/减伤） |
| `calculator/charImpl/狙击/维什戴尔.ts` | 普攻最终攻击力 | 技能最终攻击力 |
| `calculator/charImpl/狙击/莱伊.ts` | 最终攻击力 ×(1−敌人减伤) | 技能单发伤害值 |

为 fixture 写断言时应把 `dph` 视为各干员实现的私有口径：金值基线可以锁定它（防回归），但不要赋予它跨实现的物理含义。

### 4.3 logs 恒为空

`logs` 字段在全仓库只有一个写入点：`CalculatorHelper.createCalculatorOutput` 初始化为 `[]`。所有干员实现都不向它 push；UI 侧 `OperatorSection/ResultDisplay.tsx` 渲染时显式过滤掉 `logs` 键。

原因：该字段是 WASM 时代契约的遗形——JS 重写后"运算过程"改走 console（`debugRelic` 常开的藏品判定日志、`CalculatorHelper.print` 的输入输出打印），`logs` 通道从未被实现。调试输出的阅读方法见 [07-debugging.md](./07-debugging.md)。

> ⚠️ fixture 与验证报告**不要**断言或依赖 `logs` 内容；它只为保持类型形状而存在，未来可能直接删除。

## 5. buffContext 是类实例，不可 JSON 序列化

> ⚠️ **`CalculatorInput.buffContext` 是带方法的类实例树，`JSON.stringify` 后无法回灌。** `BuffContext`（`calculator/buff-context.ts`）的每个乘区桶字段都是 `ExpressionGroupNode` AST 节点（`calculator/ast` 的导出），靠节点的 `calculate()` 求值；`BuffContext.clone()` 是手写逐字段深拷贝。序列化只能留下纯数据骨架，丢失全部方法与原型，干员实现第一行 `context.in_game_buff_add.atk.calculate()` 即抛 `TypeError`——当前测试套件 4/4 全红正是这个原因。

由此推出的硬性规则：

- **fixture 只存原始输入**（charInput、charData、enemyData、relics、rogueInput 等可 JSON 化的部分），`buffContext` 在测试内用 `CalculatorHelper` 的 analyze 链 headless 重建（顺序对照 `calculator/CalcCenter.tsx`）。重建流程与基线管理见 [09-fixtures-and-baselines.md](./09-fixtures-and-baselines.md)。
- 验证报告若需落盘乘区数值，应存各桶 `calculate()` 后的标量或 `structure()` 导出的可序列化结构，而不是 context 本身，见 [10-relic-buff-verification.md](./10-relic-buff-verification.md)。

`BuffContext` 的字段清单（形状层面）：`invalidRelics`（未生效藏品列表）+ 八个乘区桶 `stage_rune_mul`、`relic_rune_add`、`relic_rune_mul`、`in_game_buff_add`、`in_game_buff_mul`、`in_game_buff_final_add`、`in_game_buff_final_mul`、`global_buff_stack`。各桶的语义、基数、操作符与写入方属于 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md) 的内容，本篇不展开。

## 6. 与旧 WASM 文档的差异对照

旧 `docs/DamageCalculatorDataSchema.md`（已加过时横幅）描述的接口从未在生产接入（WASM 路线始末见 [adr/0001-pure-ts-over-wasm.md](./adr/0001-pure-ts-over-wasm.md)）。逐项对照：

| 维度 | 旧文档（WASM `calculate`，未接入） | 现行（`calculator`） |
|---|---|---|
| 实现载体 | WASM 模块导出函数 | 纯 TypeScript，按干员分发到 `charImpl` 脚本 |
| 入口形式 | 多参数 `calculate(charInput, enemyInput, charData, enemyData, skillData, uniEquipData, relics)` | 单对象 `calculator(input: CalculatorInput)` |
| `buffContext` | 不存在 | 必填，`BuffContext` 类实例（第 5 节） |
| `rogueInput` | 不存在 | 必填 |
| `skillData`/`uniEquipData` | 顶层独立入参 | 并入 `charInput.skill` / `charInput.uniEquip` |
| `enemyInput` | `EnemyAttribute`（扁平面板） | `EnemyInput`（面板嵌套在 `attributes` 字段内） |
| `relics` 元素 | `RelicWrapper[]` | `WrappedRelicItem[]`（原始 buff 位于 `relic.buffs`） |
| 输出普攻键 | `auto` | `attack` |
| `DamageData` 面板字段 | `atk` | `dph`（口径见 4.2） |
| `DamageByType` 字段 | 可选（`phy?` 等） | 全部必填 `number` |
| `logs` | 宣称"运算过程" | 类型保留但恒为空（4.3） |

旧测试 fixture（`test/DamageCalculator/data/*.json`）正是按旧文档一侧的形状录制的，因此与现行代码不兼容；修复方案见 [09-fixtures-and-baselines.md](./09-fixtures-and-baselines.md)。
