---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector.tsx
  - app/modules/Tool/DamageCalculator/EnemySection/TopicSelector.tsx
  - app/modules/Tool/DamageCalculator/EnemySection/enemyUtils.ts
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/use-rogue5-topic-spec-items.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/狙击/维什戴尔.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/司霆惊蛰.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/expression-util.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/OperatorSection/ResultDisplay.tsx
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/index.tsx
  - app/stores/damageCalculator/slices/calculatorSlice.ts
  - app/stores/damageCalculator/localStorage.ts
  - app/stores/damageCalculator/calcUtils.ts
  - app/stores/damageCalculator/calcUtils/calculatorUtils.ts
  - app/components/VersionLocalStoarge.ts
  - test/DamageCalculator/index.test.ts
  - yarn.lock
  - pnpm-lock.yaml
---

# 已知问题登记簿

本文是伤害计算器模块的已知问题单一登记处：数据笔误、行为缺陷、工程债三类。每条问题都已于 `last-verified` 日期打开源码逐条核实。

## 维护约定

1. **修复后同 PR 销项**：修掉某条问题的 PR 必须同时删除（或更新）本表对应行，不允许"先修代码、回头再改文档"。
2. **自动化验证对账前必读**：[10-relic-buff-verification.md](10-relic-buff-verification.md) 设计的 buff 量自动验证会拿计算结果与游戏内/解包数值对账。**本表"数据笔误"一节的存量笔误会让对应项的验证永远对不上**——在对账报告里看到这些项报红时，先来本表查是否已知，不要当作新问题重复排查；反过来，修复笔误后金值基线也要同步更新（见 [09-fixtures-and-baselines.md](09-fixtures-and-baselines.md)）。
3. 处置定性三种取值：**bug 待修**（应该修，没人反对）；**设计如此**（有意为之，链接对应 ADR 或正文文档）；**待决策**（修不修、怎么修需要人拍板）。

## 一、数据笔误

手抄数据与游戏实际数值不符的条目。这些值都在版本敏感硬编码清单（[version-sensitive-hardcode.md](version-sensitive-hardcode.md)）覆盖的文件里，属于"抄错了"而非"过期了"。

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| 怪葫芦"24源石锭"档位的 key 写成 `1.2`（前后档位依次是 0/3/6/…/21/27/30，唯独此档不是 24） | EnemySection/EnemySpecSelector.tsx 的 `EnemySpecConfigs`，`enemy_2106_dyremy` 条目 | 已确认（2026-06-11 源码核实） | `apply(key)` 按 `Number(key) * 0.05` 计算加成：选"24源石锭"时生命/攻击实际只 +6% 而非 +120%，且生成的描述文案显示"持有1.2源石锭" | bug 待修（改回 `24`） |
| 岁时"寅诗"第一档黑板 key 写成 `enemy_damage_`，第二、三档为 `extra_damage` | TopicSpecSection/components/use-rogue5-topic-spec-items.ts 的 `WRATH_CONFIG`，`rogue_5_wrath_7` 条目 | 已确认（2026-06-11 源码核实） | `functionDesc` 按 `extra_damage` 查值，第一档描述渲染为"造成 undefined% 额外伤害"。该条目当前 `disabled: true` 不参与计算，所以目前只是 UI 文案错误；但将来启用计算前必须先修此 key，否则第一档效果直接丢失 | bug 待修（补全为 `extra_damage`） |
| `ALL_TOPIC_TECHTREE_BUFF` 中 rogue_5 的 `1.2` 档位，`max_hp` 写的是 `1.24`（def/atk 均为 1.2） | utils.ts 的 `ALL_TOPIC_TECHTREE_BUFF` | 源码事实已确认；**是否笔误存疑**（未能对照游戏内难度科技树数值） | 若为笔误：界园难度加成下生命上限多算 4%；若界园科技树确实是生命 +24%，则 label `"1.2"` 反而名不副实 | 待决策（需对照游戏内数值后定性） |

## 二、行为缺陷

