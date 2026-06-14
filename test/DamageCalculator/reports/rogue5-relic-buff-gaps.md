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

## 平值加属性在局内被当百分比（藏品侧，电弧的掌机等）

与左秉烛同类的 bug，但在**局内**路径：通用黑板局内分支 `if (inGame)` 对 atk/def 只写乘算区 `in_game_buff_mul`，把平值当百分比。受影响藏品（自定义键，`is_add` 判不出）：

| 藏品 | 平值 | 旧算法 | 对 DPS |
|---|---|---|---|
| **电弧的掌机** | atk=100, def=100/层 | `in_game_buff_mul.atk=100`（≈+10000%） | ⚠️ atk 有害 |
| 古堡的子嗣 | def=300 | ×300 | 无害（def 不影响输出） |
| 虚实线团 | def=600 | ×600 | 无害 |
| "万灵方" | def=1200 | ×1200 | 无害 |

✅ **已修**：通用黑板新增 `isFlat(v) = is_add || |v|≥10`，局内/局外的 atk/def 平值都改写加算区（`in_game_buff_add` / `relic_rune_add`）。量级阈值依据：atk/def/max_hp 百分比 ≤ ~2、平值 ≥ 100，区间 (2,100) 安全分割；若未来出现 +1000% 级百分比需复议（已在代码注释标注）。覆盖工具验证：电弧 atk/def 现为 +100 平值，百分比藏品（武人之争/重铠）不受影响。

> 注：电弧的掌机本质是**召唤物**增益（`selector.profession=token`），修复后仍会给干员自身 +100 平值攻击。是否应只作用于召唤物、不计入干员 DPS，是更细的语义问题（与空羽兽"+60%干员攻击"同带 token 选择器不可一刀切），留待按需细化。

## 通宝（copper）覆盖核查

与藏品不同，**通宝的战斗增益键（atk/def/hp/攻速/敌人属性/闪避）大多已被通用黑板接住**——rogue_5 共 44 个带战斗键的通宝，仅移山难/移山繁未算出（动态防御，已黑名单）。所以通宝几乎没有 Case-1 缺口要新增独立黑板，问题集中在 Case-2（算了但算错），且多为系统性：

| 问题 | 实例 | 处置 |
|---|---|---|
| **平值加攻击被当百分比倍率** | 左秉烛"攻击力+200"曾算成 `relic_rune_mul.atk=100`（≈+10000%） | ✅ **已修**：通用黑板 atk 分支增加 `is_add` → `relic_rune_add.atk`（与 def 同口径），现为 +200 平值 |
| **叠层通宝按 1 层算**，非用户可调 | 武人之争 +20%（每投出再 +20%）、贵有衡、溯外道/正道、左秉烛 等 ~8 个 | ✅ **已修**：补全用户可填通宝层数（"共计投出"输入，仿藏品 layer）。`LayerInput` 从 `copperWrapper.layer` 初始化，更新走新数组引用 → `topicSpecItems`(useMemo) 重算 → `analyzeTopicSpec` 读 `item.layer`。回归测试 `copper-layer.test.ts` 验证层数线性放大（1→1.2、3→1.6、5→2.0） |
| **敌方法抗降低落到我方** | 录武官"敌人每次受伤法抗-2(最多50层)" 无 enemy 标记，曾算成我方 `relic_rune_add.magic_resistance=-2` | ✅ **已修**：独立注册 `rogue_5_enemy_minus_magic_resistance[take_damage]`，按满层最佳写敌人乘区 `in_game_buff_add.enemy_magic_resistance=-100` |

### 局内/局外：结论——无需建"通宝局内名单"

经与作者复核：那批"投出时全体我方+X%"通宝（武人之争/重铠/火机等）**确实都是局外全局面板增益**，并非战斗内行为（描述里的"部署费用"/"再部署时间"是属性名，不是部署动作）。而真正战斗内生效的通宝（化境地块、战斗触发类）**已由现有 `buff.key` 含 `buff`/`ability` 规则归入局内**。所以通宝的局内/局外**当前已正确**，不需要新建名单。

> 键名能否推导局内/局外：部分能——`buff.key` 含 `buff`/`ability` 已数据驱动判局内（`global_buff_normal`/`char_ability_new`）；残留 `char_attribute_mul/add` 类局内外同键不可区分（空羽兽局内 vs 静音小队局外），`inGameRelicNames` 名单正为此例外存在（[ADR-0005](../../../app/modules/Tool/DamageCalculator/docs/adr/0005-manual-ingame-relic-name-lists.md)）。

### selector.char 类（安硕鼷/雕词錾刀/十戒）—— 非我方 misroute，实际正确

这 3 个的 `char_attribute_*` 带 `selector.char` 指向敌方陷阱（雕伥/年代之刺/尊主残影）。它们因 valueStr 以 `trap_` 开头走**敌人通用黑板**，且 `commonEnemyRelicBlackboard.isActive` 已按 `selector.char` 对比目标敌人 id 过滤——**真实计算中只在目标确为该陷阱时才生效，并未误加我方**。覆盖工具（`applyAnyRelics` 跳过 isActive）会显示它们落在敌人乘区，是工具特性而非 bug，勿据此误判。

## D. 不计入：干员减伤 / 范围治疗（非 DPS）

镜中境、墙眼、"萤灯映牍"、荆棘环、雪与土的织带、遥乡之引、飞锦战旌、忘生珍珑 等。

## 复核口径

- 「契合」= 真实 `applyAnyRelics` 对该藏品产出非零乘区值（按 `tooltip===relic.name` 归集）。
- 扫描已知假阴性：藏品被某条 `tooltip` 硬编码的独立黑板覆盖时会漏认（碎靶之手即此例，已随本次修复消除）。
- 全部适配的运行时数值已由覆盖工具逐个核对，与藏品描述一致。
