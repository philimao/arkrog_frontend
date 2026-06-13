---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecSelector.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecTrigger.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/Rogue4Selector.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/Rogue5Selector.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/use-rogue5-topic-spec-items.ts
  - app/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector.tsx
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/calculator/expression-util.ts
  - app/modules/Tool/DamageCalculator/calculator/debug/print-relics-info.ts
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/RelicSection/RelicSelector.tsx
  - app/modules/Tool/DamageCalculator/OperatorSection/OperatorDisplay.tsx
  - app/stores/damageCalculator/slices/enemySlice.ts
  - app/stores/damageCalculator/slices/gameDataSlice.ts
  - app/stores/damageCalculator/calcUtils/relicUtils.ts
---

# 主题特殊机制与敌人词条（伪黑板语义表）

本篇是两类"非藏品加成来源"的配置参考：

- **TopicSpec（主题特殊机制）**：rogue_4 的年代(disaster)/灵感(fragment)，rogue_5 的岁时/天象(wrath)与通宝(copper)，以及与之配套的科技树和难度词条；
- **EnemySpec（敌人特殊词条）**：boss 级敌人的减伤、起飞、源石锭叠层等手工配置，其黑板是直接写 `BuffContext` 槽位路径的**伪黑板**。

乘区本身的定义与叠加语义见 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md)；藏品黑板的三级分发（独立黑板→敌人通用→干员通用）与各类名单见 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)；整条重算链路见 [01-architecture.md](./01-architecture.md)。术语对照见[术语表](../../../../../docs/glossary.md)。

## 1. TopicSpec 体系总览

### 1.1 数据流

主题特殊机制不进入 `CalculatorInput.relics`，而是走一条平行管线，最终**复用藏品的 applyRelic 分发**：

1. 选择器组件（`TopicSpecSection/components/` 下的 `Rogue4Selector` / `Rogue5Selector`）在 `useEffect` 中把手抄配置或解包派生数据加工成 `ITopicSpecItem[]`，写入 store 的四个数组：`rogue4_inspiration_spec_items`、`rogue4_disaster_spec_items`、`rogue5_wrath_spec_items`、`rogue5_copper_spec_items`。
2. 用户的选中状态另存于 `rogueInput`：rogue_4 为单选字段 `rogue_4.inspiration` / `rogue_4.disaster`；rogue_5 为多选数组 `rogue_5.wraths` / `rogue_5.coppers`（toggle 逻辑在 `app/stores/damageCalculator/slices/gameDataSlice.ts` 的 `setRogue5Wraths` / `setRogue5Coppers`）。
3. `calculator/CalcCenter.tsx` 的 `topicSpecItems` useMemo 按 `rogueInput.topic` 分支组装：ROGUE_5 取 wraths + coppers，ROGUE_4 取 inspiration + disaster，**其他主题返回空数组**（新主题必须在此新增分支）；同时过滤掉 `userActive === false` 的项。
4. `calculator/helper.ts` 的 `CalculatorHelper.analyzeTopicSpec` 把每个 `ITopicSpecItem` 强转为 `RelicDataExt & RelicWrapper`，逐个调用 `CalculatorHelper.applyRelic`——从这一步起与藏品共用同一套黑板分发。
5. 底栏的 `TopicSpecSection/TopicSpecTrigger.tsx` 展示当前已选项的图标，点击可单独切换每项的 `userActive`（半透明 = 关闭）。其 `triggerConfigs`（按 `RogueTopic` 全键枚举）与 `allowedRogueKeys` 决定哪些主题显示入口。

两点容易踩空的机制：

> ⚠️ `TopicSpecSelector`（全屏遮罩）只是用 `display: none` 隐藏，选择器组件**常驻挂载**——spec items 数组由其 `useEffect` 生成，用户从未打开过遮罩时数据也存在。新主题若仿写组件，注意不要改成条件挂载，否则 CalcCenter 组装时会拿到空数组。

