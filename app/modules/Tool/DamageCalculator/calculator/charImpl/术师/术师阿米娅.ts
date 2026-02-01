import type { CalculatorInput, CalculatorOutput } from "~/types/gameData";
import type { CharInput } from "~/stores/damageCalculator/calcTypes";
import type { BuffContext } from "../../buff-context";
import { NumericLiteralNode } from "../../ast";
import { CalculatorHelper } from "../../helper";
import { getByKey } from "../../impls";

/** 阿米娅伤害计算器 */
export default function CasterAmiya(input: CalculatorInput): CalculatorOutput {
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
  /** 法术增伤总倍率 */
  const damage_scale_mag = context.global_buff_stack.damage_scale_mag.calculate();
  /** 真伤增伤总倍率 */
  const damage_scale_pure = context.global_buff_stack.damage_scale_pure.calculate();

  const atkSpeedBuff =
    context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate(); // 额外攻击速度
  const spBuffAdd = context.in_game_buff_add.sp_recovery_per_sec.calculate(); // 额外技力回复速度

  // 通过 calculateOutsidePanel 获取面板属性
  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });

  const atk = outsidePanel.atk; // 局外攻击力
  const skillKey = input.charInput.skillKey; // 技能key
  const mitigation = input.enemyInput.attributes.damageResistance; // 敌人减伤
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();

  const enemyMagRes = input.enemyInput.attributes.magicResistance; // 敌人法抗

  const commonDPH = ((atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const commonDamage =
    Math.max(commonDPH * (1 - enemyMagRes / 100), commonDPH * 0.05) * damage_scale * damage_scale_mag;

  const atkSpeed = Math.min(100 + atkSpeedBuff, 600); // 攻击速度
  const commonAtkTimeBase = input.charInput.attribute.baseAttackTime ?? 1.6; // 普攻基础时间
  const commonAtkFrame = Math.round((commonAtkTimeBase * 3000.0) / atkSpeed); // 普攻间隔(帧)
  const commonAtkTime = commonAtkFrame / 30.0; // 普攻间隔(秒)

  result.attack.dph = commonDPH;
  result.attack.dps.mag = (commonDamage * (1 - mitigation)) / commonAtkTime;
  result.attack.total_damage.mag = commonDamage * (1 - mitigation);

  switch (skillKey) {
    case "skchr_amiya_1": {
      break;
    }

    case "skchr_amiya_2": {
      break;
    }

    case "skchr_amiya_3": {
      const skillBuffIn = 2.3; // 技能加攻

      const skillDph = ((atk + atkBuffInAdd) * (1 + skillBuffIn + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
      const skillDamage = skillDph * damage_scale * damage_scale_pure;

      // 技能期间攻击间隔不变
      const skillAtkTime = commonAtkTime;

      const skillSp = input.charInput.skill.spData.spCost ?? 120; // 技能技力消耗
      const spInitial = input.charInput.skill.spData.initSp ?? 0; // 技能初始技力
      const skillKeepTime = input.charInput.skill.duration || 30.0; // 技能持续时间

      const uniEquipTag = `${input.charInput.uniEquipId ?? ""} ${input.charInput.uniEquipName ?? ""}`.toUpperCase();
      const hasSpecialModule = uniEquipTag.includes("DWDB-221E");
      const hasTalentUpgrade = hasSpecialModule && input.charInput.uniEquipLevel >= 1;
      const isEliteOrBoss = ["ELITE", "BOSS"].includes(input.enemyInput.levelType);

      // 天赋：每次普通攻击额外回复技力（模块/潜能影响）
      const talentSpBase = hasTalentUpgrade ? 3 : 2;
      const talentSpBonus = input.charInput.potential >= 5 ? 1 : 0;
      const talentSpPerHit = talentSpBase + talentSpBonus;
      const moduleEliteSpBonus = hasSpecialModule && isEliteOrBoss ? 1 : 0;

      // 技力恢复计算（普攻期）
      const baseSpRecoveryPerSec = input.charInput.attribute.spRecoveryPerSec ?? 1 + spBuffAdd;
      const baseSpPerHit = input.charInput.skill.spData.spType === "INCREASE_WHEN_ATTACK" ? 1 : 0;
      const spPerHit = baseSpPerHit + talentSpPerHit + moduleEliteSpBonus;

      let skillRecoveryTime = 0;
      let commonHit = 0;
      const spNeed = Math.max(skillSp - spInitial, 0);
      if (spNeed > 0) {
        if (spPerHit <= 0 && baseSpRecoveryPerSec > 0) {
          skillRecoveryTime = spNeed / baseSpRecoveryPerSec;
          commonHit = Math.ceil(skillRecoveryTime / commonAtkTime);
        } else {
          let currentSp = spInitial;
          let time = 0;
          while (currentSp < skillSp && time < 3600) {
            time += commonAtkTime;
            commonHit += 1;
            currentSp += baseSpRecoveryPerSec * commonAtkTime + spPerHit;
          }
          skillRecoveryTime = time;
        }
      }

      const skillHit = Math.ceil(skillKeepTime / skillAtkTime); // 技能攻击次数

      const commonTotalDamage = commonDamage * commonHit * (1 - mitigation);
      const skillTotalDamage = skillDamage * skillHit * (1 - mitigation);
      const cycleTime = skillRecoveryTime + skillKeepTime + outsidePanel.respawnTime;

      result.skill.dph = skillDph;
      result.skill.dps.pure = skillTotalDamage / skillKeepTime;
      result.skill.total_damage.pure = skillTotalDamage;
      result.cycle.dps.mag = commonTotalDamage / cycleTime;
      result.cycle.dps.pure = skillTotalDamage / cycleTime;
      result.cycle.total_damage.mag = commonTotalDamage;
      result.cycle.total_damage.pure = skillTotalDamage;
      break;
    }
  }

  return result;
}

/** 阿米娅技能应用 */
export function applySkill(input: { charInput: CharInput }, context: BuffContext) {
  if (input.charInput.skillKey !== "skchr_amiya_3") return;
  const atk = getByKey(input.charInput.skill.blackboard, "atk");
  if (atk) {
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value, "技能"));
  } else {
    context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(2.3, "技能"));
  }
  const maxHp = getByKey(input.charInput.skill.blackboard, "max_hp");
  if (maxHp) {
    context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(maxHp.value, "技能"));
  } else {
    context.in_game_buff_mul.max_hp.addChild(new NumericLiteralNode(1, "技能"));
  }
}

/** 阿米娅天赋应用（无面板增益，避免控制台警告） */
export function applyTalent(_input: { charInput: CharInput }, _context: BuffContext) {}


