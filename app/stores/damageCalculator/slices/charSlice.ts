import type { CharData, RelicWrapper } from "~/types/gameData";
import type { SliceCreator, SlicedCalcCharActions, SlicedCalcCharState } from "../calcTypes";
import { intialCalcCharState } from "../calcConstants";
import {
  updateCharState,
  getInitCharState,
  getPhase,
  getPhases,
  getSkillCandidate,
  getSkillItem,
  getSkills,
  getUniEquipCandidate,
  getUniEquipItem,
  getUniEquips,
  getSkillLevels,
} from "../calcUtils/charUtils";
import { wrapRelicData } from "~/modules/Tool/DamageCalculator/utils";

export const createCharSlice: SliceCreator<SlicedCalcCharState & SlicedCalcCharActions> = (set, get) => ({
  ...intialCalcCharState,
  addCharData: () =>
    set(
      (state) => ({
        ...state,
        charList: [...state.charList, undefined],
      }),
      undefined,
      "addCharData",
    ),
  setCharData: (charData: CharData, i: number) =>
    set(
      (state) => {
        const charList = state.charList;
        charList[i] = charData;
      },
      undefined,
      "setCharData",
    ),
  setActiveCharName: (charName, skill_table, uniequip_table) => {
    // TODO 缓存
    const state = get();
    const { charList } = state;
    const charData = charList.find((charData) => charData?.name === charName);
    if (!charData) throw new Error(`${charName} Not Found`);

    // 获取干员初始状态
    const { phaseLevel, frameIndex, skillKey, skillLevel, potential } = getInitCharState(charData);
    const phases = getPhases(charData);
    const phase = getPhase(phases, phaseLevel);
    const skills = getSkills(charData, skill_table);
    const skillCandidate = getSkillCandidate(skills, skillKey);
    const skillItem = getSkillItem(skillCandidate, skillLevel);
    const uniEquips = getUniEquips(charData, phaseLevel, frameIndex, uniequip_table);
    const uniEquipId = uniEquips.length ? uniEquips.slice().pop()!.uniEquipId : "";
    const uniEquipLevel = 2;
    const uniEquipCandidate = getUniEquipCandidate(uniEquips, uniEquipId);
    const uniEquipName = uniEquipCandidate ? uniEquipCandidate.uniEquipName : "";
    const uniEquipItem = uniEquipCandidate ? getUniEquipItem(uniEquipCandidate, uniEquipLevel) : undefined;

    // 获取干员属性额外修改，可能有缓存
    const charModifier = state.charsModifier[charName] || {
      atkOutPercent: 0,
      atkInPercent: 0,
      atkFinal: 0,
      atkSpd: 0,
    };

    // 更新藏品状态
    const rogueKey = state.rogueInput.topic;
    const relicList = state.relicList;
    const relicWrappers = relicList.map((relic) => wrapRelicData(relic, charData));

    set(
      (state) => {
        state.activeCharName = charName;
        state.charData = charData;
        state.charsModifier[charName] = charModifier;
        state.charState = {
          /** 精英化等级 */
          phaseLevel,
          /** 干员精英化阶段选项 */
          phases,
          /** 干员精英化阶段 */
          phase,
          /** 干员等级 */
          frameIndex,
          /** 干员等级选项 */
          keyFrames: phase.attributesKeyFrames,
          /** 潜能 */
          potential,
          /** 技能键名 */
          skillKey,
          /** 技能选项 */
          skills,
          /** 技能等级 */
          skillLevel,
          /** 技能等级选项 */
          skillLevels: getSkillLevels(skillCandidate, phaseLevel),
          /** 技能数据 */
          skill: skillItem,
          /** 模组ID */
          uniEquipId,
          /** 模组选项 */
          equips: uniEquips,
          /** 模组等级 */
          uniEquipLevel,
          /** 模组数据 */
          uniEquip: uniEquipItem,
          /** 模组名称 */
          uniEquipName,
          /** 干员属性额外修改 */
          attributeModifier: charModifier,
        };
        /** 根据干员属性，更新藏品状态 */
        state.relicsMap[rogueKey] = relicWrappers as RelicWrapper[];
      },
      undefined,
      "setActiveCharName",
    );
  },
  removeCharData: (i) =>
    set(
      (state) => {
        const charList = state.charList;
        let activeCharName = state.activeCharName;
        const charName = charList[i]!.name;
        charList.splice(i, 1);
        if (!charList.length) {
          if (activeCharName === charName) activeCharName = "";
        } else {
          activeCharName = charList[0]!.name;
        }
      },
      undefined,
      "removeCharData",
    ),
  setCharsModifier: (charName, modifier) => {
    set(
      (state) => {
        state.charsModifier[charName] = modifier;
        state.charState.attributeModifier = modifier;
      },
      undefined,
      "setCharsModifier",
    );
  },
  setPhaseLevel: (phaseLevel: string) => {
    set(
      (state) => {
        const phaseLevelInt = parseInt(phaseLevel);
        if (isNaN(phaseLevelInt) || phaseLevelInt < 0 || phaseLevelInt > 1) throw new Error("Invalid phase level");
        state.charState = updateCharState({
          charState: state.charState,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          phaseLevel: parseInt(phaseLevel),
        });
      },
      undefined,
      "setPhaseLevel",
    );
  },
  setFrameIndex: (frameIndex: string) => {
    set(
      (state) => {
        if (isNaN(parseInt(frameIndex))) throw new Error("Invalid frame index");
        state.charState = updateCharState({
          charState: state.charState,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          frameIndex: parseInt(frameIndex),
        });
      },
      undefined,
      "setFrameIndex",
    );
  },
  /** 设置潜能 */
  setPotential: (potential: string) => {
    set(
      (state) => {
        const potentialInt = parseInt(potential);
        if (isNaN(potentialInt) || potentialInt < 0 || potentialInt > 5) throw new Error("Invalid potential");
        state.charState.potential = potentialInt;
      },
      undefined,
      "setPotential",
    );
  },
  /** 设置技能键名 */
  setSkillKey: (skillKey: string) => {
    set(
      (state) => {
        state.charState = updateCharState({
          charState: state.charState,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          skillKey,
        });
      },
      undefined,
      "setSkillKey",
    );
  },
  /** 设置技能等级 */
  setSkillLevel: (skillLevel: string) => {
    set(
      (state) => {
        const skillLevelInt = parseInt(skillLevel);
        const skillLevels = state.charState.skillLevels;
        if (isNaN(skillLevelInt) || !skillLevels.find((skillLevel) => skillLevel.key === skillLevelInt))
          throw new Error("Invalid skill level");
        state.charState = updateCharState({
          charState: state.charState,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          skillLevel: skillLevelInt,
        });
      },
      undefined,
      "setSkillLevel",
    );
  },
  /** 设置模组ID */
  setUniEquipId: (uniEquipId: string) => {
    set(
      (state) => {
        const uniEquips = state.charState.equips;
        if (!uniEquips.find((uniEquip) => uniEquip.uniEquipId === uniEquipId)) throw new Error("Invalid uniEquipId");
        state.charState = updateCharState({
          charState: state.charState,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          uniEquipId,
        });
      },
      undefined,
      "setUniEquipId",
    );
  },
  /** 设置模组等级 */
  setUniEquipLevel: (uniEquipLevel: string) => {
    set(
      (state) => {
        const uniEquipLevelInt = parseInt(uniEquipLevel);
        if (isNaN(uniEquipLevelInt) || uniEquipLevelInt < 0 || uniEquipLevelInt > 2)
          throw new Error("Invalid uniEquipLevel");
        state.charState = updateCharState({
          charState: state.charState,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          uniEquipLevel: uniEquipLevelInt,
        });
      },
      undefined,
      "setUniEquipLevel",
    );
  },
});
