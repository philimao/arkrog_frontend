import type { CharData, CharPhase, SkillData, UniEquipData } from "~/types/gameData";
import type { CharInput, CharSpec, CharSpecConfig } from "../calcTypes";

const has = (value: number | string | boolean | undefined) => value !== undefined;

/** 根据用户选择内容，更新干员状态 */
export function updateCharState({
  charInput,
  uniequip_table,
  charData,
  phaseLevel,
  frameIndex,
  skillKey,
  skillLevel,
  uniEquipId,
  uniEquipLevel,
  charSpecConfigs,
}: {
  charInput: CharInput;
  charData: CharData;
  uniequip_table: Record<string, UniEquipData>;
  phaseLevel?: number;
  frameIndex?: number;
  skillKey?: string;
  skillLevel?: number;
  uniEquipId?: string;
  uniEquipLevel?: number;
  charSpecConfigs: CharSpecConfig[];
}): CharInput {
  const phases = charInput.phases;
  const phase = has(phaseLevel) ? getPhase(phases, phaseLevel || charInput.phaseLevel) : charInput.phase;
  const skills = charInput.skills;
  const skillCandidate = getSkillCandidate(skills, skillKey || charInput.skillKey);
  const skillLevels = getSkillLevels(skillCandidate, phaseLevel || charInput.phaseLevel);
  const skillItem = getSkillItem(skillCandidate, skillLevel || charInput.skillLevel);
  const uniEquips = getUniEquips(
    charData,
    phaseLevel || charInput.phaseLevel,
    frameIndex || charInput.frameIndex,
    uniequip_table,
  );
  const uniEquipCandidate = getUniEquipCandidate(uniEquips, uniEquipId || charInput.uniEquipId);
  const uniEquipName = uniEquipCandidate ? uniEquipCandidate.uniEquipName : "";
  const uniEquipItem = uniEquipCandidate
    ? getUniEquipItem(uniEquipCandidate, has(uniEquipLevel) ? uniEquipLevel! : charInput.uniEquipLevel)
    : undefined;

  const charSpec = updateCharSpec(
    {
      skillKey: skillKey ?? charInput.skillKey,
      uniEquipId: uniEquipId ?? charInput.uniEquipId,
      phaseLevel: phaseLevel ?? charInput.phaseLevel,
      level: phase.attributesKeyFrames[frameIndex ?? charInput.frameIndex].level,
      potential: charInput.potential,
      charSpec: charInput.charSpec,
    },
    charSpecConfigs,
  );

  return {
    /** 干员名称 */
    name: charData.name,
    /** 精英化等级 */
    phaseLevel: phaseLevel ?? charInput.phaseLevel,
    /** 干员精英化阶段选项 */
    phases,
    /** 干员精英化阶段 */
    phase,
    /** 干员等级 */
    frameIndex: frameIndex ?? charInput.frameIndex,
    /** 干员等级选项 */
    keyFrames: phase.attributesKeyFrames,
    /** 潜能 */
    potential: charInput.potential,
    /** 技能键名 */
    skillKey: skillKey ?? charInput.skillKey,
    /** 技能选项 */
    skills,
    /** 技能等级 */
    skillLevel: skillLevel ?? charInput.skillLevel,
    /** 技能等级选项 */
    skillLevels,
    /** 技能数据 */
    skill: skillItem,
    /** 模组ID */
    uniEquipId: uniEquipId ?? charInput.uniEquipId,
    /** 模组选项 */
    equips: uniEquips,
    /** 模组等级 */
    uniEquipLevel: uniEquipLevel ?? charInput.uniEquipLevel,
    /** 模组数据 */
    uniEquip: uniEquipItem,
    /** 模组名称 */
    uniEquipName,
    /** 干员属性额外修改 */
    attributeModifier: charInput.attributeModifier,
    /** 干员特殊配置 */
    charSpec,
  };
}

