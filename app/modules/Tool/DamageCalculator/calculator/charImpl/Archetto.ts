import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 空弦伤害计算器 */
export function Archetto(input: CalculatorInput): CalculatorOutput {
  const context = input.buffContext;

  // 获取局内buff
  /** 攻击力直接加算 */
  const atkBuffInAdd = context.in_game_buff_add.atk_source.calculate();
  /** 攻击力直接乘算 */
  const atkBuffInMul = context.in_game_buff_mul.atk_source.calculate() - 1;
  /** 攻击最终加算 */
  const atkBuffFinalAdd = context.in_game_buff_final_add.atk_source.calculate();
  /** 攻击最终乘算 */
  const atkBuffFinalMul = context.in_game_buff_final_mul.atk_source.calculate();
  /** 通用增伤总倍率 */
  const damage_scale = context.global_buff_stack.damage_scale;
  /** 物理增伤总倍率 */
  const damage_scale_phy = context.global_buff_stack.damage_scale_phy_source.calculate();
  /** 法术增伤总倍率 */
  const damage_scale_mag = context.global_buff_stack.damage_scale_mag_source.calculate();
  /** 真伤增伤总倍率 */
  const damage_scale_pure = context.global_buff_stack.damage_scale_pure_source.calculate();
  /** 元素损伤易伤 */
  const damage_scale_EP = context.in_game_buff_final_mul.enemy_damage_scale_ep_source.calculate();

  const atkSpeedBuff = context.in_game_buff_add.attack_speed + context.relic_rune_add.attack_speed; // 额外攻击速度
  const spBuffAdd = context.in_game_buff_add.sp_recovery_per_sec; // 额外技力回复速度

  // 通过 calculateOutsidePanel 获取面板属性
  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });

  const atk = input.charInput.attribute?.atk; // 局外攻击力
  const skillKey = input.charInput.skillKey; // 技能key
  const mitigation = 1 - context.in_game_buff_final_mul.enemy_damage_resistance_inf; // 敌人减伤
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();
  const fire: boolean = input.relics.find((r) => r.name === "烟花之手") !== undefined; // 烟花手，脚本只需获取是否有该藏品

  const enemyDef = input.enemyInput.attributes.def; // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage = Math.max(commonDPH - enemyDef, commonDPH * 0.05) * damage_scale * damage_scale_phy;
  const commonFireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) * damage_scale * damage_scale_phy;
  result.attack.dph = commonDPH;

  const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
  const commonAtkTimeBase = 1.0; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻帧数
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻时间

  if (fire) {
    result.attack.dps.phy = ((commonDamage + commonFireDamage * 0.25) / commonAtkTime) * (1 - mitigation);
  } else {
    result.attack.dps.phy = (commonDamage / commonAtkTime) * (1 - mitigation);
  }
  result.attack.total_damage.phy = commonDamage;

  switch (skillKey) {
    case "skchr_archet_1": {
      /*还没加入模组判断, 目前默认是集模*/
      let skillBuffIn = 0.5; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 2.3 * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 1.0; // 技能基础时间
      const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

      const spInitial = 0.0; // 藏品初始技力
      const skillSp = 3.0; // 技能技力消耗
      const skillKeepTime = skillAtkTime; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 / commonAtkTime + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / skillAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * (1 - mitigation);

      if (fire) {
        commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
        skillTotalDamage += skillFireDamage * 0.25 * (1 - mitigation);
      }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / skillKeepTime;
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (skillKeepTime + skillRecoveryTime);
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break;
    }
    case "skchr_archet_2": {
      /*技能好就开,仅计算主目标伤害*/
      /*还没加入模组判断, 目前默认是集模*/
      let skillBuffIn = 0.5; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 1.4 * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 1.0; // 技能基础攻击间隔
      const skillAtkFrame = Math.round(3000.0 / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

      const spInitial = 0.0; // 藏品初始技力
      const skillSp = 9.0; // 技能技力消耗
      const skillKeepTime = skillAtkTime; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 / commonAtkTime + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / skillAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * 5 * (1 - mitigation);

      if (fire) {
        commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
        skillTotalDamage += skillFireDamage * skillHit * 5 * 0.25 * (1 - mitigation);
      }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / skillKeepTime;
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (skillKeepTime + skillRecoveryTime);
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break;
    }
    case "skchr_archet_3": {
      /*还没加入模组判断, 目前默认是集模*/
      const skillBuffIn = 0.8; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 1.0; // 技能基础攻击间隔
      const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

      const spInitial = 0.0; // 藏品初始技力
      const skillSp = 30.0; // 技能技力消耗
      const skillKeepTime = 20.0; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 / commonAtkTime + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * 3 * (1 - mitigation);

      if (fire) {
        commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
        skillTotalDamage += skillFireDamage * skillHit * 3 * 0.25 * (1 - mitigation);
      }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / skillKeepTime;
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (skillKeepTime + skillRecoveryTime);
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break;
    }
  }

  return result;
}

// 注册空弦伤害计算器
registerCalculatorImpl("Archetto", Archetto);
