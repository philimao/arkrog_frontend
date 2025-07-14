import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";
import type { CharSpecConfig } from "~/stores/damageCalculator/calcTypes";

/** 寒芒克洛丝伤害计算器 */
export default function KroosTheKeenGlint(input: CalculatorInput): CalculatorOutput {
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
  const potential = input.charInput.potential; // 潜能等级
  const uniEquipLevel = input.charInput.uniEquipLevel; // 模组等级
  const mitigation =
    1 -
    (1 - context.in_game_buff_final_mul.enemy_damage_resistance.calculate()) *
      (1 - context.relic_rune_mul.enemy_damage_resistance.calculate());
  const fire: boolean = input.relics.find((r) => r.name === "烟花之手") !== undefined; // 烟花手，脚本只需获取是否有该藏品

  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  // 敌人属性
  const enemyDef = input.enemyInput.attributes.def;

  // 基础攻击间隔
  const baseAttackTime = 1.0;

  // 天赋：中的
  let talentProb = 0.1; // 天赋触发概率
  let talentScale = 1.5; // 天赋攻击力倍率

  // 精英化等级影响
  if (input.charInput.phaseLevel >= 2) {
    talentProb = 0.2; // 精2时概率提升到20%
  }

  // 模组影响
  if (uniEquipLevel >= 1) {
    talentScale = 1.6; // 2级模组：20%几率160%攻击力
  }
  if (uniEquipLevel >= 2) {
    talentScale = 1.65; // 3级模组：20%几率165%攻击力
  }

  // 潜能影响
  if (potential >= 4) {
    talentScale += 0.1; // 5潜时攻击力倍率+10%
  }

  // 模组特性：攻击空中单位时攻击力提升
  const traitAtkScale = input.charInput.charSpec.find((spec) => spec.label === "攻击空中单位" && spec.key === "是")
    ? 1.1
    : 1;

  // 普攻计算
  const normalAtk = (atk + atkBuffInAdd) * (1 + atkBuffInMul) * traitAtkScale * atkBuffFinalMul + atkBuffFinalAdd;
  const normalDph = normalAtk;
  const normalCritDph = normalAtk * talentScale;
  const normalFireDph = normalAtk * 2;
  const normalFireDamage = Math.max(normalFireDph - enemyDef, 0.05 * normalFireDph) * damage_scale * damage_scale_phy;

  switch (skillKey) {
    case "skchr_kroos2_1": {
      // 一技能：无痕
      const atkScales = [0.1, 0.13, 0.16, 0.2, 0.23, 0.26, 0.3, 0.33, 0.36, 0.4];
      const atkScale = atkScales[skillLevel];
      const durations = [11, 11, 11, 12, 12, 12, 13, 14, 14, 15];
      const duration = durations[skillLevel];
      const spCosts = [20, 20, 20, 17, 17, 17, 15, 15, 15, 15];
      const spCost = spCosts[skillLevel];

      // 技能期间攻击力提升，2连射
      const skillAtkMul = 1 + atkScale + atkBuffInMul;
      const skillAtk = (atk + atkBuffInAdd) * skillAtkMul * traitAtkScale * atkBuffFinalMul + atkBuffFinalAdd;
      const skillDph = skillAtk; // 2连射
      const skillCritDph = skillAtk * talentScale; // 天赋暴击的2连射
      const skillFireDph = skillAtk * 2;

      // 普攻期望伤害
      let normalPhysicalDamage =
        (Math.max(normalDph - enemyDef, 0.05 * normalDph) * (1 - talentProb) +
          Math.max(normalCritDph - enemyDef, 0.05 * normalCritDph) * talentProb) *
        damage_scale *
        damage_scale_phy;

      // 技能期望伤害
      let skillPhysicalDamage =
        (Math.max(skillDph - enemyDef, 0.05 * skillDph) * (1 - talentProb) +
          Math.max(skillCritDph - enemyDef, 0.05 * skillCritDph) * talentProb) *
        2 *
        damage_scale *
        damage_scale_phy;
      const skillFireDamage =
        Math.max(skillFireDph - enemyDef, 0.05 * skillFireDph) * 2 * damage_scale * damage_scale_phy;

      if (fire) {
        normalPhysicalDamage += normalFireDamage * 0.25;
        skillPhysicalDamage += skillFireDamage * 0.25;
      }

      // 攻击速度
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      const atkFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      const attackTime = atkFrame / 30.0;

      // 计算击数
      const normalHitCount = Math.ceil(spCost / attackTime);
      const skillHitCount = Math.ceil(duration / attackTime);

      result.attack.dph = normalDph;
      result.attack.total_damage.phy = normalPhysicalDamage * normalHitCount * (1 - mitigation);
      result.attack.dps.phy = result.attack.total_damage.phy / (spCost * attackTime);

      result.skill.dph = skillDph;
      result.skill.total_damage.phy = skillPhysicalDamage * skillHitCount * (1 - mitigation);
      result.skill.dps.phy = result.skill.total_damage.phy / duration;

      // 周期伤害
      const totalCycleTime = spCost * attackTime + duration;
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.dps.phy = result.cycle.total_damage.phy / totalCycleTime;
      break;
    }

    case "skchr_kroos2_2": {
      // 二技能：封喉
      const baseAttackTimeReductions = [-0.15, -0.15, -0.15, -0.22, -0.22, -0.22, -0.3, -0.3, -0.3, -0.367];
      const baseAttackTimeReduction = baseAttackTimeReductions[skillLevel];
      const durations = [22, 22, 22, 24, 24, 24, 26, 28, 28, 30];
      const duration = durations[skillLevel];
      const spCosts = [50, 49, 48, 45, 44, 43, 40, 40, 40, 35];
      const spCost = spCosts[skillLevel];
      const maxStackCounts = [40, 40, 40, 40, 40, 40, 40, 36, 32, 32];
      const maxStackCount = maxStackCounts[skillLevel];

      // 技能期间攻击间隔缩短，2连射，达到指定击数后变成4连射
      const skillAttackTime = baseAttackTime + baseAttackTimeReduction;

      // 计算攻击速度
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      const normalAtkFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      const normalAttackTime = normalAtkFrame / 30.0;
      const skillAtkFrame = Math.round((skillAttackTime * 3000.0) / totalAttackSpeed);
      let skillAtkFrame4 = skillAtkFrame;
      if (skillAtkFrame < 8) {
        skillAtkFrame4 = Math.max(skillAtkFrame + 1, 6);
      }
      const skillAttackTimeActual = skillAtkFrame / 30.0;
      const skillAttackTimeActual4 = skillAtkFrame4 / 30.0;

      // 技能阶段的伤害
      const skillDph2 = normalAtk; // 2连射
      const skillCritDph2 = normalAtk * talentScale;
      const skillDph4 = normalAtk; // 4连射
      const skillCritDph4 = normalAtk * talentScale;
      const skillFireDph = normalAtk * 2;

      // 计算达到maxStackCount需要的时间和击数
      const hitsToMaxStack = Math.ceil(maxStackCount / 2); // 每次攻击2发
      const timeToMaxStack = hitsToMaxStack * skillAttackTimeActual;
      const remaining4ShotTime = Math.max(0, duration - timeToMaxStack);
      const hits4Shot = Math.ceil(remaining4ShotTime / skillAttackTimeActual4);

      // 2连射期间的伤害
      let skill2ShotPhysicalDamage =
        (Math.max(skillDph2 - enemyDef, 0.05 * skillDph2) * (1 - talentProb) +
          Math.max(skillCritDph2 - enemyDef, 0.05 * skillCritDph2) * talentProb) *
        2 *
        damage_scale *
        damage_scale_phy;

      // 4连射期间的伤害
      let skill4ShotPhysicalDamage =
        (Math.max(skillDph4 - enemyDef, 0.05 * skillDph4) * (1 - talentProb) +
          Math.max(skillCritDph4 - enemyDef, 0.05 * skillCritDph4) * talentProb) *
        4 *
        damage_scale *
        damage_scale_phy;

      //烟花伤害
      const skillFireDamage = Math.max(skillFireDph - enemyDef, 0.05 * skillFireDph) * damage_scale * damage_scale_phy;

      // 普攻期间的伤害
      let normalPhysicalDamage =
        (Math.max(normalDph - enemyDef, 0.05 * normalDph) * (1 - talentProb) +
          Math.max(normalCritDph - enemyDef, 0.05 * normalCritDph) * talentProb) *
        damage_scale *
        damage_scale_phy;

      if (fire) {
        normalPhysicalDamage += normalFireDamage * 0.25;
        skill2ShotPhysicalDamage += normalFireDamage * 0.25 * 2;
        skill4ShotPhysicalDamage += normalFireDamage * 0.25 * 4;
      }

      const normalHitCount = Math.ceil(spCost / normalAttackTime);

      result.attack.dph = normalDph;
      result.attack.total_damage.phy = normalPhysicalDamage * normalHitCount * (1 - mitigation);
      result.attack.dps.phy = result.attack.total_damage.phy / spCost;

      // 技能总伤害 = 2连射伤害 + 4连射伤害
      const skill2ShotTotalDamage = skill2ShotPhysicalDamage * hitsToMaxStack * (1 - mitigation);
      const skill4ShotTotalDamage = skill4ShotPhysicalDamage * hits4Shot * (1 - mitigation);

      result.skill.dph = skillDph4; // 显示最高伤害
      result.skill.total_damage.phy = skill2ShotTotalDamage + skill4ShotTotalDamage;
      result.skill.dps.phy = result.skill.total_damage.phy / duration;

      // 周期伤害
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.dps.phy = result.cycle.total_damage.phy / (spCost + duration);
      break;
    }
  }

  return result;
}

export const charSpecConfigs: Record<string, CharSpecConfig[]> = {
  uniequip_002_kroos2: [
    {
      type: "switch",
      label: "攻击空中单位",
      desc: "攻击空中单位时攻击力提升至110%",
      unlockCondition: {
        phase: 2,
        level: 50,
      },
      requiredPotentialRank: 0,
      options: [
        {
          key: "否",
          value: 1,
        },
        {
          key: "是",
          value: 1.1,
        },
      ],
      apply: (key: string, value: number, active: boolean) => {
        return {
          active,
          label: "攻击空中单位",
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