> ⚠️ `analyzeTopicSpec` 传给 `applyRelic` 的 `relics` 参数是**当前激活的主题特殊项列表**，不是用户勾选的藏品列表。依赖 `input.relics` 扫描全场藏品的独立黑板（如奔兽战车的 `attri_up_filter_level_cost`）在通宝路径下语义不同，详见 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md)。

### 1.2 rogue_4：年代 / 灵感 / 思维负荷

| 机制 | 数据源 | 位置 | 档位 |
|---|---|---|---|
| 年代(disaster) | **手抄硬编码** | `Rogue4Selector.tsx` 文件内的 `disasters` 常量（未导出，`Record<string, ITopicSpecConfig>`，9 条） | `values[disasterLevel]`，三档随难度切换 |
| 灵感(fragment) | **手抄硬编码** | 同文件 `fragments` 常量（未导出，16 条） | 恒取 `values[0]`，**不随难度变化** |
| 思维负荷(thoughtLoad) | 难度词条硬编码 | `OperatorSection/OperatorDisplay.tsx` 的清晰/混乱开关 + `helper.ts` 的 `analyzeRogueDifficulty` | 仅 `difficulty === 18` 且 `CONFUSION` 时生效 |

命名注意：灵感在代码里有三套叫法——store 字段叫 `inspiration`，配置常量叫 `fragments`，图标文件名是 `思绪_<名称>.png`。文档与术语表统一用"灵感(fragment)"。

年代/灵感的 `ITopicSpecConfig.values` 是**仿真黑板**：手工转录成与解包 `RelicBuff` 同构的 `{key, blackboard}` 数据，因此走真实的 applyRelic 分发，分发去向由写法决定（见 3.1 节）。年代 spec items 在难度变化时重建（useEffect 依赖 `rogueInput.rogue_4.difficulty`）；灵感只在挂载时生成一次。

思维负荷不属于 topicSpecItems：它存在 `rogueInput.rogue_4.thoughtLoad`，由 `analyzeRogueDifficulty` 消费——混乱时给 `relic_rune_mul.atk` 加 -0.2、`relic_rune_add.cost` 加 +3（节点 tooltip 文案为"思绪混乱"）。UI 提示文案里的"技力自然回复速度-20%"**未建模**。

### 1.3 rogue_5：岁时天象 / 通宝

| 机制 | 数据源 | 位置 | 档位 |
|---|---|---|---|
| 岁时/天象(wrath) | **手抄硬编码** | `use-rogue5-topic-spec-items.ts` 的 `WRATH_CONFIG`（12 条，按 `WRATH_ORDER` 地支排序），档位名 `WRATH_LEVELS`（朦胧/真切/入髓） | `values[level]`，三档随难度切换 |
| 通宝(copper) | **解包数据自动派生** | `Rogue5Selector.tsx` 从 `relics.rogue_5` 中按 `id.includes("copper")` 过滤，与 `items.rogue_5` 同 id 合并，再经 `getRogue5Coppers` 包装 | 无档位；难度变体走藏品的 `_a/_b/_c` 机制（见第 4 节） |

岁时目前仅"巳农"（部署费用）与"申铸"（化物敌人属性）`disabled: false`，其余 10 条手抄了数值但标记 `disabled: true`（含义见第 2 节）。

通宝的自动派生链：`getRogue5Coppers`（`use-rogue5-topic-spec-items.ts` 导出）先用 `wrapRelicData`（`app/stores/damageCalculator/calcUtils/relicUtils.ts`）包出 `RelicWrapper`（含 `hasLayer` 判定），再调用 `applyAnyRelics`（`calculator/debug/print-relics-info.ts`）**跳过 isActive 强制应用全部 buff**，遍历返回的 `BuffContext` 所有乘区节点的 tooltip：没有在任何乘区留下节点的通宝标记 `disabled = true`（UI 置灰、不可选）。这只回答"计算器是否实现了该通宝的黑板"，**不能**用来验证数值（互斥 buff 会同时生效）。

带层数的通宝（`hasLayer`）在 `Rogue5Selector` 的卡片上有"共计投出"输入框（`LayerInput`），更新 `rogue5_copper_spec_items` 中对应项的 `layer`。

