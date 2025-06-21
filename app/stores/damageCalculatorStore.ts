import { create } from "zustand/index";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { createGameDataSlice } from "./damageCalculator/slices/gameDataSlice";
import { createOperatorSlice } from "./damageCalculator/slices/operatorSlice";
import { createEnemySlice } from "./damageCalculator/slices/enemySlice";
import { createCalculaotrSlice } from "./damageCalculator/slices/calculatorSlice";
import { createUISlice } from "./damageCalculator/slices/uiSlice";
import type { DCalculatorActions, DCalculatorState } from "./damageCalculator/calcTypes";

export const useDamageCalculatorStore = create<DCalculatorState & DCalculatorActions>()(
  devtools(
    immer((set, get, api) => ({
      ...createGameDataSlice(set, get, api),
      ...createOperatorSlice(set, get, api),
      ...createEnemySlice(set, get, api),
      ...createCalculaotrSlice(set, get, api),
      ...createUISlice(set, get, api),
    })),
    { name: "damageCalculatorStore" },
  ),
);
