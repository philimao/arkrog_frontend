import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 维娜·维多利亚伤害计算器 */
export function Vina_Victoria(input: CalculatorInput): CalculatorOutput {
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
  const enemyMagRes = input.enemyInput.magicResistance; // 敌人法抗
  // const enemyRes = input.enemyInput.resistance; // 敌人减伤(未实现)

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage = Math.max(commonDPH * (1 - enemyMagRes / 100), commonDPH * 0.05) * damage_scale * damage_scale_mag;
  // const commonFireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) * damage_scale * damage_scale_phy;

  const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
  const commonAtkTimeBase = 1.25; // 普攻基础时间
  const commonAtkFrame = Math.round(commonAtkTimeBase * 3000.0 / atkSpeed); // 普攻间隔(帧)
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻间隔(秒)

  result.attack.dps.mag = commonDamage / commonAtkTime;
  result.attack.total_damage.mag = commonDamage;

  switch (skillKey) {
    case "skchr_siege2_1": {
      break;
    }
    case "skchr_siege2_2": {
      break;
    }
    case "skchr_siege2_3": {
      // 不计算狮子伤害
      const skillBuffIn = 1.9; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph, skillDph * 0.05) * damage_scale * damage_scale_pure;
      // const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 1.0; // 技能基础攻击间隔
      const skillAtkFrame = Math.round(skillAtkTimeBase * 3000.0 / atkSpeed); // 技能攻击间隔(帧)
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔(秒)

      const spInitial = 0; // 藏品初始技力
      const skillSp = 50.0  // 技能技力消耗
      const skillKeepTime = 25.0; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit;

      // if (fire) {
      //   commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
      //   skillTotalDamage += skillFireDamage * skillHit * 3 * 0.25 * (1 - mitigation);
      // }

      result.skill.dph = skillDph;
      result.skill.dps.pure = skillTotalDamage / skillKeepTime;
      result.cycle.dps.pure = skillTotalDamage / (skillKeepTime + skillRecoveryTime);
      result.cycle.dps.mag = commonTotalDamage / (skillKeepTime + skillRecoveryTime);
      result.skill.total_damage.pure = skillTotalDamage;
      result.cycle.total_damage.pure = skillTotalDamage ;
      result.cycle.total_damage.mag = commonTotalDamage
      break;
    }
  }

  return result;
}

// 注册维娜·维多利亚伤害计算器
registerCalculatorImpl("Vina Victoria", Vina_Victoria);
