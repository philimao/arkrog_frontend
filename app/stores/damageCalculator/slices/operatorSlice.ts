import type { AttributeModifier, CharData } from "~/types/gameData";
import type { SliceCreator, SlicedCalcOperatorActions, SlicedCalcOperatorState } from "../calcTypes";

export const createOperatorSlice: SliceCreator<SlicedCalcOperatorState & SlicedCalcOperatorActions> = (set) => ({
  charList: [] as CharData[],
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
  activeCharName: "",
  setActiveCharName: (charName) =>
    set((state) => ({ ...state, activeCharName: charName }), undefined, "setActiveCharName"),
  charsModifier: {} as Record<string, AttributeModifier>,
  setCharsModifier: (charName, modifier) => {
    set(
      (state) => {
        state.charsModifier[charName] = modifier;
      },
      undefined,
      "setCharsModifier",
    );
  },
});
