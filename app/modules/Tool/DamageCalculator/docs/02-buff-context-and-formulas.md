---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/expression-util.ts
  - app/modules/Tool/DamageCalculator/calculator/ast/index.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/blackboard.ts
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/use-rogue5-topic-spec-items.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/赫德雷.ts
---

# 乘区与属性合成公式规格

本文是伤害计算器**数值正确性的基准文档**：定义每个乘区的 operator 与基数、乘区之间的合成顺序，以及承载它们的 AST 约定。任何"某增益该写进哪个乘区、写什么值"的争议以本文（及其引用的源码符号）为准。

- 管线整体（五段 analyze 的编排、双 BuffContext）见 [01-architecture](./01-architecture.md)。
- 增益如何被分发到乘区（三级黑板、名单、选择器）见 [03-relic-adaptation-guide](./03-relic-adaptation-guide.md)。
- 关卡 rune、天象、敌人特殊词条等伪黑板见 [05-topic-spec-and-enemy-spec](./05-topic-spec-and-enemy-spec.md)。
- 术语（乘区、通用黑板、独立黑板、伪黑板等）见[术语表](../../../../../docs/glossary.md)。

正文中代码路径均相对模块根 `app/modules/Tool/DamageCalculator/`。

## 1. 模型概述

`calculator/buff-context.ts` 导出的 `BuffContext` 类（接口 `IBuffContext`）即"通用黑板"本体：8 组乘区 + 1 个 `invalidRelics` 数组。每组乘区下的每个键都是一棵 `ExpressionGroupNode` 表达式树（见 §5），所有分析器（`calculator/helper.ts` 的 `CalculatorHelper` 各 `analyze*` 方法、`calculator/blackboard.ts` 的各黑板 `apply`）通过 `addChild` 往树里挂 `NumericLiteralNode` 叶子。

关键认知：**乘区树本身只定义"组内"如何叠加（operator + 基数）；"组间"如何相乘由消费方决定**——消费方有三处：

| 消费方 | 符号 | 用途 |
|---|---|---|
| 表达式路径 | `calculator/expression-util.ts` 的 `ExpressionUtil` 各 `operator_*` / `enemy_final_*` 静态方法 | 构建可渲染的公式树（面板悬浮公式） |
| 数值路径 | `calculator/helper.ts` 的 `CalculatorHelper.calculateOutsidePanel` / `calculateEnemyAttr` | 局外面板与敌人面板的最终数值 |
| 干员脚本 | `calculator/charImpl/**` 各实现（如 `charImpl/近卫/赫德雷.ts`）开头的 `context.xxx.calculate()` 样板 | DPS 计算 |

三处的合成顺序必须一致；本文 §4 给出的公式即三处共同遵循的口径（已知偏差也在 §4 标注）。

## 2. 乘区总表

阶段划分：**局外**（进入战斗前的面板，藏品 rune / 养成）→ **局内直接**（在场直接加成）→ **局内最终**（最终乘区）→ **堆叠**（伤害倍率层，作用于伤害而非属性）。`stage_rune_mul` 名义上是"本关"段，实际为幽灵乘区（§7）。

下表中 operator 与基数均逐项核对自 `BuffContext` 类的字段初始化（`calculator/buff-context.ts`）；"基数"指构造时预置的 `NumericLiteralNode("基数")` 子节点，加算组无基数（空组求值为 0）。

### 2.1 stage_rune_mul（本关，敌人侧）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| enemy_atk | `*` | 1 | 敌人攻击力关卡加成 | **无**（§7） |
| enemy_def | `*` | 1 | 敌人防御力关卡加成 | **无**（§7） |
| enemy_max_hp | `*` | 1 | 敌人最大生命值关卡加成 | **无**（§7） |

