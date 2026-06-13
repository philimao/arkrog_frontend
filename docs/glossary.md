---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/types/gameData.ts
  - app/stores/gameDataStore.ts
---

# 术语表（Glossary）

全仓库共享的领域词汇。同一个概念在本项目里常有三套名字——**UI 中文名 / 代码标识 / 上游解包字段**——本表负责对齐，并消歧最容易混淆的"黑板"一词。深入机制不在本表展开，给出链接。

## 一、游戏域名词（跨模块共享）

| 中文名 | 代码标识 | 上游字段 / id 形态 | 一句话定义 | 权威源码 |
|---|---|---|---|---|
| 集成战略 / 肉鸽 | rogue / roguelike | `rogue_1`…`rogue_5` | 明日方舟的 roguelike 玩法，本站工具的主题维度 | `app/types/gameData.ts` `RogueTopic` |
| 主题 | topic / `RogueTopic` | `rogue_N` | 一期肉鸽（如萨卡兹=rogue_4、界园=rogue_5） | `app/types/gameData.ts` |
| 藏品 | relic / `RelicDataExt` | `relics[rogueKey][id]` | 局内拾取的增益道具，携带若干 buff | `app/stores/damageCalculator/calcUtils/relicUtils.ts` |
| 通宝 | copper | id 含 `copper` | 界园(rogue_5)特有，与藏品同结构、无独立类型 | `TopicSpecSection/components/Rogue5Selector.tsx` |
| 岁时 / 天象 | wrath | `rogue_5_wrath_N` | 界园的全局环境词条 | `TopicSpecSection/components/use-rogue5-topic-spec-items.ts` `WRATH_CONFIG` |
| 年代 | disaster | — | 萨卡兹(rogue_4)的难度环境词条 | `TopicSpecSection/components/Rogue4Selector.tsx` |
| 灵感 | fragment | — | 萨卡兹的可选增益碎片 | `TopicSpecSection/components/Rogue4Selector.tsx` |
| 思绪负荷 | thoughtLoad | — | 萨卡兹的负荷机制 | `app/stores/damageCalculator/calcTypes.ts` `RogueInput` |
| 科技树 | tech | — | 主题内的全局养成加成，按档位给 atk/def/max_hp 倍率 | `utils.ts` `ALL_TOPIC_TECHTREE_BUFF` |
| 层数 | layer | buff.key 前缀 `layer_` / 词条含 `stack` | 可叠加藏品的当前叠层数 | `relicUtils.ts` `relicHasLayer` |
| 关卡 rune | rune | `levelData.runes` | 关卡自带的环境修正，被包装成伪藏品「关卡加成」 | `calculator/helper.ts` `analyzeEnemySpec` |
| 化境地块 | dygmnyTile | `relic.usage` 含「化境地块」 | 界园的特殊地块，影响其上干员 | `calculator/blackboard.ts` `commonCharRelicBlackboard` |
| 伺烛客 | candleHolder / candle holder | 词条含 `candle_holder` | 界园中被指定的干员身份，触发专属藏品 | `calculator/blackboard.ts` |
| 木桩 | dummy | `enemy_000_dummy`，名为「木桩」 | 测试用假想敌，跳过属性表达式、面板可手填 | `calculator/CalcCenter.tsx` |
| 精英化 | phase / phaseLevel | `CharData.phases` | 干员精英化等级 | `app/types/gameData.ts` |
| 潜能 | potential | — | 干员潜能等级 | `calculator/helper.ts` `analyzeChar` |
| 模组 | uniEquip | `uniequip_table` | 干员模组，提供属性与天赋强化 | `app/stores/gameDataStore.ts` |
| 解包数据 | ArknightsGameData | `DATA_PATH` 指向的仓库 | 上游开源解包仓库，全部游戏数据的源头 | [data-pipeline.md](data-pipeline.md) |

## 二、项目域名词

| 名词 | 含义 | 源码 |
|---|---|---|
| bundle / bundle-ext | 后端聚合的游戏数据接口：`bundle` 基础（主题/关卡/区域），`bundle-ext` 补充（藏品/物品/干员/技能/模组） | `app/stores/gameDataStore.ts` |
| GameDataBasic / GameDataExt | 上述两个 bundle 对应的前端类型 | `app/stores/gameDataStore.ts` |
| 金值基线 (golden value) | 测试里硬编码的精确期望 DPS，作为回归门禁 | `test/DamageCalculator/index.test.ts` |
| fixture（夹具） | 测试输入数据 | [模块 09](../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md) |
| charImpl | 干员特化计算实现，一个干员一份文件，文件名=注册键 | [模块 04](../app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md) |
| TopicSpec / EnemySpec | 主题特殊机制 / 敌人特殊词条的 UI 配置 | [模块 05](../app/modules/Tool/DamageCalculator/docs/05-topic-spec-and-enemy-spec.md) |
| 伪黑板 | TopicSpec/EnemySpec 配置里直接写 BuffContext 槽位路径（如 `in_game_buff_final_mul.enemy_max_hp`）的手写"黑板"，与上游解包黑板不是同一套语义 | [模块 05](../app/modules/Tool/DamageCalculator/docs/05-topic-spec-and-enemy-spec.md) |

