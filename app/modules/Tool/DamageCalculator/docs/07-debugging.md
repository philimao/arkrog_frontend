---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/calculator/ast/index.ts
  - app/modules/Tool/DamageCalculator/calculator/debug/print-relics-info.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/DebugInfo/DebugInfo.tsx
  - app/modules/Tool/DamageCalculator/RelicSection/RelicsContainer.tsx
  - app/modules/Tool/DamageCalculator/RelicSection/BuffPanel.tsx
  - app/modules/Tool/DamageCalculator/OperatorSection/OperatorAttributes.tsx
  - app/modules/Tool/DamageCalculator/OperatorSection/ResultDisplay.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/use-rogue5-topic-spec-items.ts
  - app/modules/Tool/components/ExpressionDisplay.tsx
  - app/modules/Tool/index.tsx
  - app/stores/damageCalculator/slices/calculatorSlice.ts
  - test/DamageCalculator/index.test.ts
  - docs/debuger.md
---

# 07 调试与排查手册

计算器没有面向用户的运算日志：`CalculatorOutput.logs` 恒为空数组（仅在 calculator/helper.ts 的 `createCalculatorOutput` 中初始化，无任何写入方，OperatorSection/ResultDisplay.tsx 渲染时显式过滤该字段，详见 [06-data-schema.md](./06-data-schema.md)）。验证与排查的实际手段是三类：**浏览器控制台输出**、**页面上的面板/悬浮公式**、**断点**。本文按这个顺序展开，核心是第 3 节的症状导向排查表。

可用工具一览：

| 工具 | 形态 | 入口符号 |
|---|---|---|
| 藏品判定日志 | console.group（每次重算自动打印） | calculator/helper.ts 的 `debugRelic` 开关 + `applyRelic` |
| 标准打印 | console.group + console.table | calculator/helper.ts 的 `CalculatorHelper.print`（CalcCenter 每次核心计算后调用） |
| 加成详细表 | console.table | calculator/helper.ts 的 `CalculatorHelper.printAdditionContext` |
| 单藏品生效词条 | 藏品卡片下的文字（默认关闭） | calculator/helper.ts 的 `printRelic` + RelicSection/RelicsContainer.tsx 的局部 `debugRelic` |
| Buff 一览面板 | UI | calculator/helper.ts 的 `outputAdditionEntry` + RelicSection/BuffPanel.tsx |
| 敌人面板公式弹层 | UI | app/modules/Tool/components/ExpressionDisplay.tsx |
| DebugInfo 面板 | UI（仅开发环境） | DebugInfo/DebugInfo.tsx |
| 全量藏品实现表 | console.table（仅开发环境，初始化时一次） | app/stores/damageCalculator/slices/calculatorSlice.ts 的 `initStore` |
| 强制应用全部藏品 | 函数 | calculator/debug/print-relics-info.ts 的 `applyAnyRelics`（边界见第 5 节） |

## 1. 浏览器控制台调试

### 1.1 debugRelic 开关：常开的事实

calculator/helper.ts 导出 `export const debugRelic = true`——**硬编码常开，含生产环境**。只要页面发生一次重算（改干员、改藏品、改敌人、改难度都触发，见 [01-architecture.md](./01-architecture.md) 的重算链路），控制台就会刷出全部藏品的判定过程。关闭它只能改源码。

> ⚠️ 这个开关有两处不对称（均为源码现状，读日志时要心里有数）：
>
> 1. calculator/blackboard.ts 的 `commonCharRelicBlackboard.isActive` 用 throw/catch 做控制流，catch 里的 `console.log("*** buff不生效 ***")` **没有**被 `debugRelic` 包裹——即使把开关改成 false，这一行仍会打印，且因为分组日志没了，它会孤零零地出现、不知道属于哪个藏品。
> 2. `commonEnemyRelicBlackboard.isActive` 在开头 `console.groupCollapsed` 之后，所有提前 `return false` 的分支**不会执行 `console.groupEnd`**，只有走到"`*** buff生效 ***`"的成功路径才关组。结果是：一旦某个 buff 在敌人侧判定失败，后续日志会被错误地嵌套进这个未关闭的分组里。看到诡异的嵌套层级，先怀疑这里，不要怀疑你的眼睛。

另外，RelicSection/RelicsContainer.tsx 内还有一个**同名但独立**的局部常量 `debugRelic`（默认 false）。把它改为 true 后，每张藏品卡片下方会直接渲染该藏品对当前干员/关卡/敌人的生效词条（实现：对单个藏品跑一遍 `applyRelic`，再用 `printRelic` 提取）。源码注释明确提醒：开这个局部开关时应把 helper 的 `debugRelic` 关掉，否则每张卡片渲染都会触发一轮判定日志，控制台会被刷爆。