### 2.2 relic_rune_add（局外加算）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| max_hp | `+` | 无 | 最大生命值固定值 | `CalculatorHelper.analyzeChar`（信赖/潜能/模组） |
| atk | `+` | 无 | 攻击力固定值 | `CalculatorHelper.analyzeChar`（信赖/潜能/模组） |
| attack_speed | `+` | 无 | 攻击速度（藏品攻速**一律局外加算**） | `analyzeChar`；`commonCharRelicBlackboard.apply`；独立黑板（伺烛客编队 `rogue_5_character_in_candle_holder_common_buff[stack]`、画人间 `rogue_5_character_sp_zone_attri_up`） |
| def | `+` | 无 | 防御力固定值 | `analyzeChar`；`commonCharRelicBlackboard.apply`（`buff.key` 含 `_attribute_add` 时） |
| magic_resistance | `+` | 无 | 法术抗性固定值 | `commonCharRelicBlackboard.apply` |
| cost | `+` | 无 | 部署费用固定值 | `analyzeChar`（潜能）；`commonCharRelicBlackboard.apply`（`buff.key === "char_attribute_add"`）；`analyzeRogueDifficulty`（思绪混乱） |
| hp_recovery_per_sec | `+` | 无 | 每秒生命回复 | 当前无写入者 |
| respawn_time | `+` | 无 | 再部署时间固定值 | `analyzeChar`（潜能） |

### 2.3 relic_rune_mul（局外"乘算"，组内实为加算，§3）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| atk | `+` | 1 | 攻击力百分比 | `commonCharRelicBlackboard.apply`（局外百分比与 `multiplier@atk`）；`analyzeRogueDifficulty`（科技树/思绪混乱）；`CalculatorHelper.analyzeRelics`（用户修正 atkOutPercent） |
| def | `+` | 1 | 防御力百分比 | `commonCharRelicBlackboard.apply`（含 `multiplier@def`）；`analyzeRogueDifficulty`（科技树） |
| max_hp | `+` | 1 | 最大生命值百分比 | `commonCharRelicBlackboard.apply`（含 `multiplier@max_hp`）；`analyzeRogueDifficulty`（科技树） |
| respawn_time | `+` | 1 | 再部署时间百分比 | `commonCharRelicBlackboard.apply`；独立黑板（契心聆铃 `rogue_5_character_in_candle_holder_buff[respawn_time]`） |
| cost | `+` | 1 | 部署费用百分比 | `commonCharRelicBlackboard.apply`（`multiplier@cost`） |
| enemy_atk | `+` | 1 | 敌人攻击力局外百分比 | 当前无写入者（恒 1） |
| enemy_def | `+` | 1 | 敌人防御力局外百分比 | 当前无写入者（恒 1） |
| enemy_max_hp | `+` | 1 | 敌人最大生命值局外百分比 | 独立黑板 `rune_mul_enemy_max_hp`；`analyzeRogueDifficulty`（年代之刺/雕伥等定向词条） |
| enemy_damage_resistance | **`max`** | **0** | 敌人局外减伤（难度加成、"5 结局蛋"类藏品，多源**取最大**） | 独立黑板 `enemy_damage_resistance[inf]`；`analyzeRogueDifficulty`（难度减伤词条） |

### 2.4 in_game_buff_add（局内直接加算）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| atk | `+` | 无 | 攻击力局内固定值 | 当前无写入者（干员脚本仍读取，预留给技能/天赋类加成） |
| def | `+` | 无 | 防御力局内固定值 | 独立黑板 `attr_up_on_trigger[def&mag_resist]` |
| magic_resistance | `+` | 无 | 法术抗性局内固定值 | 独立黑板 `attr_up_on_trigger[def&mag_resist]` |
| attack_speed | `+` | 无 | 攻击速度局内加成 | 独立黑板（国王的新枪 `rogue_2_attack_speed_up[life_point]`、波纹之手 `rogue_4_caster_hand[pair]`、丝契之谜两则）；`analyzeRelics`（用户修正 atkSpd） |
| sp_recovery_per_sec | `+` | 无 | 每秒技力回复 | 独立黑板（`modify_sp[attack_or_damage]`、`modify_sp_recover[normal]`、国王的延伸） |
| block_cnt | `+` | 无 | 阻挡数 | `commonCharRelicBlackboard.apply`；独立黑板 `attri_up_filter_level_cost`（奔兽战车） |
| enemy_magic_resistance | `+` | 无 | 敌人法术抗性改变（**加算，无符号转换**，§8） | `commonEnemyRelicBlackboard.apply` |
| enemy_attack_speed | `+` | 无 | 敌人攻击速度改变 | `commonEnemyRelicBlackboard.apply` |