> ⚠️ 通宝层数与 topicSpecItems 的同步是已知未决问题：`Rogue5Selector.tsx` 的 `updateLayer` 回调处留有"如何与topicSpecItems同步？TODO"注释和大段被注释的同步代码。修改层数后是否触发重算依赖 store 数组引用是否更新，登记见 [known-issues.md](./known-issues.md)。

### 1.4 维护方式对比

- **手抄配置**（年代/灵感/岁时/思维负荷/难度词条/科技树）：上游版本更新、平衡性调整**不会自动同步**，必须人工对照解包数据或游戏内文案改源码常量。这是本模块版本敏感硬编码的一大来源，逐项清单见 [version-sensitive-hardcode.md](./version-sensitive-hardcode.md)。
- **自动派生**（通宝）：上游数据落库后前端零改动即可见到新通宝；只有当其黑板无法被现有注册消化（自动 disabled）时才需要按 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md) 注册独立黑板或同步白名单。

## 2. 接口字段语义

三个接口都在 UI 层声明：`ITopicSpecItem` / `ITopicSpecConfig` 在 `TopicSpecSection/TopicSpecSelector.tsx`，`EnemySpec` / `EnemySpecConfig` 在 `EnemySection/EnemySpecSelector.tsx`。

`ITopicSpecConfig`（手抄配置的原始形态）：

| 字段 | 语义 |
|---|---|
| `id` / `name` | 配置 id 与中文名（id 同时用于图标路径推导与 store 选中状态） |
| `functionDesc` | `(blackboard) => string`，用当前档位黑板生成展示文案；灵感的实现不读参数 |
| `values` | `RelicBuff[][]`：外层下标 = 难度档位（0/1/2），内层 = 该档位的仿真黑板 buff 列表 |
| `disabled` | `true` = 计算器不支持该效果（数值仍手抄保留，便于日后实现），UI 置灰不可选 |

`ITopicSpecItem`（注释原话"模拟藏品relicWrapper结构"，是 `values[档位]` 实例化后的运行时形态）：

| 字段 | 语义 |
|---|---|
| `id` / `name` | 同上；通宝为解包藏品 id/名称 |
| `description` | 展示文案：手抄项 = `functionDesc(当前档位黑板)`；通宝 = 解包 `usage` |
| `userActive` | 用户开关，默认 `true`；`TopicSpecTrigger` 点击切换；`false` 时被 CalcCenter 与 `analyzeTopicSpec` 双重过滤 |
| `buffs` | `RelicBuff[]`，当前档位的黑板数据，进入 `applyRelic` |
| `layer` | 层数；通宝由"共计投出"输入，其余恒为 1 |
| `url` / `invert` / `rows` | 图标渲染参数（年代图标 `invert: 1` 反色；岁时 `rows: 1`、其余 2） |
| `disabled` | 同上；通宝由 `getRogue5Coppers` 自动判定 |
| `usage` / `hasLayer` | 通宝从 `RelicWrapper` 继承的可选字段 |

`EnemySpecConfig`（每个特殊敌人一份，键 = 敌人解包 id）：

| 字段 | 语义 |
|---|---|
| `id` / `name` | 敌人解包 id 与名称 |
| `selects[].label` | 下拉框标题（机制描述） |
| `selects[].options` | `{label, key}` 候选项，`key` 是数值参数（源石锭数、减伤比例等），会被字符串化传给 `apply` |
| `selects[].apply` | `(key) => {label, key, blackboard: [{bbKey, value}]}`——产出**伪黑板**条目 |
| `selects[].img` | 可选示意图（如特雷西斯距离减伤示意） |

`EnemySpec`（store 中的当前选择状态）：`{ id, value: apply产物[] }`。装配时机见 3.3 节。

## 3. 伪黑板语义

### 3.1 三种"黑板"的辨析

本模块同时存在三种长得像但语义不同的"黑板"，混淆它们是新维护者照抄配置时数值写错乘区的主要原因：

