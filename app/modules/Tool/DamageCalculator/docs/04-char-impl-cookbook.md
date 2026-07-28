---
last-verified: 2026-06-11
sources:
  - app/modules/Tool/DamageCalculator/calculator/impls.ts
  - app/modules/Tool/DamageCalculator/calculator/index.ts
  - app/modules/Tool/DamageCalculator/calculator/calculator.ts
  - app/modules/Tool/DamageCalculator/calculator/helper.ts
  - app/modules/Tool/DamageCalculator/calculator/CalcCenter.tsx
  - app/modules/Tool/DamageCalculator/black-list.ts
  - app/modules/Tool/DamageCalculator/OperatorSection/OperatorAttributes.tsx
  - app/modules/Tool/DamageCalculator/OperatorSection/OperatorDisplay.tsx
  - app/modules/Tool/DamageCalculator/EnemySection/EnemyDisplay.tsx
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/赫德雷.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/银灰.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/丰川祥子.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/近卫/司霆惊蛰.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/医疗/Mon3tr.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/狙击/维什戴尔.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/狙击/空弦.ts
  - app/modules/Tool/DamageCalculator/calculator/charImpl/特种/麒麟R夜刀.ts
  - app/stores/damageCalculator/slices/charSlice.ts
  - app/stores/damageCalculator/calcTypes.ts
---

# 干员特化实现 Cookbook

每个被计算器支持的干员对应 `calculator/charImpl/<职业>/<干员名>.ts` 一个文件，文件内用**期望公式**（非逐帧模拟）实现该干员普攻 / 技能 / 周期三段输出。本文是"新增 / 修改一个干员实现"的操作手册：注册机制、标准模板、生命周期钩子、写法收敛规范、反模式清单与上线 checklist。

约定：本文中不带前缀的源码路径相对于 `app/modules/Tool/DamageCalculator/`；store 相关路径为仓库相对路径。乘区与黑板等术语见[术语表](../../../../../docs/glossary.md)，乘区的权威语义见 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md)，计算管线全貌见 [01-architecture.md](./01-architecture.md)。

## 1. 新增一个干员：从建文件到出数

1. **确认数据已上架**：干员能否出现在前端列表由后端 `ACTIVE_CHARS` 白名单控制，见[数据管线 Runbook](../../../../../docs/data-pipeline.md)。
2. **建文件**：`calculator/charImpl/<职业中文名>/<干员名>.ts`。文件名必须严格等于解包数据中的 `charData.name`（命名铁律见 §2）。职业子目录名只是人为分类，对注册无影响，但**必须有这一层子目录**。
3. **实现 `calculator`**（必选）：照 §3 模板填入该干员的基础攻击间隔、技能分支。保存后由 `calculator/index.ts` 自动注册，**不需要改任何注册代码**。
4. **按需导出钩子**：`applyTalent`（天赋 / 模组增益进乘区，参与计算）、`applySkill`（仅技能面板展示）、`charSpecConfigs`（UI 开关 / 下拉），见 §4。
5. **屏蔽未适配技能**：只实现了部分技能时，把未适配的 skillId 加进 `black-list.ts`，见 §7。
6. **本地验证**：启动开发服，在计算器中选中该干员——输出不为全 0、控制台没有 `未实现天赋应用` / `计算器实现为空` 等告警、切换技能 / 模组 / 藏品时数值响应变化。
7. **收尾**：跑一遍 §8 checklist，为该干员补测试 fixture（见 [09-fixtures-and-baselines.md](./09-fixtures-and-baselines.md)）。

## 2. 命名铁律与注册机制

注册是全自动的，机制分两段：

- **构建期扫描**：`calculator/index.ts` 用 `import.meta.glob("./charImpl/*/**.ts", { eager: true })` 扫描实现文件，以**文件名（去掉 `.ts`）**为键调用 `calculator/impls.ts` 的 `registerCalculatorImpl`。模块若有具名导出 `calculator` 用之，否则取 `default` 导出；未导出的钩子用 `voidApplyTalent` / `voidApplySkill`（只打控制台告警的空函数）兜底。
- **运行期分发**：`calculator/calculator.ts` 的 `calculator` 以 `input.charData.name`（解包数据中的干员中文名，海外干员如 Mon3tr 为官方写法）查表取实现。

由此得出三条铁律：