### 2.5 in_game_buff_mul（局内直接"乘算"，组内实为加算，§3）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| atk | `+` | 1 | 攻击力局内百分比 | `commonCharRelicBlackboard.apply`（inGame 分支）；大量独立黑板（诸王的冠冕、轰鸣之手、岩角号、未叙魔王残片、支柱-援护、久居之手、折戟-裂岩、荣耀绶带、伺烛客系列等）；`analyzeRelics`（用户修正 atkInPercent，血怒） |
| max_hp | `+` | 1 | 最大生命值局内百分比 | `commonCharRelicBlackboard.apply`（inGame 分支）；独立黑板（湖中神盾、城墙之子、奔兽战车） |
| def | `+` | 1 | 防御力局内百分比 | `commonCharRelicBlackboard.apply`（inGame 分支）；伺烛客系列独立黑板 |

### 2.6 in_game_buff_final_add（局内最终加算）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| atk | `+` | 无 | 攻击力最终固定值（鼓舞类） | `analyzeRelics`（用户修正 atkFinal） |
| enemy_def | `+` | 无 | 敌人防御力最终改变（脆弱/防御削减固定值） | `analyzeEnemySpec`（敌人特殊词条 `bbKey` 分支） |

### 2.7 in_game_buff_final_mul（局内最终乘算——干员系加算、敌人系真乘、概率系 union）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| atk | `+` | 1 | 攻击力最终百分比 | 独立黑板 `env_001_storm`（厉-无皎之昧） |
| atk_scale | **`*`** | 1 | "攻击力提升**至**"类倍率（真乘） | `analyzeChar`（干员特殊配置 `charSpecConfigs`，key=`atk_scale`） |
| evade_physical | **`union`** | **0** | 物理闪避率（概率并集） | `commonCharRelicBlackboard.apply`（`prob` + `evade[physical]`/`evade[non_pure]`） |
| evade_magical | **`union`** | **0** | 法术闪避率（概率并集） | `commonCharRelicBlackboard.apply`（`prob` + `evade[magical]`/`evade[non_pure]`） |
| enemy_atk | **`*`** | 1 | 敌人攻击力倍率（真乘） | `commonEnemyRelicBlackboard.apply`（§8 符号转换）；`analyzeRogueDifficulty`（难度词条、每层指数加成）；`analyzeEnemySpec` |
| enemy_def | **`*`** | 1 | 敌人防御力倍率（真乘） | 同上；另有独立黑板 `defdown[support]`（支柱-枯法） |
| enemy_max_hp | **`*`** | 1 | 敌人最大生命值倍率（真乘） | `commonEnemyRelicBlackboard.apply`；`analyzeRogueDifficulty`；`analyzeEnemySpec` |
| enemy_magic_resistance | **`*`** | 1 | 敌人法术抗性倍率（真乘） | 独立黑板 `defdown[support]`（§8 符号转换） |
| enemy_ep_resistance | **`*`** | 1 | 敌人元素损伤抗性倍率 | 当前无写入者；且 `ExpressionUtil.enemy_final_ep_resistance` 只取基础值，**未消费**此乘区 |
| enemy_ep_damage_resistance | **`*`** | 1 | 敌人元素伤害抗性倍率 | 当前无写入者；`ExpressionUtil.enemy_final_ep_damage_resistance` 同样未消费 |
| enemy_damage_scale_phy | `+` | 1 | 敌人物理易伤（百分比增量相加） | 独立黑板 `enemy_damage_scale[phy]`（写入 `value - 1`） |
| enemy_damage_scale_mag | `+` | 1 | 敌人法术易伤 | 独立黑板 `enemy_damage_scale[mag]`（写入 `value - 1`） |
| enemy_damage_scale_pure | `+` | 1 | 敌人真实易伤 | 独立黑板 `enemy_damage_scale[pure]`（写入 `value - 1`） |
| enemy_damage_scale_ep | **`*`** | 1 | 敌人元素损伤倍率（真乘，写入原值） | 独立黑板 `enemy_damage_scale[ep]` |
| enemy_damage_resistance | **`union`** | **0** | 敌人局内减伤（大特词条、年代等，概率并集式叠加） | `analyzeEnemySpec`（敌人特殊词条 `bbKey: enemy_damage_resistance`） |

### 2.8 global_buff_stack（堆叠，作用于伤害）

