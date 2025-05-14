import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 赫德雷伤害计算器 */
export function Archetto(input: CalculatorInput): CalculatorOutput {
    const atkBuffIn = input.charInput.charsBuffInGame.atk;
    const atkBuffExtra = 0; // 额外加攻，demo版不需要
    const atk = input.charInput.attribute.atk;
    const atkSpeed = input.charInput.attribute.attackSpeed;
    const skillKey = input.charInput.skillKey;
    const enemyDef = input.enemyInput.def;
    const mitigation = input.enemyInput.damageHitratePhysical || 0;
    const vulnD = 0;
    const vulnR = 0;
    const charge = 1;
    const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

    const commonDPH = (atk * (1 + atkBuffIn) + atkBuffExtra) * 1.1;
    const commonDamage =
        Math.max(commonDPH - enemyDef, commonDPH * 0.05) *
        (1 + vulnD) *
        (1 - mitigation) *
        1.1;
    const atkTime = Math.round(7500.0 / atkSpeed);
    result.attack.dph = commonDPH;
    result.attack.dps.phy = (commonDamage * 30) / atkTime;

    switch (skillKey) {
        case "skchr_hodrer_1": {
            const skillDph = commonDPH * 2.6;
            const skillDamage =
                Math.max(skillDph - enemyDef, skillDph * 0.05) *
                (1 + vulnD) *
                (1 - mitigation) *
                1.1;
            const cycleDamage = commonDamage * 2 + skillDamage;
            result.skill.dph = skillDph;
            result.skill.dps.phy = (skillDamage * 30) / atkTime;
            result.skill.total_damage.phy = skillDamage;
            result.cycle.dps.phy = (cycleDamage * 30) / (3 * atkTime);
            result.cycle.total_damage.phy = cycleDamage;
            break;
        }
        case "skchr_hodrer_2": {
            break;
        }
        case "skchr_hodrer_3": {
            const skillDph = (atk * (1 + 1.2 + atkBuffIn) + atkBuffExtra) * 1.1;
            const skillHit = Math.floor(2100.0 / atkTime);
            const commonHit = Math.floor((1500.0 / atkTime) * charge);
            const skillDamage =
                Math.max(skillDph - enemyDef, skillDph * 0.05) *
                (1 + vulnD) *
                (1 - mitigation) *
                1.1;
            const skillTotalDamage = skillDamage * skillHit;
            const chargeTime = 1500 / charge;
            result.skill.dph = skillDph;
            result.skill.dps.pure = 200;
            result.skill.dps.phy = skillTotalDamage / 70;
            result.cycle.dps.pure = 420000.0 / (2100 + chargeTime);
            result.cycle.dps.phy =
                ((skillTotalDamage + commonDamage * commonHit) * 30) /
                (2100 + chargeTime);
            result.skill.total_damage.phy = skillTotalDamage;
            result.cycle.total_damage.phy =
                skillTotalDamage + commonDamage * commonHit;
            result.cycle.total_damage.pure = 14000;
            result.skill.total_damage.pure = 14000;
            break;
        }
    }

    return result;
}

// 注册赫德雷伤害计算器
registerCalculatorImpl("Archetto", Archetto);