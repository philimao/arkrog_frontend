import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import { CalculatorHelper } from "../../helper";
import type { CharSpecConfig } from "~/stores/damageCalculator/calcTypes";

export default function Leizi2(input: CalculatorInput): CalculatorOutput {
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

  /** 天赋1：明断 */
  // 攻击范围内每个地块每秒有10%的概率落雷对所有敌人造成相当于攻击力100%的法术伤害。未开启技能时起飞；技能期间攻击时攻击力提升至117%
  /** 天赋1落雷概率 */
  const talent1Prob = 0.1;
  /** 天赋1落雷伤害倍率 */
  const talent1Scale = 1.0;
  /** 技能期间攻击力提升倍率 */
  let skillAtkScale = 1.07;

  /** 模组强化一天赋 */
  if (uniEquipId === "uniequip_002_leizi2") {
    if (uniEquipLevel === 1) {
      skillAtkScale = 1.11;
    } else if (uniEquipLevel === 2) {
      skillAtkScale = 1.13;
    }
  }

  /** 潜能5提升技能期攻击力提升倍率 */
  if (potential >= 4) skillAtkScale += 0.04;

  /** 基础攻击间隔 */
  const baseAttackTime = 1.2;

  /** 特性 技能未开启时40秒内攻击力逐渐提升至最高+200%且技能结束时重置攻击力*/
  const traitAtkScale = 2.0;

  /** 攻击速度计算 */
  const totalAttackSpeed = Math.min(100 + atkSpeedBuff, 600);

  switch (skillKey) {
    case "skchr_leizi2_1": {
      // 一技能：浩气长存
      // 攻击范围朝前方和两侧扩大。对三个方向的地面敌人各造成相当于攻击力atk_scale_s1%的物理伤害
      // 可充能3次，充能耗尽前特性不重置

      const spCosts = [15, 15, 15, 14, 14, 14, 13, 13, 13, 11];
      const spCost = spCosts[skillLevel];

      /** 技能伤害倍率 */
      const skillScales = [2.3, 2.4, 2.5, 2.6, 2.7, 2.85, 3.0, 3.15, 3.35, 3.55];
      const skillScale = skillScales[skillLevel];

      /** 技能期间有天赋攻击力加成 */
      const skillAtkMul = 1 + traitAtkScale + atkBuffInMul;
      /** 技能期攻击力 */
      const skillAtk = ((atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd) * skillAtkScale;

      /** 单次技能伤害 */
      const skillDph = skillAtk * skillScale;
      /** 物理伤害 */
      const physicalDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;

      /** 天赋1落雷法术伤害 */
      const talent1Damage = skillAtk * talent1Scale * damage_scale_mag * (1 - enemyMagRes / 100);

      /** 对三个方向攻击，每个方向1次 */
      const hitCount = input.charInput.charSpec.find((spec) => spec.label === "敌人位于所在格" && spec.key === "是")
        ? 3
        : 1;

      result.skill.dph = skillDph;
      result.skill.total_damage.phy = physicalDamage * hitCount * (1 - mitigation);
      result.skill.total_damage.mag = talent1Damage * (1 - mitigation); // 落雷概率伤害

      // 一技能是瞬发技能，不计算DPS和周期
      result.skill.dps.phy = result.skill.total_damage.phy;
      result.skill.dps.mag = result.skill.total_damage.mag;

      result.cycle.total_damage.phy = result.skill.total_damage.phy;
      result.cycle.total_damage.mag = result.skill.total_damage.mag;
      result.cycle.dps.phy = result.skill.total_damage.phy / (spCost + 0.5);
      result.cycle.dps.mag = result.skill.total_damage.mag / (spCost + 0.5);
      break;
    }

    case "skchr_leizi2_2": {
      // 二技能：正霆摄威
      // 攻击范围沿近战地块扩展至最远三格，攻击对max_target个目标造成相当于攻击力atk_scale_s2%的物理伤害
      // 技能期间每次落雷使攻击力+10%（最多可叠加25次）

      const skillScales = [1.0, 1.03, 1.07, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5];
      const skillScale = skillScales[skillLevel];

      const thunderAtkBonus = 0.1; // 每次落雷+10%攻击力
      const maxThunderStack = 25; // 最多叠加25次
      const skillDuration = 36; // 技能持续36秒

      const blockCount = input.charInput.charSpec.find((spec) => spec.label === "攻击范围地块数")?.value || 1;
      let thunderStack = blockCount;

      /** 普攻间隔计算 */
      const attackFrame = Math.round((baseAttackTime * 3000.0) / totalAttackSpeed);
      const attackTime = attackFrame / 30.0;

      /** 技能期间普攻次数 */
      const attackCount = Math.ceil(skillDuration / attackTime);
      console.log("攻击次数", attackCount);

      let time = 0;
      const skillDphs = [];
      for (let i = 0; i < attackCount; i++) {
        time += attackTime;
        if (thunderStack < maxThunderStack) {
          const thunderExpect = Math.floor(talent1Prob * blockCount * time); // 计算期望落雷次数
          thunderStack += thunderExpect; // 落雷次数
          thunderStack = Math.min(thunderStack, maxThunderStack); // 落雷次数不超过最大值
        }
        /** 技能攻击力加成 */
        const skillAtkMul = 1 + thunderStack * thunderAtkBonus + traitAtkScale + atkBuffInMul;
        /** 技能期攻击力 */
        const skillAtk = ((atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd) * skillAtkScale;
        console.log("攻击次数", i, "时间", time, "面板攻击力", skillAtk);
        /** 该次技能伤害 */
        const skillDph = skillAtk * skillScale;
        /** 记录该次技能伤害 */
        skillDphs.push(skillDph);

        /** 物理伤害 */
        const physicalDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;

        /** 天赋1落雷法术伤害 */
        const talent1Damage =
          Math.random() < talent1Prob ? skillAtk * talent1Scale * damage_scale_mag * (1 - enemyMagRes / 100) : 0;
        if (talent1Damage > 0) {
          console.log("触发落雷", talent1Damage);
        }

        /** 记录该次技能伤害 */
        result.skill.total_damage.phy += physicalDamage * (1 - mitigation);
        result.skill.total_damage.mag += talent1Damage * (1 - mitigation);

        /** 二天赋单次落雷伤害 */
        if (i === 0) {
          const talent2Damage = skillAtk * talent1Scale * damage_scale_mag * (1 - enemyMagRes / 100);
          console.log("触发二天赋落雷", talent2Damage);
          result.skill.total_damage.mag += talent2Damage * (1 - mitigation);
        }
      }

      /** 技能回转计算 */
      const spCosts = [53, 52, 51, 50, 49, 48, 47, 46, 45, 43];
      const spCost = spCosts[skillLevel];

      result.skill.dph = Math.max(...skillDphs);
      result.skill.dps.phy = result.skill.total_damage.phy / skillDuration;
      result.skill.dps.mag = result.skill.total_damage.mag / skillDuration;
      result.cycle.total_damage.phy = result.skill.total_damage.phy;
      result.cycle.total_damage.mag = result.skill.total_damage.mag;
      result.cycle.dps.phy = result.skill.total_damage.phy / (skillDuration + spCost);
      result.cycle.dps.mag = result.skill.total_damage.mag / (skillDuration + spCost);

      break;
    }

    case "skchr_leizi2_3": {
      // 三技能：天地通明
      // 攻击范围扩大，攻击间隔大幅延长，攻击造成攻击力atk_scale_s3%的范围物理伤害
      // 目标位置产生朝四周流动三格的电流，电流所在地块上所有敌人每0.6秒受到司霆惊蛰攻击力atk_scale_current%的法术伤害

      const skillScales = [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.6, 2.8, 3.0];
      const currentScales = [0.35, 0.38, 0.42, 0.45, 0.48, 0.52, 0.56, 0.6, 0.65, 0.7];
      const skillScale = skillScales[skillLevel];
      const currentScale = currentScales[skillLevel];

      const currentHitCount = input.charInput.charSpec.find((spec) => spec.label === "单次攻击电流判定数")?.value || 20;
      console.log("单次攻击电流判定数", currentHitCount);

      const skillDuration = 24; // 技能持续24秒

      /** 普攻间隔计算 */
      const attackFrame = Math.round(((baseAttackTime + 1.7) * 3000.0 + 100) / totalAttackSpeed);
      console.log("普攻间隔", attackFrame, "普攻时间", attackFrame / 30.0);
      const attackTime = attackFrame / 30.0;

      /** 技能期间攻击力（含天赋加成） */
      const skillAtkMul = 1 + traitAtkScale + atkBuffInMul;
      const skillAtk = ((atk + atkBuffInAdd) * skillAtkMul * atkBuffFinalMul + atkBuffFinalAdd) * skillAtkScale;

      /** 技能期间普攻次数，抬手0.6s（无攻速影响），前摇0.4s */
      const skillAttackCount = Math.ceil((skillDuration - 0.6 - 0.4 / totalAttackSpeed) / attackTime);
      console.log("技能期间普攻次数", skillAttackCount);

      /** 单次技能攻击物理伤害 */
      const skillDph = skillAtk * skillScale;
      const skillPhysicalDamage = Math.max(skillDph - enemyDef, skillDph * 0.05) * damage_scale * damage_scale_phy;

      /** 电流法术伤害 */
      const currentDph = skillAtk * currentScale;

      /** 电流单次判定法术伤害 */
      const currentMagicalDamage = currentDph * currentHitCount * damage_scale_mag * (1 - enemyMagRes / 100);
      console.log("电流单次判定法术伤害", currentMagicalDamage);

      /** 总伤害计算 */
      const totalSkillDamage = skillPhysicalDamage * skillAttackCount * (1 - mitigation);
      const totalCurrentDamage = currentMagicalDamage * skillAttackCount * (1 - mitigation);
      console.log("电流总判定数", currentHitCount * skillAttackCount);

      /** 天赋1落雷伤害 */
      const talent1Damage = skillAtk * talent1Scale * damage_scale_mag * (1 - enemyMagRes / 100);
      /** 技能期期望落雷2次，二天赋触发一次 */
      const totalTalent1Damage = talent1Damage * 3 * (1 - mitigation);

      /** 技能回转计算 */
      const spCosts = [46, 45, 44, 43, 42, 41, 40, 39, 38, 36];
      const spCost = spCosts[skillLevel];

      result.skill.dph = skillDph;
      result.skill.total_damage.phy = totalSkillDamage;
      result.skill.total_damage.mag = totalCurrentDamage + totalTalent1Damage;
      result.skill.dps.phy = totalSkillDamage / skillDuration;
      result.skill.dps.mag = (totalCurrentDamage + totalTalent1Damage) / skillDuration;
      result.cycle.total_damage.phy = totalSkillDamage;
      result.cycle.total_damage.mag = totalCurrentDamage + totalTalent1Damage;
      result.cycle.dps.phy = totalSkillDamage / (skillDuration + spCost);
      result.cycle.dps.mag = (totalCurrentDamage + totalTalent1Damage) / (skillDuration + spCost);

      break;
    }
  }

  return result;
}

export const charSpecConfigs: Record<string, CharSpecConfig[]> = {
  skchr_leizi2_1: [
    {
      type: "switch",
      label: "敌人位于所在格",
      desc: "对自身所在格的敌人共能造成3次伤害",
      unlockCondition: {
        phase: 0,
        level: 1,
      },
      requiredPotentialRank: 0,
      options: [
        {
          key: "是",
          value: 3,
        },
        {
          key: "否",
          value: 1,
        },
      ],
      apply: (key: string, value: number, active: boolean) => {
        return {
          active,
          label: "敌人位于所在格",
          key: key,
          value: value,
          blackboard: [],
        };
      },
    },
  ],
  skchr_leizi2_2: [
    {
      type: "select",
      label: "攻击范围地块数",
      desc: "开启技能时触发第二天赋，并根据攻击范围地块数计算落雷概率，获得攻击力加成",
      unlockCondition: {
        phase: 2,
        level: 50,
      },
      requiredPotentialRank: 0,
      options: Array(25)
        .fill(0)
        .map((_, index) => ({
          key: 25 - index + "格",
          value: 25 - index,
        })),
      apply: (key: string, value: number, active: boolean) => {
        return {
          active,
          label: "攻击范围地块数",
          key: key,
          value: value,
          blackboard: [],
        };
      },
    },
  ],
  skchr_leizi2_3: [
    {
      type: "select",
      label: "单次攻击电流判定数",
      desc: "单次攻击产生4道电流，根据判定数计算电流伤害",
      unlockCondition: {
        phase: 2,
        level: 1,
      },
      requiredPotentialRank: 0,
      options: Array(17)
        .fill(0)
        .map((_, index) => ({
          key: 20 - index + "次",
          value: 20 - index,
        })),
      apply: (key: string, value: number, active: boolean) => {
        return {
          active,
          label: "单次攻击电流判定数",
          key: key,
          value: value,
          blackboard: [],
        };
      },
    },
  ],
};