| 类型 | 结构 | 消费方式 | 出处 |
|---|---|---|---|
| **真实黑板** | 解包 `RelicBuff`（`key` + `blackboard[{key,value,valueStr}]`） | `applyRelic` 三级分发，selector/白名单判定 | 藏品、通宝、关卡 rune |
| **手抄仿真黑板** | 与 `RelicBuff` 同构，人工转录 | 同上，走真实分发 | 年代/灵感（`disasters`/`fragments`）、岁时（`WRATH_CONFIG`） |
| **伪黑板** | `{bbKey, value}`，`bbKey` 直接写 `BuffContext` 槽位路径 | `analyzeEnemySpec` 内 switch 直写槽位，**不经过任何分发与判定** | `EnemySpecConfigs` 及 `enemySlice` 的强制规则 |

手抄仿真黑板的分发去向由写法决定，现有配置用到三种模式：

| 写法 | 分发去向 | 现有例子 |
|---|---|---|
| 黑板含 `key=="key"` 词条且其 `valueStr` 已注册独立黑板 | 独立黑板（`rune_mul_enemy_max_hp` 已在 `calculator/blackboard.ts` 注册，写 `relic_rune_mul.enemy_max_hp`） | 天灾年代、灵感"爆破"（配 `selector.enemy` 限定年代之刺/饮泣之刺） |
| 黑板词条 `valueStr` 以 `enemy_` 开头（如 `enemy_atk_down`/`enemy_max_hp_down`，**未注册**独立黑板） | `isBuffForEnemy` 命中 → 敌人通用黑板 `commonEnemyRelicBlackboard`；`tag` 词条（`sarkaz`/`animated`）对照 `enemyData.enemyTags`；数值正负双语义（正数=倍率，负数=增量） | 魔王年代、奇观年代、岁时"申铸" |
| `buff.key` 为 `char_attribute_add` / `char_attribute_mul` | 干员通用黑板；`_attribute_add` 后缀决定加算/乘算，主题特殊项不在局内名单 → 落局外乘区 `relic_rune_add` / `relic_rune_mul` | 全部灵感、岁时"巳农"、苦难/金融/繁荣年代 |

黑板 key 不在 `allowedBlackboardKeyMap` 白名单（`utils.ts`）的词条（如金融年代的 `price`、拥挤年代的 `deploy`）会被干员通用黑板静默拒绝并计入 `invalidRelics`——手抄这类"计算器管不到"的字段只为文案展示服务。

### 3.2 EnemySpec 伪黑板 bbKey 语义表

`analyzeEnemySpec`（`calculator/helper.ts`）的 switch 是伪黑板的唯一消费点。**现有全部 bbKey** 如下：

| bbKey | 实际写入槽位 | 叠加语义 | value 含义 | 现有使用 |
|---|---|---|---|---|
| `enemy_damage_resistance` | `in_game_buff_final_mul.enemy_damage_resistance` | `union`：1−∏(1−x)，再与局外槽位按 1−(1−局内)(1−局外) 合成（`calculateEnemyAttr`） | 减伤比例 0~1（0.5 = 50% 减伤） | 特雷西斯（两形态）、弗莱蒙特、博卓卡斯替、奎隆（已按 0.8^n 折算）、"阿米娅"、圆仔、大君之触系列（`sharedConfigs`）、`Rogue4SkzdwxSelect` 年代印痕 |
| `in_game_buff_final_add.enemy_def` | `in_game_buff_final_add.enemy_def` | `+` 加算 | 防御力绝对增量（似兽"起飞" = −1500） | 似兽 |
| `in_game_buff_final_mul.enemy_atk` | `in_game_buff_final_mul.enemy_atk` | `*`（基数 1） | **倍率**（1.2 = +20%，与通用敌人黑板的双语义不同，这里恒为倍率） | 怪葫芦、"巢穴"、"襁褓" |
| `in_game_buff_final_mul.enemy_max_hp` | `in_game_buff_final_mul.enemy_max_hp` | `*`（基数 1） | 倍率 | 怪葫芦、"巢穴"、"襁褓" |

