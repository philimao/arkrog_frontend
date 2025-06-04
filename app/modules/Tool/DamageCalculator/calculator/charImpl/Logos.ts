import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { ExpressionUtil } from "../expression-util";
import { registerCalculatorImpl } from "../impls";

/** 逻各斯伤害计算器 */
export function Logos(input: CalculatorInput): CalculatorOutput {
  const context = input.buffContext;
  const expression_util = new ExpressionUtil(input, context);

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

  const enemyDef = expression_util.enemy_in_game_def().calculate(); // 敌人防御
  const enemyMagRes = Math.max(input.enemyInput.attributes.magicResistance - 10, 0); // 敌人法抗
  const enemyEP = input.enemyInput.levelType == "NORMAL" ? 1000 : 2000;

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul + 165;
  const commonDamage =
    Math.max(commonDPH * (1 - enemyMagRes / 100), commonDPH * 0.05) *
    damage_scale *
    damage_scale_mag *
    (1 - mitigation);
  const commonTalentDPH = (commonDPH - 165) * 0.65 + 165; //硬编码天赋倍率，待对接
  const commonTalentDamage =
    Math.max(commonTalentDPH * (1 - enemyMagRes / 100), commonDPH * 0.05) *
    damage_scale *
    damage_scale_mag *
    (1 - mitigation);
  const commonTalentDPH_ep = (commonDPH - 165) * 0.6; //元素伤害
  const commonTalentDamage_ep = commonTalentDPH_ep; //暂未考虑元素抗性

  const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
  const commonAtkTimeBase = 1.6; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻间隔(帧)
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻间隔(秒)

  const commonDamage_EP = (commonDamage + commonTalentDamage * 0.6) * 0.08 * damage_scale_EP; //元素损伤期望
  const commonEPTime = commonAtkTime * Math.ceil(enemyEP / commonDamage_EP); //在伤害较高时偏差较大
  const commonepHit = Math.round(450 / commonAtkFrame) * 0.6; //爆条期间命中数

  result.attack.dps.mag = (commonDamage + commonTalentDamage * 0.6) / commonAtkTime;
  result.attack.dps.ep = (commonepHit * commonTalentDamage_ep + 12000) / (commonEPTime + 15.0);

  switch (skillKey) {
    case "skchr_logos_1": {
      break;
    }
    case "skchr_logos_2": {
      break;
    }
    case "skchr_logos_3": {
      const skillBuffIn = 3; // 技能加攻
      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul + 165;
      const skillDamage =
        Math.max(skillDph * (1 - enemyMagRes / 100), skillDph * 0.05) *
        damage_scale *
        damage_scale_mag *
        (1 - mitigation);
      const skillTalentDamage =
        Math.max(((skillDph - 165) * 0.65 + 165) * (1 - enemyMagRes / 100), ((skillDph - 165) * 0.65 + 165) * 0.05) *
        damage_scale *
        damage_scale_mag *
        (1 - mitigation);
      const skillTalentDamage_ep = (skillDph - 165) * 0.6;

      const skillAtkTimeBase = 1.6; // 技能基础攻击间隔
      const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔(帧)
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔(秒)

      const spInitial = 0; // 藏品初始技力
      const skillSp = 45.0; // 技能技力消耗
      const skillKeepTime = 30.0; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 + spBuffAdd); // 技能期望回转

      const commonHit = skillRecoveryTime / commonAtkTime; // 期望普攻次数, 不考虑天赋全程吃阻回的情况
      const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

      const skillDamage_EP = (skillDamage + skillTalentDamage * 0.6) * 0.08 * damage_scale_EP; //元素损伤期望
      const skillEPTime = skillAtkTime * Math.ceil(enemyEP / skillDamage_EP); //在伤害较高时偏差较大
      const skillepHit = Math.max(Math.round((900 - 30 * skillEPTime) / skillAtkFrame) * 0.6, 0); //爆条期间命中数

      let commonTotalDamage = (commonDamage + commonTalentDamage * 0.6) * commonHit;
      let skillTotalDamage = (skillDamage + skillTalentDamage * 0.6) * skillHit;
      let skillTotalDamage_ep = skillTalentDamage_ep * skillepHit;
      if (skillepHit) {
        skillTotalDamage_ep += 12000;
      }

      result.skill.dph = skillDph;
      result.skill.dps.mag = skillTotalDamage / 30;
      result.skill.total_damage.mag = skillTotalDamage;
      result.skill.dps.ep = skillTotalDamage_ep / 30;
      result.skill.total_damage.ep = skillTotalDamage_ep;
      result.cycle.dps.mag = (commonTotalDamage + skillTotalDamage) / (skillKeepTime + skillRecoveryTime);
      result.cycle.total_damage.mag = commonTotalDamage + skillTotalDamage;

      break;
    }
  }

  return result;
}

// 注册逻各斯伤害计算器
registerCalculatorImpl("Logos", Logos);
