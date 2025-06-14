import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";
import { ExpressionUtil } from "../../expression-util";
import { registerCalculatorImpl } from "../../impls";

/** Mon3tr伤害计算器 */
export default function Mon3tr(input: CalculatorInput): CalculatorOutput {
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
  /** 物理增伤总倍率 */
  const damage_scale_phy = context.global_buff_stack.damage_scale_phy.calculate();
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
  // const cardA: boolean = input.relics.find((r) => r.name === "疗养体验卡") !== undefined; // 疗养卡
  // const cardB: boolean = input.relics.find((r) => r.name === "疗养特供卡") !== undefined;

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;

  const atkSpeed = 100 + atkSpeedBuff + 22; // 攻击速度
  const commonAtkTimeBase = 2.85; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻帧数
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
      const skillDamage = Math.max(skillDph, skillDph * 0.05) * damage_scale * damage_scale_pure;

      const skillAtkTimeBase = 1.35; // 技能基础时间
      const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

      const spInitial = 0; // 技能初始技力
      const skillSp = 15.0; // 技能技力消耗
      const skillKeepTime = 25.0; // 技能持续时间
      const skillRecoveryTime = Math.max(skillSp - spInitial, 0) / (1 / skillAtkTime + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = Math.floor(25.0 / skillAtkTime); // 技能期望普攻次数
      // if (cardA || cardB) {
      //   const a = cardA ? 1 : 0;
      //   const b = cardB ? 1 : 0;
      //   const atkSpeedCard = 40 * a + 70 * b;
      //   const skillAtkFrameCard = Math.round((skillAtkTimeBase * 3000.0) / (atkSpeed + atkSpeedCard));
      // }

      const commonTotalDamage = 0;
      const skillTotalDamage = skillDamage * skillHit;


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
