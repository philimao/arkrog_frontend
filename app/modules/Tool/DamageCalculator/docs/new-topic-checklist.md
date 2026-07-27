---
last-verified: 2026-06-11
sources:
  - app/types/gameData.ts
  - app/stores/damageCalculator/calcTypes.ts
  - app/stores/damageCalculator/calcConstants.ts
  - app/stores/damageCalculator/localStorage.ts
  - app/components/VersionLocalStoarge.ts
  - app/stores/damageCalculator/slices/gameDataSlice.ts
  - app/stores/damageCalculator/slices/calculatorSlice.ts
  - app/stores/damageCalculator/slices/charSlice.ts
  - app/stores/damageCalculator/calcUtils/gameDataUtils.ts
  - app/modules/Tool/DamageCalculator/EnemySection/enemyUtils.ts
  - app/modules/Tool/DamageCalculator/EnemySection/TopicSelector.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecSelector.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecTrigger.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/Rogue5Selector.tsx
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/RelicSection/RelicSelector.tsx
  - app/modules/Tool/DamageCalculator/RelicSection/FooterPanel.tsx
  - app/modules/Tool/DamageCalculator/OperatorSection/OperatorDisplay.tsx
---

# 新增肉鸽主题（rogue_N）扩展手册

本手册列出新主题（下文以 `rogue_6` 为例）接入伤害计算器的全部前端散点改动，按实施顺序排列。每项标注漏改后的症状——**绝大多数漏改不产生任何报错**，只表现为"功能缺失"或"数值算错"。

> ⚠️ **类型系统在这条链路上基本不兜底。**
> 全代码库只有两处会因为给 `RogueTopic` 枚举加成员而产生编译错误：`utils.ts` 的 `ALL_TOPIC_TECHTREE_BUFF` 和 `TopicSpecTrigger.tsx` 的 `triggerConfigs`（两者都是不带 `as` 断言的 `Record<RogueTopic, ...>` 字面量，TS 要求枚举键完备）。其余多处 `Record<RogueKey, ...>` 状态用 `as` 断言伪造了完备性——`calcConstants.ts` 的 `rogueInput` 整体 `as RogueInput`、`stages`/`relics`/`relicUiStateMap` 等都是 `{} as Record<...>`，`gameDataSlice.ts` 内还有多处 `as never`。**编译通过 ≠ 改全了**，必须逐条核对本清单。

> ⚠️ **改了 `CalculatorLocalState` 结构却忘记 bump localStorage 版本号，旧状态会以新结构被读出。**
> `VersionLocalStoarge.ts` 的 `VersionLocalStorage` 只在版本号不一致时清空存储（见 `init` 方法）；版本号不动而结构变了，老用户浏览器里的旧 JSON 会原样反序列化成新接口的形状——缺失字段是 `undefined`、改了语义的字段带着旧值——全程无报错。详见第 4 步。

## 前置：后端数据先就位

前端的主题数据全部来自后端 API：`/gamedata/bundle` 提供 `topics`/`zones`/`stages`，`/gamedata/bundle-ext` 提供 `relics`/`items`。新主题上线前先完成后端数据重建（见 [数据管线 Runbook](../../../../../docs/data-pipeline.md)）。

数据到位后，`gameDataStore.fetchRelicTopic` 会在用户选择主题时请求对应 `rogue_N.json`；`calculatorSlice.loadRelicTopic` 随后构建该主题的 `relics: Record<string, WrappedRelicItem>` 与独立 `relicUiStateMap`，并用 `applyAnyRelics` 派生 `disabled`。已加载主题保留在内存缓存中，切回时不重复请求。新主题上线初期藏品全部置灰是预期行为，逐个适配见[藏品接入手册](./03-relic-adaptation-guide.md)。

## 改动总览（按实施顺序）

