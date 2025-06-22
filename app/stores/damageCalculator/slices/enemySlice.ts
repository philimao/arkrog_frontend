import { parseEnemyData } from "~/modules/Tool/DamageCalculator/EnemySection/enemyUtils";
import { initialEnemyState } from "../calcConstants";
import type { SliceCreator, SlicedCalcEnemyActions, SlicedCalcEnemyState } from "../calcTypes";
import { EnemySpecConfigs, Rogue4SkzdwxSelect } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";
import { getEnemyIllust } from "../calcUtils/enemyUtils";

export const createEnemySlice: SliceCreator<SlicedCalcEnemyState & SlicedCalcEnemyActions> = (set) => ({
  ...initialEnemyState,
  setEnemyData: (enemyData) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        const difficulty = state.rogueInput[rogueKey].difficulty;
        state.enemyData = enemyData;
        state.enemyBase = parseEnemyData(enemyData);
        let enemyConfig = EnemySpecConfigs[enemyData.id] || {
          id: enemyData.id,
          name: enemyData.name.m_value,
          selects: [],
        };
        // 为萨卡兹敌人添加年代印痕选项，这里不能直接修改enemyConfig，该对象被冻结
        if (rogueKey === "rogue_4") {
          enemyConfig = {
            ...enemyConfig,
            selects: [...enemyConfig.selects, Rogue4SkzdwxSelect],
          };
        }
        state.enemyConfig = enemyConfig;
        state.enemyIllust = getEnemyIllust(enemyConfig);
        state.enemySpec = {
          id: enemyData.id,
          value: enemyConfig.selects.map((select) => select.apply(select.options[0].value)),
        };
        /** 当难度大于等于14时，为年代之刺与饮泣之刺设置年代印痕减伤 */
        if (
          rogueKey === "rogue_4" &&
          difficulty >= 14 &&
          ["trap_760_skztzs", "enemy_2073_skzrck"].includes(enemyData.id)
        ) {
          state.enemySpec.value[0].value = 0.5;
        }
      },
      undefined,
      "setEnemyData",
    ),
  updateEnemySpec: (index: number, value: string) =>
    set(
      (state) => {
        const valueNum = Number(value);
        if (isNaN(valueNum)) throw new Error("Invalid value");
        state.enemySpec.value[index].value = valueNum;
      },
      undefined,
      "updateEnemySpec",
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
  setEnemyIllust: (enemyIllust) =>
    set(
      (state) => ({
        ...state,
        enemyIllust,
      }),
      undefined,
      "setEnemyIllust",
    ),
});
