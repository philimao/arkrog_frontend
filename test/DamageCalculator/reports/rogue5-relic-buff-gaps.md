# 藏品/通宝 计算覆盖缺口与适配分诊

> 数据源：本地 `ArknightsGameData`（`VersionControl:74.2.0`，Change:115904，2026-06-10；rogue_5 内容 Data:26-05-27），2026-06-14 拉取至 c286dac。
> 方法：用**真实 `applyAnyRelics`** 跑全 5 主题（`test/DamageCalculator/relic-coverage.report.test.ts`，`RELIC_COVERAGE=1` opt-in，必须 `--pool=threads`），按 `tooltip===relic.name` 收集每个藏品/通宝在各乘区的实际 buff 量，判定「契合（算出非零值）/未算出」。
>
> 适配范围与建模口径见 [ADR-0007](../../../app/modules/Tool/DamageCalculator/docs/adr/0007-relic-adaptation-scope-and-best-case.md)。

## 总览：未算出且带战斗增益的藏品/通宝 = 63（按名去重，全主题）

| 类别 | 数量 | 处置 |
|---|---|---|
| 已在 `disallowedRelicNames` 黑名单（临时/动态/限次效果，作者主动排除） | 28 | 维持 |
| 额外伤害类（`atk_scale`/`extra_aoe`/落雷/每秒法伤…） | 17 | **暂缓**至模拟引擎版本（[ADR-0007](../../../app/modules/Tool/DamageCalculator/docs/adr/0007-relic-adaptation-scope-and-best-case.md) §3） |
| 干员减伤/范围治疗（非 DPS） | 11 | 不计入 DPS |
| 条件型增伤/易伤（可适配） | 5 | **本次适配**（最佳情况口径） |
| 属性增益（碎靶之手 ×2，扫描假阴性） | 2 | 实为已生效，本次修复溯源 bug |

> 修正记录：早先一版结论曾称"仅 1 个常规增益缺口"，**错误**——当时把条件/触发型一律剔除了，而现有代码（锈刃-遗世独立、文学、见厉、轰鸣之手等）的既定模式恰恰会为条件型注册独立黑板。已按 [ADR-0007](../../../app/modules/Tool/DamageCalculator/docs/adr/0007-relic-adaptation-scope-and-best-case.md) §1 的"最佳情况"口径补齐。

## A. 本次已适配（真实计算器验证通过）

| 藏品 | bbKey | 写入乘区 | 验证值 |
|---|---|---|---|
| "阿猛"（敌受元素伤害+100%） | `enemy_take_element_damage_up` | `in_game_buff_final_mul.enemy_damage_scale_ep` | ×2 |
| 赏善郎（闪避/抵挡后下次攻击+100%） | `rogue_5_next_atk_up[evade_or_block]` | `global_buff_stack.damage_scale_phy/mag` | ×2 |
| 万星园之辉（浮空/失重时受伤+30%） | `enemy_weak[levitateAndMassLoss]` | 同上 | ×1.3 |
| 枣面（对被阻挡敌人+50%） | `damage_scale_magic_physical[when_block]` | 同上 | ×1.5 |
| Blaze的电锯（最近+100%，距离未建模取最佳） | `rogue_5_enemy_damage_scale_by_distance` | 同上 | ×2 |
| 断杖-凝神 / 医者-自医（技力恢复） | `modify_sp_recover[caster]` / `[medic]` | `in_game_buff_add.sp_recovery_per_sec` | +0.4 / +0.3 |

**修复**：`rogue_2_atk_up_on_output_damage[stack]`（轰鸣之手/碎靶之手）原 `apply` 硬编码 `1.5` 与 tooltip `"轰鸣之手"`——数值碰巧对（0.15×10）但碎靶之手溯源丢失、且对未来不同参数会算错。改为数据驱动 `atk × max_stack_cnt` + `relic.name` tooltip；两者现各得 +150% 且溯源正确。

> 万星园之辉、枣面均为多 buff 藏品：本次只接其增伤/易伤 buff；其 2000 点法伤（额外伤害）与 50% 减伤（生存）按 ADR-0007 不计。

## B. 暂缓：额外伤害类（17，等模拟引擎）

