import type { SlicedCalcRelicActions, SlicedCalcRelicState } from "../calcTypes";
import { initialRelicState } from "../calcConstants";
import type { SliceCreator } from "../calcTypes";
import type { RelicWrapper } from "~/types/gameData";

export const createRelicSlice: SliceCreator<SlicedCalcRelicState & SlicedCalcRelicActions> = (set) => ({
  ...initialRelicState,
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
    const layerNumber = parseInt(layer) || 0;
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
          const updated = [...state.selectedIds, id];
          set((state) => ({ ...state, selectedIds: updated }), undefined, "selectRelic");
        }
      },
      undefined,
      "selectRelic",
    ),
  unselectRelic: (id) =>
    set(
      (state) => {
        if (state.selectedIds.includes(id)) {
          const updated = state.selectedIds.filter((i) => i !== id);
          set(
            (state) => {
              state.selectedIds = updated;
            },
            undefined,
            "unselectRelic",
          );
        }
      },
      undefined,
      "unselectRelic",
    ),
  toggleRelicSelection: (id) => {
    set(
      (state) => {
        const updated = [...state.selectedIds];
        if (state.selectedIds.includes(id)) {
          const i = updated.indexOf(id);
          updated.splice(i, 1);
        } else {
          updated.push(id);
        }
        state.selectedIds = updated;
      },
      undefined,
      "toggleRelicSelection",
    );
  },
});
