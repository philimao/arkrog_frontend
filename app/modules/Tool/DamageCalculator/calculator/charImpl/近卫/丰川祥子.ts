import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import type { CharInput } from "~/stores/damageCalculator/calcTypes";
import { CalculatorHelper } from "../../helper";
import type { BuffContext } from "../../buff-context";
import { type ApplyTalentFC, type CalculatorImpl, getByKeySafe } from "../../impls";
import { NumericLiteralNode } from "../../ast";

/** 丰川祥子伤害计算器 */
export const calculator: CalculatorImpl = (input: CalculatorInput): CalculatorOutput => {
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

    /** 攻击速度 */
    const atkSpeedBuff =
        context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate(); // 额外攻击速度

    /** 获取局外面板 */
    const outsidePanel = CalculatorHelper.calculateOutsidePanel({
        charInput: input.charInput,
        context,
    });

    /** 局外攻击力 */
    const atk = outsidePanel.atk;
    /** 技能key */
    const skillKey = input.charInput.skillKey;
    /** 技能等级 */
    const skillLevel = input.charInput.skillLevel;
    /** 潜能等级 */
    const potential = input.charInput.potential;
    /** 模组ID */
    const uniEquipId = input.charInput.uniEquipId;
    /** 模组等级 */
    const uniEquipLevel = input.charInput.uniEquipLevel;
    /** 敌人减伤 */
    const mitigation =
        1 -
        (1 - context.in_game_buff_final_mul.enemy_damage_resistance.calculate()) *
        (1 - context.relic_rune_mul.enemy_damage_resistance.calculate());

    /** 创建计算结果 */
    const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

    /** 敌人防御 */
    const enemyDef = input.enemyInput.attributes.def;

    /** 敌人法抗 */
    const enemyMagRes = input.enemyInput.attributes.magicResistance;
    // 基础攻击间隔和前摇
    const baseAttackFrame = 39;
    const baseAttackPre = 9;
    // 攻击速度
    const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
    let atkFrame = Math.round((baseAttackFrame * 100.0) / totalAttackSpeed);
    const commonCoolFrame = Math.ceil((baseAttackFrame * 100.0) / totalAttackSpeed);
    if (commonCoolFrame > atkFrame) {
        atkFrame = commonCoolFrame + 1;
    }
    const atkFramePre = Math.round((baseAttackPre * 100.0) / totalAttackSpeed);
    const attackTime = atkFrame / 30.0;
    const attackPre = atkFramePre / 30.0;

    const normalAtk = (atk + atkBuffInAdd) * (1 + atkBuffInMul) * atkBuffFinalMul + atkBuffFinalAdd;
    const normalDph = normalAtk * 0.8;
    const normalCritDph = normalAtk;

    switch (skillKey) {
        case "skchr_svrash_1": {
            //注：当前仅计算满级技能的精确结果，普攻部分未考虑天赋穿透
            // 一技能 新月的苏醒
            const atkScales = [2.12, 2.33, 2.53, 2.76, 2.97, 3.17, 3.37, 3.60, 3.82, 4.22];
            const atkScale = atkScales[skillLevel];
            const spCosts = [5, 5, 5, 4, 4, 4, 4, 3, 3, 3];
            const spCost = spCosts[skillLevel];
            const duration = 20; // fever时间

            // 子弹倍率 (Rank III)
            const bulletScales = [1.00, 0.92, 0.75, 0.58, 0.42, 0.33, 0.17, 0.05];

            // 可配置变量
            const Bullets = Math.round(totalAttackSpeed / 100);
            const baseBullets = Bullets > 3 ? Bullets + 7 : Bullets; // 初始子弹数
            const resReductionPerBullet = 2.5; // 每颗子弹减抗百分比


            // 计算击数
            const normalHitCount = spCost;
            const skillHitCount = Math.ceil(duration / attackTime);

            // 技能期间倍率改变
            const skillAtkMul = 1 + atkBuffInMul;
            const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul * atkScale + atkBuffFinalAdd;
            const skillDph = skillAtk;

            // 普攻期望伤害
            let normalPhysicalDamage =
                Math.max(normalDph - enemyDef, 0.05 * normalDph) *
                damage_scale *
                damage_scale_phy;

            let skillMagDamage;
            let skillFeverDamage;

            // 仅在Rank III（技能等级9）时进行精确计算
            if (skillLevel === 9) {
                // 精确计算函数（考虑减抗）
                const bulletOrder = [0, 1, 2, 3, 4, 5, 6, 7]; // 1-8顺序

                let totalDamage = 0;
                let currentBullets = baseBullets + 8; // 初始子弹数

                for (let i = 0; i < bulletOrder.length; i++) {
                    const bulletIndex = bulletOrder[i];
                    const bulletScale = bulletScales[bulletIndex];

                    // 计算减抗效果
                    const maxReduction = 30; // 最大减抗百分比
                    const actualReduction = Math.min(resReductionPerBullet * currentBullets, maxReduction);
                    const effectiveRes = Math.max(enemyMagRes * (100 - actualReduction) / 100, 0);

                    // 技能期间倍率改变
                    const skillAtkMul = 1 + atkBuffInMul;
                    const bulletAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul * bulletScale + atkBuffFinalAdd;

                    // 计算伤害
                    const bulletDamage = bulletAtk * Math.max((1 - effectiveRes / 100), 0.05) *
                        damage_scale *
                        damage_scale_mag;

                    totalDamage += bulletDamage;

                    // 命中后子弹数减少
                    currentBullets--;
                }
                skillMagDamage = totalDamage;
                //这里暂时使用硬编码
                skillFeverDamage =
                    skillDph * Math.max((1 - enemyMagRes * 0.7 / 100), 0.05) *
                    damage_scale *
                    damage_scale_mag;

            } else {
                // 其他等级使用粗略计算（不考虑减抗）
                skillMagDamage =
                    skillDph * Math.max((1 - enemyMagRes / 100), 0.05) *
                    damage_scale *
                    damage_scale_mag;
                skillFeverDamage =
                    skillDph * Math.max((1 - enemyMagRes * 0.7 / 100), 0.05) *
                    damage_scale *
                    damage_scale_mag;
            }

            result.attack.dph = normalDph;
            result.attack.total_damage.phy = normalPhysicalDamage * normalHitCount * (1 - mitigation);
            result.attack.dps.phy = result.attack.total_damage.phy / (spCost * attackTime);

            result.skill.dph = skillDph;
            result.skill.total_damage.mag = skillFeverDamage * skillHitCount * (1 - mitigation);
            result.skill.dps.mag = result.skill.total_damage.mag / duration;

            // 周期伤害
            const totalCycleTime = spCost * attackTime + attackPre;
            result.cycle.total_damage.phy = result.attack.total_damage.phy;
            result.cycle.dps.phy = result.cycle.total_damage.phy / totalCycleTime;
            result.cycle.total_damage.mag = skillMagDamage * skillHitCount * (1 - mitigation);
            result.cycle.dps.mag = result.cycle.total_damage.mag / totalCycleTime;

            break;
        }
        case "skchr_svrash_2": {
            //当前输出钢琴dps和fever总伤，法伤仅输出fever总伤，分别对应普攻，周期，技能
            //当前未考虑减抗
            const atkScales = [0.4, 0.45, 0.50, 0.6, 0.65, 0.7, 0.75, 0.8, 0.95, 1.1];
            const skillAtkSpeeds = [60, 65, 70, 80, 90, 100, 110, 120, 130, 140];
            const atkScale = atkScales[skillLevel];
            const atkSpeedIncrease = skillAtkSpeeds[skillLevel];
            const duration = 20;

            const baseBullets = Math.round(totalAttackSpeed / 100);
            const baseMagBullets = Math.round((totalAttackSpeed + atkSpeedIncrease) / 100);
            const resReductionDefPerBullet = 5;// 每颗子弹减防百分比
            const resReductionMagPerBullet = 2.5; // 每颗子弹减法抗百分比

            // 技能期间攻击力提升
            const skillAtkMul = 1 + atkScale + atkBuffInMul;
            const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;
            const skillDph = skillAtk;
            const skillMagAtkMul = 1 + atkBuffInMul;
            const skillMagAtk = (atk + atkBuffInAdd) * skillMagAtkMul * atkBuffFinalMul + atkBuffFinalAdd;
            const skillMagDph = skillMagAtk;
            const skillAttackSpeed = Math.min(100 + atkSpeedBuff + atkSpeedIncrease, 600);
            let skillAtkFrame = Math.round((baseAttackFrame * 100.0) / skillAttackSpeed);
            const commonCoolFrame = Math.ceil((baseAttackFrame * 100.0) / skillAttackSpeed);
            if (commonCoolFrame > skillAtkFrame) {
                skillAtkFrame = commonCoolFrame + 1;
            }
            const skillAtkTime = skillAtkFrame / 30.0;

            // 技能期望伤害
            let skillPhysicalDamage =
                Math.max(skillDph - enemyDef, 0.05 * skillDph) *
                damage_scale *
                damage_scale_phy;
            let skillMagDamage = skillMagDph * Math.max((1 - enemyMagRes * 0.01), 0.05) *
                damage_scale *
                damage_scale_mag;

            // 计算击数
            const skillHitCount = Math.ceil(duration / attackTime) * 2;

            result.attack.dph = skillDph;
            result.attack.total_damage.phy = skillPhysicalDamage * (1 - mitigation);
            result.attack.dps.phy = result.attack.total_damage.phy / attackTime;

            result.skill.dph = skillMagDph;
            result.skill.total_damage.mag = skillMagDamage * (1 - mitigation);
            result.skill.dps.mag = result.skill.total_damage.mag / skillAtkTime;

            // 周期伤害
            result.cycle.total_damage.phy = result.attack.total_damage.phy * skillHitCount;
            result.cycle.dps.phy = result.cycle.total_damage.phy / duration;
            break;
        }
        case "skchr_svrash_3": {
        }
    }

    return result;
};

/** 丰川祥子技能应用 */
export function applySkill(input: { charInput: CharInput }, context: BuffContext) {
    const atk = getByKeySafe(input.charInput.skill.blackboard, "atk");
    if (atk) {
        context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value, "技能"));
    }
};