/** 获取干员初始状态 */
export function getInitCharState(charData: CharData) {
  /** 精英化等级 */
  const maxPhaseLevel = charData.phases.length - 1;
  /** 干员等级 */
  const maxFrameIndex = charData.phases[maxPhaseLevel].attributesKeyFrames.length - 1;
  /** 最后一个技能键名 */
  const lastSkillKey = charData.skills.map((skill) => skill.skillId).pop() || "";
  /** 最大技能等级 */
  const skillLevel = maxPhaseLevel > 1 && parseInt(charData.rarity.slice(-1)) > 3 ? 9 : 6;
  /** 潜能 */
  const potential = 5;
  return {
    phaseLevel: maxPhaseLevel,
    frameIndex: maxFrameIndex,
    skillKey: lastSkillKey,
    skillLevel: skillLevel,
    potential,
  };
}

/** 获取干员精英化阶段选项 */
export function getPhases(charData: CharData) {
  return charData.phases;
}

/** 获取干员精英化阶段 */
export function getPhase(phases: CharPhase[], phaseLevel: number) {
  return phases[phaseLevel];
}

/** 获取干员精英化阶段属性 */
export function getKeyFrames(phase: CharPhase) {
  return phase.attributesKeyFrames;
}

/** 获取干员技能选项 */
export function getSkills(charData: CharData, skill_table: Record<string, SkillData>) {
  return charData.skills.map((skill) => skill_table[skill.skillId]);
}

/** 获取干员技能 */
export function getSkillCandidate(skills: SkillData[], skillKey: string) {
  return skills.find((skill) => skill.skillId === skillKey)!;
}

/** 获取干员技能等级选项 */
export function getSkillLevels(skill: SkillData, phaseLevel: number) {
  const levels =
    phaseLevel > 1 && skill.levels.length > 7
      ? [
          { key: 3, name: "4级" },
          { key: 6, name: "7级" },
          { key: 7, name: "专精一" },
          { key: 8, name: "专精二" },
          { key: 9, name: "专精三" },
        ]
      : phaseLevel > 0
        ? [
            { key: 3, name: "4级" },
            { key: 6, name: "7级" },
          ]
        : [{ key: 3, name: "4级" }];
  return levels;
}

/** 获取干员技能等级 */
export function getSkillItem(skillCandidate: SkillData, skillLevel: number) {
  return skillCandidate.levels[skillLevel];
}

/** 获取干员模组选项 */
export function getUniEquips(
  charData: CharData,
  phaseLevel: number,
  frameIndex: number,
  uniequip_table: Record<string, UniEquipData>,
) {
  if (phaseLevel === 2 && frameIndex === 1 && parseInt(charData.rarity.slice(-1)) > 3) {
    return Object.values(uniequip_table).filter((uniEquip) =>
      uniEquip.uniEquipId.endsWith(charData.potentialItemId.split("_").pop()!),
    );
  }
  return [];
}

export function getUniEquipCandidate(uniEquips: UniEquipData[], uniEquipId: string) {
  return uniEquips.find((uniEquip) => uniEquip.uniEquipId === uniEquipId);
}

/** 获取干员模组 */
export function getUniEquipItem(uniEquipCandidate: UniEquipData, uniEquipLevel: number) {
  return uniEquipCandidate.phases?.[uniEquipLevel];
}

export function updateCharSpec(
  charInput: {
    skillKey: string;
    uniEquipId: string;
    phaseLevel: number;
    level: number;
    potential: number;
    charSpec: CharSpec[];
  },
  charSpecConfigs: CharSpecConfig[],
) {
  const { phaseLevel, potential, level, charSpec } = charInput;
  return charSpecConfigs.map((config, index) => {
    const active =
      config.requiredPotentialRank <= potential &&
      config.unlockCondition.phase <= phaseLevel &&
      config.unlockCondition.level <= level;
    const key = config.options.find((option) => option.key === charSpec[index]?.key)?.key || config.options[0].key;
    const value = config.options.find((option) => option.key === key)?.value || config.options[0].value;
    return config.apply(key, value, active);
  });
}
