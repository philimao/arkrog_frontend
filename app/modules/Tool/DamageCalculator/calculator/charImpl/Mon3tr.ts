import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** Mon3tr伤害计算器 */
export function Mon3tr(input: CalculatorInput): CalculatorOutput {
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
  const mitigation = input.enemyInput.damageHitratePhysical || 0; // 闪避
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();
  // const fire: boolean = input.relics.find((r) => r.name === "烟花之手") !== undefined; // 烟花手，脚本只需获取是否有该藏品

  const enemyDef = input.enemyInput.def; // 敌人防御
  // const enemyRes = input.enemyInput.resistance; // 敌人减伤

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  // const commonDamage = Math.max(commonDPH - enemyDef, commonDPH * 0.05) * damage_scale * damage_scale_phy;
  // const commonFireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) * damage_scale * damage_scale_phy;
  // result.attack.dph = commonDPH;

  const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
  const commonAtkTimeBase = 2.85; // 普攻基础时间
  const commonAtkFrame = Math.round(commonAtkTimeBase * 3000.0 / atkSpeed); // 普攻帧数
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻时间

  switch (skillKey) {
    case "skchr_monstr_1": {
      break;
    }
    case "skchr_monstr_2": {
      break;
    }
    case "skchr_monstr_3": {
      const skillBuffIn = 3.3; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_pure;
      // const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 1.35; // 技能基础时间
      const skillAtkFrame = Math.round(skillAtkTimeBase * 3000.0 / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间 

      const spInitial = 0; // 技能初始技力
      const skillSp = 15.0; // 技能技力消耗
      const skillKeepTime = 25.0; // 技能持续时间
      const skillRecoveryTime = Math.max(skillKeepTime - spInitial, 0) / (1 / skillAtkTime + spBuffAdd); // 技能期望回转
      
      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = 25.0 / skillAtkTime - 1; // 技能期望普攻次数

      let commonTotalDamage = 0;
      let skillTotalDamage = skillDamage * skillHit;

      // if (fire) {
      //   commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
      //   skillTotalDamage += skillFireDamage * skillHit * 3 * 0.25 * (1 - mitigation);
      // }

      result.skill.dph = skillDph;
      result.skill.dps.pure = skillTotalDamage / skillKeepTime;
      result.cycle.dps.pure = (skillTotalDamage + commonTotalDamage) / (skillKeepTime + skillRecoveryTime);
      result.skill.total_damage.pure = skillTotalDamage;
      result.cycle.total_damage.pure = skillTotalDamage + commonTotalDamage;
      break;
    }
  }

  return result;
}

// 注册Mon3tr伤害计算器
registerCalculatorImpl("Mon3tr", Mon3tr);
  