> ⚠️ **bbKey 命名不统一是陷阱**：`enemy_damage_resistance` 不带槽位前缀但实际写入 `in_game_buff_final_mul`，另外三个则是完整槽位路径。bbKey 只是 switch 的 case 标签，**写错或写了表里没有的 bbKey 不会报错，词条静默无效**（switch 无 default 分支）。新增伪黑板槽位时必须同时在 `analyzeEnemySpec` 的 switch 中加 case。

> ⚠️ `in_game_buff_final_add.enemy_def` 槽位目前只被表达式展示消费（`expression-util.ts` 的 `common_enemy_expression` 把它纳入敌人面板 AST），而真正给 charImpl 供数的 `CalculatorHelper.calculateEnemyAttr` **不读取该槽位**——似兽"起飞"的 −1500 防御只反映在敌人面板上，不进入实际 DPS 计算。登记见 [known-issues.md](./known-issues.md)。

与解包真实黑板的本质区别：伪黑板**没有 selector/validator 判定、没有白名单过滤、没有层数乘法**，`apply` 返回什么就写什么。所有"每 X 获得 Y"的折算（怪葫芦每 3 源石锭 +15%、奎隆每尼卢火 20% 减伤的乘法叠算）都在 `apply` 函数体内做完，槽位只接收最终数值。

### 3.3 装配时机与强制规则

`enemySlice.ts`（`app/stores/damageCalculator/slices/`）的 `setEnemyData` 在用户点选敌人时装配：

1. 查 `EnemySpecConfigs[enemyData.id]`，无配置则给空 `selects`；
2. rogue_4 主题下**给所有敌人追加** `Rogue4SkzdwxSelect`（年代印痕，最终乘算 50 减伤）——但 `EnemySpecSelector` 组件仅在 `难度 ≥ 14 且非木桩` 时显示该下拉（`showSkzdwx`），未显示时默认选"否"（value 0，对 union 槽位无影响）；
3. `enemySpec.value` 以每个 select 的**第一个 option** 调 `apply` 初始化——注意默认值不一定是"无效果"（特雷西斯距离减伤默认即 90%）；
4. 难度 ≥ 14 且敌人为年代之刺/饮泣之刺（`trap_760_skztzs` / `enemy_2073_skzrck`）时，强制把 `value[0]` 写为年代印痕减伤 0.5，UI 上对应下拉禁用"否"选项。

用户改选项时 `updateEnemySpec` 按下标覆盖 `value[index]`。

`analyzeEnemySpec` 除了消费伪黑板，还负责**关卡 rune**：把 `levelData.runes` 中 `difficultyMask` 等于 `stageData.difficulty`（或为 `"ALL"`）的 rune 包成名为"关卡加成"的伪藏品走 `applyRelic`——这部分是真实黑板语义，与伪黑板无关。

## 4. 两套档位映射（难度 → 配置档位）

同一个难度数字在本模块有**两套互不相干的映射**，照抄时容易混用：

| 用途 | 映射规则 | 位置 |
|---|---|---|
| 藏品难度变体 | 同系列存在 `_a` 变体时：难度 ≥ 9 → `_c`；≥ 6 → `_b`；≥ 3 → `_a`；< 3 → 无后缀基础版 | `RelicSection/RelicSelector.tsx` 的 `showIds` 过滤 |
| 年代/岁时档位 | 难度 < 6 → 档 0（成型期/朦胧）；< 13 → 档 1（扩张期/真切）；≥ 13 → 档 2（鼎盛期/入髓） | `Rogue4Selector.tsx`（组件体与年代 useEffect 各一份）、`use-rogue5-topic-spec-items.ts` 的 `getRogue5Wraths`、`Rogue5Selector.tsx` 的 `levelStr` |

第二套映射在四处重复硬编码，改阈值要全改。灵感不参与任何映射（恒 `values[0]`）；通宝的难度变体走第一套（它本质是藏品数据）。

## 5. 科技树与难度词条（analyzeRogueDifficulty）

`CalculatorHelper.analyzeRogueDifficulty`（`calculator/helper.ts`）在重算链中位于 `analyzeRelics` 之后、`analyzeTopicSpec` 之前，内部按主题硬编码分支。

