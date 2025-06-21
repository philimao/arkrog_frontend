import type { EnemyData } from "~/types/gameData";
import { dummy } from "../calcConstants";
import type { SliceCreator, SlicedCalcEnemyActions, SlicedCalcEnemyState } from "../calcTypes";
import type { BuffContext } from "~/modules/Tool/DamageCalculator/calculator";
import type { EnemySpec } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";

export const createEnemySlice: SliceCreator<SlicedCalcEnemyState & SlicedCalcEnemyActions> = (set) => ({
  enemyBase: dummy,
  enemyDataParsed: dummy,
  enemyData: undefined as unknown as EnemyData,
  enemyContext: undefined as unknown as BuffContext,
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
  setEnemyDataParsed: (enemyDataParsed) =>
    set(
      (state) => ({
        ...state,
        enemyDataParsed: enemyDataParsed,
      }),
      undefined,
      "setEnemyDataParsed",
    ),
  enemySpec: undefined as unknown as EnemySpec,
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
