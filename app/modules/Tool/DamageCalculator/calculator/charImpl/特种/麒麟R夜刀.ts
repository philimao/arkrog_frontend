import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";

/** 麒麟R夜刀伤害计算器 */
export default function KirinRYato(input: CalculatorInput): CalculatorOutput {
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
    context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate(); // 额外攻击速度

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
  const mitigation =
    1 -
    (1 - context.in_game_buff_final_mul.enemy_damage_resistance.calculate()) *
      (1 - context.relic_rune_mul.enemy_damage_resistance.calculate()); // 敌人减伤
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const enemyDef = input.enemyInput.attributes.def; // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  // 天赋1：双雷剑麒麟 - 攻击额外造成法术伤害
  const talent1Scale = phase === 0 ? 0.06 : phase === 1 ? 0.13 : 0.2;

  // 天赋2：鬼人强化状态 - 技能期间及结束后10秒攻击力加成
  const talent2Atk =
    (uniEquipLevel === 2 ? 0.15 : uniEquipLevel === 1 ? 0.14 : 0.13) + // 模组
    (potential >= 4 ? 0.03 : 0); // 潜能
  /** 技能期2天赋加成 */
  const talent2SkillAtk = talent2Atk + (uniEquipLevel === 2 ? 0.05 : uniEquipLevel === 1 ? 0.03 : 0);

  // 基础攻击间隔
  const baseAttackTime = 0.93;

  switch (skillKey) {
    case "skchr_yato2_1": {
      // 一技能：鬼人化
      // 攻击速度+30~100，攻击变为二连击，第三次攻击变为六连击
      const skillAttackSpeed = [30, 35, 40, 45, 50, 60, 70, 80, 90, 100][skillLevel] || 100;

      /** 局内技能攻击力加成 */
      const skillAtkMul = 1 + talent2SkillAtk + atkBuffInMul;
      /** 技能攻击力中间值 */
      const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

      // 物理伤害
      const physicalDamage = Math.max(skillAtk - enemyDef, skillAtk * 0.05) * damage_scale * damage_scale_phy;
      // 法术伤害（天赋1）
      const magicalDamage = skillAtk * talent1Scale * damage_scale_mag * (1 - enemyMagRes / 100);

      // 攻击速度计算
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff + skillAttackSpeed, 600);
      /** 技能攻击间隔(帧) */
      const skillAtkFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      /** 技能攻击间隔(秒) */
      const skillAttackTime = skillAtkFrame / 30.0;
      /** 技能持续时间(秒) */
      const skillDuration = input.charInput.skills.find((skill) => skill.skillId === skillKey)!.levels[skillLevel]
        .duration;
      /** 技能期望普攻次数 */
      const skillHit = Math.ceil(skillDuration / skillAttackTime);

      // 一技能特殊机制：二连击 + 第三次攻击六连击
      // 六连击占用2个攻击间隔（前4连击+后2连击）
      // 简化计算：平均每次攻击的伤害倍数
      // 两次二连击 + 一次六连击 共占用4个攻击间隔 = 10次攻击 / 4次攻击间隔 ≈ 2.5倍
      const averageHitMultiplier = 10 / 4;

      result.skill.dph = skillAtk;
      result.skill.total_damage.phy = physicalDamage * skillHit * averageHitMultiplier * (1 - mitigation);
      result.skill.total_damage.mag = magicalDamage * skillHit * averageHitMultiplier * (1 - mitigation);

      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;
      result.skill.dps.mag = result.skill.total_damage.mag / skillDuration;

      result.cycle.total_damage = result.skill.total_damage;
      result.cycle.dps.phy = result.skill.total_damage.phy / (input.charInput.attribute!.respawnTime + skillDuration);
      result.cycle.dps.mag = result.skill.total_damage.mag / (input.charInput.attribute!.respawnTime + skillDuration);
      break;
    }

    case "skchr_yato2_2": {
      // 二技能：乱舞
      // 天赋1效果提升，攻击力提升，16次斩击
      const talent1EnhanceScales = [1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.35, 2.5];
      const skillScales = [1.05, 1.08, 1.12, 1.16, 1.2, 1.25, 1.3, 1.35, 1.4, 1.5];

      const talent1EnhanceScale = talent1EnhanceScales[skillLevel];
      const skillScale = skillScales[skillLevel];

      // 技能期间有天赋2加成
      const skillAtkMul = 1 + talent2SkillAtk + atkBuffInMul;
      /** 技能期面板攻击力 */
      const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

      // 物理伤害
      const skillDph = skillAtk * skillScale;
      const physicalDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      // 强化后的法术伤害（天赋1 * 技能倍率）
      const enhancedTalent1 = talent1Scale * talent1EnhanceScale;
      const magicalDamage = skillAtk * enhancedTalent1 * skillScale * damage_scale_mag * (1 - enemyMagRes / 100);

      // 16次斩击
      const slashCount = 16;

      // 第16次斩击在121帧出伤
      const skillDuration = 121 / 30;

      result.skill.dph = skillAtk;
      result.skill.total_damage.phy = physicalDamage * slashCount * (1 - mitigation);
      result.skill.total_damage.mag = magicalDamage * slashCount * (1 - mitigation);

      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;
      result.skill.dps.mag = result.skill.total_damage.mag / skillDuration;

      result.cycle.total_damage = result.skill.total_damage;
      result.cycle.dps.phy = result.skill.total_damage.phy / (input.charInput.attribute!.respawnTime + skillDuration);
      result.cycle.dps.mag = result.skill.total_damage.mag / (input.charInput.attribute!.respawnTime + skillDuration);
      break;
    }

    case "skchr_yato2_3": {
      // 三技能：空中回旋乱舞
      // 突进攻击，每段距离都造成伤害
      const skillScales = [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.0];
      const skillScale = skillScales[skillLevel];

      // 技能期间有天赋2加成
      const skillAtkMul = 1 + talent2SkillAtk + atkBuffInMul;
      /** 技能期面板攻击力 */
      const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

      // 技能倍率伤害
      const skillDph = skillAtk * skillScale;
      const physicalDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      // 法术伤害（天赋1基于技能攻击力）
      const magicalDamage = skillDph * talent1Scale * damage_scale_mag * (1 - enemyMagRes / 100);

      /** 判数2 5 4 5 5 2 */
      const hitCount = 5;

      // 最后一段伤害50帧，80帧恢复阻挡
      const skillDuration = 50 / 30;

      result.skill.dph = skillAtk;
      result.skill.total_damage.phy = physicalDamage * hitCount * (1 - mitigation);
      result.skill.total_damage.mag = magicalDamage * hitCount * (1 - mitigation);

      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;
      result.skill.dps.mag = result.skill.total_damage.mag / skillDuration;

      result.cycle.total_damage = result.skill.total_damage;
      result.cycle.dps.phy = result.skill.total_damage.phy / (input.charInput.attribute!.respawnTime + skillDuration);
      result.cycle.dps.mag = result.skill.total_damage.mag / (input.charInput.attribute!.respawnTime + skillDuration);
      break;
    }
  }

  return result;
}
