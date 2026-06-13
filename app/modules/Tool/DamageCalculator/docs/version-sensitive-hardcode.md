---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/EnemySection/TopicSelector.tsx
  - app/modules/Tool/DamageCalculator/EnemySection/enemyUtils.ts
  - app/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector.tsx
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/use-rogue5-topic-spec-items.ts
  - app/modules/Tool/DamageCalculator/TopicSpecSection/components/Rogue4Selector.tsx
  - app/modules/Tool/DamageCalculator/utils.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/司霆惊蛰.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/狙击/维什戴尔.ts
  - app/stores/damageCalculator/localStorage.ts
  - app/stores/damageCalculator/calcUtils/gameDataUtils.ts
  - app/components/VersionLocalStoarge.ts
  - ../arkrog_backend/utils/gamedata/buildCharacterRawBundle.js
---

# 版本敏感硬编码清单

本清单登记所有"上游一变、这里必须人改"的散点硬编码。每项已于 `last-verified` 日期打开源码核实位置与内容。所有项的共同特征：**漏改不会报错，只会静默出错**——这正是它们需要被集中登记的原因。

与本清单相关的两篇：游戏数据如何从解包仓库流到前端见 [../../../../../docs/data-pipeline.md](../../../../../docs/data-pipeline.md)；已确认的存量抄写错误（怪葫芦、寅诗等）登记在 [known-issues.md](known-issues.md)，本清单只管"会过期的位置"，不重复记录"已经错了的值"。

> ⚠️ 维护本清单本身也是版本敏感的：新增散点硬编码的 PR 必须同步在此加一行（见 [../../../../../CONTRIBUTING.md](../../../../../CONTRIBUTING.md) 的触发映射表）。