| 铁律 | 原因 | 违反后果 |
|---|---|---|
| 文件名 = `charData.name`，一字不差 | 注册键取自文件名，分发键取自游戏数据 | 查表失败，走空实现 |
| 文件必须在 `charImpl/` 的**子目录**里 | glob 模式 `./charImpl/*/**.ts` 至少要求一层子目录 | 文件根本不被加载 |
| 不要手动调用 `registerCalculatorImpl` | 注册统一由 `calculator/index.ts` 完成 | 无效或重复注册（见 §6.4 死 import） |

> ⚠️ **改名即静默失效，输出全 0。** 文件名与 `charData.name` 不匹配时，`calculator/impls.ts` 的 `getCalculatorImpl` 返回一个只产出 `CalculatorHelper.createCalculatorOutput()`（全字段为 0）的空实现。UI 不报任何错，唯一线索是控制台的 `干员 X 的计算器实现为空` 告警。排查"选了干员但所有 DPS 都是 0"时，第一件事就是核对文件名。

`charImpl/` 根目录下的 `Hoederer_beta.ts` 正是铁律二的反面教材：它在文件内自行调用 `registerCalculatorImpl`，但因为不在子目录里从未被 glob 加载，整条 beta 链路（含 `calculator/calculator.ts` 的 `calculator_beta` 入口）是死代码，详见 [08-simulate-and-legacy.md](./08-simulate-and-legacy.md)。

## 3. 标准模板

下面是一份带注释的骨架，综合了现存 16 份实现中各维度的推荐写法（推荐依据见 §5）。乘区的精确语义以 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md) 为准，`CalculatorOutput` 各槽位的含义以 [06-data-schema.md](./06-data-schema.md) 为准。

```ts
import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import type { CalculatorImpl } from "../../impls";
import { CalculatorHelper } from "../../helper";

/** <干员名>伤害计算器 */
export const calculator: CalculatorImpl = (input: CalculatorInput): CalculatorOutput => {
  const context = input.buffContext;

  // ===== 1. 乘区读取样板 =====
  /** 攻击力局内加算 */
  const atkBuffInAdd = context.in_game_buff_add.atk.calculate();
  /** 攻击力局内乘算（该乘区组基数为 1，减 1 取增量） */
  const atkBuffInMul = context.in_game_buff_mul.atk.calculate() - 1;
  /** 攻击最终加算 */
  const atkBuffFinalAdd = context.in_game_buff_final_add.atk.calculate();
  /** 攻击最终乘算 */
  const atkBuffFinalMul = context.in_game_buff_final_mul.atk.calculate();
  /** 通用 / 物理 / 法术 / 真伤增伤总倍率 */
  const damage_scale = context.global_buff_stack.damage_scale.calculate();
  const damage_scale_phy = context.global_buff_stack.damage_scale_phy.calculate();
  const damage_scale_mag = context.global_buff_stack.damage_scale_mag.calculate();
  const damage_scale_pure = context.global_buff_stack.damage_scale_pure.calculate();
  /** 额外攻击速度：局内、局外两处加算相加（项目约定） */
  const atkSpeedBuff =
    context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate();
  /** 额外技力回复速度 */
  const spBuffAdd = context.in_game_buff_add.sp_recovery_per_sec.calculate();

  // ===== 2. 局外面板：自行调用，不依赖调用方注入（见 §5 收敛规范） =====
  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });
  /** 局外攻击力 */
  const atk = outsidePanel.atk;

  // ===== 3. 干员与敌人输入 =====
  const skillKey = input.charInput.skillKey; // 技能 skillId，如 "skchr_xxxxx_1"
  const skillLevel = input.charInput.skillLevel; // 0 起：0~6 = 1~7 级，7~9 = 专精一~三
  const enemyDef = input.enemyInput.attributes.def;
  const enemyMagRes = input.enemyInput.attributes.magicResistance;
  /** 敌人减伤（mitigation）的统一取法：读 calculateEnemyAttr 的产物，含木桩用户自定义值 */
  const mitigation = input.enemyInput.attributes.damageResistance;

  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  // ===== 4. 普攻段 =====
  /** 基础攻击间隔（秒）。目前各实现均为手抄值，未从解包数据读取 */
  const baseAttackTime = 1.0;
  /** 攻速 = 基础 100 + 加成，上限 600 */
  const atkSpeed = Math.min(100 + atkSpeedBuff, 600);
  /** 攻击间隔帧量化：游戏逻辑帧率 30fps，先换算为帧取整，再转回秒 */
  const commonAtkFrame = Math.round((baseAttackTime * 3000.0) / atkSpeed);
  const commonAtkTime = commonAtkFrame / 30.0;

  /** 单发攻击数值：((局外atk + 局内加算) × (1 + 局内乘算) + 最终加算) × 最终乘算 */
  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  /** 物理伤害：减防后保底 5%，再乘增伤乘区 */
  const commonDamage = Math.max(commonDPH - enemyDef, commonDPH * 0.05) * damage_scale * damage_scale_phy;
  // 法术伤害写法：dph * (1 - enemyMagRes / 100) * damage_scale * damage_scale_mag

  result.attack.dph = commonDPH;
  // (1 - mitigation) 统一在"伤害落地"处乘，且每类伤害只乘一次
  result.attack.total_damage.phy = commonDamage * (1 - mitigation);
  result.attack.dps.phy = result.attack.total_damage.phy / commonAtkTime;

  // ===== 5. 技能分支 =====
  switch (skillKey) {
    case "skchr_xxxxx_3": {
      // 技能数值：优先从 input.charInput.skill.blackboard 读取（getByKey），
      // 手抄十级数组是现状主流但属于反模式（见 §6.1），手抄时必须注明数据版本
      const atkScales = [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 3.0, 3.2];
      const atkScale = atkScales[skillLevel];

      const skillSp = 30; // 技力消耗
      const skillKeepTime = 20; // 持续时间
      // 期望回转：攻回技能 = skillSp / (1 / commonAtkTime + spBuffAdd)
      //          自然回复 = skillSp / (1 + spBuffAdd)
      const skillRecoveryTime = skillSp / (1 + spBuffAdd);

      const skillDph =
        ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkScale * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkFrame = Math.round((baseAttackTime * 3000.0) / atkSpeed);
      const skillAtkTime = skillAtkFrame / 30.0;
      const skillHit = Math.ceil(skillKeepTime / skillAtkTime); // 技能期望攻击次数
      const commonHit = skillRecoveryTime / commonAtkTime; // 回转期普攻次数

      const skillTotalDamage = skillDamage * skillHit * (1 - mitigation);
      const commonTotalDamage = commonDamage * commonHit * (1 - mitigation);

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / skillKeepTime;
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (skillKeepTime + skillRecoveryTime);
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break; // ⚠️ 每个 case 必须 break，缺 break 会 fall-through 到下一个技能的计算
    }
    default: {
      // 未适配的技能：保持全 0 输出，并在 black-list.ts 中禁用（见 §7）。
      // 不要留下空 case 静默归零（见 §6.2）。
      break;
    }
  }

  return result;
};
```