### 1.2 每次计算打印什么、怎么读

一次重算的控制台输出按时间顺序分两段。

**第一段：藏品判定分组**（来自 `analyzeRelics` → `applyRelic`）。每个藏品一个折叠组 `藏品 <名称>`，组内对每个 buff 依次打印三级分发的判定结果（分发机制正文见 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)）：

| 日志行 | 判定内容 | 对应符号（排查入口） |
|---|---|---|
| `位于黑名单中 <bool>` | 藏品中文名是否在黑名单 | utils.ts 的 `isRelicInBlacklist` / `disallowedRelicNames` |
| `有特殊黑板实现 <bool>` | buff 黑板中 `key=='key'` 词条的 `valueStr` 是否注册过独立黑板 | calculator/impls.ts 的 `isRelicBlackboard` |
| `使用敌人通用黑板` / `使用干员通用黑板` | 没走独立黑板时的分流结果 | utils.ts 的 `isBuffForEnemy` |
| `buff <buff.key> <blackboard数组>`（子折叠组） | 通用黑板 isActive 判定开始 | calculator/blackboard.ts 的 `commonCharRelicBlackboard` / `commonEnemyRelicBlackboard` |
| `对该干员生效状态 <a> <b> <c>` | 依次为：不在藏品黑名单 / 不在 valueStr 黑名单 / 选择器+key 白名单通过 | `isRelicInBlacklist`、`isBuffInBlacklist`、utils.ts 的 `isBlackboardActiveForChar` |
| `关卡类型 ...` | `validator.roguelike_event_type`（BATTLE_BOSS/DUEL） | 同上 isActive 内 |
| `伺烛客选择器 ...` | valueStr 含 `rogue_5_character_in_candle_holder` 时要求 `charInput.candleHolder` | 同上 |
| `化境地块选择器 ...` | `relic.usage` 文案含"化境地块"时要求 `charInput.dygmnyTile` | 同上 |
| `敌人数据` / `敌人ID选择器` / `陷阱ID选择器` / `敌人等级选择器` / `敌人TAG选择器` / `关卡类型选择器` / `岁兽残识选择器` | 敌人侧逐项选择器判定 | `commonEnemyRelicBlackboard.isActive` |
| `*** buff生效 ***` / `*** buff不生效 ***` | 该 buff 的判定结论 | — |

读法：找到目标藏品的折叠组 → 看它的 buff 走了哪条分发路径 → 在子组里找第一个为 false/不匹配的行，那就是不生效的直接原因。

> ⚠️ 同一个藏品组在一次重算里会出现**不止一次**：CalcCenter 维护两份 BuffContext（含养成的 `globalAnalysisResult` 与供 Buff 一览的 `relicAnalysisResult`，见 [01-architecture.md](./01-architecture.md)），各跑一遍 `analyzeRelics`/`analyzeTopicSpec`。这不代表加成被重复计算——两份是相互独立的上下文。此外 `analyzeTopicSpec` 与 `analyzeEnemySpec` 也复用 `applyRelic`，所以通宝、岁时/天象、年代、灵感会以"藏品 <名称>"的形式出现，关卡 rune 会以伪藏品 `藏品 关卡加成` 的形式出现。

**第二段：标准打印**（calculator/CalcCenter.tsx 的核心计算 effect 在每次 `calculator(input)` 之后调用 `CalculatorHelper.print`）：

1. 横幅 `本次运行伤害计算结果 | 版本：1.0.0_beta`；
2. 折叠组"查看输入输出原始数据"——`输入` 是完整 `CalculatorInput`（含 `buffContext`，可展开核对每个乘区），`输出` 是 `CalculatorOutput`；随后内嵌一次 `printAdditionContext`（见 1.3）；
3. 折叠组"查看结构化输出"——console.table 三行：普攻/技能/周期伤害，列为 `面板攻击力`（即各段 `dph`）、`dps`、`总伤`。注意 `dps` 与 `总伤` 列是把物理/法术/真伤/元素四种伤害**求和**后的单值，分类型数值要去上面的原始输出对象里看。

### 1.3 printAdditionContext 的 console.table 列含义

