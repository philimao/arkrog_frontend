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
    const charge = 1;
    const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();
    const fire = 0;//烟花手，脚本只需获取是否有该藏品

    const commonDPH = (atk * (1 + atkBuffIn) + atkBuffExtra);
    const commonDamage =
        Math.max(commonDPH - enemyDef, commonDPH * 0.05) *
        (1 + vulnD) *
        (1 - mitigation);
    const atkTime = Math.round(3000.0 / atkSpeed);
    const fireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) *
        (1 + vulnD) *
        (1 - mitigation);
    result.attack.dph = commonDPH;
    if (fire) {
        result.attack.dps.phy = (commonDamage + fireDamage * 0.25) * 30 / atkTime;
    }
    else {
        result.attack.dps.phy = (commonDamage * 30) / atkTime;
    }

    switch (skillKey) {
        case "skchr_archetto_1": {
            break;
        }
        case "skchr_archetto_2": {
            break;
        }
        case "skchr_archetto_3": {
            const skillBuffIn = 0.5 + 0.3;//集成战略模组加成+专三数值
            const skillDph = (atk * (1 + skillBuffIn + atkBuffIn) + atkBuffExtra);
            const skillHit = Math.floor(600.0 / atkTime) * 3;
            const commonHit = Math.ceil((30.0 * atkSpeed) / 40.0 + atkSpeed);//仅考虑天赋，默认从0开始计时
            const skillDamage =
                Math.max(skillDph - enemyDef, skillDph * 0.05) *
                (1 + vulnD) *
                (1 - mitigation);
            const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) *
                (1 + vulnD) *
                (1 - mitigation);
            var commonTotalDamage = commonDamage * commonHit;
            var skillTotalDamage = skillDamage * skillHit;
            if (fire) {
                commonTotalDamage += fireDamage * commonHit * 0.25;
                skillTotalDamage += skillFireDamage * skillHit * 0.25;
            }
            result.skill.dph = skillDph;
            result.skill.dps.phy = skillTotalDamage / 20;
            result.cycle.dps.phy =
                ((skillTotalDamage + commonDamage * commonHit) * 30) / (600 + atkTime * commonHit);
            result.skill.total_damage.phy = skillTotalDamage;
            result.cycle.total_damage.phy =
                skillTotalDamage + commonDamage * commonHit;
            break;
        }
    }

    return result;
}

// 注册空弦伤害计算器
registerCalculatorImpl("Archetto", Archetto);