模板之外的两个常用变体：

- **冷却帧修正**（银灰.ts、丰川祥子.ts 的 `calculator`）：以帧数为基准 `Math.round((baseAttackFrame * 100.0) / atkSpeed)`（`baseAttackFrame = baseAttackTime × 30`，数学上与模板写法等价），并额外做 `Math.ceil` 求冷却帧、若冷却帧大于动画帧则动画帧 +1 的修正。打帧精度要求高的干员可参考。
- **攻回技能的自然回复清零**：`CalculatorHelper.calculateOutsidePanel` 对 `spType === "INCREASE_WHEN_ATTACK"` 的技能会把 `spRecoveryPerSec` 置 0，计算回转时间时注意两种 spType 的分母不同（见模板注释）。

## 4. 生命周期钩子

`calculator/impls.ts` 的 `CharImpl` 接口共四个成员，只有 `calculator` 必选：

| 成员 | 必选 | 调用方（导出符号） | 调用时机 | 影响范围 |
|---|---|---|---|---|
| `calculator` | 是 | `calculator/calculator.ts` 的 `calculator`，由 `calculator/CalcCenter.tsx` 的核心计算 effect 触发 | 任意输入变化后的重算 | DPS / 总伤输出 |
| `applyTalent` | 否 | `calculator/helper.ts` 的 `CalculatorHelper.analyzeChar` | 全局 BuffContext 装配的第一段 | **计算与面板都生效** |
| `applySkill` | 否 | `OperatorSection/OperatorAttributes.tsx` 的 `OperatorAttributes`（`mode === "skill"`） | 渲染"技能"页签的属性面板时 | **仅 UI 展示** |
| `charSpecConfigs` | 否 | `app/stores/damageCalculator/slices/charSlice.ts` 的 `createCharSlice` | 选中干员 / 切技能 / 切模组时 | UI 配置项，其产物经 `charSpec` 进入计算 |