`CalculatorHelper.printAdditionContext(context, relics)` 输出折叠组"加成详细打印"：先 `console.log(context)` 打出**活的 BuffContext 对象**（可展开核对每个乘区的 children 与 `invalidRelics` 数组），然后是按来源聚合的 console.table：

| 列 | 内容 |
|---|---|
| 藏品名称 | 节点 `tooltip` 聚合（见 1.4） |
| 词条 | 默认恒为空字符串 |
| 局外加算 | `relic_rune_add` 桶中该来源的节点，格式 `属性中文名+值` |
| 局外乘算 | `relic_rune_mul` 桶，格式 `属性中文名*百分比` |
| 直接加算 | `in_game_buff_add` 桶 |
| 直接乘算 | `in_game_buff_mul` 桶 |
| 最终乘算 | `in_game_buff_final_mul` 桶 |
| 描述 | `relic.usage` 原文 |

表格外需要知道的事：

- 属性中文名来自 utils.ts 的 `allowedBlackboardKeyMap`（兼作白名单与翻译表）；同一来源在同一乘区有多条时用 `|` 连接。
- 百分比是节点值直接 `*100%` 显示，**其语义（增量还是倍率）由乘区决定**：`relic_rune_mul` 的子节点是增量（`+30%` 的藏品显示 `攻击力*30%`），而敌人系 `in_game_buff_final_mul` 的子节点是倍率（`+20%` 生命显示 `敌人生命上限*120%`）。各乘区 operator 与基数的规格见 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md)。
- "藏品名称"列实为 `tooltip` 聚合，所以**非藏品来源也会各占一行**：信赖、潜能、科技树、`直面魂灵·N | ...`/`请君入园·N | ...` 难度词条等（`CalculatorHelper.print` 传入的是含养成的 `globalAnalysisResult`）。
- 传入的 `relics` 中没有产生任何节点的藏品也会出现在表中，**所有乘区列为空**——这就是"未生效藏品"行，与 `context.invalidRelics` 互为印证。
- "词条"列默认为空：`printAdditionContext` 内部的 `getKey` 默认返回空串，文件里保留了一段注释掉的实现（提取 buff 黑板中 `key=='key'` 的 `valueStr`），临时排查独立黑板注册键时可以打开。

> ⚠️ 表格**没有"最终加算"列**——输出 `in_game_buff_final_add` 的那一行在源码中被注释掉了。写入该乘区的加成（如鼓舞类最终加算）在表里不可见，要在 `console.log(context)` 展开的对象里手动看 `in_game_buff_final_add`。

### 1.4 用 tooltip 溯源某条加成来自哪个藏品

机制：所有写入乘区的 AST 节点（calculator/ast/index.ts 的 `NumericLiteralNode`/`ExpressionGroupNode`）都携带 `tooltip` 字段，约定为**来源名**——通用黑板与规范的独立黑板写 `relic.name`，干员养成写"信赖"/"潜能"，难度词条写完整描述串。`CalculatorHelper.printRelic` 就是按 `child.tooltip === relicName` 反查一个藏品在全部乘区的落点。

三条溯源路径：

1. **控制台**："加成详细打印"组里 `console.log(context)` → 展开可疑乘区 → 展开 `children` → 看每个节点的 `tooltip` 与 `value`；`NumericLiteralNode` 还可能带 `source` 字段（原始 `{relic, buff}` 引用），可直接定位到解包数据。
2. **UI（敌人面板）**：非木桩敌人的属性数值是 app/modules/Tool/components/ExpressionDisplay.tsx 渲染的弹层——点击数值展开表达式树，悬浮每个数字 Chip 即显示该节点的 `tooltip`（来源名）。
3. **UI（藏品卡片）**：开 RelicsContainer.tsx 的局部 `debugRelic`（见 1.1），单藏品的生效词条直接显示在卡片下。

> ⚠️ `tooltip` 是事实上的标识符，不只是给人看的：`printRelic`、`printAdditionContext` 的行聚合、`applyAnyRelics` 的"已实现"判定（第 5 节）全部靠 `tooltip` 与 `relic.name` 的字符串相等。独立黑板的 `apply` 里若把 tooltip 写成硬编码字面量而非 `relic.name`（现存案例：calculator/blackboard.ts 中 `rogue_3_relic_book_7` 的 apply 硬编码"断杖-波纹"），一旦上游改名或被别的藏品复用同一注册键，溯源与有效性判定会整体失配。新写独立黑板一律用 `relic.name`，见 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)。

## 2. DebugInfo 面板

