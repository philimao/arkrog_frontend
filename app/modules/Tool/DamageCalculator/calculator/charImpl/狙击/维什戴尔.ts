import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";
import type { CharSpecConfig } from "~/stores/damageCalculator/calcTypes";


/** 维什戴尔伤害计算器 */
export default function Wisdel(input: CalculatorInput): CalculatorOutput {
  const context = input.buffContext;

  // 获取局内buff
  /** 攻击力直接加算 */
  const atkBuffInAdd = context.in_game_buff_add.atk.calculate();
  /** 攻击力直接乘算 */
  const atkBuffInMul = context.in_game_buff_mul.atk.calculate() - 1;
  /** 攻击最终乘算 */
  const atkBuffFinalMul = context.in_game_buff_final_mul.atk.calculate();
  /** 攻击最终加算 */
  const atkBuffFinalAdd = context.in_game_buff_final_add.atk.calculate();
  /** 通用增伤总倍率 */
  const damage_scale = context.global_buff_stack.damage_scale.calculate();
  /** 物理增伤总倍率 */
  const damage_scale_phy = context.global_buff_stack.damage_scale_phy.calculate();

  const atkSpeedBuff =
    context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate();

  // 通过 calculateOutsidePanel 获取面板属性
  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });

  const atk = outsidePanel.atk; // 局外攻击力
  const skillKey = input.charInput.skillKey; // 技能key
  const skillLevel = input.charInput.skillLevel; // 技能等级
  const phase = input.charInput.phaseLevel; // 精英化等级
  const potential = input.charInput.potential; // 潜能等级
  const uniEquipLevel = input.charInput.uniEquipLevel; // 模组等级
  const uniEquipId = input.charInput.uniEquipId; // 模组id
  const mitigation =
    1 -
    (1 - context.in_game_buff_final_mul.enemy_damage_resistance.calculate()) *
    (1 - context.relic_rune_mul.enemy_damage_resistance.calculate()); // 敌人减伤

  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const enemyDef = input.enemyInput.attributes.def; // 敌人防御
  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  // 基础攻击间隔
  const baseAttackTime = 2.1;

  // 模组特性判断
  const equipX = uniEquipId === "uniequip_002_wisdel";

  /** 天赋1：好礼 */
  let talent1MainAtkScale = phase === 2 ? 1.15 : 1;
  let talent1AoeAtkScale = 0;
  if (phase == 1) {
    talent1AoeAtkScale = 1.2;
  }
  else if (phase == 2) {
    talent1AoeAtkScale = 1.5;
  }
  if (equipX) {
    talent1MainAtkScale += uniEquipLevel * 0.05;
    talent1AoeAtkScale += 0.15 + uniEquipLevel * 0.05;
  }
  if (potential >= 4 && phase >= 1) {
    talent1AoeAtkScale += 0.1;
  }

  // 基础特性：投掷手 - 两次攻击（第二次为余震50%）-区分主副目标
  const dealPhysicalDamage = (atk: number, def: number, isShockwave: boolean, isMain: boolean, isTalent: boolean) => {
    let damage_scale = isShockwave ? 0.5 : 1;
    damage_scale *= isMain ? talent1MainAtkScale : 1;
    if (!isTalent) {
      return Math.max(atk * damage_scale - def, atk * damage_scale * 0.05);
    }
    else {
      damage_scale = talent1AoeAtkScale;
      return Math.max(atk * damage_scale - def, atk * damage_scale * 0.05);
    }
  };

  /** 局内加攻百分比 */
  const normalAtkMul = 1 + atkBuffInMul;
  /** 局内面板攻击力 */
  const normalAtk = (atk + atkBuffInAdd) * normalAtkMul * atkBuffFinalMul + atkBuffFinalAdd;

  /** 物理伤害（主目标） */
  let isMain = input.charInput.charSpec.find((spec) => spec.label === "攻击主目标" && spec.key === "是") ? true : false;
  const normalPhysicalDamage =
    (dealPhysicalDamage(normalAtk, enemyDef, false, isMain, false) +
      dealPhysicalDamage(normalAtk, enemyDef, true, isMain, false) * (equipX ? 2 : 1) + dealPhysicalDamage(normalAtk, enemyDef, false, isMain, true) * (equipX ? 0.2775 : 0.15)) *
    damage_scale *
    damage_scale_phy; // 普通+余震+期望暴击

  switch (skillKey) {
    case "skchr_wisdel_1": {

    }

    case "skchr_wisdel_2": {
      // 二技能：饱和复仇
      // 攻击间隔缩短，攻击力提升
      const atkScales = [0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.25, 0.28, 0.3, 0.35];
      const olAtkScales = [0.6, 0.6, 0.6, 0.65, 0.65, 0.65, 0.7, 0.75, 0.75, 0.8];
      const atkScale = atkScales[skillLevel];
      const olAtkScale = olAtkScales[skillLevel];
      const IntervalReduction = skillLevel >= 6 ? 0.7 : 0.5;

      // 技能期间攻击力
      const skillAtkMul = 1 + atkScale + atkBuffInMul;
      const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;
      const skillolAtk = skillAtk * olAtkScale;

      // 技能过载前
      const skillPhysicalDamage =
        (dealPhysicalDamage(skillAtk, enemyDef, false, isMain, false) +
          dealPhysicalDamage(skillAtk, enemyDef, true, isMain, false) * (equipX ? 2 : 1) +
          dealPhysicalDamage(skillAtk, enemyDef, false, isMain, true) * (equipX ? 0.2775 : 0.15)) *
        damage_scale *
        damage_scale_phy;
      // 技能过载后
      const skillOverloadPhysicalDamage =
        (dealPhysicalDamage(skillolAtk, enemyDef, false, isMain, false) +
          dealPhysicalDamage(skillolAtk, enemyDef, true, isMain, false) * (equipX ? 2 : 1) +
          dealPhysicalDamage(skillAtk, enemyDef, false, isMain, true) * (equipX ? 0.2775 : 0.15)) *
        damage_scale *
        damage_scale_phy * 4;


      // 攻击速度
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      /** 普通攻击间隔(帧) */
      const normalAtkFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      /** 普通攻击间隔(秒) */
      const normalAttackTime = normalAtkFrame / 30.0;
      /** 过载攻击间隔(帧) */
      const skillAtkFrame = Math.round(((baseAttackTime - IntervalReduction) * 3000.0) / (totalAttackSpeed));
      /** 过载攻击间隔(秒) */
      const skillAttackTime = skillAtkFrame / 30.0;

      // 技能持续时间
      const skillDuration = 12.5;
      const skillHits = Math.ceil(skillDuration / skillAttackTime);


      // 计算周期伤害
      const spCosts = [35, 34, 33, 32, 31, 30, 29, 28, 27, 25];
      const spCost = spCosts[skillLevel];
      const normalHits = Math.ceil(spCost / normalAttackTime);

      // 普通攻击
      result.attack.dph = normalAtk;
      result.attack.total_damage.phy = normalPhysicalDamage * normalHits * (1 - mitigation);
      result.attack.dps.phy = result.attack.total_damage.phy / spCost;

      // 技能
      result.skill.dph = skillAtk;
      result.skill.total_damage.phy = skillPhysicalDamage * skillHits * (1 - mitigation);
      result.skill.total_damage.phy += skillOverloadPhysicalDamage * skillHits * (1 - mitigation);
      result.skill.dps.phy = result.skill.total_damage.phy / (2 * skillDuration);
      // 周期
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.dps.phy = result.cycle.total_damage.phy / (spCost + skillDuration);
      break;
    }

    case "skchr_wisdel_3": {

    }
  }

  return result;
}


export const charSpecConfigs: Record<string, CharSpecConfig[]> = {
  uniequip_002_wisdel: [
    {
      type: "switch",
      label: "攻击主目标",
      desc: "攻击主目标时攻击力提升",
      unlockCondition: {
        phase: 1,
        level: 1,
      },
      requiredPotentialRank: 0,
      options: [
        {
          key: "是",
          value: 1,
        },
        {
          key: "否",
          value: 0,
        },
      ],
      apply: (key: string, value: number, active: boolean) => {
        return {
          active,
          label: "攻击主目标",
          key: key,
          value: value,
          blackboard: [
            {
              key: "atk_scale",
              value: value,
              valueStr: null,
            },
          ],
        };
      },
    },
  ],
};