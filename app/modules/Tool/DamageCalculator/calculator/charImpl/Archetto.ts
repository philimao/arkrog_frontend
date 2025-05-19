import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 空弦伤害计算器 */
export function Archetto(input: CalculatorInput): CalculatorOutput {
  // 干员养成加成
  let context = CalculatorHelper.analyzeChar({
    charInput: input.charInput,
    charData: input.charData,
  });

  // 生成藏品加成
  context = CalculatorHelper.analyzeRelics(
    {
      charInput: input.charInput,
      charData: input.charData,
      relics: input.relics,
    },
    context,
  );

  // 获取局内buff
  const atkBuffInAdd = context.in_game_buff_final_add.atk; // 攻击力直接加算
  const atkBuffInMul = context.in_game_buff_mul.atk - 1; // 攻击力直接乘算
  const atkBuffFinalAdd = context.in_game_buff_final_add.atk; // 攻击最终加算
  const atkBuffFinalMul = context.in_game_buff_final_mul.atk; // 攻击最终乘算
  const damage_scale = context.global_buff_stack.damage_scale; // 通用增伤总倍率
  const damage_scale_phy = context.global_buff_stack.damage_scale_phy; // 物理增伤总倍率
  const damage_scale_mag = context.global_buff_stack.damage_scale_mag; // 法术增伤总倍率
  const damage_scale_pure = context.global_buff_stack.damage_scale_pure; // 真伤增伤总倍率

  const atkSpeedBuff = context.in_game_buff_add.attack_speed; // 额外攻击速度
  const spBuffAdd = context.in_game_buff_add.sp_recovery_per_sec; // 额外技力回复速度

  // 通过 calculateOutsidePanel 获取面板属性
  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });

  const atk = input.charInput.attribute?.atk; // 局外攻击力
  const skillKey = input.charInput.skillKey; // 技能key
  const mitigation = input.enemyInput.damageHitratePhysical || 0; // 闪避?减伤?
  const charge = 1;
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();
  const fire: boolean = input.relics.find((r) => r.name === "烟花之手") !== undefined; // 烟花手，脚本只需获取是否有该藏品

  const enemyDef = input.enemyInput.def; // 敌人防御
  // const enemyRes = input.enemyInput.resistance; // 敌人减伤

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage = Math.max(commonDPH - enemyDef, commonDPH * 0.05) * damage_scale * damage_scale_phy;
  const commonFireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) * damage_scale * damage_scale_phy;
  result.attack.dph = commonDPH;

  const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
  const commonAtkFrame = Math.round(3000.0 / atkSpeed); // 普攻帧数
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻时间

  if (fire) {
    result.attack.dps.phy = ((commonDamage + commonFireDamage * 0.25) / commonAtkTime) * (1 - mitigation);
  } else {
    result.attack.dps.phy = (commonDamage / commonAtkTime) * (1 - mitigation);
  }
  result.attack.total_damage.phy = commonDamage;

  switch (skillKey) {
    case "skchr_archet_1": {
      const skillBuffIn = 0.0; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 2.3 * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkFrame = Math.round(3000.0 / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间 
      const spRecoveryTime = 3.0 / (1 / skillAtkTime + spBuffAdd); // 技能期望回转
      const commonHit = spRecoveryTime / skillAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = 1.0 // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * (1 - mitigation);

      if (fire) {
        commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
        skillTotalDamage += skillFireDamage * 0.25 * (1 - mitigation);
      }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / (skillAtkTime * skillHit);
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (commonAtkTime * commonHit + skillAtkTime * skillHit);
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break;
    }
    case "skchr_archet_2": {
      /*技能好就开,仅计算主目标伤害*/
      const skillBuffIn = 0.0; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 1.4 * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkFrame = Math.round(3000.0 / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间 
      const spRecoveryTime = 9.0 / (1 / skillAtkTime + spBuffAdd); // 技能期望回转
      const commonHit = spRecoveryTime / skillAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = 1.0 // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * 5 * (1 - mitigation);

      if (fire) {
        commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
        skillTotalDamage += skillFireDamage * skillHit * 5 * 0.25 * (1 - mitigation);
      }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / (skillAtkTime * skillHit);
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (commonAtkTime * commonHit + skillAtkTime * skillHit);
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break;
    }
    case "skchr_archet_3": {
      const skillBuffIn = 0.3; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkFrame = Math.round(3000.0 / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间 
      const spRecoveryTime = 30.0 / (1 / skillAtkTime + spBuffAdd); // 技能期望回转
      const commonHit = spRecoveryTime / skillAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = 20.0 / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * 3 * (1 - mitigation);

      if (fire) {
        commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
        skillTotalDamage += skillFireDamage * skillHit * 3 * 0.25 * (1 - mitigation);
      }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / (skillAtkTime * skillHit);
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (commonAtkTime * commonHit + skillAtkTime * skillHit);
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break;
    }
  }

  return result;
}

// 注册空弦伤害计算器
registerCalculatorImpl("Archetto", Archetto);