## 三、计算域名词（伤害计算器）

| 名词 | 含义 | 深入 |
|---|---|---|
| BuffContext / 通用黑板 | 所有增益的容器，按乘区分桶；"通用黑板"指它对藏品 buff 的通用解析逻辑 | [模块 02](../app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) |
| 独立黑板 (RelicBlackboard) | 为通用黑板表达不了的藏品/通宝单独注册的 `{isActive, apply}` | [模块 03](../app/modules/Tool/DamageCalculator/docs/03-relic-adaptation-guide.md) |
| 乘区 | BuffContext 里的一个增益桶，决定数值参与合成的阶段与方式 | [模块 02](../app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) |
| 局外乘区 | `relic_rune_add` / `relic_rune_mul`：局外面板加成 | 同上 |
| 局内直接乘区 | `in_game_buff_add` / `in_game_buff_mul`：局内直接加成 | 同上 |
| 局内最终乘区 | `in_game_buff_final_add` / `in_game_buff_final_mul`：最后结算 | 同上 |
| 增伤堆叠区 | `global_buff_stack`：增伤类按桶堆叠 | 同上 |
| 加算 / 乘算 | 同乘区内百分比**相加**，乘区之间**相乘**（"乘算"乘区组内其实是加算） | [模块 02](../app/modules/Tool/DamageCalculator/docs/02-buff-context-and-formulas.md) |
| union / max | 概率并集 `1-∏(1-x)`（闪避、局内敌减伤）/ 取最大（局外敌减伤"蛋"类） | `calculator/ast/index.ts` |
| 期望公式 vs 帧模拟 | 生产路径是 charImpl 的期望公式；帧模拟是未启用的预留方向 | [模块 08](../app/modules/Tool/DamageCalculator/docs/08-simulate-and-legacy.md) |

## 四、消歧：「黑板」的两个含义 ⚠️

"黑板"在本系统里指两个**完全不同**的东西，源码注释与文档里常混用，务必区分：

1. **上游解包数据的 blackboard**：游戏数据里每个 buff 携带的词条数组，类型 `BlackboardData = { key, value, valueStr }[]`。它是**数据**。例：`buff.blackboard.find(b => b.key === "atk")`。
2. **计算器的"藏品黑板" `RelicBlackboard`**：本项目为处理藏品 buff 写的**代码**，类型 `{ isActive, apply }`（`calculator/impls.ts`）。又分"通用黑板"（`commonCharRelicBlackboard` / `commonEnemyRelicBlackboard`）与"独立黑板"（`registerRelicBlackboard` 注册的）。

> 一句话同时出现二者：**"独立黑板（RelicBlackboard）的注册键，取自该 buff 的 blackboard（BlackboardData）中那个 `key === 'key'` 的词条的 `valueStr`。"**

## 五、buff.key 前缀语义速查

`RelicBuff.key` 的前缀决定它怎样被分发；blackboard 词条里也有几个特殊 key。判定逻辑见 `utils.ts` 与 `calculator/blackboard.ts`。

| 形态 | 含义 | 判定符号 |
|---|---|---|
| `enemy…`（buff.key 前缀） | 效果作用于敌人 | `isBuffForEnemy`（`utils.ts`） |
| valueStr 以 `enemy_` / `trap_` 开头 | 同上（作用于敌人） | `isBuffForEnemy` |
| `layer_…`（buff.key 前缀） | 局外乘区按 `relic.layer` 叠层（否则固定 1） | `commonCharRelicBlackboard`（`blackboard.ts`） |
| `global…`（buff.key 前缀） | 全局类，按 valueStr 再分敌我 | `isBuffForChar`（`utils.ts`） |
| buff.key 含 `buff` / `ability` | 触发"局内生效"判定 | `commonCharRelicBlackboard` |
| buff.key 含 `_attribute_add` | 走加算分支（`is_add`） | `commonCharRelicBlackboard` |
| 词条 `key === "key"` | 其 `valueStr` 即独立黑板注册键 | `getRelicBlackboard`（`impls.ts`） |
| 词条 `multiplier@atk` / `@def` / `@max_hp` | 局外百分比属性（几丁质刺刃等） | `commonCharRelicBlackboard` |
| 词条 `selector.*` | 干员/敌人选择器（profession/sub_profession/buildable/enemy/char/enemy_level_type） | `isBlackboardActiveForChar`、`commonEnemyRelicBlackboard` |
| 词条 `validator.*` | 关卡类型校验（roguelike_event_type / roguelike_sky_zone_event_type） | `commonEnemyRelicBlackboard` |

更多导航见 [文档索引](README.md)。