app/modules/Tool/index.tsx 的 `DebugInfoWrapper` 仅在 `import.meta.env.DEV` 下懒加载 DebugInfo/DebugInfo.tsx，生产构建中不存在。面板目前只有一个功能：按钮"显示敌人解包数据"，展开后把 store 中 `enemyBase`（当前选中敌人的原始输入）以 JSON 全文显示。

用途：排查"算出来不对"之前，先确认**喂进计算器的敌人原始数值就是你以为的那个**（等级档位、attributes 各项）。如果这里就不对，问题在数据选取/档位映射，不在计算，转 [05-topic-spec-and-enemy-spec.md](./05-topic-spec-and-enemy-spec.md)。

与之相邻的一个仅开发环境输出：app/stores/damageCalculator/slices/calculatorSlice.ts 的 `initStore` 在 DEV 下会对 rogue_4/rogue_5 的**全量藏品**各打一份 `printAdditionContext`（基于 `applyAnyRelics`，见第 5 节）。这份表回答"全主题哪些藏品已有实现"，与单次计算打印的那份（只含当前勾选藏品、且经过 isActive）口径不同，不要混读。

## 3. 症状导向排查表

下表是入口索引，每个症状的展开排查在后续小节。

| 症状 | 第一现场 | 详见 |
|---|---|---|
| 藏品/通宝在列表中置灰（悬浮提示"该藏品暂未生效"） | `relicWrapper.disabled` | 3.1 |
| 藏品勾选了但没任何效果 | 藏品判定 console.group | 3.2 |
| 效果数值翻倍/减半/差层数 | printAdditionContext 节点值 | 3.3 |
| 面板数值与计算结果对不上 | 双 BuffContext | 3.4 |
| 干员输出全 0 | console.warn + charImpl 的 switch | 3.5 |

### 3.1 藏品/通宝置灰

置灰=该藏品/通宝**没有任何黑板实现**。判定发生在初始化：`initStore`（藏品，app/stores/damageCalculator/slices/calculatorSlice.ts）与 `getRogue5Coppers`（通宝，TopicSpecSection/components/use-rogue5-topic-spec-items.ts）都用 `applyAnyRelics` 强制应用全部 buff，凡是在所有乘区都没有产生节点（按 tooltip 匹配 `relic.name`）的，标 `disabled = true`。

排查/处理：这不是 bug，是待适配清单。接入方法（通用黑板能不能吃、要不要注册独立黑板）走 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)。注意 `initStore` 里有一个手工豁免名单 `validRelicList`（"烟花之手"、"国王的铠甲"——不产节点但在干员脚本里特判），改判定逻辑时别误伤。

### 3.2 藏品勾选了但没效果

按 `applyRelic`（calculator/helper.ts）的分发顺序逐级查，每一级在 console.group 里都有对应日志行（见 1.2 的表）：

1. **黑名单**：日志行 `位于黑名单中 true`，或子组里 `对该干员生效状态` 第二个 bool 为 false → utils.ts 的 `disallowedRelicNames`（按藏品中文名）/ `disallowedValueStrs`（按 buff 黑板 valueStr）。注意：模块根目录的 black-list.ts **不是**藏品黑名单，它是干员禁用技能的 UI 配置。
2. **独立黑板注册键不匹配**：日志行 `有特殊黑板实现 false`，但你明明在 calculator/blackboard.ts 里注册了 → 核对注册键。键必须等于该 buff 黑板中 `key=='key'` 词条的 `valueStr`——**不是 `buff.key`，也不是藏品 id**（calculator/impls.ts 的 `isRelicBlackboard`/`getRelicBlackboard`；buff 没有 `key=='key'` 词条时默认键为 `'char'`）。
3. **独立黑板 isActive 不满足**：`有特殊黑板实现 true` 但乘区里没节点 → 看该注册项的 `isActive` 条件（技能类型、套装计数、依赖藏品等），并确认 buff 进了 `context.invalidRelics`。
4. **分流错了**：日志行 `使用敌人通用黑板`/`使用干员通用黑板` 与预期不符 → utils.ts 的 `isBuffForEnemy`（`buff.key` 以 enemy 开头、或 valueStr 以 `enemy_`/`trap_` 开头）。
5. **selector 不支持/不匹配**：buff 子组里某个选择器行不匹配 → 干员侧 `isBlackboardActiveForChar`（职业/子职业/部署位，外加伺烛客与化境地块两个文案耦合选择器），敌人侧 `commonEnemyRelicBlackboard.isActive`（敌人 ID/等级/TAG/关卡类型/岁兽残识）。通用黑板**不支持**的选择器类型意味着必须写独立黑板。
6. **key 不在白名单**：`对该干员生效状态` 第三个 bool 为 false 且选择器都对 → `isBlackboardActiveForChar` 的最后一关要求 buff 黑板里至少一个 key 在 `allowedBlackboardKeyMap`（utils.ts）。新词条没登记就在这里被拦。
7. **apply 阶段静默丢弃**：isActive 全过、`*** buff生效 ***` 也打了，乘区里仍没有 → 通用黑板的 `apply` 只识别有限的 key 集合（`atk`/`max_hp`/`multiplier@atk`/`prob`+`evade[...]` 等），全部未命中时整个 relic 被 push 进 `context.invalidRelics`，无其他告警。