| 序号 | 文件 + 符号 | 要做什么 | 漏改症状（均无报错） |
|---|---|---|---|
| 1 | `app/types/gameData.ts` 的 `RogueKey`、`RogueTopic` | 联合类型与枚举各加 `rogue_6` | `Record<RogueKey,...>` 状态类型缺新键但运行时数据存在，类型撒谎；后续索引全靠 `as` |
| 2 | `app/stores/damageCalculator/calcTypes.ts` 的 `RogueInput`、`SlicedCalcGameDataState`/`Actions` | 新机制字段、spec items 状态字段与 action 签名 | 新机制无处存放（本步漏掉会被后续编译错兜住；整个机制都忘了则彻底静默） |
| 3 | `app/stores/damageCalculator/calcConstants.ts` 的 `initialCalcGameDataState` | `rogueInput` 加 `rogue_6` 默认条目；spec items 初始 `[]` | 切到新主题时 `setRogueKey` 抛 TypeError，只出现在控制台 Unhandled Rejection，主题下拉无响应 |
| 4 | `app/stores/damageCalculator/localStorage.ts` 的 `Rouge6State`、`CalculatorLocalState`、`calculatorStorage` | 新主题状态接口 + `rougeTopic` 键 + **bump 版本号** | 旧本地状态以新结构读出，缺字段为 `undefined`、旧值进新语义 |
| 5 | `app/stores/damageCalculator/slices/gameDataSlice.ts` 的 `setRogueKey` 及新 action | 主题专属字段重置分支（**两处**）；新 `setRogue6Xxx` action | 切回新主题时专属字段不重置，残留上次会话值继续参与计算 |
| 6 | `app/modules/Tool/DamageCalculator/utils.ts` 的 `ALL_TOPIC_TECHTREE_BUFF` | 加新主题科技树档位 | 编译失败（本清单仅有的保险丝之一）；label 与默认 `tech` 不匹配则科技树加成静默缺失 |
| 7 | `app/modules/Tool/DamageCalculator/EnemySection/enemyUtils.ts` 的 boss 数量表、`suffixBossNames`、`getNavOfZone`、`getDefaultLayerForStage` | 四组主题硬编码 | boss 关不显示 / 导航少 Boss 名 / 特殊区域关卡找不到 / 默认层数错导致敌人数值偏差 |
| 8 | `app/modules/Tool/DamageCalculator/EnemySection/TopicSelector.tsx` | `slice(3, 5)` 切片 + 难度档数分支 | 新主题不出现在主题下拉；难度档数错误 |
| 9 | `app/modules/Tool/DamageCalculator/calculator/helper.ts` 的 `analyzeRogueDifficulty` | 新主题难度词条分支 | 难度/层数敌人乘区全部缺失，敌人面板远低于游戏内实际，DPS 虚高 |
| 10 | `TopicSpecSection/`：新建 `Rogue6Selector` + `TopicSpecSelector` + `TopicSpecTrigger` | 主题特殊效果选择器与底栏入口 | 弹层空白 / 底栏入口不渲染 |
| 11 | `app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx` 的 `topicSpecItems` 与保存 effect | 组装分支 + localStorage 保存分支 | 选了岁时/年代类效果但完全不参与计算；新主题选择不持久化 |
| 12 | `app/modules/Tool/DamageCalculator/RelicSection/RelicSelector.tsx` 的 `filterTagsMemo`、`filterFuncMap` | 主题专属筛选标签 | 仅缺筛选标签，外观级 |
| 13 | 新主题藏品/通宝适配 | 见[藏品接入手册](./03-relic-adaptation-guide.md) | 新藏品全部置灰不可选 |

以下逐项说明细节与坑。

## 1. 类型层：`RogueKey` 与 `RogueTopic`

`app/types/gameData.ts` 中 `RogueKey` 是字符串联合类型（已标 `@deprecated`，让用 `RogueTopic`），`RogueTopic` 是 `const enum`。**两者在代码库中仍然混用**：`RogueInput`、`stages`、`relics`/`relicUiStateMap`、`gameDataStore` 的 `topics` 等 Record 键用的是 `RogueKey`；`setRogueKey` 参数、`triggerConfigs`、localStorage 的 `rougeTopic` 键用的是 `RogueTopic`。两边都要加。

建议先做这一步：加完 `RogueTopic` 成员后，编译器会在 `ALL_TOPIC_TECHTREE_BUFF`（第 6 步）和 `triggerConfigs`（第 10 步）两处报错，可当作天然的进度锚点——但**仅此两处**，其余靠本清单。

## 2. 状态契约：`calcTypes.ts`

`RogueInput` 的定义是 `{ topic: RogueTopic } & Record<RogueKey, {...}>`——每个主题的 value 形状是**同构共享**的，rogue_4 的 `thoughtLoad`/`inspiration`/`disaster` 与 rogue_5 的 `wraths`/`coppers` 都直接挂在这一个共享类型上（以注释标注主题限定）。新主题的专属机制字段照此追加。

若新主题有岁时/年代类的"主题特殊效果"，还需要在 `SlicedCalcGameDataState` 加对应列表字段（参照 `rogue5_wrath_spec_items`/`rogue5_copper_spec_items`，元素类型为 `ITopicSpecItem`），并在 `SlicedCalcGameDataActions` 加 setter 签名（参照 `setRogue5Wraths`/`setRogue5WrathSpecItems` 成对出现的模式）。