代码逻辑与预期行为不符、或会产出错误/不稳定结果的条目。

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| 维什戴尔一技能 `case "skchr_wisdel_1"` 是空块且无 `break`，直接 fall-through 进二技能分支；三技能 `case "skchr_wisdel_3"` 同为空块（落出 switch） | calculator/charImpl/狙击/维什戴尔.ts 的 `calculator` switch | 已确认（2026-06-11 源码核实） | 选一技能时输出的是二技能"饱和复仇"的倍率/SP/周期数值；选三技能时技能段全 0、只剩普攻段。两者均无注释佐证是有意复用 | bug 待修（实现一/三技能，或显式注释 + 在 UI 禁选；实现规范见 [04-char-impl-cookbook.md](04-char-impl-cookbook.md)） |
| 司霆惊蛰二技能循环内用 `Math.random() < talent1Prob` 采样天赋落雷，同一循环里落雷叠层却用期望值（`Math.floor(talent1Prob * blockCount * time)`）——一个实现里期望与采样混用 | calculator/charImpl/近卫/司霆惊蛰.ts 的 `calculator`，`skchr_leizi2_2` 分支 | 已确认（2026-06-11 源码核实） | 同一输入每次计算结果不同；无法纳入金值基线/快照测试。本模块对概率天赋的约定是期望化（见 [adr/0002-expectation-formula-vs-frame-simulation.md](adr/0002-expectation-formula-vs-frame-simulation.md)），若必须采样应接入冻结种子的 PRNG（见 [adr/0006-exact-golden-values-and-frozen-prng.md](adr/0006-exact-golden-values-and-frozen-prng.md)） | bug 待修（期望化该项伤害） |
| 独立黑板未注册 key 静默 no-op：`getRelicBlackboard` 查不到注册时返回 `{ isActive: () => true, apply() {} }`，`console.warn` 整行被注释；buff 黑板缺 `key` 词条时缺省键为 `"char"` 且带 `TODO` 注释 | calculator/impls.ts 的 `getRelicBlackboard` | 已确认（2026-06-11 源码核实） | 新藏品/通宝注册 key 拼错或漏注册时，"看似生效实际无任何效果"，无报错、无日志、不进 `invalidRelics`——本模块最危险的静默失败模式 | 待决策（恢复告警 vs 靠自动验证兜底；判定流程见 [03-relic-adaptation-guide.md](03-relic-adaptation-guide.md)，自动对账见 [10-relic-buff-verification.md](10-relic-buff-verification.md)） |
| `resetStore` 是空操作：函数体只剩 `console.log("resetStore")`，真正的 `set(() => initialCalculatorState, ...)` 被注释 | stores/damageCalculator/slices/calculatorSlice.ts 的 `resetStore`；调用方为 modules/Tool/index.tsx 的 `ToolIndexWrapper`（卸载时调用） | 已确认（2026-06-11 源码核实） | 离开 `/tool` 路由后 store 状态不重置，再次进入时叠加在残留状态上；与 CalcCenter 模块级 `localStateInited` 单次恢复标志耦合，路由往返/HMR 行为依赖隐式状态 | 待决策（注释无说明，可能是为保住用户配置而有意禁用，也可能是调试遗留） |
| `debugRelic` 硬编码常开（`export const debugRelic = true`） | calculator/helper.ts 的 `debugRelic` | 已确认（2026-06-11 源码核实） | 生产环境每次计算对每个藏品输出 `console.groupCollapsed` 日志；自动化测试时产生大量噪音。另注意 `commonCharRelicBlackboard.isActive` 的 catch 分支日志不受此开关控制（见 [07-debugging.md](07-debugging.md)） | bug 待修（改为可配置开关，默认关闭） |
| 模组天赋/特性加成被注释：`analyzeChar` 中 `uniEquip.attributeBlackboard`（基础属性）生效，但 `uniEquip.parts`（特性/天赋 candidates）整段注释，尾注 `TODO 暂时由计算脚本固定写死这部分加成` | calculator/helper.ts 的 `CalculatorHelper.analyzeChar` | 已确认（2026-06-11 源码核实） | 模组的特性/天赋数值改由各干员实现在 `applyTalent` 里手抄（如 charImpl/近卫/银灰.ts）；新干员适配容易漏算模组，上游模组数值变更不会自动反映（已登记进 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)） | 设计如此（暂行约定，见 [04-char-impl-cookbook.md](04-char-impl-cookbook.md)；何时改回数据驱动待决策） |
| `IBuffContext.stage_rune_mul` 是幽灵乘区：全仓库只有定义、`clone`、读取（`CalculatorHelper.calculateEnemyAttr`、expression-util.ts 的表达式拼装），没有任何写入者，恒为基数 1 | calculator/buff-context.ts 的 `IBuffContext.stage_rune_mul` | 已确认（2026-06-11 全仓库检索核实） | 阅读代码时容易误以为关卡符文走此乘区；实际关卡加成经 `analyzeEnemySpec` 以伪藏品形式写入其他乘区（语义见 [02-buff-context-and-formulas.md](02-buff-context-and-formulas.md)） | 待决策（删除字段或接通写入；删除需同步改 `clone` 与 expression-util.ts） |
| `CalculatorOutput.logs` 恒为空数组：仅在 `createCalculatorOutput` 初始化，全仓库无写入；UI 侧显式 `filter((key) => key !== "logs")` 跳过 | calculator/helper.ts 的 `CalculatorHelper.createCalculatorOutput`；OperatorSection/ResultDisplay.tsx | 已确认（2026-06-11 全仓库检索核实） | 输出契约带一个永远无内容的字段，误导消费方；真正的"运算过程"是 console 输出 | 待决策（删字段或接入日志；契约见 [06-data-schema.md](06-data-schema.md)） |