> ⚠️ **`applySkill` 只影响面板展示，不参与 DPS 计算。** `OperatorAttributes` 在技能页签下先 `context.clone()` 再调用 `applySkill`，这个克隆上下文只用来生成展示用表达式，从不流回 `calculator()` 的输入。计算器内的技能加攻全部是 `calculator` 函数里的硬编码常量（如赫德雷.ts 各分支的 `skillBuffIn`），与 `applySkill` 读取的 `skill.blackboard` 是**两套数据源**——只改一处必然出现"面板属性与伤害数值对不上"。新增实现时，两处都要写，且数值要同源核对。

各钩子写法要点：

- **`applyTalent`**：把天赋 / 模组的增益以 `NumericLiteralNode` 加进乘区，`tooltip` 参数写来源名（如 `"模组"`），用于面板溯源。参考银灰.ts 的 `applyTalent`：遍历 `charInput.uniEquip.parts` 的 `addOrOverrideTalentDataBundle.candidates`，按潜能 `findLast` 选中后**从解包黑板自取数值**写入 `in_game_buff_mul.atk`——这是"模组数值自取"的推荐范式，不要手抄模组数值。背景：`CalculatorHelper.analyzeChar` 只自动应用模组的 `attributeBlackboard` 基础属性，模组天赋部分被注释掉了（源码中标注 TODO），所以模组天赋必须由各干员的 `applyTalent` 自行处理。
- **`applySkill`**：从 `input.charInput.skill.blackboard` 读键值写入克隆上下文，参考银灰.ts 的 `applySkill`。注意 `calculator/impls.ts` 的 `getByKeySafe` 在键不存在时**直接 throw**；可选键请用 `getByKey`（返回 `undefined`）。
- **`charSpecConfigs`**：导出 `Record<string, CharSpecConfig[]>`，**键只能是 `"default"`、技能 skillId、模组 uniEquipId 三种**。`charSlice` 在 `setActiveCharName` / `setSkillKey` / `setUniEquipId` 中按 `["default", skillKey, uniEquipId]` 三键取值合并，渲染为开关（`switch`）或下拉（`select`）。类型定义见 `app/stores/damageCalculator/calcTypes.ts` 的 `CharSpecConfig` / `CharSpec`。
- **`charSpec` 的两条消费路径**：`apply` 函数产出的 `CharSpec` 进入 `charInput.charSpec` 后——
  1. 若 `blackboard` 含 `atk_scale` 键且 `active`，由 `CalculatorHelper.analyzeChar` 通用应用到 `in_game_buff_final_mul.atk_scale`（目前通用路径只认 `atk_scale` 这一个键）；
  2. 其余配置需在 `calculator` 内手动读取，惯用法是 `input.charInput.charSpec.find((spec) => spec.label === "..." && spec.key === "...")`，参考维什戴尔.ts 的 `charSpecConfigs`（键为 `uniequip_002_wisdel`，"攻击主目标"开关）与其 `calculator` 内的消费。

未导出的钩子在运行时会产生 `[干员名] 未实现天赋应用 / 未实现技能应用` 的控制台告警（`calculator/index.ts` 的 `voidApplyTalent` / `voidApplySkill`），这是提示而非错误。

## 5. 新写法收敛规范

16 份生效实现是层层抄写演化出来的，至少分化出三代写法。新实现按下表"推荐"列执行；"旧写法识别特征"列用于读旧代码时辨认，**不要再复制**。

| 维度 | 推荐写法 | 旧写法 / 变体（识别特征） |
|---|---|---|
| 导出形式 | 具名导出 `export const calculator: CalculatorImpl`（银灰.ts、丰川祥子.ts） | `export default function`（其余全部） |
| 局外攻击力 | `CalculatorHelper.calculateOutsidePanel(...).atk`（维什戴尔.ts、麒麟R夜刀.ts） | `input.charInput.attribute?.atk`（赫德雷.ts、Mon3tr.ts、银灰.ts 等） |
| 敌人减伤 mitigation | `input.enemyInput.attributes.damageResistance` | 实现内自行组合 `1 - (1 - in_game_buff_final_mul.enemy_damage_resistance) × (1 - relic_rune_mul.enemy_damage_resistance)`（Mon3tr.ts、维什戴尔.ts、麒麟R夜刀.ts） |
| 单发 DPH 公式 | `((atk + 局内加算) × (1 + 局内乘算 + 技能加攻) + 最终加算) × 技能倍率 × 最终乘算` | 见下方两类已知偏差 |
| `(1 - mitigation)` 位置 | 在 total_damage / dps 聚合处对每类伤害**只乘一次** | 散落在各中间量上，存在漏乘（见下） |