若新主题有干员级开关（参照 rogue_5 的 `candleHolder`/`dygmnyTile`），字段加在 `CharInput` 上，UI 在 `OperatorSection/OperatorDisplay.tsx` 按主题渲染，持久化要贯通到第 4、11 步。

## 3. 默认值：`calcConstants.ts`

`initialCalcGameDataState.rogueInput` 按主题逐条写死默认 `zone`/`layer`/`difficulty`/`tech`/`relics`（rogue_4/rogue_5 另有专属字段默认值）。整个对象以 `as RogueInput` 断言收尾，**漏写新主题条目不会有编译错误**。

漏改症状：用户在主题下拉选择新主题时，`gameDataSlice.ts` 的 `setRogueKey` 读 `defaultValues[rogueTopic]` 得 `undefined`，随后对 `rogueInput[rogueTopic].zone` 赋值抛 TypeError。由于 `setRogueKey` 是 async action 且调用方（`TopicSelector` 的 onChange）不 catch，错误只以 Unhandled Promise Rejection 形式出现在控制台，页面上的表现是**主题下拉选不动**。

> ⚠️ `tech` 默认值必须与第 6 步 `ALL_TOPIC_TECHTREE_BUFF[新主题]` 中某个 `label` **字符串完全一致**。`analyzeRogueDifficulty` 按 `label` 查表，查不到只 `console.error("科技树加成不存在")`，科技树加成静默缺失。

新主题的 spec items 列表初始值（空数组）也加在这里，与 `rogue5_wrath_spec_items: []` 同级。

## 4. 持久化：`localStorage.ts` 与版本号

> ⚠️ 既有命名拼写就是 **Rouge**（`RougeBaseState`/`Rouge4State`/`Rouge5State`/`rougeTopic`），文件名也是 `VersionLocalStoarge.ts`（Stoarge）。新增时沿用既有拼写，不要"顺手修正"——那是另一个 PR 的事。

三件事：

1. 新建 `Rouge6State extends RougeBaseState`，放新主题专属持久化字段（参照 `Rouge5State` 的 `wraths`/`coppers`）。
2. `CalculatorLocalState.rougeTopic` 是按枚举成员**逐键声明**的 `Partial<{...}>` 映射——`Partial` 意味着加枚举成员不会触发编译错误，必须手动加 `[RogueTopic.ROGUE_6]: Rouge6State`。若 `CharInput` 加了干员级开关，`charStates` 条目内联类型（`candleHolder`/`dygmnyTile` 所在处）也要加字段。
3. **bump `calculatorStorage` 的版本号**：`new VersionLocalStorage<CalculatorLocalState>("calculator-local-state", N)` 的第二参 +1。

漏 bump 的后果：`VersionLocalStorage.read` 只校验版本号相等与否，结构变化本身不可检测。老用户的旧 JSON 以新接口形状被消费——`charSlice.ts` 的 `setActiveCharName` 用 `??` 兜底使"纯新增字段"看似无害，但凡有字段改名/改语义，旧值会原样灌进新语义，无任何报错。版本不一致时整个存储被清空（用户丢失全部记忆状态），这是有意的取舍，bump 即可。

一个已核实的现状：`rougeTopic` 目前**只写不读**——恢复路径（`CalcCenter` 的初始化 effect 与 `charSlice.setActiveCharName`）只消费 `topic`/`charName`/`charStates`。新主题分支仍要写全，它是持久化契约的一部分，未来接入恢复逻辑时缺数据无从补救。

## 5. 主题切换：`gameDataSlice.ts` 的 `setRogueKey`

`setRogueKey` 的主题专属字段重置逻辑写了**两遍**：

- `set()` 之前：对 `JSON.parse(JSON.stringify(state.rogueInput))` 深拷贝出的本地 `rogueInput` 重置（供同函数内 `getStageList`/`handleUpdateStageId` 同步使用）；
- `set()` 回调内：对 store 状态再重置一遍。

两处都有 `if (rogueTopic === RogueTopic.ROGUE_4) {...} else if (rogueTopic === RogueTopic.ROGUE_5) {...}` 分支，新主题要在**两处**都加。共通字段（`zone`/`layer`/`difficulty`/`tech`/`relics`）的重置是无分支的通用代码，不用动。

漏改症状：切换到新主题时共通字段被重置为默认值、专属字段（岁时类选择等）不重置，残留上次会话的值继续参与计算——界面上"主题像是重置了"，实际乘区里还挂着旧选择，无报错。

新主题的 `setRogue6Xxx` action 实现也加在本文件（toggle 语义参照 `setRogue5Wraths`：传数组整体替换、传单个 id 则增删切换）。

