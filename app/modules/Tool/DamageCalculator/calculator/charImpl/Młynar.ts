import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

/** 玛恩纳伤害计算器 */
export function Młynar(input: CalculatorInput): CalculatorOutput {
    // 干员养成加成
    let context = CalculatorHelper.analyzeChar({
        charInput: input.charInput,
        charData: input.charData,
    });

    // 生成藏品加成
    context = CalculatorHelper.analyzeRelics(
        {
            charInput: input.charInput,
            charData: input.charData,
            relics: input.relics,
            enemyInput: input.enemyInput,
        },
        context,
    );

    // 获取局内buff
    const atkBuffInAdd = context.in_game_buff_final_add.atk; // 攻击力直接加算
    const atkBuffInMul = context.in_game_buff_mul.atk - 1; // 攻击力直接乘算
    const atkBuffFinalAdd = context.in_game_buff_final_add.atk; // 攻击最终加算
    const atkBuffFinalMul = context.in_game_buff_final_mul.atk; // 攻击最终乘算
    const damage_scale = context.global_buff_stack.damage_scale; // 通用增伤总倍率
    const damage_scale_phy = context.global_buff_stack.damage_scale_phy; // 物理增伤总倍率
    const damage_scale_mag = context.global_buff_stack.damage_scale_mag; // 法术增伤总倍率
    const damage_scale_pure = context.global_buff_stack.damage_scale_pure; // 真伤增伤总倍率
    const damage_scale_EP = context.in_game_buff_final_mul.enemy_damage_scale_ep;//元素损伤易伤

    const atkSpeedBuff = context.in_game_buff_add.attack_speed + context.relic_rune_add.attack_speed; // 额外攻击速度
    const spBuffAdd = context.in_game_buff_add.sp_recovery_per_sec; // 额外技力回复速度

    // 通过 calculateOutsidePanel 获取面板属性
    const outsidePanel = CalculatorHelper.calculateOutsidePanel({
        charInput: input.charInput,
        context,
    });

    const atk = input.charInput.attribute?.atk; // 局外攻击力
    const skillKey = input.charInput.skillKey; // 技能key
    const mitigation = 1 - context.in_game_buff_final_mul.enemy_damage_resistance_inf; // 敌人减伤
    const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

    const enemyDef = input.enemyInput.attributes.def; // 敌人防御

    const atkSpeed = 100 + atkSpeedBuff; // 攻击速度
    const commonAtkTimeBase = 1.2; // 普攻基础时间
    const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻间隔(帧)
    const commonAtkTime = commonAtkFrame / 30.0; // 普攻间隔(秒)

    switch (skillKey) {
        case "skchr_mlynar_1": {
            break;
        }
        case "skchr_mlynar_2": {
            break;
        }
        case "skchr_mlynar_3": {
            let skillBuffIn = 4.0; // 技能加攻
            const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffInAdd) * 1.8 * 1.23 * atkBuffFinalMul;
            const skillDphPure = skillDph * 0.12 / (1.8 * 1.23);
            const skillDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;

            const skillAtkTimeBase = 1.2; // 技能基础攻击间隔
            const skillAtkFrame = Math.round((skillAtkTimeBase * 3000.0) / atkSpeed); // 技能攻击间隔帧
            const skillAtkTime = skillAtkFrame / 30.0; // 技能攻击间隔时间

            const spInitial = 0; // 藏品初始技力
            const skillSp = 42.0;
            const skillKeepTime = 28.0; // 技能持续时间
            const skillRecoveryTime = skillSp / (1 + spBuffAdd); // 技能期望回转

            const skillHit = skillKeepTime / skillAtkTime; // 技能期望普攻次数

            let skillTotalDamage = skillDamage * skillHit * (1 - mitigation);
            let skillTotalDamagePure = skillDphPure * skillHit * damage_scale_pure;

            result.skill.dph = skillDph;
            result.skill.dps.phy = skillTotalDamage / skillKeepTime;
            result.skill.dps.pure = skillTotalDamagePure / skillKeepTime;
            result.cycle.dps.phy = skillTotalDamage / (skillKeepTime + skillRecoveryTime);
            result.cycle.dps.pure = skillTotalDamagePure / (skillKeepTime + skillRecoveryTime);
            result.skill.total_damage.phy = skillTotalDamage;
            result.skill.total_damage.pure = skillTotalDamagePure;
            result.cycle.total_damage.phy = skillTotalDamage;
            result.cycle.total_damage.pure = skillTotalDamagePure;
            break;
        }
    }

    return result;
}

// 注册玛恩纳伤害计算器
registerCalculatorImpl("Młynar", Młynar);