import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";
import { ExpressionUtil } from "../../expression-util";
import { registerCalculatorImpl } from "../../impls";

/** 阿米娅伤害计算器 */
export default function Amiya(input: CalculatorInput): CalculatorOutput{
  const context = input.buffContext;
  const expression_util = new ExpressionUtil(input, context);

  // 获取局内buff
  /** 攻击力直接加算 */
  const atkBuffInAdd = context.in_game_buff_add.atk.calculate();
  /** 攻击力直接乘算 */
  const atkBuffInMul = context.in_game_buff_mul.atk.calculate() - 1;
  /** 攻击最终加算 */
  const atkBuffFinalAdd = context.in_game_buff_final_add.atk.calculate();
  /** 攻击最终乘算 */
  const atkBuffFinalMul = context.in_game_buff_final_mul.atk.calculate();
  /** 通用增伤总倍率 */
  const damage_scale = context.global_buff_stack.damage_scale.calculate();
  /** 法术增伤总倍率 */
  const damage_scale_mag = context.global_buff_stack.damage_scale_mag.calculate();
  /** 真伤增伤总倍率 */
  const damage_scale_pure = context.global_buff_stack.damage_scale_pure.calculate();
  /** 元素损伤易伤 */
  const damage_scale_EP = context.in_game_buff_final_mul.enemy_damage_scale_ep.calculate();

  const atkSpeedBuff =
    context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate(); // 额外攻击速度
  const spBuffAdd = context.in_game_buff_add.sp_recovery_per_sec.calculate(); // 额外技力回复速度

  // 通过 calculateOutsidePanel 获取面板属性
  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });

  const atk = input.charInput.attribute?.atk; // 局外攻击力
  const skillKey = input.charInput.skillKey; // 技能key
  const mitigation =
    1 -
    (1 - context.in_game_buff_final_mul.enemy_damage_resistance.calculate()) *
    (1 - context.relic_rune_mul.enemy_damage_resistance.calculate()); // 敌人减伤
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const enemyDef = input.enemyInput.attributes.def; // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul + 165;
  const commonDamage =
    Math.max(commonDPH * (1 - enemyMagRes / 100), commonDPH * 0.05) *
    damage_scale *
    damage_scale_mag *
    (1 - mitigation);

  const atkSpeed = Math.min(100 + atkSpeedBuff, 600); // 攻击速度
  const commonAtkTimeBase = 1.6; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻间隔(帧)
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻间隔(秒)

  switch (skillKey) {
    case "skchr_amiya_1": {
      break;
    }

    case "skchr_amiya_2": {
      break;
    }

    case "skchr_amiya_3": {

      const skillBuffIn = 2.3; // 技能加攻

      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph, skillDph * 0.05) * damage_scale * damage_scale_pure;

      // 技能期间攻击间隔不变
      const skillAtkTime = commonAtkTime;

      const spInitial = 0; // 技能初始技力
      const skillSp = 120.0; // 技能技力消耗
      const skillKeepTime = 30.0; // 技能持续时间

      // 计算技力回复时间
      let skillRecoveryTime = 0;
      let currentSp = 0;
      let time = 0;
      while (currentSp < skillSp) {
        time += commonAtkTime;
        currentSp += talentSpRecovery;
      }
      skillRecoveryTime = time;

      const commonHit = Math.ceil(skillRecoveryTime / commonAtkTime); // 普攻次数
      const skillHit = Math.floor(skillKeepTime / skillAtkTime); // 技能攻击次数

      const commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      const skillTotalDamage = skillDamage * skillHit * (1 - mitigation);

      result.skill.dph = skillDph;
      result.skill.dps.pure = skillTotalDamage / skillKeepTime;
      result.skill.total_damage.pure = skillTotalDamage;
      result.cycle.dps.mag = commonTotalDamage / (skillRecoveryTime + skillKeepTime);
      result.cycle.dps.pure = skillTotalDamage / (skillRecoveryTime + skillKeepTime);
      result.cycle.total_damage.mag = commonTotalDamage;
      result.cycle.total_damage.pure = skillTotalDamage;
      break;
    }
  }

  return result;
};