各维度的解释与依据：

- **局外攻击力**：两种取法当前运行时等价——`calculator/CalcCenter.tsx` 在核心计算 effect 中把 `CalculatorHelper.calculateOutsidePanel` 的结果注入 `charInput.attribute` 后才调用 `calculator()`。但 `attribute` 取法依赖调用方完成注入，headless 场景（测试内重建管线，见 [09-fixtures-and-baselines.md](./09-fixtures-and-baselines.md)）容易漏；自行调用 `calculateOutsidePanel` 自包含且与面板展示同源，故为推荐。许多旧文件两者都算了一遍而 `outsidePanel` 变量未使用，属抄写残留。
- **mitigation**：`CalculatorHelper.calculateEnemyAttr` 已把上述组合公式的结果（四舍五入到 3 位小数）预先写入 `enemyInput.attributes.damageResistance`，因此对普通敌人两种取法数值等价（仅舍入差）。

> ⚠️ **实现内自行组合 mitigation 会绕过木桩。** `calculateEnemyAttr` 对名为"木桩"的敌人直接原样返回用户输入，木桩的减伤是用户在敌人面板手填的（`EnemySection/EnemyDisplay.tsx` 的 `displayAttrKeys.damageResistance`，0~1）。从 `context` 自行组合的写法读不到这个用户值——打木桩且手填了减伤时数值会错。这也是本文不采纳 Mon3tr.ts 式组合取法的原因（Mon3tr.ts 中该 `mitigation` 变量甚至算而未用）。收敛方向如有异议，以 [02-buff-context-and-formulas.md](./02-buff-context-and-formulas.md) 的裁定为准。

- **DPH 公式的两类已知偏差**（读旧代码时务必识别，新代码禁止复制）：
  1. **技能分支把局内加算误放最终加算槽位**：赫德雷.ts、Mon3tr.ts、空弦.ts、银灰.ts 的技能 DPH 公式形如 `((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul`——第二个加项是 `atkBuffInAdd` 而非 `atkBuffFinalAdd`，与同文件普攻段的 `commonDPH` 公式自相矛盾，属复制传播的疑似缺陷（登记见 [known-issues.md](./known-issues.md)）。
  2. **最终加算位置不一**：维什戴尔.ts、丰川祥子.ts 把 `atkBuffFinalAdd` 加在 `atkBuffFinalMul` **之后**（`(atk + add) × mul × finalMul + finalAdd`），与模板口径不同。两类乘区都有非零值时结果不同，统一口径以 02 为准。
- **`(1 - mitigation)` 漏乘现状**：赫德雷.ts 三技能的真伤部分、Mon3tr.ts 三技能全程都没有乘 `(1 - mitigation)`，而同文件物理部分乘了。减伤对哪些伤害类型生效的权威口径见 02；实现层的纪律是：**每一笔落地伤害，要么乘且只乘一次，要么有注释说明为何不乘**。
- **`result` 槽位口径**：`result.*.dph` 在不同文件里分别被填成"含技能倍率的单发攻击数值"（赫德雷.ts、空弦.ts）和"局内攻击力面板"（维什戴尔.ts）；`result.attack.total_damage` 有的填单发、有的填回转期累计。权威契约见 [06-data-schema.md](./06-data-schema.md)，新实现以其为准。

## 6. 已知反模式清单

以下模式在存量代码中真实存在，新代码一律禁止；改旧文件时顺手清理。