## 三、工程债

不直接产出错误数值，但阻碍开发、测试与自动化的条目。

| 症状 | 位置（路径 + 符号） | 确认状态 | 影响 | 处置定性 |
|---|---|---|---|---|
| 测试套件 4/4 全红：`npx vitest run` 全部用例抛 `TypeError: Cannot read properties of undefined (reading 'in_game_buff_add')`——fixture 是 BuffContext 重构前的旧 schema，顶层缺 `buffContext` | test/DamageCalculator/index.test.ts（fixture 在 test/DamageCalculator/data/） | 已确认（2026-06-11 实测） | 仓库实际处于无有效测试保护状态，"数据更新 → 自动验证"目标被阻塞；BuffContext 是带方法的类实例树，旧的 JSON 直灌方案不可恢复 | bug 待修（按 [09-fixtures-and-baselines.md](09-fixtures-and-baselines.md) 重建 fixture 管线；背景见 [adr/0003-buffcontext-class-not-serializable.md](adr/0003-buffcontext-class-not-serializable.md)） |
| 仓库根残留一份已失效的 `yarn.lock`（与权威的 `pnpm-lock.yaml` 并存） | 仓库根 yarn.lock、pnpm-lock.yaml | 已确认（2026-06-11 核实并存；2026-07-18 包管理器已定为 pnpm） | 包管理器歧义本身已消除（`package.json` 的 `packageManager` 字段令 yarn 1.x 直接拒绝运行），但残留锁文件仍会误导新成员按 yarn 依赖树排查问题 | bug 待修（删除 `yarn.lock`；工程约定见 [../../../../../CONTRIBUTING.md](../../../../../CONTRIBUTING.md) 与 [../../../../../docs/testing.md](../../../../../docs/testing.md)） |
| 两个 4 字节空占位文件：`stores/damageCalculator/calcUtils.ts` 与 `stores/damageCalculator/calcUtils/calculatorUtils.ts`（内容均为两个空行） | app/stores/damageCalculator/calcUtils.ts；app/stores/damageCalculator/calcUtils/calculatorUtils.ts | 已确认（2026-06-11 核实文件大小与内容） | 与真实代码目录 `calcUtils/`（charUtils/enemyUtils/gameDataUtils/relicUtils 等）同名混居，import 路径极易写错且不报错 | bug 待修（删除两个空文件） |
| 文件名拼写错误：`VersionLocalStoarge.ts`（Stoarge），文件内导出的类名 `VersionLocalStorage` 拼写正确 | app/components/VersionLocalStoarge.ts 的 `VersionLocalStorage` | 已确认（2026-06-11 源码核实） | 按正确拼写搜文件搜不到；新 import 容易拼错路径 | 待决策（改名需同步所有 import，收益与扰动需权衡） |
| 十余处版本敏感硬编码散点（主题切片 `slice(3, 5)`、boss 关数量表、`getDefaultLayerForStage` 逐关卡表、localStorage 版本号、utils.ts 各中文名单等） | 详见 [version-sensitive-hardcode.md](version-sensitive-hardcode.md)（单一正文源，本表不重复展开） | 已确认（逐项核实记录见该清单） | 上游游戏数据更新时需人工逐点检查，漏改即静默出错 | 设计如此 + 待自动化（手工名单的决策背景见 [adr/0005-manual-ingame-relic-name-lists.md](adr/0005-manual-ingame-relic-name-lists.md)；校验脚本需求见清单结尾） |
