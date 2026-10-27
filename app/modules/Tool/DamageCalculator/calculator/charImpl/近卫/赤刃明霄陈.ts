import type { CalculatorInput, CalculatorOutput, CharData, CharTalentData } from "~/types/gameData";
import type { CharInput, CharSpecConfig } from "~/stores/damageCalculator/calcTypes";
import { NumericLiteralNode } from "../../ast";
import type { BuffContext } from "../../buff-context";
import { CalculatorHelper } from "../../helper";
import { getByKey, type ApplySkillFC, type ApplyTalentFC } from "../../impls";
import { foldedEnemyMagicResistance, resolveWeakDamage, type DamageType } from "../../weakDamage";

const BASE_ATTACK_TIME = 1.25;
const SKILL_ID = "skchr_chen3_3";
/** MultiMeleeAttack._additionalTimes = 2，同一次攻击再打两下，加上本体共三下。 */
const HITS_PER_ATTACK = 3;
const TALENT_NAME = "形意洞照";

/** 间隔帧的整数倍上出招，结束帧上不再打出。 */
function attackCount(durationSec: number, atkSpeed: number): number {
  const step = Math.round((BASE_ATTACK_TIME * 3000) / atkSpeed);
  const frames = Math.round(durationSec * 30);
  if (step <= 0 || frames <= 0) return 0;
  return Math.floor((frames - 1) / step);
}

function admittedTalent(charData: CharData, charInput: CharInput): CharTalentData | undefined {
  const level = charInput.phase?.attributesKeyFrames?.[charInput.frameIndex]?.level ?? 0;
  for (const talent of charData.talents ?? []) {
    const candidate = talent.candidates?.findLast((item) => {
      if (item.name !== TALENT_NAME) return false;
      const phase = Number(String(item.unlockCondition.phase).replace("PHASE_", ""));
      return (
        phase <= charInput.phaseLevel &&
        item.unlockCondition.level <= level &&
        item.requiredPotentialRank <= charInput.potential
      );
    });
    if (candidate) return candidate;
  }
  return undefined;
}

function unblockedAttackSpeed(charInput: CharInput): number {
  const enabled = charInput.charSpec?.find((spec) => spec.label === "未阻挡" && spec.active && spec.key === "是");
  if (!enabled || !charInput.uniEquip) return 0;
  for (const part of charInput.uniEquip.parts) {
    const candidates = part.overrideTraitDataBundle?.candidates;
    if (!candidates) continue;
    const trait = [...candidates].reverse().find((item) => getByKey(item.blackboard, "attack_speed"));
    const attackSpeed = trait ? getByKey(trait.blackboard, "attack_speed") : undefined;
    if (attackSpeed) return attackSpeed.value;
  }
  return 0;
}

export const applyTalent: ApplyTalentFC = (input, context) => {
  const { charInput, charData } = input;
  if (!charData) return;
  const talent = admittedTalent(charData, charInput);
  if (talent) {
    const atk = getByKey(talent.blackboard, "atk");
    const attackSpeed = getByKey(talent.blackboard, "attack_speed");
    if (atk) context.in_game_buff_mul.atk.addChild(new NumericLiteralNode(atk.value, TALENT_NAME));
    if (attackSpeed) {
      context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(attackSpeed.value, TALENT_NAME));
    }
  }
  const traitAttackSpeed = unblockedAttackSpeed(charInput);
  if (traitAttackSpeed) {
    context.in_game_buff_add.attack_speed.addChild(new NumericLiteralNode(traitAttackSpeed, "未阻挡"));
  }
};

export const applySkill: ApplySkillFC = () => {};

type DamageSlot = "phy" | "mag";

function slotOf(type: DamageType): DamageSlot {
  return type === "PHYSICAL" ? "phy" : "mag";
}