> ⚠️ 第 2 条是最危险的静默失败：注册键拼错时**没有任何报错**（`getRelicBlackboard` 对未注册键返回 `{isActive: () => true, apply: 空函数}` 的 no-op，里面的 console.warn 被注释掉了），buff 会安静地落入通用黑板，被**部分消化**（比如只吃到 atk 词条、丢掉特殊条件）或判无效。"看似生效实际不对"比"明确不生效"更难发现——新增独立黑板后务必用 printAdditionContext 核对落点乘区与数值。

### 3.3 效果数值翻倍/减半/差层数

三个高频根因，都不报错、只算错：

- **正负双语义**：敌人通用黑板的 `apply`（calculator/blackboard.ts 的 `commonEnemyRelicBlackboard`）对 atk/max_hp/def 用 `Math.sign(v) === 1 ? v : 1 + v`——正数是倍率（1.3 = 130%），负数是增量（-0.3 → ×0.7）。上游两种写法都存在，照抄相邻 case 容易把 30% 写成 130% 或反之。
- **层数双轨**：通用干员黑板（`commonCharRelicBlackboard.apply`）的局外分支只在 `buff.key` 以 `layer_` 开头时才乘 `relic.layer`（否则按 1 层），而局内分支**无条件**乘 `relic.layer`；`multiplier@atk` 与 `multiplier@max_hp`/`multiplier@def` 的取层来源也不一致。独立黑板则各自决定乘不乘层。给不可叠层藏品填了层数、或反过来，数值就差一个 layer 倍数。
- **乘区错位**：局内/局外由 `inGameRelicNames` 名单（utils.ts，按中文名）+ `buff.key` 含 `buff`/`ability` 判定，错放的直接表现是"先加后乘"的顺序差；加算/乘算由 `buff.key` 含 `_attribute_add` 判定。各乘区在合成公式中的位置见 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md)，名单维护见 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)。

排查手法：在 printAdditionContext 展开的 `context` 对象里找到该来源节点，看 `value` 是否已含层数/符号换算，再对照落点乘区的 operator（`+`/`*`/`max`/`union`）判断是写错值还是放错桶。

### 3.4 面板数值与计算结果对不上

先确认你在比较的两个数**来自哪份上下文**：

- CalcCenter 维护两份 BuffContext：`globalAnalysisResult`（含干员养成：信赖/潜能/模组/天赋，供核心计算与敌人面板）与 `relicAnalysisResult`（**不含养成**，专供 Buff 一览面板）。Buff 一览（RelicSection/BuffPanel.tsx，经 `outputAdditionEntry`）的条目与计数天然少于实际参与计算的加成，这是设计而非 bug。两份 context 的同步义务见 [01-architecture.md](./01-architecture.md)。
- **applySkill 只改面板**：OperatorSection/OperatorAttributes.tsx 在技能模式下 clone 上下文并调用干员实现的 `applySkill`，仅用于技能面板展示；DPS 计算走的是 charImpl 内 `switch (skillKey)` 各 case 的硬编码倍率，二者口径可能漂移。见 [04-char-impl-cookbook.md](./04-char-impl-cookbook.md)。
- **模组天赋/特性**：`analyzeChar`（calculator/helper.ts）中模组 parts 的解析被注释（TODO 由计算脚本写死），实际由各干员脚本的 `applyTalent` 自行取数——新干员漏写时，面板（吃模组基础属性）与输出（缺天赋加成）会出现可感知的偏差。

### 3.5 干员输出全 0

两个互不相干的原因，先看控制台再看代码：

