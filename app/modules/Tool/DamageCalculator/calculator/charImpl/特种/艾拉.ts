import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";

/** 艾拉伤害计算器 */
export default function Ela(input: CalculatorInput): CalculatorOutput {
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

  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  // 敌人属性
  const enemyDef = input.enemyInput.attributes.def;

  // 基础攻击间隔
  const baseAttackTime = 0.85;

  // 模组天赋：正中靶心
  let critProb = 0.3; // 暴击概率
  let critScale = 1.5; // 暴击倍率

  // 5潜能时伤害倍率+10%
  if (potential >= 4) {
    critScale += 0.1;
  }

  if (uniEquipLevel >= 2) {
    // 2级模组：40%几率160%攻击力伤害
    // 3级模组：50%几率170%攻击力伤害
    critProb = uniEquipLevel === 2 ? 0.5 : 0.4;
    critScale += uniEquipLevel === 2 ? 0.2 : 0.1;
  }

  // 普攻计算
  const normalAtk = (atk + atkBuffInAdd) * (1 + atkBuffInMul) * atkBuffFinalMul + atkBuffFinalAdd;
  const normalDph = normalAtk;
  const normalCritDph = normalAtk * critScale;

  switch (skillKey) {
    case "skchr_ela_1": {
      // 一技能：眩目阻滞
      // 主要是陷阱控制效果，不直接影响伤害计算
      // 考虑模组天赋的期望伤害
      // 物理伤害
      const normalPhysicalDamage =
        (Math.max(normalDph - enemyDef, 0.05 * normalDph) * (1 - critProb) +
          Math.max(normalCritDph - enemyDef, 0.05 * normalCritDph) * critProb) *
        damage_scale *
        damage_scale_phy;

      const skillPhysicalDamage =
        Math.max(normalCritDph - enemyDef, 0.05 * normalCritDph) * damage_scale * damage_scale_phy;

      // 攻击速度
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      const attackTime = (baseAttackTime * 3000) / totalAttackSpeed / 30;

      const duration = 70;

      const hitCount = Math.ceil(duration / attackTime);

      result.attack.dph = normalDph;
      result.attack.total_damage.phy = normalPhysicalDamage * hitCount * (1 - mitigation);
      result.attack.dps.phy = result.attack.total_damage.phy / duration;

      result.skill.dph = normalCritDph;
      result.skill.total_damage.phy = skillPhysicalDamage * hitCount * (1 - mitigation);
      result.skill.dps.phy = result.skill.total_damage.phy / duration;

      // 周期总伤为技能与普攻相加
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.dps.phy = result.cycle.total_damage.phy / (2 * duration);
      break;
    }

    case "skchr_ela_2": {
      // 二技能：震荡坚守
      // 防御力提升，溅射攻击，无视防御力
      const defPenetrates = [200, 250, 300, 350, 400, 450, 500, 600, 700, 800];
      const defPenetrate = defPenetrates[skillLevel];

      // 技能期间攻击力不变，但有溅射和穿透效果
      const normalDph = normalAtk;
      const critDph = normalAtk * critScale;

      // 溅射伤害，无视一定防御力
      const normalPhysicalDamage =
        (Math.max(normalDph - Math.max(enemyDef - defPenetrate, 0), 0.05 * normalDph) * (1 - critProb) +
          Math.max(critDph - Math.max(enemyDef - defPenetrate, 0), 0.05 * critDph) * critProb) *
        damage_scale *
        damage_scale_phy;

      const skillPhysicalDamage =
        Math.max(critDph - Math.max(enemyDef - defPenetrate, 0), 0.05 * critDph) * damage_scale * damage_scale_phy;

      // 攻击速度不变
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      const attackTime = (baseAttackTime * 3000) / totalAttackSpeed / 30;

      // 技能持续时间
      const spCosts = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16];
      const spCost = spCosts[skillLevel];
      const normalDuration = spCost * attackTime;

      const skillDuration = 20.0;
      const skillHits = Math.ceil(skillDuration / attackTime);

      result.attack.dph = normalDph;
      result.attack.total_damage.phy = normalPhysicalDamage * 16 * (1 - mitigation);
      result.attack.dps.phy = result.attack.total_damage.phy / normalDuration;

      result.skill.dph = critDph;
      result.skill.total_damage.phy = skillPhysicalDamage * skillHits * (1 - mitigation);
      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;

      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.dps.phy = result.cycle.total_damage.phy / (normalDuration + skillDuration);
      break;
    }

    case "skchr_ela_3": {
      // 三技能："博萨克风暴"
      // 攻击间隔缩短，攻击力提升，40发子弹
      const atkScales = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9];
      const atkScale = atkScales[skillLevel];
      const baseAttackTimeReduction = -0.35; // 攻击间隔缩短

      // 技能期间攻击力提升
      const skillAtkMul = 1 + atkScale + atkBuffInMul;
      const skillDph = (atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd;
      const skillCritDph = skillDph * critScale;

      /** 普攻期望伤害 */
      const normalPhysicalDamage =
        (Math.max(normalDph - enemyDef, 0.05 * normalDph) * (1 - critProb) +
          Math.max(normalCritDph - enemyDef, 0.05 * normalCritDph) * critProb) *
        damage_scale *
        damage_scale_phy;

      /** 地雷脆弱 */
      const fragile = 1.35;
      /** 技能伤害 */
      const skillPhysicalDamage =
        Math.max(skillCritDph - enemyDef, 0.05 * skillCritDph) * fragile * damage_scale * damage_scale_phy;

      // 攻击速度提升
      const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);
      const normalAttackTime = (baseAttackTime * 3000) / totalAttackSpeed / 30;
      const skillAttackTime = ((baseAttackTime + baseAttackTimeReduction) * 3000) / totalAttackSpeed / 30;

      // 40发子弹
      const bulletCount = 40;
      const skillDuration = skillAttackTime * bulletCount;

      result.skill.dph = skillCritDph;
      result.skill.total_damage.phy = skillPhysicalDamage * bulletCount * (1 - mitigation);
      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;

      const spCosts = [48, 47, 46, 44, 43, 42, 40, 38, 36, 34];
      const spCost = spCosts[skillLevel];
      const normalDuration = spCost;
      const normalHitCount = Math.ceil(normalDuration / normalAttackTime);

      result.attack.dph = normalDph;
      result.attack.total_damage.phy = normalPhysicalDamage * normalHitCount * (1 - mitigation);
      result.attack.dps.phy = result.attack.total_damage.phy / normalDuration;

      // 计算周期伤害
      result.cycle.total_damage.phy = result.skill.total_damage.phy + result.attack.total_damage.phy;
      result.cycle.dps.phy = result.cycle.total_damage.phy / (normalDuration + skillDuration);
      break;
    }
  }

  return result;
}
