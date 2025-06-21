import type { SliceCreator, SlicedCalcUIActions, SlicedCalcUIState } from "../calcTypes";

export const createUISlice: SliceCreator<SlicedCalcUIState & SlicedCalcUIActions> = (set) => ({
  showRelics: false as boolean,
  toggleShowRelics: () =>
    set(
      (state) => ({
        ...state,
        showRelics: !state.showRelics,
      }),
      undefined,
      "toggleShowRelics",
    ),
  showTopicSpec: false as boolean,
  toggleShowTopicSpec: () =>
    set(
      (state) => ({
        ...state,
        showTopicSpec: !state.showTopicSpec,
      }),
      undefined,
      "toggleShowTopicSpec",
    ),
});
