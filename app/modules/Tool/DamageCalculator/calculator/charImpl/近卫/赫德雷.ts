import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";
import { ExpressionUtil } from "../../expression-util";
import { registerCalculatorImpl } from "../../impls";

/** 赫德雷伤害计算器 */
export default function Hoederer(input: CalculatorInput): CalculatorOutput {
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
    (1 - context.in_game_buff_final_mul.enemy_damage_resistance.calculate()) *
    (1 - context.relic_rune_mul.enemy_damage_resistance.calculate()); // 敌人减伤
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();
  // const fire: boolean = input.relics.find((r) => r.name === "烟花之手") !== undefined; // 烟花手，脚本只需获取是否有该藏品

  const enemyDef = expression_util.enemy_in_game_def().calculate(); // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage = Math.max(commonDPH - enemyDef, commonDPH * 0.05) * damage_scale * damage_scale_phy;
  //const commonFireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) * damage_scale * damage_scale_phy;

  const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
  const commonAtkTimeBase = 2.5; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻帧数
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻时间

  result.attack.dps.phy = commonDamage / commonAtkTime;
  result.attack.total_damage.phy = commonDamage;

  switch (skillKey) {
    case "skchr_hodrer_1": {
      let skillBuffIn = 0.0; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 2.6 * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      // const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 2.5; // 技能基础攻击间隔
      const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

      const spInitial = 0; // 藏品初始技力
      const skillSp = 2;
      const skillKeepTime = skillAtkTime; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 / commonAtkTime + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * (1 - mitigation);

      // if (fire) {
      //   commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
      //   skillTotalDamage += skillFireDamage * 0.25 * (1 - mitigation);
      // }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / skillKeepTime;
      result.cycle.dps.phy = (skillTotalDamage + commonTotalDamage) / (skillKeepTime + skillRecoveryTime);
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage + commonTotalDamage;
      break;
    }
    case "skchr_hodrer_2": {
      let skillBuffIn = 0.4; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      // const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 3.0; // 技能基础攻击间隔
      const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔(帧)
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔(秒)

      const spInitial = 0; // 藏品初始技力
      const skillSp = 5.0;
      const skillKeepTime = skillAtkTime; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = skillDamage * skillHit * (1 - mitigation);

      // if (fire) {
      //   commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
      //   skillTotalDamage += skillFireDamage * 0.25 * (1 - mitigation);
      // }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamage / skillKeepTime;
      result.cycle.dps.phy = skillTotalDamage / skillKeepTime;
      result.skill.total_damage.phy = skillTotalDamage;
      result.cycle.total_damage.phy = skillTotalDamage;
      break;
    }
    case "skchr_hodrer_3": {
      // 目前不计算眩晕覆盖之类的问题
      let skillBuffIn = 1.2; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      // const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;
      const skillDamagePure = 200 * damage_scale * damage_scale_pure;

      const skillAtkTimeBase = 2.5; // 技能基础攻击间隔
      const skillAtkFrame = Math.round((2.5 * 3000.0) / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

      const spInitial = 0; // 藏品初始技力
      const skillSp = 50.0;
      const skillKeepTime = 70.0; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数
      const skillHit = 68.5 / skillAtkTime; // 技能期望攻击次数(前摇1.5s)

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamagePhy = skillDamage * skillHit * (1 - mitigation);
      let skillTotalDamagePure = skillDamagePure * 68;

      // if (fire) {
      //   commonTotalDamage += commonFireDamage * commonHit * 0.25 * (1 - mitigation);
      //   skillTotalDamage += skillFireDamage * 0.25 * (1 - mitigation);
      // }

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamagePhy / skillKeepTime;
      result.skill.dps.pure = skillTotalDamagePure / skillKeepTime;
      result.cycle.dps.phy = (skillTotalDamagePhy + commonTotalDamage) / (skillRecoveryTime + skillKeepTime);
      result.skill.total_damage.phy = skillTotalDamagePhy;
      result.skill.total_damage.pure = skillTotalDamagePure;
      result.cycle.total_damage.phy = skillTotalDamagePhy + commonTotalDamage;
      result.cycle.total_damage.pure = skillTotalDamagePure;
      break;
    }
  }

  return result;
}