## 6. 科技树：`utils.ts` 的 `ALL_TOPIC_TECHTREE_BUFF`

`Record<RogueTopic, Array<{ label, buff: { def, atk, max_hp } }>>`，无 `as` 断言——**编译器强制补全**，是本清单的保险丝。两个消费方：

- `TopicSelector.tsx` 用它渲染"科技树加成"下拉（`label` 即选项文案与选中键）；
- `analyzeRogueDifficulty` 在 `parseFloat(tech) > 1` 时按 `label` 查表取 `buff` 乘数。

> ⚠️ `label` 与数值**并非恒等**：rogue_5 的 `label: "1.2"` 实际 `max_hp` 是 `1.24`（atk/def 为 1.2）。label 只是展示与查找键，数值以游戏内实际为准手抄。

## 7. 区域导航与层数：`enemyUtils.ts`

四组主题硬编码，全部基于 `stage.id` 字符串切分的启发式规则：

| 位置 | 内容 | 漏改症状 |
|---|---|---|
| 模块私有常量 `numOfZone3Boss`/`numOfZone5Boss`/`numberOfZone67Boss` | 各主题三层/五层/六七层 boss 关数量，键是 `stage.id` 首段短前缀（`ro1`…`ro5`），需加 `ro6` | `isBoss` 查表得 `undefined`，比较恒为 false，**boss 关从区域导航中消失** |
| 模块私有常量 `suffixBossNames` | 6 层以上区域名追加的 Boss 名（`Record<string, Record<number, string>>`，取值带 `?.` 可选链） | 导航名缺少" · Boss名"后缀，纯外观 |
| `getNavOfZone` 内的 `otherZones` | 按主题键查表的特殊区域（当前仅 rogue_5 有"岁兽残识"两区），新主题特殊区域加在这里 | 特殊区域关卡不被任何分区的 filter 命中（`baseZones` 只认 n/e/b/duel 模式），**用户找不到这些关卡** |
| `getDefaultLayerForStage` | `if (topic === "rogue_4") {...} else if (topic === "rogue_5") {...}` 逐关卡 ID 硬编码默认层数（不期而遇/指点迷津/诡异行商类） | fallback 返回当前层数，选这些关卡时层数不切换 → 第 9 步的每层乘区按错误层数累乘，**敌人面板数值偏差**，无报错 |

`baseZones`/`sharedZones` 的过滤规则（`isBase`/`isLayer`/`isDuel`/`isIncident`/`isShop`/`isStashedRecruit`）是跨主题通用的命名模式启发式；新主题若沿用 `roN_` 命名风格可直接复用，但上游命名一变即静默漏关卡，新主题首批关卡数据到位后务必逐区域人工核对一遍导航。

## 8. 主题与难度下拉：`TopicSelector.tsx`

两处：

1. 主题下拉的数据源是 `Object.values(topics!).slice(3, 5)`——硬编码切片，只露出第 4、5 个主题（依赖后端 `topics` Record 的插入顺序 rogue_1…rogue_5）。新主题要把切片改为包含它（如 `slice(3, 6)`）。**漏改则新主题永远不出现在下拉里，前面所有步骤都不可见。**
2. 难度档数 IIFE：`rogue_4`/`rogue_2` 为 19 档（N0–N18），其余 16 档（N0–N15）。新主题难度上限不同就加分支。漏改的连锁后果：多出/缺少的档位在第 9 步 `enemyAttrMultipliers` 数组中取 `undefined`，每层乘区静默不应用。

## 9. 难度词条：`helper.ts` 的 `analyzeRogueDifficulty`

科技树部分是主题无关的通用代码（查 `ALL_TOPIC_TECHTREE_BUFF`），不用动。其后是按主题的大段硬编码分支（`if (rogueInput.topic === "rogue_4")`、`if (rogueInput.topic === "rogue_5")`），新主题要新增一段，内容包括：

- `enemyAttrMultipliers` 数组：下标 = 难度 N 值，值 = 每层敌人攻击/生命增幅百分比；
- `layerToZoneMap`：层数选择器键到实际层数的映射；
- 各难度阈值的特定词条：全体/精英/领袖敌人加成、特定敌人 ID 的专属加成、`enemiesIgnore` 类豁免名单（rogue_5 用它排除雕伥/便符不吃通用加成）。

这些数值全部是对照游戏内难度描述手抄的。词条写法的乘区选择（`in_game_buff_final_mul` vs `relic_rune_mul` 等）与既有模式见[主题/敌人特殊词条文档](./05-topic-spec-and-enemy-spec.md)。