| 键 | operator | 基数 | 语义 | 典型写入者 |
|---|---|---|---|---|
| damage_scale | `*` | 1 | 通用增伤总倍率 | 当前无写入者（恒 1；干员脚本仍读取） |
| damage_scale_phy | `*` | 1 | 物理增伤总倍率 | 独立黑板（文学的开端 `rogue_4_damage_scale[tag]`、见厉 `damage_scale[filter_tag]`）；`analyzeRelics` 收尾挂入 `enemy_damage_scale_phy` 组 |
| damage_scale_mag | `*` | 1 | 法术增伤总倍率 | 独立黑板（苦难巫咒 `damage_scale[caster]`、断杖-波纹 `rogue_3_relic_book_7`、文学的开端、见厉）；`analyzeRelics` 挂入 `enemy_damage_scale_mag` 组 |
| damage_scale_pure | `*` | 1 | 真伤增伤总倍率 | `analyzeRelics` 挂入 `enemy_damage_scale_pure` 组 |

`CalculatorHelper.analyzeRelics` 在收尾处把 `in_game_buff_final_mul.enemy_damage_scale_phy/mag/pure` 三棵组树整体 `addChild` 进对应的 `global_buff_stack.damage_scale_*`。因此**干员脚本读 `global_buff_stack.damage_scale_phy.calculate()` 时已经包含敌人物理易伤**——敌人易伤组先在组内加算（1 + Σ增量），再作为一个因子乘进堆叠组。给易伤类增益选乘区时不要直接写 `global_buff_stack`，否则会绕过这个加算归并（详见 [03](./03-relic-adaptation-guide.md)）。

## 3. "乘算乘区组内实为加算"的精确解释

`relic_rune_mul`、`in_game_buff_mul` 与 `in_game_buff_final_mul` 的干员系键（`atk`、`enemy_damage_scale_phy/mag/pure`）虽然名字带 `mul`，但其 `ExpressionGroupNode` 的 operator 是 **`+`、基数 1**（见 `BuffContext` 字段初始化处的 `new ExpressionGroupNode("+", ...)` 与 `NumericLiteralNode(1, "基数")`）。子节点写入的是**百分比增量**（+20% 写 `0.2`），求值结果为：

```
组值 = 1 + Σ pᵢ
```

即**同一乘区内的百分比相加，不同乘区之间相乘**。两件各 +20% 攻击的局外藏品给出 ×1.4 而非 ×1.44；一件局外 +20% 与一件局内 +20% 才是 ×1.2 × ×1.2 = ×1.44。

例外（operator 真不是 `+` 的乘区）：

| 例外乘区 | operator | 数学式 | 出处符号 |
|---|---|---|---|
| `in_game_buff_final_mul` 敌人系（enemy_atk/def/max_hp/magic_resistance/ep_*、enemy_damage_scale_ep）与 `atk_scale` | `*` | 组值 = ∏ vᵢ（子节点为倍率，两个 1.2 → 1.44） | `BuffContext` 初始化（tooltip "局内最终乘算"） |
| `in_game_buff_final_mul.evade_physical/evade_magical`、`in_game_buff_final_mul.enemy_damage_resistance` | `union` | 组值 = 1 − ∏(1 − xᵢ)（概率并集） | operator 定义在 `BuffContext` 初始化（tooltip "局内取并集乘算"）；数学实现在 `calculator/ast/index.ts` 的 `ExpressionGroupNode.calculate` |
| `relic_rune_mul.enemy_damage_resistance` | `max` | 组值 = max(0, x₁, x₂, …)（多源减伤取最大，源码注释"蛋"） | `BuffContext` 初始化（tooltip "局外最大值"） |

局内、局外两个敌人减伤乘区**跨组**的合成不是相乘而是按"剩余伤害比例相乘"：

```
总减伤 = 1 − (1 − union(局内)) × (1 − max(局外))
```

出处：数值路径在 `CalculatorHelper.calculateEnemyAttr`（变量 `damage_resistance`），表达式路径在 `ExpressionUtil.enemy_final_physical_magic_resistance`——两处公式一致。

> ⚠️ 选错 operator 的乘区**不会报错，只会算错**。把"提升至 150%"写进 `+` 组会变成 +150%，把"+30% 易伤"原值写进 `enemy_damage_scale_phy`（应写 `value - 1`）会多出 100%。写入前对照 §2 总表的 operator 与"写入什么值"。

## 4. 属性合成顺序公式

