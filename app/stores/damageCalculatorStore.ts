import { create } from "zustand/index";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { createGameDataSlice } from "./damageCalculator/slices/gameDataSlice";
import { createCharSlice } from "./damageCalculator/slices/charSlice";
import { createEnemySlice } from "./damageCalculator/slices/enemySlice";
import { createCalculaotrSlice } from "./damageCalculator/slices/calculatorSlice";
import { createUISlice } from "./damageCalculator/slices/uiSlice";
import type { DCalculatorActions, DCalculatorState } from "./damageCalculator/calcTypes";

export const useDamageCalculatorStore = create<DCalculatorState & DCalculatorActions>()(
  devtools(
    immer((set, get, api) => ({
      ...createGameDataSlice(set, get, api),
      ...createCharSlice(set, get, api),
      ...createEnemySlice(set, get, api),
      ...createCalculaotrSlice(set, get, api),
      ...createUISlice(set, get, api),
    })),
    { name: "damageCalculatorStore" },
  ),
);
