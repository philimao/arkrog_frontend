import type { RelicWrapper } from "~/types/gameData";
import type { RogueInput, SlicedCalcGameDataState } from "../calcTypes";
import type { SliceCreator, SlicedCalcGameDataActions } from "../calcTypes";
import { initialCalcGameDataState } from "../calcConstants";

export const createGameDataSlice: SliceCreator<SlicedCalcGameDataState & SlicedCalcGameDataActions> = (set) => ({
  ...initialCalcGameDataState,
  setRelicWrapper: (rogueKey, relics) =>
    set(
      (state) => {
        state.relicsMap[rogueKey] = relics;
      },
      false,
      "setRelicWrapper",
    ),
  updateRelic: (id, key, value) =>
    set(
      (state) => {
        const relicWrappers = state.relicsMap[state.rogueInput.topic] as RelicWrapper[];
        if (relicWrappers) {
          relicWrappers.find((relicWrapper) => relicWrapper.id === id)![key as keyof RelicWrapper] = value as never;
        }
      },
      false,
      "updateRelic",
    ),
  updateRelics: (ids, key, value) =>
    set(
      (state) => {
        const relicWrappers = state.relicsMap[state.rogueInput.topic] as RelicWrapper[];
        if (relicWrappers) {
          relicWrappers
            .filter((relicWrapper) => ids.includes(relicWrapper.id))
            .forEach((relicWrapper) => {
              relicWrapper[key as keyof RelicWrapper] = value as never;
            });
        }
      },
      false,
      "updateRelics",
    ),
  setRelicLayer: (id: string, layer: string) => {
    const layerNumber = parseInt(layer);
    set(
      (state) => {
        state.relicsMap[state.rogueInput.topic].find((r) => r.id === id)!.layer = layerNumber || 0;
      },
      undefined,
      "setRelicLayer",
    );
    return layerNumber.toString();
  },
  setSelectedIds: (ids) => set((state) => ({ ...state, selectedIds: ids }), undefined, "setSelectedIds"),
  selectRelic: (id) =>
    set(
      (state) => {
        if (!state.selectedIds.includes(id)) {
          state.selectedIds.push(id);
        }
      },
      undefined,
      "selectRelic",
    ),
  unselectRelic: (id) =>
    set(
      (state) => {
        if (state.selectedIds.includes(id)) {
          state.selectedIds.splice(state.selectedIds.indexOf(id), 1);
        }
      },
      undefined,
      "unselectRelic",
    ),
  toggleRelicSelection: (id) => {
    set(
      (state) => {
        if (state.selectedIds.includes(id)) {
          const i = state.selectedIds.indexOf(id);
          state.selectedIds.splice(i, 1);
        } else {
          state.selectedIds.push(id);
        }
      },
      undefined,
      "toggleRelicSelection",
    );
  },
  setTopicSpecItems: (callback) =>
    set(
      (state) => {
        state.topicSpecItems = callback(state.topicSpecItems);
      },
      undefined,
      "setTopicSpecItems",
    ),
  setRogueKey: (rogueKey) => set((state) => ({ ...state, rogueKey }), undefined, "setRogueKey"),
  setRogueInput: (rogueInput: RogueInput) => set((state) => ({ ...state, rogueInput }), undefined, "setRogueInput"),
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
      (state) => {
        state.rogueInput[state.rogueInput.topic].zone = zone;
      },
      undefined,
      "setRogueZone",
    ),
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.thoughtLoad = thoughtLoad;
      },
      undefined,
      "setRogueThoughtLoad",
    ),
  setRougeTech: (tech) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.tech = tech;
      },
      undefined,
      "setRogueThoughtLoad",
    ),
  setStageData: (stageData) => set((state) => ({ ...state, stageData }), undefined, "setStageData"),
  setLevelData: (levelData) => set((state) => ({ ...state, levelData }), undefined, "setLevelData"),
});