### 5.1 科技树

`utils.ts` 导出的 `ALL_TOPIC_TECHTREE_BUFF` 按 `RogueTopic` 全键枚举各主题的科技树档位（`label` 与 `rogueInput[topic].tech` 字符串经 `parseFloat` 匹配）。命中后把 atk/def/max_hp 换算为增量写入 `relic_rune_mul`（tooltip "科技树"）；`tech ≤ 1` 跳过；label 匹配不到时仅 `console.error`。注意 rogue_5 的 max_hp 是 1.24（与 atk/def 的 1.2 不同），属手抄实测值。**新主题必须在此加档位表**，否则科技树选择静默无效果。

### 5.2 rogue_4（萨卡兹的无终奇语）分支

| 触发条件 | 效果（写入槽位 → 值语义） |
|---|---|
| 难度 18 且思维负荷=混乱 | `relic_rune_mul.atk` −0.2（增量）；`relic_rune_add.cost` +3 |
| 各难度 | `enemyAttrMultipliers`（19 项，下标=难度 0~18）给出每层百分比，按层数复利：`in_game_buff_final_mul.enemy_atk/enemy_max_hp` 各乘 (1+x)^层数（层数来自 `layerToZoneMap`，layer_1~layer_6） |
| 难度 ≤ 2 | `in_game_buff_final_mul.enemy_max_hp` 乘 0.8/0.85/0.9（倍率） |
| 难度 ≥ 4 且敌人为年代之刺/饮泣之刺 | `relic_rune_mul.enemy_max_hp` +0.2（增量） |
| 难度 ≥ 4 且 ELITE/BOSS | `in_game_buff_final_mul.enemy_max_hp` ×1.2（倍率） |
| 难度 ≥ 7 且 ELITE/BOSS | `in_game_buff_final_mul.enemy_atk` ×1.1 |
| 难度 ≥ 10 且 ELITE/BOSS | `relic_rune_mul.enemy_damage_resistance` 0.1（max 语义取最大） |
| 难度 ≥ 14 且特雷西斯（`enemy_2081_skztxs`） | `in_game_buff_final_mul.enemy_max_hp` ×1.5 |
| 难度 ≥ 15 且黑棺（`enemy_2083_skzhg`） | `in_game_buff_final_mul.enemy_max_hp` ×2 |

### 5.3 rogue_5（界园：岁的界园志异）分支

豁免名单 `enemiesIgnore`（helper.ts 文件内未导出常量：雕伥 `trap_222_rgdysm`、便符 `enemy_2101_dyspll`）不吃全体类词条。

| 触发条件 | 效果 |
|---|---|
| 各难度 | `enemyAttrMultipliers`（16 项，下标=难度 0~15）按层数复利，同 rogue_4（layer_1~layer_7） |
| 难度 0 / 1 | `in_game_buff_final_mul.enemy_max_hp/enemy_atk` 各 ×0.8 / ×0.9 |
| 难度 ≥ 4 | 全体（除豁免）`enemy_max_hp` ×1.4；便符单独 ×1.5 |
| 难度 ≥ 5 | `relic_rune_mul.enemy_damage_resistance` 0.1 |
| 难度 ≥ 8 且 ELITE/BOSS | `in_game_buff_final_mul.enemy_def/enemy_max_hp` 各 ×1.2 |
| 难度 ≥ 11 | 全体（除豁免）`enemy_atk` ×1.2 |
| 难度 ≥ 13 且雕伥 | `relic_rune_mul.enemy_max_hp` +0.5（增量） |
| 难度 ≥ 14 且 BOSS | `relic_rune_mul.enemy_damage_resistance` 0.2 |
| 难度 ≥ 15 且"瑕"（`trap_226_dychss`） | **空实现**（if 块体只有注释，词条未生效） |

> ⚠️ 表中"增量"与"倍率"混用源自槽位语义不同：`relic_rune_mul` 系组内是 `+` 基数 1（填 0.2 表示 +20%），`in_game_buff_final_mul` 的 enemy 系是 `*`（填 1.2 表示 ×1.2）。在 `analyzeRogueDifficulty` 里新增词条时先确认目标槽位的 operator（见 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md)），填错不报错只算错。

