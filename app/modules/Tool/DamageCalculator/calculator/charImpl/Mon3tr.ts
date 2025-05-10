import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** Mon3tr伤害计算器 */
export function Mon3tr(input: CalculatorInput): CalculatorOutput {
  const atkBuffIn = input.charInput.charsBuffInGame.atk;
  const atkBuffExtra = 0;
  const atk = input.charInput.attribute.atk;
  const atkSpeed = input.charInput.attribute.attackSpeed;
  const skillKey = input.charInput.skillKey;
  const vulnR = 0;

  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const commonHPH = atk * (1 + atkBuffIn) + atkBuffExtra; // 普攻hph
  const atkTime = Math.round(8700 / atkSpeed); // 普攻攻击间隔
  // result.attack.dps.phy = commonHPH / atkTime;

  switch (skillKey) {
    case "skchr_monstr_1": {
      break;
    }
    case "skchr_monstr_2": {
      break;
    }
    case "skchr_monstr_3": {
      // 三技能
      const skillDamage =
        (atk * (4.3 + atkBuffIn) + atkBuffExtra) * (1 + vulnR); // 技能dph
      const skillAtkTime = Math.round(4200.0 / atkSpeed); // 技能攻击间隔
      const skillHit = Math.floor(750.0 / skillAtkTime); // 技能期hit数
      const commonHit = 14; // 普攻hit数
      const chargeTime = 14 * atkTime;
      const totalDamage = skillDamage * skillHit; // 技能总伤

      result.skill.dps.pure = totalDamage / 25.0;
      result.skill.total_damage.pure = totalDamage;
      result.cycle.dps.pure = (totalDamage * 30) / (chargeTime + 750);
      result.cycle.total_damage.pure = totalDamage;
      break;
    }
  }

  return result;
}

// 注册Mon3tr伤害计算器
registerCalculatorImpl("Mon3tr", Mon3tr);
