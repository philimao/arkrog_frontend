import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 维娜·维多利亚伤害计算器 */
export function Vina_Victoria(input: CalculatorInput): CalculatorOutput {
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const atkBuffIn = input.charInput.charsBuffInGame.atk;
  const atkBuffExtra = 0; // 额外加攻，demo版不需要
  const atk = input.charInput.attribute.atk;
  const atkSpeed = input.charInput.attribute.attackSpeed;
  const skillKey = input.charInput.skillKey;
  const enemyMR = input.enemyInput.magicResistance;
  const mitigation = input.enemyInput.damageHitrateMagical || 0;
  const vulnR = 0;
  const charge = 1;

  const commonDamage =
    (atk * (1 + atkBuffIn) + atkBuffExtra) * (1 - enemyMR) * (1 - mitigation); // 普攻dph
  const atkTime = Math.round(3800 / atkSpeed); // 普攻攻击间隔
  result.attack.dps.phy = (commonDamage * 30) / atkTime;

  switch (skillKey) {
    case "skchr_siege2_1": {
      break;
    }
    case "skchr_siege2_2": {
      break;
    }
    case "skchr_siege2_3": {
      // 三技能
      const skillDamage =
        (atk * (2.9 + atkBuffIn) + atkBuffExtra) * (1 + vulnR); // 技能dph
      const skillAtkTime = Math.round(3000 / atkSpeed); // 技能攻击间隔
      const skillHit = Math.floor(750 / skillAtkTime); // 技能期hit数
      const commonHit = Math.floor(1500 / (atkTime * charge)); // 普攻hit数
      const chargeTime = Math.round(1500 / charge); // 技能回转
      const totalDamage = skillDamage * skillHit; // 技能总伤

      result.skill.dps.pure = totalDamage / 25.0;
      result.skill.total_damage.pure = totalDamage;
      result.cycle.dps.mag =
        (commonDamage * commonHit * 30) / (chargeTime + 750);
      result.cycle.dps.pure = (totalDamage * 30) / (chargeTime + 750);
      result.cycle.total_damage.mag = commonDamage * commonHit;
      result.cycle.total_damage.pure = totalDamage;
      break;
    }
  }

  return result;
}

// 注册维娜·维多利亚伤害计算器
registerCalculatorImpl("Vina Victoria", Vina_Victoria);