### 5.4 新主题扩展位置

新主题（如 rogue_6）在本篇职责范围内需要动的点：`analyzeRogueDifficulty` 新增 `if (rogueInput.topic === "rogue_6")` 块（含该主题的 `enemyAttrMultipliers` 与 `layerToZoneMap`）、`ALL_TOPIC_TECHTREE_BUFF` 加档位表、`TopicSpecSelector` 的 switch 加 case 与新 `Rogue6Selector` 组件、`TopicSpecTrigger` 的 `triggerConfigs` 与 `allowedRogueKeys`、`CalcCenter` 的 `topicSpecItems` 组装分支与 localStorage 保存分支、store 的 `rogueInput` 字段与 spec items 数组。完整的跨模块清单（关卡导航、boss 关数量表等）见 [new-topic-checklist.md](./new-topic-checklist.md)。

## 6. 已知笔误与缺陷（指针）

本篇涉及的手抄配置已确认存在笔误，**登记与修复进度以 [known-issues.md](./known-issues.md) 为准**，此处只列索引不展开：

- 岁时"寅诗"档 0 的黑板 key 残缺（`enemy_damage_`，应为 `extra_damage`）——`WRATH_CONFIG` 内，当前该条 `disabled: true` 暂无实际影响；
- 怪葫芦"24源石锭"选项的 `key` 写成 `1.2`（应为 `24`）——`EnemySpecConfigs` 内，选中该档时加成按 1.2 源石锭计算；
- 岁时"申铸"档 0 的第一条 buff 同时含 `atk` 与 `max_hp` 词条，与第二条 buff 的 `max_hp` 重复计入（难度 < 6 时生命加成 ×1.21 而非 ×1.1）；
- 似兽"起飞"防御词条只进面板不进计算（见 3.2 节警示块）；
- 通宝层数与 topicSpecItems 同步的 TODO（见 1.3 节警示块）。

## 7. 维护时机表：上游什么变化 → 改哪个配置

| 上游变化 | 改动位置 | 备注 |
|---|---|---|
| 年代/灵感数值或文案调整 | `Rogue4Selector.tsx` 的 `disasters` / `fragments` | 手抄，不会自动同步 |
| 岁时数值调整 / 新增岁时 | `use-rogue5-topic-spec-items.ts` 的 `WRATH_CONFIG`（新名字还要进 `WRATH_ORDER`） | 同上；实现新效果时把 `disabled` 改 `false` 并补黑板 |
| 新通宝上架 | 通常零改动（自动派生 + 自动 disabled 判定） | 置灰的通宝按 [03-relic-adaptation-guide.md](./03-relic-adaptation-guide.md) 注册独立黑板或同步白名单 |
| 新 boss / boss 机制调整 | `EnemySpecSelector.tsx` 的 `EnemySpecConfigs` 加条目（bbKey 严格照 3.2 节语义表）；需要按难度强制默认值时加 `enemySlice.setEnemyData` 规则 | 多个敌人共用同一机制时仿照 `sharedConfigs` 批量生成 |
| 难度词条调整 / 每层数值调整 | `analyzeRogueDifficulty` 对应主题分支与 `enemyAttrMultipliers` | 数组下标即难度，档位数变化时注意长度 |
| 科技树数值调整 | `utils.ts` 的 `ALL_TOPIC_TECHTREE_BUFF` | label 必须与 UI 提供的 tech 值字符串可 parseFloat 对上 |
| 难度档位结构变化（档位数、阈值） | 第 4 节两套映射的全部位置（共五处硬编码） | 阈值不集中，逐处核对 |
| 新主题上线 | 见 5.4 节 + [new-topic-checklist.md](./new-topic-checklist.md) | |

改完后的验证手段（debugRelic 日志、`printAdditionContext` 表格、表达式面板逐项展开）见 [07-debugging.md](./07-debugging.md)。