三套公式分别由 `calculator/expression-util.ts` 的三个模块级函数定义（`ExpressionUtil` 的全部 `operator_*` 方法均委托给它们）。记 `A[k] = relic_rune_add[k] 求和`、`M[k] = relic_rune_mul[k] 组值`，以此类推。

### 4.1 局外（common_out_game_expression）

```
P_out(k) = (base_k + A[k]) × M[k]
         = (base_k + Σ加算项) × (1 + Σ局外百分比)
```

`base_k` 取自 `charInput.phase.attributesKeyFrames[frameIndex].data` 的驼峰键（snake_case 键经 `utils.ts` 的 `snakeToCamel` 转换，缺失时取 0）。若 `relic_rune_add` / `relic_rune_mul` 中不存在键 `k`，对应段退化（不加 / 不乘）。

数值路径 `CalculatorHelper.calculateOutsidePanel` 与此同构，但对 `atk`、`def`、`maxHp`、`respawnTime` 在乘算之后做 `Math.round` 取整，并额外把 `in_game_buff_add.sp_recovery_per_sec` 加进局外面板的技力回复（攻击回复型技能 `spType === "INCREASE_WHEN_ATTACK"` 时技力回复强制为 0）。

> ⚠️ 表达式路径**未做取整**（`common_in_game_expression` 内有源码注释"没做取整 TODO"），与 `calculateOutsidePanel` 的取整数值可能相差 ±1。面板展示值以数值路径为准；核对表达式树时注意这处已知偏差。

### 4.2 局内（common_in_game_expression）

```
P_in(k) = ( (P_out(k) + D_add[k]) × D_mul[k] + F_add[k] ) × F_mul[k]
```

其中 `D_add/D_mul` 为 `in_game_buff_add/mul`，`F_add/F_mul` 为 `in_game_buff_final_add/final_mul`。展开即：

```
((基础 + 局外加算) × 局外乘算 + 局内直接加算) × 局内直接乘算 + 最终加算) × 最终乘算
```

干员脚本的手写样板与此一致，可对照 `charImpl/近卫/赫德雷.ts` 中 `commonDPH` 的计算：`((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul`（其中 `atkBuffInMul` 取 `calculate() - 1`，因为组值已含基数 1）。

特例（不走上述通式的属性）：

| 属性 | 公式 | 出处符号 |
|---|---|---|
| 每秒生命回复（局外） | `base + Σ relic_rune_add.hp_recovery_per_sec`（无乘算段） | `ExpressionUtil.operator_out_game_hp_recovery_per_sec` |
| 每秒技力回复（局外） | 仅基础值（局内回复走 `in_game_buff_add.sp_recovery_per_sec`，由 `calculateOutsidePanel` 与干员脚本消费） | `ExpressionUtil.operator_out_game_sp_recovery_per_sec` |
| 物理/法术闪避率 | 先走通式，随后**把最外层 operator 改写为 `union`**，等效于 union(各来源闪避) | `ExpressionUtil.operator_in_game_evade_physical` / `operator_in_game_evade_magical` |
| 干员侧伤害倍率 damage_scale | 通式中各乘区均无 `damage_scale` 键，退化为基础值；实际增伤一律走 `global_buff_stack`（§2.8） | `ExpressionUtil.operator_out_game_damage_scale` / `operator_in_game_damage_scale` |

> ⚠️ `ExpressionUtil.operator_out_game_cost`（名为"局外"）实际调用的是 `common_in_game_expression`。当前因局内各乘区均无 `cost` 键，两条路径数值等价，属休眠的命名口径不符；如未来给局内加 `cost` 乘区，此处会先暴雷。

### 4.3 敌人（calculateEnemyAttr 数值路径 / common_enemy_expression 表达式路径）

数值路径（面板与干员脚本读到的 `enemyInput.attributes` 以此为准），出处 `CalculatorHelper.calculateEnemyAttr`：

```
attr = round( base × stage_rune_mul[enemy_k] × relic_rune_mul[enemy_k] × in_game_buff_final_mul[enemy_k] )
            （k ∈ atk, def, max_hp）
damageResistance = round₃( 1 − (1 − union(局内减伤)) × (1 − max(局外减伤)) )
```