玩具弹弓、烟花之手、烧火棍、老者面、铁卫-推进、"小百灶"、厉-诛邪雷法（通宝）等——藏品自身的独立伤害源，计算器当前无归并机制，见 [ADR-0007](../../../app/modules/Tool/DamageCalculator/docs/adr/0007-relic-adaptation-scope-and-best-case.md) §3 与 [ADR-0002](../../../app/modules/Tool/DamageCalculator/docs/adr/0002-expectation-formula-vs-frame-simulation.md)。

## C. 暂缓：技力流（按用户当前指示不做）

钝爪-爆发、折戟-浴血、铁卫-无锋、"绽放"、`modify_sp[born]` 系列、`hit_to_add_sp` 系列、修习雷针、零嘴背篓等。多为 `modify_sp[*]`/`sp_recovery_per_sec` 键，通用黑板不消化。批量适配前需定每种的建模口径（初始技力是否影响首动、攻击/受击/命中回技如何换算 sp/sec）。

## 通宝（copper）覆盖核查

与藏品不同，**通宝的战斗增益键（atk/def/hp/攻速/敌人属性/闪避）大多已被通用黑板接住**——rogue_5 共 44 个带战斗键的通宝，仅移山难/移山繁未算出（动态防御，已黑名单）。所以通宝几乎没有 Case-1 缺口要新增独立黑板，问题集中在 Case-2（算了但算错），且多为系统性：

| 问题 | 实例 | 处置 |
|---|---|---|
| **平值加攻击被当百分比倍率** | 左秉烛"攻击力+200"曾算成 `relic_rune_mul.atk=100`（≈+10000%） | ✅ **已修**：通用黑板 atk 分支增加 `is_add` → `relic_rune_add.atk`（与 def 同口径），现为 +200 平值 |
| **叠层通宝按 1 层算**，非用户可调 | 武人之争 +20%（每投出再 +20%）、贵有衡、溯外道/正道、左秉烛 等 ~8 个 | ✅ **已修**：补全用户可填通宝层数（"共计投出"输入，仿藏品 layer）。`LayerInput` 从 `copperWrapper.layer` 初始化，更新走新数组引用 → `topicSpecItems`(useMemo) 重算 → `analyzeTopicSpec` 读 `item.layer`。回归测试 `copper-layer.test.ts` 验证层数线性放大（1→1.2、3→1.6、5→2.0） |
| **局内效果落入局外乘区** | "投出时全体+X%"类进 `relic_rune_mul`（局外），因通宝都不在 `inGameRelicNames` | ⏳ 待定（见下"局内/局外"），二阶影响，需作者定通宝默认 |

> 录武官（敌人每次受伤法抗-2，最多50层）在覆盖扫描中既不在 fits 也不在 noFit（疑去重/异常），属边角，单列待查。

### 局内/局外能否从解包数据规律推导？

**部分能**：现有规则 `buff.key` 含 `buff`/`ability` 即判局内，已覆盖 `global_buff_normal`/`char_ability_new` 等（这部分已数据驱动）。
**残留不能**：`char_attribute_mul`/`char_attribute_add`/`layer_char_attribute_*` 这几个键**局内局外都在用**（空羽兽局内 vs 静音小队/异铁小圆盾局外，同为 `char_attribute_mul`），无法靠键名区分——`inGameRelicNames` 名单正为此类例外而存在（见 [ADR-0005](../../../app/modules/Tool/DamageCalculator/docs/adr/0005-manual-ingame-relic-name-lists.md)）。
**对通宝**：`global_buff_normal` 类已走局内；`char_attribute_*` 类（武人之争/重铠/火机等"投出时全体+X%"）目前走局外，多为战斗内持续增益、理应局内，但同键在藏品上常是局外面板，故不宜全局改键规则。可选方案：给通宝单独设"默认局内"（通宝战斗增益绝大多数是局内持续 buff），或对这批通宝补一份类 `inGameRelicNames` 的通宝名单。**需作者定。**

## D. 不计入：干员减伤 / 范围治疗（非 DPS）

镜中境、墙眼、"萤灯映牍"、荆棘环、雪与土的织带、遥乡之引、飞锦战旌、忘生珍珑 等。

## 复核口径

- 「契合」= 真实 `applyAnyRelics` 对该藏品产出非零乘区值（按 `tooltip===relic.name` 归集）。
- 扫描已知假阴性：藏品被某条 `tooltip` 硬编码的独立黑板覆盖时会漏认（碎靶之手即此例，已随本次修复消除）。
- 全部适配的运行时数值已由覆盖工具逐个核对，与藏品描述一致。