| 位置（路径 + 符号） | 硬编码内容 | 触发更新的上游变更类型 | 漏改症状 | 是否已被 generated/ 覆盖 |
|---|---|---|---|---|
| EnemySection/TopicSelector.tsx 的 `TopicSelector` 组件 | 主题下拉取 `Object.values(topics!).slice(3, 5)`，依赖后端 bundle 中 `topics` 对象的插入顺序，且只露出第 4、5 个主题 | 上游新增肉鸽主题（topics 对象多一项）或后端调整对象键序 | 主题下拉缺新主题，或切片错位显示成旧主题 | 否 |
| EnemySection/enemyUtils.ts 的 `numOfZone3Boss` / `numOfZone5Boss` / `numberOfZone67Boss`（供 `getNavOfZone` 内部的 `isBoss` 判定使用） | 每主题（ro1～ro5）三层/五层/六七层 boss 关数量表（异格记同一个）；`isBoss` 还有"水月树洞未处理"的 TODO | 新主题上线；现有主题新增 boss 关或异格 boss | 新 boss 关不出现在对应层的关卡导航里，或被归错层 | 否 |
| EnemySection/enemyUtils.ts 的 `suffixBossNames` | rogue_4 / rogue_5 的 6+ 层 boss 名（爱国者/奎隆/魔王阿米娅、望/后兽），用于层导航标题 | 新主题上线；现有主题加层或加 6+ 层 boss | 新层导航标题缺 boss 名后缀 | 否 |
| EnemySection/enemyUtils.ts 的 `getDefaultLayerForStage`（及 `getNavOfZone` 内 `otherZones` / `sharedZones` 的 `getLayer` 规则） | 按 `stageId` 逐关写死的默认层数表：rogue_4 的 ev/t 关 11 条、rogue_5 的 ev/t/dv/fs 关 20+ 条；岁兽残识、行商、指点迷津各有专属层数规则 | 新增不期而遇/诡异行商/指点迷津/狭路相逢类关卡 | 新关卡默认层数回落到"保持当前层"，敌人数值档位错误（敌人四维按层数缩放） | 否 |
| TopicSpecSection/components/use-rogue5-topic-spec-items.ts 的 `WRATH_CONFIG`、`WRATH_ORDER`、`WRATH_LEVELS`（消费方 `getRogue5Wraths`，含难度档位映射 `<6→0、<13→1、≥13→2`） | 界园全部岁时/天象的名称、三档（朦胧/真切/入髓）数值与黑板 key 手抄表；部分条目 `disabled: true` 表示计算器不支持 | 游戏版本调整岁时数值；新增/改名岁时；难度档位规则变化 | 计算与游戏内数值不符且无报错；新岁时不显示 | 否 |
| TopicSpecSection/components/Rogue4Selector.tsx 的 `disasters` 与 `fragments`（模块级 const，含同款难度档位映射） | 萨卡兹主题全部年代、灵感的数值与黑板手抄表 | 游戏版本调整年代/灵感数值；新增条目 | 同上 | 否 |
| utils.ts 的 `ALL_TOPIC_TECHTREE_BUFF` | 各主题难度科技树对敌人 def/atk/max_hp 的加成档位表（rogue_1～rogue_5 手抄；rogue_5 的 `1.2` 档 `max_hp` 为 1.24，是否笔误见 [known-issues.md](known-issues.md)） | 新主题上线；难度科技树加成调整 | 难度加成下拉缺档/数值过期，敌人三维整体算错 | 否 |
| calculator/charImpl/ 下各干员文件的 `calculator` switch 分支 | 技能倍率、SP 消耗、持续时间、攻击间隔等十级数组全部手抄（如 近卫/司霆惊蛰.ts 的 `skillScales` / `spCosts`，狙击/维什戴尔.ts 的 `atkScales`），不读 `skill.blackboard` 解包数据；模组特性/天赋数值同样写死在 `applyTalent`（背景见 [known-issues.md](known-issues.md) 模组加成条目） | 游戏技能平衡性调整；模组数值调整；干员新增模组 | 计算结果静默偏离游戏实际值，UI 无任何提示 | 部分——[generated/char-impl-coverage.md](generated/char-impl-coverage.md) 只覆盖"哪个干员 × 哪个技能已实现"，**不校验数值本身** |
| EnemySection/EnemySpecSelector.tsx 的 `EnemySpecConfigs` | 特殊敌人（敌人特殊词条）的伪黑板配置：选项档位、`bbKey` 直写 BuffContext 槽位路径、数值全部手抄（语义见 [05-topic-spec-and-enemy-spec.md](05-topic-spec-and-enemy-spec.md)；存量笔误见 [known-issues.md](known-issues.md) 怪葫芦条目） | 新版本特殊敌人上线；现有敌人机制/数值改动 | 特殊敌人词条缺失或按旧数值计算 | 否 |
| utils.ts 的 `allowedBlackboardKeyMap`、`allowedBlackboardValueStrs`、`blackboardValueStrsForEnemy`、`blackboardValueStrsForChar`、`layerValueStrs`、`inGameRelicNames`、`disallowedRelicNames`、`disallowedValueStrs`、`allyTraps` 及八组层数同步名单（`gin_layer_sync`、`assertions_layer_sync`、`thought_layer_sync`、`tujixieyi_layer_sync`、`baoleixieyi_layer_sync`、`yuanchengxieyi_layer_sync`、`pohuaixieyi_layer_sync`、`sizhuke_layer_sync`） | 通用黑板的白名单/黑名单/局内藏品中文名名单/层数同步组——全部按藏品中文名或 buff key/valueStr 手工维护（各名单语义见 [03-relic-adaptation-guide.md](03-relic-adaptation-guide.md)；决策背景见 [adr/0005-manual-ingame-relic-name-lists.md](adr/0005-manual-ingame-relic-name-lists.md)） | 新藏品/通宝上架；上游改藏品名；新 buff 黑板 key | 白名单漏登记 → buff 词条被静默丢弃"没效果"；`inGameRelicNames` 漏登记 → 加成被错放进局外乘区（对攻击力是先加后乘的区别）；层数同步组漏登记 → 联动藏品层数不同步 | 是——[generated/allowed-keys.md](generated/allowed-keys.md)（`yarn docs:gen` 从源码导出，CI 校验一致性）；独立黑板注册清单另见 [generated/relic-blackboard-registry.md](generated/relic-blackboard-registry.md) |
| stores/damageCalculator/localStorage.ts 的 `calculatorStorage`（`new VersionLocalStorage("calculator-local-state", 1)`，类实现在 app/components/VersionLocalStoarge.ts 的 `VersionLocalStorage`——文件名拼写见 [known-issues.md](known-issues.md)） | localStorage 持久化结构的版本号 `1`，需随 `CalculatorLocalState` 结构变更人工 bump | `CalculatorLocalState` 接口任何结构变更 | 忘 bump：旧结构数据按新结构读出，运行时 undefined 异常或状态错乱（版本不符时数据会被整体清空，bump 了反而安全） | 否 |
| arkrog_backend 仓库 utils/gamedata/buildCharacterRawBundle.js 的 `cutCharacterRawBundle`（读 `process.env.ACTIVE_CHARS`） | **属后端仓库**：伤害计算器可用干员的中文名白名单（`\|` 分隔，配置在后端 `.env`），bundle 构建时据此裁剪 character/skill/uniequip 表 | 新干员的 charImpl 适配完成、准备上架 | 前端拿不到该干员数据，干员列表不出现——注意前端按 charImpl 文件名过滤的旧逻辑已注释，上架开关只在后端（流程见 [../../../../../docs/data-pipeline.md](../../../../../docs/data-pipeline.md)） | 否 |
| stores/damageCalculator/calcUtils/gameDataUtils.ts 的 `getStageList`（局部 `invalidStages`）、`handleUpdateStageId`（局部 `stageWithBoatIds` / `stageWithRollingAncestorIds`）、`mergeDuplicateStages` | 三组特例表：无效关卡剔除 `["ro5_e_t_9_a"]`；带船关（ro4_b_4_c/d、ro4_b_5_c/d、ro4_b_7）自动注入藏品 `rogue_4_relic_final_6`（阿纳萨）；异格关（ro4_b_4_b/d、ro4_b_5_b/d）自动注入 `rogue_4_relic_explore_7`（滚动先祖）；夕江对擂/南武群英会按指定 stageId 合并去重 | 新版本带船/异格类 boss 关上线；上游关卡表增删 | 新带船关不自动带船 → 相关加成整体缺失；无效/重复关卡混入关卡列表。验证藏品列表时还要注意：这些注入项不是用户选的 | 否 |

## 本清单与自动化校验的关系

本清单是未来自动化校验脚本的需求来源：计划中的"数据更新 → 自动验证"流程（见 [10-relic-buff-verification.md](10-relic-buff-verification.md) 与 [../../../../../docs/data-pipeline.md](../../../../../docs/data-pipeline.md)）应逐步把表中各项纳入机器对账——例如用解包数据 diff 检测 `WRATH_CONFIG` / `EnemySpecConfigs` / charImpl 技能数组是否过期、用 topics 对象长度变化报警 `slice(3, 5)` 错位。在脚本落地前，每次上游数据更新后人工巡检的范围就是上表全部行。