边界规则：`name === "木桩"` 的敌人直接返回用户输入、不计算任何加成；id 以 `trap` 开头的装置类敌人 `stage_rune_mul` 因子按 1 处理。法术抗性与攻击速度的改变量在 `in_game_buff_add.enemy_magic_resistance / enemy_attack_speed` 中，由干员脚本自行消费。

表达式路径 `common_enemy_expression` 名义上与数值路径同构（本关 → 局外 → 直接 → 最终），但存在两处休眠缺陷：

> ⚠️ `common_enemy_expression` 先用 `stage_rune_mul` 的 children 构建"本关加成"表达式，随后的局外段**无条件重新赋值 `expression`，把本关段整棵丢弃**；且局外段判断用 `relic_rune_add[buffKey]`（`enemy_` 前缀键）、展开却用 `relic_rune_add[key]`（无前缀键），两者错位。当前因 `stage_rune_mul` 无写入者（§7）、`relic_rune_add` 没有任何 `enemy_*` 键，两条路径数值恰好一致——但任何"给 stage_rune_mul 写数据"或"给 relic_rune_add 加 enemy_* 键"的改动都会让表达式展示与实际数值分叉。登记见 [known-issues](./known-issues.md)。

## 5. AST 约定（calculator/ast/index.ts）

两类节点，均继承 `BaseNode`：

- **`NumericLiteralNode(value, tooltip, source?)`**：叶子节点。`value` 为数值，`tooltip` 为来源标签（见下），可选的 `source` 携带 `{ relic, buff }` 原始引用（目前仅 `commonCharRelicBlackboard.apply` 的部分写入点填写，供调试溯源，不参与计算）。
- **`ExpressionGroupNode(operator, tooltip)`**：组节点，`addChild(...)` 返回自身支持链式。operator 集合为 `"-" | "+" | "*" | "max" | "min" | "union"`，求值语义（`calculate`）：

| operator | 数学定义 | 备注 |
|---|---|---|
| `-` | x₁ − x₂ − … − xₙ | 空组返回 0 |
| `+` | Σ xᵢ | 空组返回 0 |
| `*` | ∏ xᵢ | 空组返回 1 |
| `max` | reduce 初值 0，逐项取最大 | 全负子项会被初值 0 顶替——仅适用于非负量（减伤） |
| `min` | reduce 初值 Infinity，逐项取最小 | 当前无乘区使用 |
| `union` | **1 − ∏(1 − xᵢ)** | 概率并集；基数 0 不影响结果（1−0=1） |

三重职责：

1. **求值**：`calculate()`。
2. **UI 渲染**：`printExpression()` 输出算式字符串、`structure()` 输出可序列化的 plain object（供敌人面板悬浮公式渲染）。两者都会过滤"无效子节点"（`+`/`-` 组中值为 0、`*` 组中值为 1 的子项），所以渲染出的公式可能比实际子节点少——核对时以 `calculate()` 与 `printDebug()`（输出 tooltip 而非数值）为准。注意 `ExpressionGroupNode.structure()` 的返回对象省略了 `tooltip` 与 `value` 字段（靠 `as` 断言绕过类型检查）。
3. **溯源标识**：见下。

### tooltip 是事实标识符

`tooltip` 不只是展示文案，有两处逻辑**按字符串相等做匹配**：

- `calculator/helper.ts` 的 `CalculatorHelper.printRelic`：以 `child.tooltip === relicName` 在全部乘区中收集某藏品的加成词条（Buff 一览面板的数据来源）。
- `TopicSpecSection/components/use-rogue5-topic-spec-items.ts` 的 `getRogue5Coppers`：把所有乘区 children 的 tooltip 收进集合，通宝名字不在集合中即标 `disabled`（UI 置灰，表示"未实现"）。

> ⚠️ 独立黑板 `apply` 写入节点时 **tooltip 必须用 `relic.name`**。写错字（或硬编码字符串与上游藏品名不一致）的后果：该藏品在 Buff 一览中溯源缺失；若是通宝，会被 `getRogue5Coppers` 错误置灰为"未实现"。现存反例：`calculator/blackboard.ts` 中断杖-波纹（`rogue_3_relic_book_7`）与轰鸣之手（`rogue_2_atk_up_on_output_damage[stack]`）的 apply 硬编码了中文名而非 `relic.name`——目前恰与藏品名一致才未出问题，新代码不要效仿。

## 6. 新增乘区的"三同步"义务

