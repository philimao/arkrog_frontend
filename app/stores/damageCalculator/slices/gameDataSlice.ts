import type { RogueInput, SlicedCalcGameDataState } from "../calcTypes";
import type { SliceCreator, SlicedCalcGameDataActions } from "../calcTypes";
import { initialCalcGameDataState } from "../calcConstants";

import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";
import { RogueTopic, type RogueKey } from "~/types/gameData";
import { calculatorStorage, type Rouge4State, type Rouge5State } from "../localStorage";

export const createGameDataSlice: SliceCreator<SlicedCalcGameDataState & SlicedCalcGameDataActions> = (set, get) => ({
  ...initialCalcGameDataState,
  setRogue4DisasterSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue4_disaster_spec_items = callback(state.rogue4_disaster_spec_items);
      },
      undefined,
      "setRogue4DisasterSpecItems",
    ),
  setRogue4InspirationSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue4_inspiration_spec_items = callback(state.rogue4_inspiration_spec_items);
      },
      undefined,
      "setRogue4InspirationSpecItems",
    ),
  setRogue5WrathSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue5_wrath_spec_items = callback(state.rogue5_wrath_spec_items);
      },
      undefined,
      "setRogue5WrathSpecItems",
    ),
  setRogue5CopperSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue5_copper_spec_items = callback(state.rogue5_copper_spec_items);
      },
      undefined,
      "setRogue5CopperSpecItems",
    ),
  setTopicSpecItems: (callback) =>
    set(
      (state) => {
        state.topicSpecItems = callback(state.topicSpecItems);
      },
      undefined,
      "setTopicSpecItems",
    ),
  setRogueInput: (rogueInput: RogueInput) =>
    set(
      (state) => {
        state.rogueInput = rogueInput;
      },
      undefined,
      "setRogueInput",
    ),
  setRogueKey: async (rogueTopic: RogueTopic) => {
    const state = get();
    const rogueInput = JSON.parse(JSON.stringify(state.rogueInput));
    rogueInput.topic = rogueTopic;
    const localState = calculatorStorage.read();
    const localRogueTopic = localState?.rougeTopic[rogueTopic];
    const difficulty = localRogueTopic?.difficulty ?? rogueInput[rogueTopic].difficulty;
    const zone = localRogueTopic?.zone ?? rogueInput[rogueTopic].zone;
    const tech = localRogueTopic?.tech ?? rogueInput[rogueTopic].tech;

    rogueInput[rogueTopic].zone = zone;
    const renderStages = getStageList(state.stages, rogueInput);
    const stageId = localRogueTopic?.stage ?? renderStages[0].id;
    const { stageData, levelData, levels, relics, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages: state.stages,
      levels: state.levels,
      relics: localRogueTopic?.relics || [],
      stageId,
    }); // immer可以获得最新的state
    set(
      (state) => {
        state.rogueInput.topic = rogueTopic;
        state.rogueInput[rogueTopic].difficulty = difficulty;
        state.rogueInput[rogueTopic].zone = zone;
        state.rogueInput[rogueTopic].tech = tech;
        state.renderStages = renderStages;
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.rogueInput[rogueTopic].relics = relics;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
        // 萨卡兹肉鸽 设置思维负荷和灵感 (本地状态还原)
        if (rogueTopic === RogueTopic.ROGUE_4 && localRogueTopic) {
          state.rogueInput[rogueTopic].thoughtLoad = (localRogueTopic as Rouge4State).thoughtLoad;
          state.rogueInput[rogueTopic].inspiration = (localRogueTopic as Rouge4State).inspiration;
          state.rogueInput[rogueTopic].disaster = (localRogueTopic as Rouge4State).disaster;
        }
        // 界园肉鸽 设置岁时和通宝 (本地状态还原)
        if (rogueTopic === RogueTopic.ROGUE_5 && localRogueTopic) {
          state.rogueInput[rogueTopic].wraths = (localRogueTopic as Rouge5State).wraths;
          state.rogueInput[rogueTopic].coppers = (localRogueTopic as Rouge5State).coppers;
        }
      },
      undefined,
      "setRogueKey",
    );
  },
  setRogueDifficulty: (difficulty) => {
    return set(
      (state) => {
        state.rogueInput[get().rogueInput.topic].difficulty = difficulty;
      },
      undefined,
      "setRogueDifficulty",
    );
  },
  setRogueZone: async (zone) => {
    const state = get();
    const rogueInput = JSON.parse(JSON.stringify(state.rogueInput));
    rogueInput[rogueInput.topic].zone = zone;
    const rogueKey = rogueInput.topic as RogueKey;
    const renderStages = getStageList(state.stages, rogueInput);
    const stageId = renderStages[0].id;
    const { stageData, levelData, levels, relics, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages: state.stages,
      levels: state.levels,
      relics: state.rogueInput[rogueKey].relics,
      stageId,
    });
    set(
      (state) => {
        state.rogueInput[rogueKey].zone = zone;
        state.renderStages = renderStages;
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.rogueInput[rogueKey].relics = relics;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "setRogueZone",
    );
  },
  setRogueStageId: async (stageId) => {
    const state = get();
    const rogueKey = state.rogueInput.topic as RogueKey;
    const { stageData, levelData, levels, relics, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput: state.rogueInput,
      stages: state.stages,
      levels: state.levels,
      relics: state.rogueInput[rogueKey].relics,
      stageId,
    });
    set(
      (state) => {
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.rogueInput[rogueKey].relics = relics;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "setRogueStageId",
    );
  },
  setRogueTech: (tech) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        state.rogueInput[rogueKey].tech = tech;
      },
      undefined,
      "setRogueTech",
    ),
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.thoughtLoad = thoughtLoad;
      },
      undefined,
      "setRogueThoughtLoad",
    ),
  setRogue4Inspiration: (inspiration) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.inspiration = inspiration;
      },
      undefined,
      "setRogue4Inspiration",
    ),
  setRogue4Disaster: (disaster) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.disaster = disaster;
      },
      undefined,
      "setRogue4Disaster",
    ),
  setRogue5Wraths: (wraths) =>
    set(
      (state) => {
        if (Array.isArray(wraths)) {
          state.rogueInput.rogue_5.wraths = wraths;
        } else {
          const updated = [...state.rogueInput.rogue_5.wraths];
          if (updated.includes(wraths)) updated.splice(updated.indexOf(wraths), 1);
          else updated.unshift(wraths);
          state.rogueInput.rogue_5.wraths = updated;
        }
      },
      undefined,
      "setRogueWraths",
    ),
  setRogue5Coppers: (coppers) =>
    set(
      (state) => {
        if (Array.isArray(coppers)) {
          state.rogueInput.rogue_5.coppers = coppers;
        } else {
          const updated = [...state.rogueInput.rogue_5.coppers];
          if (updated.includes(coppers)) updated.splice(updated.indexOf(coppers), 1);
          else updated.unshift(coppers);
          state.rogueInput.rogue_5.coppers = updated;
        }
      },
      undefined,
      "setRogueCoppers",
    ),
});
