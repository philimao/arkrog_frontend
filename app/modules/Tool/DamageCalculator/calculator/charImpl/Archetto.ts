import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 空弦伤害计算器 */
export function Archetto(input: CalculatorInput): CalculatorOutput {
    
    const atkBuffIn = input.charInput.charsBuffInGame.atk; // 局内加攻
    const atkBuffExtra = 0; // 额外加攻，demo版不需要
    const atk = input.charInput.attribute.atk; // 攻击力(计算局外后)
    
    const skillKey = input.charInput.skillKey;
    const mitigation = input.enemyInput.damageHitratePhysical || 0;  // 闪避?减伤?
    const vulnD = 0;  // 物理易伤
    const charge = 1;
    const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();
    const fire: boolean = input.relics.find((r) => r.name === "烟花之手") !== undefined;; //烟花手，脚本只需获取是否有该藏品

    const enemyDef = input.enemyInput.def;

    const commonDPH = (atk * (1 + atkBuffIn) + atkBuffExtra);
    const commonDamage =
        Math.max(commonDPH - enemyDef, commonDPH * 0.05) *
        (1 + vulnD);
    const fireDamage = Math.max(2 * commonDPH - enemyDef, commonDPH * 2 * 0.05) *
        (1 + vulnD) *
        (1 - mitigation);
    result.attack.dph = commonDPH;

    const atkSpeed = input.charInput.attribute.attackSpeed; 
    const commonAtkFrame = Math.round(3000.0 / atkSpeed); // 普攻帧数
    const commonAtkTime = commonAtkFrame / 30.0; // 普攻时间
    
    if (fire) {
        result.attack.dps.phy = 
        (commonDamage + fireDamage * 0.25) * 30 / commonAtkTime * (1 - mitigation);
    }
    else {
        result.attack.dps.phy = (commonDamage * 30) / commonAtkTime;
    }

    switch (skillKey) {
        case "skchr_archet_1": {
            const skillBuffIn = 0.5;  // 局内总加攻(含技能天赋)
            const skillDph = (atk * (1 + skillBuffIn + atkBuffIn) + atkBuffExtra) * 2.3;
            const skillDamage =
                Math.max(skillDph - enemyDef, skillDph * 0.05) *
                (1 + vulnD);
            const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) *
                (1 + vulnD) ;

            const commonHit = 3.0 / (atkSpeed / 100 + 0.4) * (atkSpeed / 100); // 期望普攻次数, 不考虑天赋全程吃阻回的情况

            var commonTotalDamage = commonDamage * commonHit;
            var skillTotalDamage = skillDamage;

            if (fire) {
                commonTotalDamage += fireDamage * commonHit * 0.25;
                skillTotalDamage += skillFireDamage * 0.25;
            }

            result.skill.dph = skillDph;
            result.skill.dps.phy = skillTotalDamage / (commonAtkTime * (commonHit + 1)) * (1 - mitigation);
            result.cycle.dps.phy =
                (skillTotalDamage + commonTotalDamage * commonHit) / (commonAtkTime * (commonHit + 1)) * (1 - mitigation);
            result.skill.total_damage.phy = skillTotalDamage;
            result.cycle.total_damage.phy =
                skillTotalDamage + commonTotalDamage;
            break;
        }
        case "skchr_archet_2": {
            /*技能好就开,仅计算主目标伤害*/
            const skillBuffIn = 0.5;  // 局内总加攻(含技能天赋)
            const skillDph = (atk * (1 + skillBuffIn + atkBuffIn) + atkBuffExtra) * 1.4;
            const skillDamage =
                Math.max(skillDph - enemyDef, skillDph * 0.05) *
                (1 + vulnD);
            const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) *
                (1 + vulnD) ;

            const commonHit = 9.0 / (atkSpeed / 100 + 0.4) * (atkSpeed / 100); // 期望普攻次数, 不考虑天赋全程吃阻回的情况

            var commonTotalDamage = commonDamage * commonHit;
            var skillTotalDamage = skillDamage * 5;

            if (fire) {
                commonTotalDamage += fireDamage * commonHit * 0.25;
                skillTotalDamage += skillFireDamage * 0.25;
            }

            result.skill.dph = skillDph;
            result.skill.dps.phy = skillTotalDamage / (commonAtkTime * (commonHit + 1)) * (1 - mitigation);
            result.cycle.dps.phy =
                (skillTotalDamage + commonTotalDamage * commonHit) / (commonAtkTime * (commonHit + 1)) * (1 - mitigation);
            result.skill.total_damage.phy = skillTotalDamage;
            result.cycle.total_damage.phy =
                skillTotalDamage + commonTotalDamage;
            break;
        }
        case "skchr_archet_3": {
            const skillBuffIn = 0.5 + 0.3;//集成战略模组加成+专三数值
            const skillDph = (atk * (1 + skillBuffIn + atkBuffIn) + atkBuffExtra);
            const skillDamage =
                Math.max(skillDph - enemyDef, skillDph * 0.05) *
                (1 + vulnD) *
                (1 - mitigation);
            const skillFireDamage = Math.max(skillDph * 2 - enemyDef, skillDph * 2 * 0.05) *
                (1 + vulnD) *
                (1 - mitigation);

            const skillAtkTime = commonAtkTime
            const skillHit = Math.floor(20.0 / skillAtkTime) * 3;
            const commonHit = 30.0 / (atkSpeed / 100 + 0.4) * (atkSpeed / 100); // 仅考虑天赋，默认从0开始计时

            var commonTotalDamage = commonDamage * commonHit;
            var skillTotalDamage = skillDamage * skillHit;

            if (fire) {
                commonTotalDamage += fireDamage * commonHit * 0.25;
                skillTotalDamage += skillFireDamage * skillHit * 0.25;
            }

            result.skill.dph = skillDph;
            result.skill.dps.phy = skillTotalDamage / 20.0;
            result.cycle.dps.phy =
                (skillTotalDamage + commonTotalDamage) / (20.0 + commonAtkTime * commonHit);
            result.skill.total_damage.phy = skillTotalDamage;
            result.cycle.total_damage.phy =
                skillTotalDamage + commonTotalDamage;
            break;
        }
    }

    return result;
}

// 注册空弦伤害计算器
registerCalculatorImpl("Archetto", Archetto);