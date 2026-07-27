---
last-verified: 2026-07-13
sources:
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/calculator/buff-context.ts
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/types/gameData.ts
  - app/types/recordType.ts
  - app/types/constant.ts
  - app/stores/gameDataStore.ts
  - app/stores/relicFreeStore.ts
  - app/stores/appDataStore.ts
  - app/utils/stageSelector.ts
  - app/routes.ts
  - ../arkrog_backend/routers/record.js
  - ../arkrog_backend/utils/appData/shared.js
  - ../arkrog_backend/utils/appData/stageEnemies.js
---

# 术语表（Glossary）

全仓库共享的领域词汇。同一个概念在本项目里常有三套名字——**UI 中文名 / 代码标识 / 上游解包字段**——本表负责对齐，并消歧最容易混淆的"黑板"一词。深入机制不在本表展开，给出链接。

## 一、游戏域名词（跨模块共享）

| 中文名 | 代码标识 | 上游字段 / id 形态 | 一句话定义 | 权威源码 |
|---|---|---|---|---|
| 集成战略 / 肉鸽 | rogue / roguelike | `rogue_1`…`rogue_5` | 明日方舟的 roguelike 玩法，本站工具的主题维度 | `app/types/gameData.ts` `RogueTopic` |
| 主题 | topic / `RogueTopic` | `rogue_N` | 一期肉鸽（如萨卡兹=rogue_4、界园=rogue_5） | `app/types/gameData.ts` |
| 藏品 | relic / `WrappedRelicItem` | `relics[rogueKey][id]` | 局内拾取的增益道具，原始 buff 位于 `relic.buffs` | `app/stores/damageCalculator/calcUtils/relicUtils.ts` |
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

## 二、无藏收录域名词

无藏收录模块的正文文档见 [app/modules/RelicFree/docs/](../app/modules/RelicFree/docs/README.md)，本表只对齐名词。

| 中文名 | 代码标识 | 上游字段 / id 形态 | 一句话定义 | 权威源码 |
|---|---|---|---|---|
| 无藏 | relic-free / RelicFree | 路由 `/relic-free`（关卡页 `/relic-free/:stageId`） | 不携带藏品通关的挑战玩法；站内收录其通关记录的板块（导航标题「穷集一生」，副标题「无藏收录」） | `app/routes.ts`、[模块 01](../app/modules/RelicFree/docs/01-architecture-and-data-flow.md) |
| 记录 | `RecordType` / Mongo `Records` 集合 | — | 一条无藏通关记录（视频链接 + 队伍 + 作战类型 + 难度），提交即发布、删除为硬删除 | `app/types/recordType.ts` `RecordType`、[模块 02](../app/modules/RelicFree/docs/02-record-lifecycle-and-schema.md) |
| 攻略者 | raider（`raider`/`raiderImage`/`raiderLink`） | B站/YouTube 视频作者 | 记录视频的作者，由后端解析视频链接派生，**与提交人是两个角色** | `arkrog_backend/utils/record.js` `setRaiderInfo` |
| 提交人 | submitter（`submitter`/`submitterId`） | session 的 username/userId | 提交该记录的站内用户（Level ≥ 3，语义见 `arkrog_backend/docs/Permission.md`），服务端从 session 写入、客户端不可指定 | `arkrog_backend/routers/record.js` |
| 关卡预览 | `StagePreview` / `StagePreviewData` | Mongo `Data.stage-preview` | 记录派生的每关预览表；`normalNum`/`eliteNum`/`boatNum` = 该作战类型在**最高已有记录难度**下的最少人数（非全难度最小值），另含面包屑 | `app/types/gameData.ts` `StagePreviewData`、[模块 06 第 4 节](../app/modules/RelicFree/docs/06-data-pipeline.md) |
| 敌人预览 | stageEnemies | Mongo `Data.stage-enemies` | 每关敌人名称列表（`Record<stageId, string[]>`），头像由展示端按名称拼外链 | `arkrog_backend/utils/appData/stageEnemies.js` `stageEnemiesUpdate` |
| 作战类型 | `StageTypes`（normal/elite/boat） | 记录字段 `type` | 普通 / 紧急 / 带船三种作战类型，预览徽标与最少人数按此分桶 | `app/types/constant.ts` `StageTypes` |
| 难度 | `StageLevels`（`N0`/`N15`/`N18`） | 记录字段 `level` | 收录的三档难度；各主题上限见 `topicMaxLevels`（ro3/ro5 至 N15） | `app/types/constant.ts` `StageLevels`/`topicMaxLevels` |
| 异格 | — | Boss 关 id 的 `_[a-z]` 尾缀（如 `ro4_b_5_d`） | 同一 Boss 的变体形态：前后端数量表均"异格记为同一个"，筛选器按 `stage.name` 去重只显示一个，后端面包屑据尾缀加「异格」前缀 | `app/utils/stageSelector.ts` `navOfZone`、[模块 03](../app/modules/RelicFree/docs/03-stage-taxonomy-and-selector.md) |
| 层名 | `navOfZone` 各组 `name` | — | 无藏关卡导航的分组名：险路恶敌（大 Boss 关，编号大于 `numOfMinorBoss`）、第 N 层、是非境 / 今昔境（`sv` 关按 `dlc1` 尾缀分流）等 | `app/utils/stageSelector.ts` `navOfZone`，规则表见[生成物](../app/modules/RelicFree/docs/generated/stage-filter-rules.md) |
| 收录原则 | inclusionPrinciple | Mongo `Data` 集合 `inclusion-principle` 文档 | 站方收录标准的 Markdown 正文，经 `GET /app/bundle` 下发、全局弹窗展示；**正文在数据库里，仓库文档覆盖不到**，本表只登记其存在与下发链 | `app/stores/appDataStore.ts`、`app/components/Modal/InclusionPrincipleModal.tsx` |
| 悬挂收藏 | — | `Users.favorite` 残留条目 | 收藏指向已被硬删除记录的条目：删除记录不清理收藏，永久残留且无 UI 清理入口 | [模块 02 第 7 节](../app/modules/RelicFree/docs/02-record-lifecycle-and-schema.md)、[known-issues](../app/modules/RelicFree/docs/known-issues.md) |

