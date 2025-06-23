import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import type { CharInput } from "~/stores/damageCalculator/calcTypes";
import { CalculatorHelper } from "../../helper";
import type { BuffContext } from "../../buff-context";
import { type ApplyTalentFC, type CalculatorImpl, getByKeySafe } from "../../impls";
import { NumericLiteralNode } from "../../ast";

/** 银灰伤害计算器 */
export const calculator: CalculatorImpl = (input: CalculatorInput): CalculatorOutput => {
  // 干员养成加成
  const context = input.buffContext;

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
  const mitigation = input.enemyInput.attributes.damageResistance; // 敌人减伤
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const enemyDef = input.enemyInput.attributes.def; // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  const commonBuffIn = 0.27;
  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul + commonBuffIn) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage = Math.max(commonDPH * 1.15 - enemyDef, commonDPH * 1.15 * 0.05) * damage_scale * damage_scale_phy;
  const commonDamageMag = commonDPH * 0.1 * damage_scale_mag * (1 - enemyMagRes / 100);

  const atkSpeed = Math.min(100 + atkSpeedBuff, 600); // 攻击速度
  const commonAtkTimeBase = 1.33; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻帧数
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻时间

  result.attack.dps.phy = (commonDamage * (1 - mitigation)) / commonAtkTime;
  result.attack.dps.mag = (commonDamageMag * (1 - mitigation)) / commonAtkTime;
  result.attack.total_damage.phy = commonDamage * (1 - mitigation);
  result.attack.total_damage.mag = commonDamageMag * (1 - mitigation);

  switch (skillKey) {
    case "skchr_svrash_1": {
      break;
    }
    case "skchr_svrash_2": {
      break;
    }
    case "skchr_svrash_3": {
      // 目前不计算眩晕覆盖之类的问题
      const skillBuffIn = 2.27; // 技能加攻
      const skillDph =
        ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * atkBuffFinalMul * 1.15; //默认攻击精英/领袖
      const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;
      const skillDamageMag =
        Math.max((skillDph * 0.1 * (1 - enemyMagRes * 0.01)) / 1.15) * damage_scale * damage_scale_mag;

      const skillAtkTimeBase = 1.33; // 技能基础攻击间隔
      const skillAtkFrame = Math.round((1.33 * 3000.0) / atkSpeed); // 技能攻击间隔帧
      const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

      const spInitial = 0; // 藏品初始技力
      const skillSp = 90.0;
      const skillKeepTime = 30.0; // 技能持续时间
      const skillRecoveryTime = skillSp / (1 + spBuffAdd); // 技能期望回转

      const commonHit = Math.ceil(skillRecoveryTime / commonAtkTime); // 普攻次数
      const skillHit = Math.ceil(skillKeepTime / skillAtkTime); // 技能攻击次数

      const commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      const skillTotalDamagePhy = skillDamage * skillHit * (1 - mitigation);
      const skillTotalDamageMag = skillDamageMag * skillHit * (1 - mitigation);

      result.skill.dph = skillDph;
      result.skill.dps.phy = skillTotalDamagePhy / skillKeepTime;
      result.skill.dps.mag = skillTotalDamageMag / skillKeepTime;
      result.cycle.dps.phy = (skillTotalDamagePhy + commonTotalDamage) / (skillRecoveryTime + skillKeepTime);
      result.skill.total_damage.phy = skillTotalDamagePhy;
      result.skill.total_damage.mag = skillTotalDamageMag;
      result.cycle.total_damage.phy = skillTotalDamagePhy + commonTotalDamage;
      result.cycle.total_damage.mag = skillTotalDamageMag;
      break;
    }
  }

  return result;
};

/** 银灰技能应用 */
export function applySkill(input: { charInput: CharInput }, context: BuffContext) {
  const atk = getByKeySafe(input.charInput.skill.blackboard, "atk");
  if (atk) {
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value, "技能"));
  }
}

/** 银灰天赋应用 */
export const applyTalent: ApplyTalentFC = (input, context) => {
  if (!input.charInput.uniEquip) {
    return;
  }
  for (const part of input.charInput.uniEquip.parts) {
    const talent = part.addOrOverrideTalentDataBundle?.candidates?.findLast(
      (talent) =>
        talent.requiredPotentialRank <= input.charInput.potential &&
        (talent.description || talent.overrideDescription || talent.upgradeDescription),
    );
    if (!talent) continue;
    const atk = getByKeySafe(talent.blackboard, "atk");
    if (atk) {
      context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value, "模组"));
    }
  }
};
