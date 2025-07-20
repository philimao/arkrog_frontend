import type { SliceCreator, SlicedCalcUIActions, SlicedCalcUIState } from "../calcTypes";

export const createUISlice: SliceCreator<SlicedCalcUIState & SlicedCalcUIActions> = (set) => ({
  showRelics: false as boolean,
  toggleShowRelics: () =>
    set(
      (state) => {
        if (!state.showRelics && state.showTopicSpec) {
          state.showTopicSpec = false;
        }
        state.showRelics = !state.showRelics;
      },
      undefined,
      "toggleShowRelics",
    ),
  showTopicSpec: false as boolean,
  toggleShowTopicSpec: () =>
    set(
      (state) => {
        if (!state.showTopicSpec && state.showRelics) {
          state.showRelics = false;
        }
        state.showTopicSpec = !state.showTopicSpec;
      },
      undefined,
      "toggleShowTopicSpec",
    ),
});
