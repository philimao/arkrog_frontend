import type { CharData } from "~/types/gameData";
import type { CharInput, CharSpec, SliceCreator, SlicedCalcCharActions, SlicedCalcCharState } from "../calcTypes";
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
  updateCharSpec,
} from "../calcUtils/charUtils";
import { getCharImpl } from "~/modules/Tool/DamageCalculator/calculator/impls";
import { calculatorStorage } from "../localStorage";

export const createCharSlice: SliceCreator<SlicedCalcCharState & SlicedCalcCharActions> = (set, get) => ({
  ...intialCalcCharState,
  addCharData: () =>
    set(
      (state) => {
        state.charList = [...state.charList, undefined] as CharData[];
      },
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
    const localState = calculatorStorage.read();
    const localCharState = localState?.charStates[charName];
    const initCharState = getInitCharState(charData);
    const phaseLevel = localCharState?.phaseLevel ?? initCharState.phaseLevel;
    const frameIndex = localCharState?.frameIndex ?? initCharState.frameIndex;
    const skillKey = localCharState?.skillKey ?? initCharState.skillKey;
    const skillLevel = localCharState?.skillLevel ?? initCharState.skillLevel;
    const potential = localCharState?.potential ?? initCharState.potential;

    const phases = getPhases(charData);
    const phase = getPhase(phases, phaseLevel);
    const skills = getSkills(charData, skill_table);
    const skillCandidate = getSkillCandidate(skills, skillKey);
    const skillItem = getSkillItem(skillCandidate, skillLevel);
    const uniEquips = getUniEquips(charData, phaseLevel, frameIndex, uniequip_table);
    const uniEquipId = localCharState?.uniEquipId ?? (uniEquips.length ? uniEquips.slice().pop()!.uniEquipId : "");
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

    const configs = getCharImpl(charName).charSpecConfigs;
    const charSpecConfigs = ["default", skillKey, uniEquipId]
      .map((key) => configs[key])
      .filter((i) => i)
      .flat();
    const charSpec = updateCharSpec(
      {
        skillKey,
        uniEquipId,
        phaseLevel,
        level: phase.attributesKeyFrames[frameIndex].level,
        potential,
        charSpec: [], // 初始化时可以传入空数组，但后续必须传入包含key的配置
      },
      charSpecConfigs,
    );

    set(
      (state) => {
        state.activeCharName = charName;
        state.charData = charData;
        state.charsModifier[charName] = charModifier;
        state.charSpecConfigs = charSpecConfigs;
        state.charInput = {
          /** 干员名称 */
          name: charName,
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
          /** 是否为伺烛客 rogue_5限定 */
          candleHolder: localCharState?.candleHolder ?? false,
          /** 是否在化境地块上 */
          dygmnyTile: localCharState?.dygmnyTile ?? false,
          /** 干员特殊配置 */
          charSpec,
        };
      },
      undefined,
      "setActiveCharName",
    );
  },
  removeActiveCharName: () => {
    set(
      (state) => {
        state.activeCharName = "";
        state.charsModifier = {};
        state.charData = undefined as unknown as CharData;
        state.charInput = undefined as unknown as CharInput;
        state.charSpecConfigs = [];
      },
      undefined,
      "removeActiveCharName",
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
        state.charInput.attributeModifier = modifier;
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
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          phaseLevel: parseInt(phaseLevel),
          charSpecConfigs: state.charSpecConfigs,
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
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          frameIndex: parseInt(frameIndex),
          charSpecConfigs: state.charSpecConfigs,
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
        state.charInput.potential = potentialInt;
      },
      undefined,
      "setPotential",
    );
  },
  /** 设置技能键名 */
  setSkillKey: (skillKey: string) => {
    set(
      (state) => {
        const charName = state.charInput.name;
        const uniEquipId = state.charInput.uniEquipId;
        const configs = getCharImpl(charName).charSpecConfigs;
        const charSpecConfigs = ["default", skillKey, uniEquipId]
          .map((key) => configs[key])
          .filter((i) => i)
          .flat();
        state.charSpecConfigs = charSpecConfigs;
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          skillKey,
          charSpecConfigs: charSpecConfigs,
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
        const skillLevels = state.charInput.skillLevels;
        if (isNaN(skillLevelInt) || !skillLevels.find((skillLevel) => skillLevel.key === skillLevelInt))
          throw new Error("Invalid skill level");
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          skillLevel: skillLevelInt,
          charSpecConfigs: state.charSpecConfigs,
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
        const uniEquips = state.charInput.equips;
        if (!uniEquips.find((uniEquip) => uniEquip.uniEquipId === uniEquipId)) throw new Error("Invalid uniEquipId");
        const charName = state.charInput.name;
        const skillKey = state.charInput.skillKey;
        const configs = getCharImpl(charName).charSpecConfigs;
        const charSpecConfigs = ["default", skillKey, uniEquipId]
          .map((key) => configs[key])
          .filter((i) => i)
          .flat();
        state.charSpecConfigs = charSpecConfigs;
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          uniEquipId,
          charSpecConfigs: charSpecConfigs,
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
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          uniEquipLevel: uniEquipLevelInt,
          charSpecConfigs: state.charSpecConfigs,
        });
      },
      undefined,
      "setUniEquipLevel",
    );
  },
  setCandleHolder: (candleHolder: boolean) => {
    set(
      (state) => {
        state.charInput.candleHolder = candleHolder;
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          charSpecConfigs: state.charSpecConfigs,
        });
      },
      undefined,
      "setCandleHolder",
    );
  },
  setDygmnyTile: (dygmnyTile: boolean) => {
    set(
      (state) => {
        state.charInput.dygmnyTile = dygmnyTile;
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          charSpecConfigs: state.charSpecConfigs,
        });
      },
      undefined,
      "setDygmnyTile",
    );
  },
  setCharSpec: (label: string, key: string) => {
    set(
      (state) => {
        const charSpec = state.charInput.charSpec;
        const spec: CharSpec[] = JSON.parse(JSON.stringify(charSpec));
        const specItem = spec.find((spec) => spec.label === label);
        if (specItem) specItem.key = key;
        state.charInput.charSpec = spec;
        state.charInput = updateCharState({
          charInput: state.charInput,
          charData: state.charData,
          uniequip_table: state.uniequip_table,
          charSpecConfigs: state.charSpecConfigs,
        });
      },
      undefined,
      "setCharSpec",
    );
  },
});
