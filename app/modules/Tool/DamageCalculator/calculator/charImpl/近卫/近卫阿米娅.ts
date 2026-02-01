import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import type { CharInput } from "~/stores/damageCalculator/calcTypes";
import type { BuffContext } from "../../buff-context";
import { NumericLiteralNode } from "../../ast";
import { CalculatorHelper } from "../../helper";

const SPECIAL_MODULE_KEY = "待调弦的怒火";

function hasSpecialModule(charInput: CharInput): boolean {
  const uniEquipTag = `${charInput.uniEquipId ?? ""} ${charInput.uniEquipName ?? ""}`.toUpperCase();
  return uniEquipTag.includes(SPECIAL_MODULE_KEY.toUpperCase());
}

function getTalentScale(charInput: CharInput): number {
  if (!hasSpecialModule(charInput)) {
    return 0.07;
  }
  if (charInput.uniEquipLevel >= 2) {
    return 0.09;
  }
  if (charInput.uniEquipLevel >= 1) {
    return 0.08;
  }
  return 0.07;
}

/** 近卫阿米娅伤害计算器 */
export default function GuardAmiya(input: CalculatorInput): CalculatorOutput {
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
  /** 法术增伤总倍率 */
  const damage_scale_mag = context.global_buff_stack.damage_scale_mag.calculate();
  /** 真伤增伤总倍率 */
  const damage_scale_pure = context.global_buff_stack.damage_scale_pure.calculate();

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

  const atkSpeed = Math.min(100 + atkSpeedBuff, 600); // 攻击速度
  const commonAtkTimeBase = 1.25; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻间隔(帧)
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻间隔(秒)

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage =
    Math.max(commonDPH * (1 - enemyMagRes / 100), commonDPH * 0.05) * damage_scale * damage_scale_mag;

  result.attack.dph = commonDPH;
  result.attack.dps.mag = (commonDamage * (1 - mitigation)) / commonAtkTime;
  result.attack.total_damage.mag = commonDamage * (1 - mitigation);

  switch (skillKey) {
    case "skchr_amiya2_1": {
      break;
    }
    case "skchr_amiya2_2": {
      const killCount = input.charInput.charSpec.find((spec) => spec.label === "击败敌人数")?.value ?? 0;
      const maxStack = 3;
      let stackCount = 0;
      if (stackCount < maxStack) {
        stackCount += killCount;
        stackCount = Math.min(stackCount, maxStack);
      }

      const talentScale = getTalentScale(input.charInput);
      const skillTalentBonus = talentScale; // 技能期间天赋效果加倍，额外补一次
      const stackAtkBonus = 0.4 * stackCount;

      const skillAtkMul = 1 + atkBuffInMul + skillTalentBonus + stackAtkBonus;
      const skillAtk = ((atk + atkBuffInAdd) * skillAtkMul + atkBuffFinalAdd) * atkBuffFinalMul;

      const hitScale = 2.2;
      const finalHitScale = 4.4;

      const hitDamageMag =
        Math.max(skillAtk * hitScale * (1 - enemyMagRes / 100), skillAtk * hitScale * 0.05) *
        damage_scale *
        damage_scale_mag;
      const finalHitDamagePure = skillAtk * finalHitScale * damage_scale * damage_scale_pure;

      const hitCount = 10;
      const normalHitCount = hitCount - 1;

      const normalHitTotal = hitDamageMag * normalHitCount;
      const finalHitTotal = finalHitDamagePure;

      const skillTotalDamageMag = normalHitTotal;
      const skillTotalDamagePure = finalHitTotal;

      const skillKeepTime = 35.0; // 技能持续时间
      const slashTime = 3.2;
      const normalKeepTime = Math.max(skillKeepTime - slashTime, 0);
      const normalHit = Math.ceil(normalKeepTime / commonAtkTime);
      const normalHitDamage = skillAtk * damage_scale * damage_scale_pure;
      const normalTotalDamage = normalHitDamage * normalHit * (1 - mitigation);

      // 回转与普攻期伤害
      const skillSp = 20;
      const spInitial = 0;
      const baseSpRecoveryPerSec = input.charInput.attribute.spRecoveryPerSec ?? 1 + spBuffAdd;

      let skillRecoveryTime = 0;
      let commonHit = 0;
      if (baseSpRecoveryPerSec > 0) {
        skillRecoveryTime = skillSp / baseSpRecoveryPerSec;
        commonHit = Math.ceil(skillRecoveryTime / commonAtkTime);
      }

      const commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      const cycleTime = skillRecoveryTime + skillKeepTime;

      result.skill.dph = skillAtk * hitScale;
      result.skill.total_damage.mag = skillTotalDamageMag * (1 - mitigation);
      result.skill.total_damage.pure = skillTotalDamagePure * (1 - mitigation) + normalTotalDamage;
      result.skill.dps.mag = result.skill.total_damage.mag / skillKeepTime;
      result.skill.dps.pure = result.skill.total_damage.pure / skillKeepTime;

      result.cycle.total_damage.mag = commonTotalDamage + result.skill.total_damage.mag;
      result.cycle.total_damage.pure = result.skill.total_damage.pure;
      result.cycle.dps.mag = result.cycle.total_damage.mag / cycleTime;
      result.cycle.dps.pure = result.cycle.total_damage.pure / cycleTime;
      break;
    }
  }

  return result;
}

/** 近卫阿米娅技能应用 */
export function applySkill(input: { charInput: CharInput }, context: BuffContext) {
  if (input.charInput.skillKey !== "skchr_amiya2_2") return;
  const talentScale = getTalentScale(input.charInput);
  context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(talentScale, "天赋加倍"));
  context.in_game_buff_mul.def.addChild(new NumericLiteralNode(talentScale, "天赋加倍"));
}

/** 近卫阿米娅天赋应用 */
export function applyTalent(input: { charInput: CharInput }, context: BuffContext) {
  const talentScale = getTalentScale(input.charInput);
  context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(talentScale, "天赋"));
  context.in_game_buff_mul.def.addChild(new NumericLiteralNode(talentScale, "天赋"));
}

export const charSpecConfigs = {
  default: [
    {
      type: "select",
      label: "击败敌人数",
      desc: "技能2期间击败敌人数，获得攻击力+40%（最多3层）",
      unlockCondition: {
        phase: 0,
        level: 1,
      },
      requiredPotentialRank: 0,
      options: Array(4)
        .fill(0)
        .map((_, index) => ({
          key: `${index}个`,
          value: index,
        })),
      apply: (key: string, value: number, active: boolean) => {
        return {
          active,
          label: "击败敌人数",
          key: key,
          value: value,
          blackboard: [],
        };
      },
    },
  ],
};
