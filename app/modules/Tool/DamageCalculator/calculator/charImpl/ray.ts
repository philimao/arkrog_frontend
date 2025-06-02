import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 莱伊伤害计算器 */
export function Ray(input: CalculatorInput): CalculatorOutput {
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
  // const fire: boolean = input.relics.find((r) => r.name === "烟花之手") !== undefined; // 烟花手，脚本只需获取是否有该藏品

  const enemyDef = input.enemyInput.attributes.def; // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage = Math.max(commonDPH - enemyDef, commonDPH * 0.05) * damage_scale * damage_scale_phy;
  //const commonFireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) * damage_scale * damage_scale_phy;
  result.attack.dph = commonDPH;

  const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
  const commonAtkTimeBase = 1.3; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻帧数
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻时间

  switch (skillKey) {
    case "skchr_ray_1": {
      break;
    }
    case "skchr_ray_2": {
      break;
    }

    case "skchr_ray_3": {
      // 不计算投递伤害
      let skillBuffIn = 0.3; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 1.6 * atkBuffFinalMul;
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillDphBomb =
        ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 2.0 * atkBuffFinalMul;
      const skillDamageBomb = Math.max(skillDphBomb - enemyDef, skillDphBomb * 0.05) * damage_scale * damage_scale_phy;
      // const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) * damage_scale * damage_scale_phy;

      const skillAtkTimeBase = 1.3; // 技能基础攻击间隔
      const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔(帧)
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔(秒)

      const spInitial = 0; // 藏品初始技力
      const Bullet = 50; // 子弹数
      const skillSp = 35.0;
      const skillKeepTime = (skillAtkTime * Bullet) / 5; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      let commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      let skillTotalDamage = (skillDamage + skillDamageBomb * 0.35) * 5 * skillHit * (1 - mitigation);

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
  }

  return result;
}

// 注册赫德雷伤害计算器
registerCalculatorImpl("Ray", Ray);
