import type { RogueInput, SlicedCalcGameDataState } from "../calcTypes";
import type { SliceCreator, SlicedCalcGameDataActions } from "../calcTypes";
import { initialCalcGameDataState } from "../calcConstants";

import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";
import { RogueTopic, type RogueKey } from "~/types/gameData";
import { calculatorStorage, type Rouge4State } from "../localStorage";

export const createGameDataSlice: SliceCreator<SlicedCalcGameDataState & SlicedCalcGameDataActions> = (set, get) => ({
  ...initialCalcGameDataState,
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
    const { stageData, levelData, levels, selectedIds, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages: state.stages,
      levels: state.levels,
      selectedIds: localRogueTopic?.relics || [],
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
        state.selectedIdsMap[rogueTopic] = selectedIds;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
        // 萨卡兹肉鸽 设置思维负荷和灵感
        if (rogueTopic === RogueTopic.ROGUE_4) {
          state.rogueInput[rogueTopic].thoughtLoad = (localRogueTopic as Rouge4State).thoughtLoad;
          state.rogueInput[rogueTopic].inspiration = (localRogueTopic as Rouge4State).inspiration;
        }
        // 界园肉鸽 设置岁时和通宝
        if (rogueTopic === RogueTopic.ROGUE_5) {
          // state.rogueInput[topic].era = (rogueState as Rouge5State).era;
          // state.rogueInput[topic].treasure = (rogueState as Rouge5State).treasure;
        }
      },
      undefined,
      "setRogueKey",
    );
  },
  setRogueDifficulty: (difficulty) => {
    return set(
      (state) => {
        console.log("setRogueDifficulty", get().rogueInput.topic);
        console.log("setRogueDifficulty", state.rogueInput.topic);
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
    const { stageData, levelData, levels, selectedIds, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages: state.stages,
      levels: state.levels,
      selectedIds: state.selectedIdsMap[rogueKey],
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
        state.selectedIdsMap[state.rogueInput.topic] = selectedIds;
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
    const { stageData, levelData, levels, selectedIds, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput: state.rogueInput,
      stages: state.stages,
      levels: state.levels,
      selectedIds: state.selectedIdsMap[rogueKey],
      stageId,
    });
    set(
      (state) => {
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.selectedIdsMap[rogueKey] = selectedIds;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "setRogueStageId",
    );
  },
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        if (rogueKey === "rogue_4") {
          state.rogueInput[rogueKey].thoughtLoad = thoughtLoad;
        }
      },
      undefined,
      "setRogueThoughtLoad",
    ),
  setRogueTech: (tech) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        state.rogueInput[rogueKey].tech = tech;
      },
      undefined,
      "setRogueTech",
    ),
});