## 三、项目域名词

| 名词 | 含义 | 源码 |
|---|---|---|
| bundle / bundle-ext | 后端聚合的游戏数据接口：`bundle` 基础（主题/关卡/区域），`bundle-ext` 补充（藏品/物品/干员/技能/模组） | `app/stores/gameDataStore.ts` |
| GameDataBasic / GameDataExt | 上述两个 bundle 对应的前端类型 | `app/stores/gameDataStore.ts` |
| 金值基线 (golden value) | 测试里硬编码的精确期望 DPS，作为回归门禁 | `test/DamageCalculator/index.test.ts` |
| fixture（夹具） | 测试输入数据 | [模块 09](../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md) |
| charImpl | 干员特化计算实现，一个干员一份文件，文件名=注册键 | [模块 04](../app/modules/Tool/DamageCalculator/docs/04-char-impl-cookbook.md) |
| TopicSpec / EnemySpec | 主题特殊机制 / 敌人特殊词条的 UI 配置 | [模块 05](../app/modules/Tool/DamageCalculator/docs/05-topic-spec-and-enemy-spec.md) |
| 伪黑板 | TopicSpec/EnemySpec 配置里直接写 BuffContext 槽位路径（如 `in_game_buff_final_mul.enemy_max_hp`）的手写"黑板"，与上游解包黑板不是同一套语义 | [模块 05](../app/modules/Tool/DamageCalculator/docs/05-topic-spec-and-enemy-spec.md) |

## 四、计算域名词（伤害计算器）

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

## 五、消歧：「黑板」的两个含义 ⚠️

"黑板"在本系统里指两个**完全不同**的东西，源码注释与文档里常混用，务必区分：

1. **上游解包数据的 blackboard**：游戏数据里每个 buff 携带的词条数组，类型 `BlackboardData = { key, value, valueStr }[]`。它是**数据**。例：`buff.blackboard.find(b => b.key === "atk")`。
2. **计算器的"藏品黑板" `RelicBlackboard`**：本项目为处理藏品 buff 写的**代码**，类型 `{ isActive, apply }`（`calculator/impls.ts`）。又分"通用黑板"（`commonCharRelicBlackboard` / `commonEnemyRelicBlackboard`）与"独立黑板"（`registerRelicBlackboard` 注册的）。

> 一句话同时出现二者：**"独立黑板（RelicBlackboard）的注册键，取自该 buff 的 blackboard（BlackboardData）中那个 `key === 'key'` 的词条的 `valueStr`。"**

## 六、buff.key 前缀语义速查

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
