import { BuffContext, CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";
import type { SliceCreator, SlicedCalculatorActions, SlicedCalculatorState } from "../calcTypes";
import { initialCalculatorState } from "../calcConstants";

export const createCalculaotrSlice: SliceCreator<SlicedCalculatorState & SlicedCalculatorActions> = (set, get) => ({
  ...initialCalculatorState,
  setRelicAnalysisResult: (relicAnalysisResult: BuffContext) =>
    set(
      (state) => {
        state.relicAnalysisResult = relicAnalysisResult;
      },
      undefined,
      "setRelicAnalysisResult",
    ),
  setGlobalAnalysisResult: (context) => {
    set(
      (state) => {
        state.globalAnalysisResult = context;
      },
      undefined,
      "setGlobalAnalysisResult",
    );
  },
  updateGlobalAnalysisResult: (input) => {
    const { stageData, enemyData, rogueInput } = get();
    const { charInput, charData, relics } = input;
    let globalContext = CalculatorHelper.createAdditionContext();
    // 干员养成加成
    if (charInput.attributeModifier) {
      globalContext = CalculatorHelper.analyzeChar({
        charInput: input.charInput,
        charData: input.charData,
      });
    }
    // 藏品加成
    globalContext = CalculatorHelper.analyzeRelics(
      {
        charInput,
        charData,
        relics,
        enemyData: enemyData,
        stageData,
      },
      globalContext,
    );
    globalContext = CalculatorHelper.analyzeRogueDifficulty(
      {
        rogueInput,
        enemyData,
      },
      globalContext,
    );
    let panelContext = CalculatorHelper.createAdditionContext();
    panelContext = CalculatorHelper.analyzeRelics(
      {
        charInput,
        charData,
        relics,
        enemyData: enemyData,
        stageData,
      },
      panelContext,
    );
    panelContext = CalculatorHelper.analyzeRogueDifficulty(
      {
        rogueInput,
        enemyData,
      },
      panelContext,
    );
    console.log("globalContext", globalContext);
    console.log("panelContext", panelContext);
    set((state) => {
      state.globalAnalysisResult = globalContext;
      state.relicAnalysisResult = panelContext;
    });
    return globalContext;
  },
  resetStore: () => {
    set(() => initialCalculatorState, undefined, "resetStore");
  },
  setCalcOutput: (output) => {
    set(
      (state) => {
        state.calcOutput = output;
      },
      undefined,
      "setCalcOutput",
    );
  },
});
