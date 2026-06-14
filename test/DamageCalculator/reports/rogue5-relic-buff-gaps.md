# rogue_5（界园）藏品/通宝 计算覆盖缺口扫描（初版）

> 生成方式：**静态启发式扫描**（非真实计算器输出），数据源 = 本地 `ArknightsGameData` 解包仓库 `roguelike_topic_table.json`（Data:26-05-27 起的 rogue_5 内容，2026-06-14 拉取至 c286dac）。
> 方法：复刻 `applyAnyRelics` 的三级分发（独立黑板 / 通用敌人黑板 / 通用干员黑板），筛出「携带战斗相关 blackboard key 但未被任何路径消化」的藏品/通宝。
>
> ⚠️ 这是**启发式近似**，不是 `analyzeRelics` 的真实运行结果，也未计算实际 buff 量。真实数值需待测试基建重建后由 [10-relic-buff-verification](../../../app/modules/Tool/DamageCalculator/docs/10-relic-buff-verification.md) 的自动化流程产出。本报告用于**人工分诊**：判断每个缺口是「该适配」还是「本就超出 DPS 模型范围」。

## 各主题缺口数（按名去重）

| 主题 | 战斗相关但未消化的藏品/通宝数 |
|---|---|
| rogue_1 | 18 |
| rogue_2 | 18 |
| rogue_3 | 20 |
| rogue_4 | 18 |
| rogue_5 | 35 |

> 注：通宝（id 含 `copper`）共 108 项（按名 ~101），其中绝大多数是**经济/移动/行为类**效果（源石锭、护盾、票券、刷新、收藏品、敌人移速/重量），计算器本就不该计入，「未消化」是正确行为，不在本表。

## rogue_5 缺口分诊（35 项）

### A. 已适配（3 项）

| 藏品 | bbKey | 处置 |
|---|---|---|
| 断杖-凝神（术师技力恢复+0.4/s） | `modify_sp_recover[caster]` | 独立黑板，写 `in_game_buff_add.sp_recovery_per_sec`（与 `modify_sp_recover[normal]` 同口径，多职业筛选） |
| 医者-自医（医疗技力恢复+0.3/s） | `modify_sp_recover[medic]` | 同上 |
| "阿猛"（敌人受元素伤害+100%） | `enemy_take_element_damage_up` | 独立黑板，写 `in_game_buff_final_mul.enemy_damage_scale_ep`（与 `enemy_damage_scale[ep]` 同口径）；**已用真实计算器验证**产出 ep 乘区 ×2 |

> 「契合度」权威复核：用真实 `applyAnyRelics` 跑全部 5 主题（见 `relic-coverage.report.test.ts`，`RELIC_COVERAGE=1` opt-in）。
> 结论——**排除技力类与运行时条件/触发类后，全主题里"无条件可被当前乘区模型表达却未算出"的藏品/通宝仅 3 个**：`戈渎不语`、`传芳雕版`（均已在 `disallowedRelicNames` 黑名单，动态条件无法静态建模）与 `"阿猛"`（已于本次适配）。即：通用黑板已覆盖全部无条件属性类藏品，新数据中**没有**遗漏的、契合计算器的常规增益。

### B. 技力流——可建模但需作者确认口径（约 11 项）

这些影响技能循环，理论上可折入 cycle DPS，但「初始技力 / 攻击回技 / 受击回技 / 命中回技」各自的建模口径不同，需作者判断是否纳入及如何换算。

| 藏品 | bbKey | 效果 |
|---|---|---|
| 钝爪-爆发 | `modify_sp[pioneer]` | 先锋初始技力+10、攻击力+10%（攻击力部分另需处理） |
| 折戟-浴血 | `modify_sp[warrior]` | 近卫攻击后+2 技力 |
| 铁卫-无锋 | `modify_sp[tank]` | 重装受击+2 技力、技力消耗-20% |
| "绽放" | `modify_sp[take_damage]` / `[take_ep_damage]` | 受伤/受元素损伤回技力 |
| 高卢银行支票 / 摩根队长佳酿 / 生命之水 / 皇家利口酒 | `modify_sp[born]` | 初始技力+N |
| 断杖-汲取 / 波纹之手 | `hit_to_add_sp` | 术师/特定子职业 命中回技力 |
| 厉-神农守（通宝） | `hit_to_add_sp` | 造成伤害+2 技力、技力恢复-1/s |
| 修习雷针 | `rogue_2_sp_recovery_up[stack]` | 用技能后技力回复+0.4/s（叠 5 层） |
| 零嘴背篓 | `rogue_5_sp_recover_any_char_skill_start_finish` | 开局技力回复+100%（手动放技能后失效） |