`BuffContext.clone()` 是**手写的逐字段深拷贝**（非泛型递归），因此给 `calculator/buff-context.ts` 加键/加组必须同步三处：

1. **`IBuffContext` 接口**——加类型声明；
2. **`BuffContext` 字段初始化**——选定 operator 与基数（对照 §2/§3 决定是 `+` 加算、`+`基数1 百分比、`*` 真乘、`union` 还是 `max`）；
3. **`BuffContext.clone()`**——在对应组的对象字面量里补 `.clone()` 行；新增整组时补整段拷贝。

> ⚠️ 漏改 `clone()` 的后果是**静默丢数据**，有两种形态：
> - **新键漏拷**：`clone()` 用对象字面量整体替换组对象，字面量里没列的键在克隆体上是 `undefined`。链式 analyze（`analyzeChar` / `analyzeRelics` 传入 context 时返回 clone，见 [01](./01-architecture.md)）会把克隆前写入的数据丢掉；`common_*_expression` 的存在性判断会静默跳过该乘区；直接 `.addChild` 的独立黑板则抛 TypeError——后者反而是运气好的情况。
> - **新组漏拷**：克隆体拿到的是构造器初始化的全新空组，完全无报错，之前累计的 children 静默清零。

三同步只保证数据不丢；要让新乘区真正参与数值，还需在消费方接线：`expression-util.ts` 的合成函数、`CalculatorHelper.calculateOutsidePanel` / `calculateEnemyAttr`，以及各干员脚本（见 [04](./04-char-impl-cookbook.md)）。

## 7. stage_rune_mul 幽灵乘区

> ⚠️ `stage_rune_mul` 三个键在全仓库**没有任何写入者**（无一处 `addChild`），求值恒为基数 1。不要被它的名字和 `calculateEnemyAttr` 中的读取代码误导：
>
> - 关卡 rune 的真实路径是：`CalculatorHelper.analyzeEnemySpec` 把 `levelData.runes`（按难度过滤）包装成 `name: "关卡加成"` 的**伪藏品**，走 `applyRelic` → `isBuffForEnemy`（`utils.ts`）→ `commonEnemyRelicBlackboard`，最终写入 `in_game_buff_final_mul.enemy_*` 与 `in_game_buff_add.enemy_*`。详见 [05-topic-spec-and-enemy-spec](./05-topic-spec-and-enemy-spec.md)。
> - 即便未来有人给 `stage_rune_mul` 写数据，也只有 `calculateEnemyAttr` 数值路径生效；表达式路径 `common_enemy_expression` 会把本关段整棵覆盖丢弃（§4.3），展示与数值随即分叉。
> - 结论：**新代码一律不要使用该乘区**；关卡侧加成请走伪藏品路径。该乘区保留至今仅为兼容 `clone()` 与 `calculateEnemyAttr` 的现有读取。

## 8. 数值正负双语义速查

上游解包数据中，敌人属性改变量存在两种写法并存：正数是**倍率**（`1.3` = 130%），负数是**增量**（`-0.3` = 降低 30%）。转换式：

```
写入值 = sign(v) === 1 ? v : 1 + v
```

| 项 | 内容 |
|---|---|
| 出处 | `calculator/blackboard.ts` 的 `commonEnemyRelicBlackboard.apply`（`atk` / `max_hp` / `def` 三处）与独立黑板 `defdown[support]`（支柱-枯法，`def` / `magic_resistance`） |
| 适用范围 | **仅限写入 `in_game_buff_final_mul` 敌人系真乘乘区的值**——这些组 operator 为 `*`，子节点必须是倍率，转换式把增量形式归一为倍率 |
| 不适用 | 干员侧通用黑板一律按"百分比增量 ×层数"写入加算组（operator `+` 基数 1），无符号转换；敌人 `magic_resistance` / `attack_speed` 走 `in_game_buff_add` 加算，也无转换 |
| 风险 | 照抄错 case 会让数值翻倍或减半：把 `-0.3` 原样写进 `*` 组得到 ×(−0.3)；把 `1.3` 套用转换式之外的"增量"理解写成 `0.3` 也错。新增写入点时先确认上游值是哪种形式（判定步骤见 [03](./03-relic-adaptation-guide.md)） |

注意 `v = 0` 时 `sign(0) === 0`，转换结果为 `1 + 0 = 1`（无效果），语义自洽。
