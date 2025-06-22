import type { RogueInput, SlicedCalcGameDataState } from "../calcTypes";
import type { SliceCreator, SlicedCalcGameDataActions } from "../calcTypes";
import { initialCalcGameDataState } from "../calcConstants";
import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";

export const createGameDataSlice: SliceCreator<SlicedCalcGameDataState & SlicedCalcGameDataActions> = (set) => ({
  ...initialCalcGameDataState,
  setTopicSpecItems: (callback) =>
    set(
      (state) => {
        state.topicSpecItems = callback(state.topicSpecItems);
      },
      undefined,
      "setTopicSpecItems",
    ),
  setRogueInput: (rogueInput: RogueInput) => set((state) => ({ ...state, rogueInput }), undefined, "setRogueInput"),
  setRogueKey: (rogueKey) =>
    set(
      async (state) => {
        state.rogueInput.topic = rogueKey;
        state.renderStages = getStageList(state.stages, state.rogueInput);
        state.stageId = state.renderStages[0].id;
        await handleUpdateStageId({
          rogueInput: state.rogueInput,
          stages: state.stages,
          levels: state.levels,
          selectedIds: state.selectedIds,
          stageId: state.stageId,
        }); // immer可以获得最新的state
      },
      undefined,
      "setRogueKey",
    ),
  setRogueDifficulty: (difficulty) => {
    return set(
      (state) => {
        state.rogueInput[state.rogueInput.topic].difficulty = difficulty;
      },
      undefined,
      "setRogueDifficulty",
    );
  },
  setRogueZone: (zone) =>
    set(
      async (state) => {
        state.rogueInput[state.rogueInput.topic].zone = zone;
        state.renderStages = getStageList(state.stages, state.rogueInput);
        state.stageId = state.renderStages[0].id;
        const { stageData, levelData, levels, selectedIds, enemyData, enemyBase } = await handleUpdateStageId({
          rogueInput: state.rogueInput,
          stages: state.stages,
          levels: state.levels,
          selectedIds: state.selectedIds,
          stageId: state.stageId,
        });
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.selectedIds = selectedIds;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "setRogueZone",
    ),
  setRogueStageId: (stageId) =>
    set(
      async (state) => {
        state.stageId = stageId;
        const { stageData, levelData, levels, selectedIds, enemyData, enemyBase } = await handleUpdateStageId({
          rogueInput: state.rogueInput,
          stages: state.stages,
          levels: state.levels,
          selectedIds: state.selectedIds,
          stageId,
        });
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.selectedIds = selectedIds;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "setRogueStageId",
    ),
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
