import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";

/** 迷迭香伤害计算器 */
export default function Rosemary(input: CalculatorInput): CalculatorOutput {
  const context = input.buffContext;

  // 获取局内buff
  /** 攻击力直接加算 */
  const atkBuffInAdd = context.in_game_buff_add.atk.calculate();
  /** 攻击力直接乘算 */
  const atkBuffInMul = context.in_game_buff_mul.atk.calculate() - 1;
  /** 攻击最终乘算 */
  const atkBuffFinalMul = context.in_game_buff_final_mul.atk.calculate();
  /** 攻击最终加算 */
  const atkBuffFinalAdd = context.in_game_buff_final_add.atk.calculate();
  /** 通用增伤总倍率 */
  const damage_scale = context.global_buff_stack.damage_scale.calculate();
  /** 物理增伤总倍率 */
  const damage_scale_phy = context.global_buff_stack.damage_scale_phy.calculate();
  /** 法术增伤总倍率 */
  const damage_scale_mag = context.global_buff_stack.damage_scale_mag.calculate();

  const atkSpeedBuff =
    context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate();

  // 通过 calculateOutsidePanel 获取面板属性
  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });

  const atk = outsidePanel.atk; // 局外攻击力
  const skillKey = input.charInput.skillKey; // 技能key
  const skillLevel = input.charInput.skillLevel; // 技能等级
  const phase = input.charInput.phaseLevel; // 精英化等级
  const potential = input.charInput.potential; // 潜能等级
  const uniEquipLevel = input.charInput.uniEquipLevel; // 模组等级
  const uniEquipId = input.charInput.uniEquipId; // 模组id
  const mitigation =
    1 -
    (1 - context.in_game_buff_final_mul.enemy_damage_resistance.calculate()) *
      (1 - context.relic_rune_mul.enemy_damage_resistance.calculate()); // 敌人减伤

  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const enemyDef = input.enemyInput.attributes.def; // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  // 基础攻击间隔
  const baseAttackTime = 2.1;

  // 模组特性判断
  const equipX = uniEquipId === "uniequip_002_rosmon";
  const equipA = uniEquipId === "uniequip_003_rosmon";

  // 天赋1：歼灭战装备 - 无视防御力
  let defPenetrate = 0;
  if (phase === 1) {
    defPenetrate = potential >= 4 ? 105 : 90;
  } else if (phase === 2) {
    defPenetrate = potential >= 4 ? 175 : 160;
    if (equipA) {
      defPenetrate += 400;
    }
    if (skillKey === "skchr_rosmon_3") {
      defPenetrate += 160;
    }

    // x模组加成
    if (equipX) {
      if (uniEquipLevel >= 1) {
        if (uniEquipLevel === 1) {
          defPenetrate += 30;
        } else if (uniEquipLevel === 2) {
          defPenetrate += 60;
        }
      }
    }
  }
  let magicResReduction = 0;
  if (equipA) {
    magicResReduction = 20;
  }

  /** 天赋2：感知稳定 - 攻击力+8%（精英2开启） */
  const talent2AtkBonus = phase === 2 ? 0.08 : 0;

  // 基础特性：投掷手 - 两次攻击（第二次为余震50%）
  const dealPhysicalDamage = (atk: number, def: number, isShockwave: boolean) => {
    const damage_scale = isShockwave ? 0.5 : 1;
    const effectiveDef = Math.max(0, def - defPenetrate);
    return Math.max(atk * damage_scale - effectiveDef, atk * damage_scale * 0.05);
  };
  const dealMagicDamage = (atk: number, magicRes: number) => {
    return atk * (1 - Math.max(magicRes - magicResReduction, 0) / 100);
  };

  /** 局内加攻百分比 */
  const normalAtkMul = 1 + talent2AtkBonus + atkBuffInMul;
  /** 局内面板攻击力 */
  const normalAtk = (atk + atkBuffInAdd) * normalAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

  /** 物理伤害（含防穿） */
  const normalPhysicalDamage =
    (dealPhysicalDamage(normalAtk, enemyDef, false) +
      dealPhysicalDamage(normalAtk, enemyDef, true) * (equipX ? 2 : 1)) *
    damage_scale *
    damage_scale_phy; // 普通+余震
  /** 100%攻击力的法伤 */
  const normalMagicDamage = dealMagicDamage(normalAtk, enemyMagRes) * damage_scale * damage_scale_mag;

  switch (skillKey) {
    case "skchr_rosmon_1": {
      // 一技能：思维膨大
      // 下次攻击额外造成法术伤害
      const extraMagicScales = [0.8, 0.85, 0.95, 1.0, 1.05, 1.1, 1.2, 1.4, 1.6, 1.8];
      const extraMagicScale = extraMagicScales[skillLevel];

      // 攻击回复，攻击次数需求
      const spCosts = [4, 4, 4, 4, 4, 4, 3, 3, 3, 2];
      const spCost = spCosts[skillLevel];

      // 攻击速度
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      /** 普通攻击间隔(帧) */
      const atkFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      /** 普通攻击间隔(秒) */
      const attackTime = atkFrame / 30.0;

      // 普通攻击
      result.attack.dph = normalAtk;
      result.attack.total_damage.phy = normalPhysicalDamage * spCost * (1 - mitigation);
      result.attack.total_damage.mag = equipA ? normalMagicDamage * spCost * (1 - mitigation) : 0;
      result.attack.dps.phy = result.attack.total_damage.phy / (spCost * attackTime);
      result.attack.dps.mag = result.attack.total_damage.mag / (spCost * attackTime);

      // 技能
      result.skill.dph = normalAtk;
      result.skill.total_damage.phy = normalPhysicalDamage * (1 - mitigation);
      result.skill.total_damage.mag = normalMagicDamage * (equipA ? 1 + extraMagicScale : 1) * (1 - mitigation);
      result.skill.dps.phy = result.skill.total_damage.phy / attackTime;
      result.skill.dps.mag = result.skill.total_damage.mag / attackTime;

      // 周期
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.total_damage.mag = result.skill.total_damage.mag + result.attack.total_damage.mag;
      result.cycle.dps.phy = result.cycle.total_damage.phy / ((spCost + 1) * attackTime);
      result.cycle.dps.mag = result.cycle.total_damage.mag / ((spCost + 1) * attackTime);
      break;
    }

    case "skchr_rosmon_2": {
      // 二技能：末梢阻断
      // 攻击间隔增大，攻击力提升，额外2次余震
      const atkScales = [0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 0.3, 0.37, 0.45, 0.55];
      const atkScale = atkScales[skillLevel];

      // 技能期间攻击力
      const skillAtkMul = 1 + atkScale + talent2AtkBonus + atkBuffInMul;
      const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

      // 技能期间有额外2次余震，总共4次攻击（Y模组下是5次）
      const skillPhysicalDamage =
        (dealPhysicalDamage(skillAtk, enemyDef, false) +
          dealPhysicalDamage(skillAtk, enemyDef, true) * (equipX ? 4 : 3)) *
        damage_scale *
        damage_scale_phy;
      const skillMagicDamage = dealMagicDamage(skillAtk, enemyMagRes) * damage_scale * damage_scale_mag;

      // 攻击速度
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      /** 普通攻击间隔(帧) */
      const normalAtkFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      /** 普通攻击间隔(秒) */
      const normalAttackTime = normalAtkFrame / 30.0;
      /** 普通攻击间隔(帧) */
      const skillAtkFrame = Math.round((baseAttackTime * 1.5 * 3000.0) / totalAttackSpeed);
      /** 普通攻击间隔(秒) */
      const skillAttackTime = skillAtkFrame / 30.0;

      // 技能持续时间
      const skillDurations = [30, 31, 32, 33, 34, 35, 36, 37, 38, 40];
      const skillDuration = skillDurations[skillLevel];
      const skillHits = Math.ceil(skillDuration / skillAttackTime);

      // 计算周期伤害
      const spCosts = [40, 39, 38, 37, 36, 35, 34, 33, 32, 30];
      const spCost = spCosts[skillLevel];
      const normalHits = Math.ceil(spCost / normalAttackTime);

      // 普通攻击
      result.attack.dph = normalAtk;
      result.attack.total_damage.phy = normalPhysicalDamage * normalHits * (1 - mitigation);
      result.attack.total_damage.mag = equipA ? normalMagicDamage * normalHits * (1 - mitigation) : 0;
      result.attack.dps.phy = result.attack.total_damage.phy / spCost;
      result.attack.dps.mag = result.attack.total_damage.mag / spCost;

      // 技能
      result.skill.dph = skillAtk;
      result.skill.total_damage.phy = skillPhysicalDamage * skillHits * (1 - mitigation);
      result.skill.total_damage.mag = equipA ? skillMagicDamage * skillHits * (1 - mitigation) : 0;
      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;
      result.skill.dps.mag = result.skill.total_damage.mag / skillDuration;

      // 周期
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.total_damage.mag = result.skill.total_damage.mag + result.attack.total_damage.mag;
      result.cycle.dps.phy = result.cycle.total_damage.phy / (spCost + skillDuration);
      result.cycle.dps.mag = result.cycle.total_damage.mag / (spCost + skillDuration);
      break;
    }

    case "skchr_rosmon_3": {
      // 三技能："如你所愿"
      // 攻击间隔缩短，攻击力提升，同时攻击2个敌人
      const atkScales = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.75];
      const atkScale = atkScales[skillLevel];

      // 技能期间攻击力
      const skillAtkMul = 1 + atkScale + talent2AtkBonus + atkBuffInMul;
      const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

      const skillPhysicalDamage =
        (dealPhysicalDamage(skillAtk, enemyDef, false) +
          dealPhysicalDamage(skillAtk, enemyDef, true) * (equipX ? 2 : 1)) *
        damage_scale *
        damage_scale_phy;
      const skillMagicDamage = dealMagicDamage(skillAtk, enemyMagRes) * damage_scale * damage_scale_mag;

      // 攻击速度
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      /** 普通攻击间隔(帧) */
      const normalAtkFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      /** 普通攻击间隔(秒) */
      const normalAttackTime = normalAtkFrame / 30.0;
      /** 普通攻击间隔(帧) */
      const skillAtkFrame = Math.round((baseAttackTime * 0.5 * 3000.0) / totalAttackSpeed);
      /** 普通攻击间隔(秒) */
      const skillAttackTime = skillAtkFrame / 30.0;

      // 技能持续时间
      const skillDurations = [25, 25, 25, 26, 26, 26, 27, 28, 29, 30];
      const skillDuration = skillDurations[skillLevel];
      /** 技能前摇，暂时假设为0.5s */
      const skillStartup = 50 / totalAttackSpeed;
      const skillHits = Math.ceil((skillDuration - skillStartup) / skillAttackTime);

      // 计算周期伤害
      const spCosts = [80, 79, 78, 77, 76, 75, 74, 70, 66, 60];
      const spCost = spCosts[skillLevel];
      const normalHits = Math.ceil(spCost / normalAttackTime);

      // 普通攻击期间
      const normalAtkMul = 1 + talent2AtkBonus + atkBuffInMul;
      const normalAtk = (atk + atkBuffInAdd) * normalAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

      // 普通攻击
      result.attack.dph = normalAtk;
      result.attack.total_damage.phy = normalPhysicalDamage * normalHits * (1 - mitigation);
      result.attack.total_damage.mag = equipA ? normalMagicDamage * normalHits * (1 - mitigation) : 0;
      result.attack.dps.phy = result.attack.total_damage.phy / spCost;
      result.attack.dps.mag = result.attack.total_damage.mag / spCost;

      // 技能
      result.skill.dph = skillAtk;
      result.skill.total_damage.phy = skillPhysicalDamage * skillHits * (1 - mitigation);
      result.skill.total_damage.mag = equipA ? skillMagicDamage * skillHits * (1 - mitigation) : 0;
      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;
      result.skill.dps.mag = result.skill.total_damage.mag / skillDuration;

      // 周期
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.total_damage.mag = result.skill.total_damage.mag + result.attack.total_damage.mag;
      result.cycle.dps.phy = result.cycle.total_damage.phy / (spCost + skillDuration);
      result.cycle.dps.mag = result.cycle.total_damage.mag / (spCost + skillDuration);
      break;
    }
  }

  return result;
}