/** 赤刃明霄陈三技能本体。龙不计算。 */
export function calculator(input: CalculatorInput): CalculatorOutput {
  const context: BuffContext = input.buffContext;
  const atkBuffInAdd = context.in_game_buff_add.atk.calculate();
  const atkBuffInMul = context.in_game_buff_mul.atk.calculate() - 1;
  const atkBuffFinalAdd = context.in_game_buff_final_add.atk.calculate();
  const atkBuffFinalMul = context.in_game_buff_final_mul.atk.calculate();
  const damageScale = context.global_buff_stack.damage_scale.calculate();
  const damageScalePhy = context.global_buff_stack.damage_scale_phy.calculate();
  const damageScaleMag = context.global_buff_stack.damage_scale_mag.calculate();
  const atkSpeedBuff =
    context.in_game_buff_add.attack_speed.calculate() + context.relic_rune_add.attack_speed.calculate();
  const spBuffAdd = context.in_game_buff_add.sp_recovery_per_sec.calculate();

  const outsidePanel = CalculatorHelper.calculateOutsidePanel({
    charInput: input.charInput,
    context,
  });
  const panel = ((outsidePanel.atk + atkBuffInAdd) * (1 + atkBuffInMul) + atkBuffFinalAdd) * atkBuffFinalMul;
  const atkSpeed = Math.min(100 + atkSpeedBuff, 600);
  const attackFrame = Math.round((BASE_ATTACK_TIME * 3000) / atkSpeed);
  const attackTime = attackFrame / 30;
  const mitigation = input.enemyInput.attributes.damageResistance;
  const res = foldedEnemyMagicResistance(
    input.enemyInput.attributes.magicResistance,
    context.in_game_buff_add.enemy_magic_resistance.calculate(),
    context.in_game_buff_final_mul.enemy_magic_resistance.calculate(),
  );
  const def = input.enemyInput.attributes.def;

  const land = (atk: number) =>
    resolveWeakDamage({
      atk,
      def,
      res,
      originalType: "MAGICAL",
      damageScale,
      damageScalePhy,
      damageScaleMag,
    });

  const result = CalculatorHelper.createCalculatorOutput();
  const normal = land(panel);
  const normalLanded = normal.amount * (1 - mitigation);
  result.attack.dph = normal.amount;
  result.attack.dps[slotOf(normal.type)] = attackTime > 0 ? normalLanded / attackTime : 0;
  result.attack.total_damage[slotOf(normal.type)] = normalLanded;

  if (input.charInput.skillKey !== SKILL_ID) return result;

  const atkScale = getByKey(input.charInput.skill.blackboard, "attack@atk_scale")?.value ?? 1;
  const duration = input.charInput.skill.duration;
  const spCost = input.charInput.skill.spData.spCost;
  const recovery = spCost / (1 + spBuffAdd);
  const skill = land(panel * atkScale);
  const skillAttacks = attackCount(duration, atkSpeed);
  const recoveryAttacks = attackCount(recovery, atkSpeed);
  const skillTotal = skill.amount * skillAttacks * HITS_PER_ATTACK * (1 - mitigation);
  const recoveryTotal = normal.amount * recoveryAttacks * (1 - mitigation);

  result.skill.dph = skill.amount;
  result.skill.dps[slotOf(skill.type)] = duration > 0 ? skillTotal / duration : 0;
  result.skill.total_damage[slotOf(skill.type)] = skillTotal;

  const cycleTime = duration + recovery;
  result.cycle.total_damage[slotOf(skill.type)] += skillTotal;
  result.cycle.total_damage[slotOf(normal.type)] += recoveryTotal;
  if (cycleTime > 0) {
    result.cycle.dps.phy = result.cycle.total_damage.phy / cycleTime;
    result.cycle.dps.mag = result.cycle.total_damage.mag / cycleTime;
  }
  return result;
}

export const charSpecConfigs: Record<string, CharSpecConfig[]> = {
  uniequip_002_chen3: [
    {
      type: "switch",
      label: "未阻挡",
      desc: "未阻挡敌人时攻击速度提升",
      unlockCondition: {
        phase: 2,
        level: 60,
      },
      requiredPotentialRank: 0,
      options: [
        { key: "是", value: 1 },
        { key: "否", value: 0 },
      ],
      apply: (key, value, active) => ({
        active,
        label: "未阻挡",
        key,
        value,
        blackboard: [],
      }),
    },
  ],
};
