import { initialEnemyState } from "../calcConstants";
import type { SliceCreator, SlicedCalcEnemyActions, SlicedCalcEnemyState } from "../calcTypes";
import type { BuffContext } from "~/modules/Tool/DamageCalculator/calculator";

export const createEnemySlice: SliceCreator<SlicedCalcEnemyState & SlicedCalcEnemyActions> = (set) => ({
  ...initialEnemyState,
  setEnemyContext: (enemyContext: BuffContext) =>
    set((state) => ({ ...state, enemyContext }), undefined, "setEnemyContext"),
  setEnemyData: (enemyData) =>
    set(
      (state) => ({
        ...state,
        enemyData,
      }),
      undefined,
      "setEnemyData",
    ),
  setEnemyBase: (enemyBase) =>
    set(
      (state) => ({
        ...state,
        enemyBase,
      }),
      undefined,
      "setEnemyBase",
    ),
  setEnemyInput: (enemyInput) =>
    set(
      (state) => ({
        ...state,
        enemyInput: enemyInput,
      }),
      undefined,
      "setEnemyInput",
    ),
  setEnemySpec: (enemySpec) =>
    set(
      (state) => {
        // 字符串判断，解决enemyData与enemySpec的组件层级不同，更新不同步的问题
        if (JSON.stringify(state.enemySpec) === JSON.stringify(enemySpec)) return;
        state.enemySpec = enemySpec;
      },
      undefined,
      "setEnemySpec",
    ),
});