漏改症状：科技树加成仍生效，但难度与层数的全部敌人乘区缺失——敌人生命/攻击远低于游戏内实际、DPS 与击杀时间全面虚高，无任何报错。这是数值正确性影响最大的一处。

## 10. 主题特殊效果 UI：`TopicSpecSection/`

三个文件：

1. **新建 `components/Rogue6Selector.tsx`**：参照 `Rogue5Selector` 的模式——用 `useEffect` 把硬编码配置/解包数据物化为 `ITopicSpecItem` 列表写入 store（`setRogue6XxxSpecItems`），选中态写回 `rogueInput.rogue_6` 的专属字段。岁时/年代类配置（档位映射、`ITopicSpecItem`/`ITopicSpecConfig` 字段语义、blackboard 写法）见[主题/敌人特殊词条文档](./05-topic-spec-and-enemy-spec.md)。
2. **`TopicSpecSelector.tsx`**：`switch (rogueInput.topic)` 加 `case "rogue_6"` 返回新组件。漏改：default 返回 null，弹层打开后**只有返回按钮的空白页**。
3. **`TopicSpecTrigger.tsx`**：三处——`triggerConfigs`（`Record<RogueTopic,...>`，编译器强制）加入口文案与背景图；`allowedRogueKeys` 数组加 `RogueTopic.ROGUE_6`（漏改则 `FooterPanel` 上的入口**整个不渲染**）；按主题条件渲染的 `TopicSpecTriggerNode` 分支为新主题的每个 spec items 列表各加一段。

## 11. 计算编排与持久化分支：`CalcCenter.tsx`

两处主题分支：

1. **`topicSpecItems` useMemo**：把 `rogueInput` 中选中的效果 id 映射到对应 spec items 列表并过滤 `userActive`，现有 `if (rogueInput.topic === RogueTopic.ROGUE_5)`/`ROGUE_4` 两段，新主题照加。
   > ⚠️ 这是整条链路最危险的静默失败点：漏改时 `analyzeTopicSpec` 收到空数组，**UI 上选中了岁时/年代类效果、底栏图标也亮着，但效果完全不参与计算**，表达式展开面板里也找不到对应来源。
2. **保存 effect**：`if (localState.topic === RogueTopic.ROGUE_4)`/`ROGUE_5` 两段把当前主题选择写入 `localState.rougeTopic`，新主题照加（写入第 4 步的 `Rouge6State`）。漏改：新主题的选择不被持久化。注意 `localState.topic` 本身是无分支保存的，所以"刷新后主题还在、但选择全丢"。如第 4 步所述 `rougeTopic` 现状只写不读，短期无可观察差异，仍须写全。

若 `CharInput` 加了干员级主题开关，保存 effect 中 `charStates` 写入对象（`candleHolder`/`dygmnyTile` 所在处）也要加字段。

另外注意 `CalcCenter` 的两份 BuffContext（`globalAnalysisResult` 与 `relicAnalysisResult`）各有一个 useEffect 调用 `analyzeTopicSpec`——`topicSpecItems` 本身是共享的 useMemo，所以新主题不需要改这两个 effect；但若新主题引入了**新的 analyze 环节**，两处都要加，见[架构总览](./01-architecture.md)。

## 12. 藏品筛选标签：`RelicSelector.tsx`

`filterTagsMemo` 在模块级 `filterTags` 基础上按主题 unshift 专属关键词（rogue_4 加"美愿"，rogue_5 加"化境"/"伺烛"）；关键词若不能靠 `name`/`usage` 包含匹配实现，需在 `filterFuncMap` 加谓词。漏改仅导致新主题缺少专属筛选标签，外观级。

## 13. 收尾：藏品/通宝适配与验证

代码散点改完后，剩下的是数据适配工作：

- **新主题的 TopicSpec 配置（年代/岁时类档位数值、伪黑板槽位语义、档位映射规则）**：[05-topic-spec-and-enemy-spec.md](./05-topic-spec-and-enemy-spec.md)
- **难度词条的硬编码模式（乘区选择、特定敌人 ID 词条、豁免名单）**：[05-topic-spec-and-enemy-spec.md](./05-topic-spec-and-enemy-spec.md)
- **新主题藏品/通宝的通用黑板白名单与独立黑板注册**：[03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)——`initStore` 会自动把未适配藏品置灰，新主题上线初期"藏品全灰"是机制使然，按 03 的决策树逐个消化。

其他随版本更新需核对的散点（关卡黑名单、自动注入藏品关卡表、特殊敌人 ID 联动等）见[版本敏感硬编码清单](./version-sensitive-hardcode.md)。