> `modify_sp[*]` 多个 valueStr 已在 `utils.ts` 的 `allowedBlackboardKeyMap` 登记（仅作中文翻译），但通用黑板的 apply 不消化 `sp`/`sp_recovery_per_sec` 键，故未计入计算。

### C. 触发型额外伤害——需 bespoke 建模，暂不适配（约 8 项）

额外伤害源，难以折入 auto/skill/cycle 三档，需专门建模：

| 藏品 | bbKey | 效果 |
|---|---|---|
| 玩具弹弓 | `rogue_5_extra_aoe_damage[skill_start]` | 放技能时 AOE 法伤=攻击力 30% |
| 烟花之手 | `rogue_4_extra_aoe_damage[hand]` | 25% 概率额外子弹，攻击力 200% 群伤 |
| 烧火棍 | `extra_magic_damage[filter_tag]` | 对【化物】额外攻击力 50% 法伤 |
| 老者面 | `PeriodicDamageViaAtkToBlockees[Magic]` | 每秒对阻挡目标攻击力 150% 法伤 |
| 铁卫-推进 | `rogue_3_unmovableAndDmgAura` | 每 2 秒束缚+攻击力 100% 真伤 |
| "小百灶" | `rogue_5_character_cost_damage` | 部署时按费用比例真伤 |
| 厉-诛邪雷法（通宝） | `rogue_5_copper_S_6[god_damage]` | 化境落雷多段伤害 |

### D. 条件增伤/减伤、敌人易伤——可部分映射敌人乘区，需确认触发条件（约 9 项）

| 藏品 | bbKey | 效果 | 备注 |
|---|---|---|---|
| "阿猛" | `enemy_take_element_damage_up` | 敌受元素伤害+100% | 或可映射 `enemy_damage_scale_ep` |
| 万星园之辉 | `enemy_weak[levitateAndMassLoss]` | 浮空/失重时受伤+30% | 条件触发 |
| 赏善郎 | `rogue_5_next_atk_up[evade_or_block]` | 闪避/抵挡后下次攻击+100% | 条件触发 |
| 镜中境 | `enemy_first_damage_down` | 敌首次伤害-90% | 减伤、敌方视角 |
| 枣面 / 墙眼 | `damage_*[when_block]` / `..._in_attack_range` | 阻挡/范围内增减伤 | 条件触发 |
| Blaze的电锯 | `rogue_5_enemy_damage_scale_by_distance` | 按距离最高+100%易伤 | 距离相关 |
| 万星园之辉等 | 见明细 | — | — |

### E. 其它（生存/位移/再部署等，非 DPS，建议拉黑或忽略）

荆棘环、"萤灯映牍"、雪与土的织带、遥乡之引、飞锦战旌、忘生珍珑 等——技力/治疗/位移联动，多数对静态 DPS 无直接贡献。

## 建议

1. **B 类技力流**是最有价值的下一批适配目标，但需作者明确每种 `modify_sp[*]` 的建模口径（初始技力是否影响首动、攻击/受击回技如何换算 sp/sec），再批量注册独立黑板。
2. **C/D 类**需 bespoke 建模与逐个验证，优先级取决于实战常用度。
3. 全部适配都应在 [测试基建重建](../../../app/modules/Tool/DamageCalculator/docs/09-fixtures-and-baselines.md) 后，由 [自动验证流程](../../../app/modules/Tool/DamageCalculator/docs/10-relic-buff-verification.md) 输出真实 buff 量并人工签核——本报告的启发式分诊正是该自动化的输入雏形。