1. **手抄技能数值，不读 `skill.blackboard`**。`atkScales` / `spCosts` / `durations` 十级数组（丰川祥子.ts、维什戴尔.ts、艾拉.ts 等）全部是从游戏数据人肉誊抄的。上游技能平衡性调整**不会自动反映**到计算结果，必须人工逐文件核对——这是"数据更新→自动验证"目标的主要敌人之一。能从 `input.charInput.skill.blackboard` 取到的数值（银灰.ts 的 `applySkill` 是范例）就不要手抄；确实取不到的，注释中写明誊抄自哪个数据版本。
2. **空 case 静默归零**。`switch` 里留空分支（Mon3tr.ts 一二技能、银灰.ts 一二技能、玛恩纳.ts、逻各斯.ts、维什戴尔.ts 三技能等）会让用户选中该技能时得到全 0 输出且无任何提示，与"文件名打错"的症状无法区分。未适配的技能必须同时进 `black-list.ts`（§7）。
3. **缺 `break` 导致 fall-through**。维什戴尔.ts 的 `skchr_wisdel_1` 分支为空且无 `break`，直接落入二技能分支——选一技能显示的是二技能的数值（已登记 [known-issues.md](./known-issues.md)）。
4. **死 import `registerCalculatorImpl`**。赫德雷.ts、Mon3tr.ts、空弦.ts 等 9 个文件 import 了它但从不调用，纯属互相抄写的残留。整个 `charImpl/` 子目录中真正调用它的只有从未被加载的 `Hoederer_beta.ts`。新文件不要 import。
5. **`Math.random()` 非确定性**。司霆惊蛰.ts 的二技能用 `Math.random()` 模拟概率触发，同样输入每次输出不同，金值基线无从谈起。概率机制一律用期望值（概率 × 收益）；确需采样的未来逐帧场景使用 `calculator/simulate/random-probability.ts` 的种子随机数（现状见 [08-simulate-and-legacy.md](./08-simulate-and-legacy.md)）。
6. **算而不用的样板变量**。多数旧文件开头实例化了 `ExpressionUtil`、调用了 `calculateOutsidePanel` 却从不使用（Mon3tr.ts 还有算而未用的 `mitigation`）。这是抄模板的痕迹，会误导读者以为这些值参与了计算。模板里没用到的就删掉。
7. **`console.log` 残留**。司霆惊蛰.ts、丰川祥子.ts 等含有大量调试输出。调试手段见 [07-debugging.md](./07-debugging.md)，提交前清干净。

## 7. 禁用未适配技能：black-list

`black-list.ts` 导出 `DamageCalculatorSettings`，按干员名（与 `charData.name` 同口径的中文名 / 官方名）登记 `disabled_skills`（技能 skillId 数组）：

```ts
Mon3tr: {
  disabled_skills: ["skchr_monstr_1", "skchr_monstr_2"],
},
```

消费方是 `OperatorSection/OperatorDisplay.tsx` 的 `OperatorDisplay`：把 `DamageCalculatorSettings.operator[activeCharName]?.disabled_skills` 传给技能下拉的 `disabledKeys`，被禁用的技能在下拉中不可选。

只实现了部分技能的干员，**实现文件里的空分支与黑名单条目必须成对出现**：黑名单挡住用户选择，空分支兜底防御。补全某个技能的实现后，记得同步从黑名单移除。

> ⚠️ 黑名单只作用于下拉交互层。`app/stores/damageCalculator/slices/charSlice.ts` 的 `setActiveCharName` 在恢复 localStorage 里保存的 `skillKey` 时**不经过黑名单过滤**——用户上次选中的技能后来被加入黑名单时，仍会以该技能进入计算（命中空分支则显示全 0）。

## 8. 上线 Checklist

提交一个新干员实现（或大改存量实现）前逐项核对：

- [ ] 文件名与 `charData.name` 一字不差，且位于 `charImpl/<职业>/` 子目录下
- [ ] 使用具名导出 `calculator`；没有 import `registerCalculatorImpl`
- [ ] 三个技能分支全部实现，或未实现者已加入 `black-list.ts` 的 `disabled_skills`
- [ ] 每个 `case` 末尾有 `break`（或显式注释说明有意 fall-through）
- [ ] 攻速取 `Math.min(100 + atkSpeedBuff, 600)`，攻击间隔做了 30fps 帧量化
- [ ] 乘区读取齐全：atk 四乘区、`damage_scale` 系列、攻速双源相加、`sp_recovery_per_sec`
- [ ] `(1 - mitigation)` 对每类落地伤害只乘一次；不乘的位置有注释依据
- [ ] 局外攻击力取自 `calculateOutsidePanel`；没有算而不用的样板变量
- [ ] 技能数值优先读 `skill.blackboard`；手抄数值表注明了索引含义（`skillLevel` 0 起）与誊抄的数据版本
- [ ] `applySkill` 与 `calculator` 内的技能加攻数值同源核对过（面板与伤害一致）
- [ ] 没有 `Math.random()`；没有遗留 `console.log`
- [ ] 本地 UI 验证：输出非全 0、控制台无"未实现 / 实现为空"告警、切技能与模组数值有响应
- [ ] 为该干员补了测试 fixture 与用例（流程见 [09-fixtures-and-baselines.md](./09-fixtures-and-baselines.md)）
- [ ] 若已接入 `pnpm docs:gen`，重新生成 `generated/char-impl-coverage.md` 覆盖矩阵
