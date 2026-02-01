import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import type { CharInput } from "~/stores/damageCalculator/calcTypes";
import type { BuffContext } from "../../buff-context";
import { CalculatorHelper } from "../../helper";

/** 咒愈阿米娅伤害计算器 */
export default function MedicAmiya(input: CalculatorInput): CalculatorOutput {
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

  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage =
    Math.max(commonDPH * (1 - enemyMagRes / 100), commonDPH * 0.05) * damage_scale * damage_scale_mag;

  const atkSpeed = Math.min(100 + atkSpeedBuff, 600); // 攻击速度
  const commonAtkTimeBase = 1.6; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻间隔(帧)
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻间隔(秒)

  result.attack.dph = commonDPH;
  result.attack.dps.mag = (commonDamage * (1 - mitigation)) / commonAtkTime;
  result.attack.total_damage.mag = commonDamage * (1 - mitigation);

  switch (skillKey) {
    case "skchr_amiya3_1": {
      break;
    }
    case "skchr_amiya3_2": {
      const firstHitTargetCount =
        input.charInput.charSpec.find((spec) => spec.label === "首击命中敌人数")?.value ?? 1;
      const maxStack = 5;
      let stackCount = 0;
      if (stackCount < maxStack) {
        stackCount += firstHitTargetCount;
        stackCount = Math.min(stackCount, maxStack);
      }

      // 首击：攻击力+30%*N，攻击力200%法术伤害
      const firstHitTime = 1.0;
      const firstHitAtkMul = 1 + atkBuffInMul + 0.3 * stackCount;
      const firstHitAtk = (atk + atkBuffInAdd) * firstHitAtkMul * atkBuffFinalMul + atkBuffFinalAdd;
      const firstHitDph = firstHitAtk * 2.0;
      const firstHitDamage =
        Math.max(firstHitDph * (1 - enemyMagRes / 100), firstHitDph * 0.05) * damage_scale * damage_scale_mag;
      const firstHitTotalDamage = firstHitDamage * (1 - mitigation);

      // 技能后续：真伤普通攻击
      const skillAtkMul = 1 + atkBuffInMul + 0.3 * stackCount;
      const skillAtk = ((atk + atkBuffInAdd) * skillAtkMul + atkBuffFinalAdd) * atkBuffFinalMul;
      const skillDph = skillAtk;
      const skillDamage = skillDph * damage_scale * damage_scale_pure;

      const skillKeepTime = 32.0; // 技能持续时间
      const normalKeepTime = Math.max(skillKeepTime - firstHitTime, 0);
      const skillHit = Math.ceil(normalKeepTime / commonAtkTime); // 技能攻击次数

      const skillTotalDamage = skillDamage * skillHit * (1 - mitigation);

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

      result.skill.dph = Math.max(firstHitDph, skillDph);
      result.skill.total_damage.mag = firstHitTotalDamage;
      result.skill.total_damage.pure = skillTotalDamage;
      result.skill.dps.mag = firstHitTotalDamage / skillKeepTime;
      result.skill.dps.pure = skillTotalDamage / skillKeepTime;

      result.cycle.total_damage.mag = commonTotalDamage + firstHitTotalDamage;
      result.cycle.total_damage.pure = skillTotalDamage;
      result.cycle.dps.mag = result.cycle.total_damage.mag / cycleTime;
      result.cycle.dps.pure = result.cycle.total_damage.pure / cycleTime;
      break;
    }
  }

  return result;
}



export const charSpecConfigs = {
  default: [
    {
      type: "select",
      label: "首击命中敌人数",
      desc: "技能2首击命中敌人数，用于计算攻击力+30%叠加层数（最多5层）",
      unlockCondition: {
        phase: 0,
        level: 1,
      },
      requiredPotentialRank: 0,
      options: Array(5)
        .fill(0)
        .map((_, index) => ({
          key: `${index + 1}个`,
          value: index + 1,
        })),
      apply: (key: string, value: number, active: boolean) => {
        return {
          active,
          label: "首击命中敌人数",
          key: key,
          value: value,
          blackboard: [],
        };
      },
    },
  ],
};
