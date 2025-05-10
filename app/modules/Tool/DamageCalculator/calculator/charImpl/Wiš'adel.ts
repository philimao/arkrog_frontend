import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

// 二技能的单次总伤模拟
function cal_Wisadel_sim(
  atkBuffIn: number,
  atkBuffExtra: number,
  atk: number,
  atkSpeed: number,
  enemyDef: number,
  mitigation: number,
  vulnD: number,
  charge: number,
): number {
  let totalDamage = 0.0; // 输出的技能结果
  const skillDPH = (atk * (1.35 + atkBuffIn) + atkBuffExtra) * 1.25; // 过载前dph
  const skillDamage = Math.max(skillDPH - enemyDef, 0.05 * skillDPH); // 主攻击伤害
  const skillExDamage = Math.max(skillDPH * 0.5 - enemyDef, 0.05 * skillDPH); // 余震伤害
  const skillDPHOL = atk * (1.35 + atkBuffIn) + atkBuffExtra; // 过载
  const skillDamageOL = Math.max(skillDPHOL - enemyDef, 0.05 * skillDPHOL);
  const skillExDamageOL = Math.max(
    skillDPHOL * 0.5 - enemyDef,
    0.05 * skillDPHOL,
  );
  const skillTalentDamage = Math.max(
    (atk * (1.35 + atkBuffIn) + atkBuffExtra) * 1.85 - enemyDef,
    (atk * (1.35 + atkBuffIn) + atkBuffExtra) * 1.85 * 0.05,
  ); // 普攻天赋伤害
  const skillAtkTime = Math.round(4200.0 / atkSpeed);
  const skillHit = Math.floor(365.0 / skillAtkTime);
  const skillHitOL = Math.floor(370.0 / skillAtkTime);

  let damage =
    skillDamage * skillHit +
    skillExDamage * 2 * skillHit * (1 + vulnD) * (1 - mitigation);
  let damageOL =
    skillDamageOL * skillHitOL * 4 +
    skillExDamageOL * 8 * skillHitOL * (1 + vulnD) * (1 - mitigation);

  for (let i = 0; i < skillHit; ++i) {
    let hit = true;
    for (let j = 0; j < 2; ++j) {
      const random = Math.floor(Math.random() * 100) + 1; // 1 to 100
      if (random < 16) {
        damage += skillTalentDamage;
        hit = false;
        break;
      }
    }
  }

  for (let i = 0; i < skillHitOL; ++i) {
    let hit = true;
    for (let j = 0; j < 8; ++j) {
      const random = Math.floor(Math.random() * 100) + 1;
      if (random < 16) {
        damageOL += skillTalentDamage;
        hit = false;
        break;
      }
    }
  }

  totalDamage = damage + damageOL;

  return totalDamage;
}

/** 维什戴尔伤害计算器 */
export function Wisdel(input: CalculatorInput): CalculatorOutput {
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const atkBuffIn = input.charInput.charsBuffInGame.atk;
  const atkBuffExtra = 0; // 额外加攻，demo版不需要
  const atk = input.charInput.attribute.atk;
  const atkSpeed = input.charInput.attribute.attackSpeed;
  const skillKey = input.charInput.skillKey;
  const enemyDef = input.enemyInput.def;
  const mitigation = input.enemyInput.damageHitratePhysical || 0;
  const vulnD = 0;
  const charge = 1;

  const commonDPH = (atk * (1 + atkBuffIn) + atkBuffExtra) * 1.25; // 1.25是3级模组的攻击倍率
  const commonDamage = Math.max(commonDPH - enemyDef, 0.05 * commonDPH); // 主攻击伤害
  const commonExDamage = Math.max(commonDPH * 0.5 - enemyDef, 0.05 * commonDPH); // 余震伤害
  const talentDamage = Math.max(
    (atk * (1 + atkBuffIn) + atkBuffExtra) * 1.85 - enemyDef,
    (atk * (1 + atkBuffIn) + atkBuffExtra) * 1.85 * 0.05,
  ); // 普攻天赋伤害
  const atkTime = Math.round(6300 / atkSpeed);
  result.attack.dps.phy =
    ((commonDamage + 2 * commonExDamage + 0.15 * talentDamage) *
      (1 + vulnD) *
      (1 - mitigation) *
      30) /
    atkTime;

  switch (skillKey) {
    case "skchr_wisdel_1": {
      break;
    }
    case "skchr_wisdel_2": {
      // 二技能
      const iterations = 10000;
      let totalDamage = 0.0;
      let min_damage = Infinity;
      let max_damage = -Infinity;
      const commonHit = Math.floor(750.0 / atkTime);
      const chargeTime = Math.round(750.0 / charge);

      for (let i = 0; i < iterations; ++i) {
        const simDamage = cal_Wisadel_sim(
          atkBuffIn,
          atkBuffExtra,
          atk,
          atkSpeed,
          enemyDef,
          mitigation,
          vulnD,
          charge,
        );

        totalDamage += simDamage;
        if (simDamage < min_damage) {
          min_damage = simDamage;
        }
        if (simDamage > max_damage) {
          max_damage = simDamage;
        }
      }
      result.skill.total_damage.phy = totalDamage / iterations;
      result.skill.dps.phy = result.skill.total_damage.phy / 25;
      result.cycle.total_damage.phy =
        commonDamage * commonHit * (1 + vulnD) * (1 - mitigation) +
        totalDamage / iterations;
      result.cycle.dps.phy =
        (result.cycle.total_damage.phy * 30) / (chargeTime + 750);
      break;
    }
    case "skchr_wisdel_3": {
      break;
    }
  }

  return result;
}

// 注册维什戴尔伤害计算器
registerCalculatorImpl("Wiš'adel", Wisdel);