- **实现未注册**：控制台出现 `干员 <名> 的计算器实现为空`（calculator/impls.ts 的 `getCalculatorImpl` fallback，返回全 0 输出，UI 不报错）。注册键 = 文件名去 `.ts`（中文），查找键 = `charData.name`；calculator/index.ts 的 `import.meta.glob('./charImpl/*/**.ts')` **只扫子目录**，文件放在 charImpl 根目录不会被注册。文件改名/放错层级即静默失效。
- **switch 空 case**：实现已注册、普攻段有数值，但技能/周期段为 0 → 该干员脚本的 `switch (skillKey)` 没有覆盖当前选中技能（charImpl 各文件以 `skchr_` 开头的技能 key 分 case），未命中的 case 保持 `createCalculatorOutput` 的零值。

两条的修复路径都在 [04-char-impl-cookbook.md](./04-char-impl-cookbook.md)。

## 4. 断点调试

本节文字步骤转写自 [docs/debuger.md](../../../../../docs/debuger.md)。

> ⚠️ 原文的操作截图是语雀（cdn.nlark.com）外链，随时可能失效；以本节文字为准。原文件过渡期后将删除。

### 4.1 VSCode + vitest 断点

1. 用 VSCode 打开仓库；
2. 计算实现的位置：`calculator/charImpl/`（所有干员实现）与 `calculator/calculator.ts`（总入口 `calculator`）。在目标干员函数内行号左侧点出红点设断点；
3. 打开调试面板，选择 **JavaScript Debug Terminal**；
4. 在弹出的终端里运行 `yarn test`（package.json 的 `test` 脚本即 `vitest run`）；
5. 执行到对应测试时会停在断点。

> ⚠️ 测试套件当前 4/4 全红：test/DamageCalculator/index.test.ts 的 fixture 是旧 schema、缺 `buffContext`，干员实现第一行解引用即抛 TypeError。断点本身仍会命中（在抛错之前），可以用来观察控制流，但 fixture 喂进来的输入是过时的，**不能**据此核对数值。测试基建的修复方案与 fixture 重建流程见 [09-fixtures-and-baselines.md](./09-fixtures-and-baselines.md)，vitest 运行环境见 [docs/testing.md](../../../../../docs/testing.md)。

### 4.2 浏览器 Sources 断点

1. 本地启动前端（`yarn dev`）；
2. 打开页面，F12 进入开发者工具，切到 **Sources（源代码）** 面板；
3. 按 `Ctrl+P` 搜索并打开目标干员的实现文件（原文写 `Ctrl+Shift+P`，在 DevTools 中那是命令菜单，搜文件用 `Ctrl+P`；vite dev 下可直接搜中文文件名）；
4. 在想停的行点击行号设断点；
5. 页面上选择该干员（或改动任何会触发重算的输入），执行流进入断点。

实践提示：要观察藏品判定而非干员脚本时，断点设在 calculator/helper.ts 的 `applyRelic` 或 calculator/blackboard.ts 对应黑板的 `isActive`/`apply` 上；条件断点用 `relic.name === "<藏品名>"` 过滤可以避免在几十个藏品上反复继续。

## 5. applyAnyRelics 的适用边界

calculator/debug/print-relics-info.ts 提供两个函数：

- `applyAnyRelics(relics)`：跳过**所有** isActive 判定（黑名单除外），对每个 buff 强制调用对应黑板的 `apply`，返回攒满节点的 BuffContext；
- `printRelicsInfo(input)`：`applyAnyRelics` + `printAdditionContext` 的组合，已标 `@deprecated`。

deprecated 注释写明了原因：**无法判断藏品是否生效，可能存在多个 buff 同时生效的情况，仅能用于判断藏品是否实现黑板**。一个藏品对不同职业/条件常有多个互斥 buff（正常管线由 isActive 二选一），`applyAnyRelics` 会让它们全部落进乘区叠加。

因此它的能力边界是：

| 能回答 | 不能回答 |
|---|---|
| 这个藏品/通宝有没有任何黑板实现（会不会产生节点） | 任何数值是否正确 |
| 哪些藏品该置灰（`disabled` 判定） | 某 buff 在当前局面下是否生效 |

现存的三个用途全部在边界内：`initStore` 的藏品 `disabled` 标注、`getRogue5Coppers` 的通宝 `disabled` 标注（源码注释同样警告"不能用于展示该通宝的具体效果"）、DEV 启动时的全量实现表（第 2 节）。

> ⚠️ 不要把 `applyAnyRelics` 当作自动化验证的取数入口。"新增藏品 buff 量"的验证必须走真实管线（`analyzeChar` → `analyzeRelics` → ...，经 isActive），方案见 [10-relic-buff-verification.md](./10-relic-buff-verification.md)。
