import { BuffContext, CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";
import type { SliceCreator, SlicedCalculatorActions, SlicedCalculatorState } from "../calcTypes";
import type { AttributeModifier, CharData, EnemyData, RelicWrapper, RogueInput, RogueKey } from "~/types/gameData";
import type { ITopicSpecItem } from "~/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecSelector";
import { dummy } from "../calcConstants";
import type { EnemySpec } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";

export const createCalculaotrSlice: SliceCreator<SlicedCalculatorState & SlicedCalculatorActions> = (set, get) => ({
  globalAnalysisResult: CalculatorHelper.createAdditionContext(),
  relicAnalysisResult: CalculatorHelper.createAdditionContext(),
  setRelicAnalysisResult: (relicAnalysisResult: BuffContext) =>
    set(
      (state) => {
        state.relicAnalysisResult = relicAnalysisResult;
      },
      undefined,
      "setRelicAnalysisResult",
    ),
  calcOutput: CalculatorHelper.createCalculatorOutput(),
  setCalcOutput: (output) => {
    set(
      (state) => {
        state.calcOutput = output;
      },
      undefined,
      "setCalcOutput",
    );
  },
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
    set(
      () => ({
        rogueKey: "rogue_4" as RogueKey,
        rogueInput: {
          topic: "rogue_4",
          rogue_4: {
            zone: "zone_5",
            difficulty: 18,
            thoughtLoad: "NORMAL",
          },
        } as RogueInput,
        difficulty: 18,
        charList: [] as CharData[],
        activeCharName: "",
        relicAnalysisResult: undefined,
        showRelics: false,
        showTopicSpec: false,
        topicSpecItems: [] as ITopicSpecItem[],
        relicsMap: {} as Record<RogueKey, RelicWrapper[]>,
        selectedIds: [] as string[],
        enemyData: undefined as unknown as EnemyData,
        enemyDataParsed: dummy,
        enemySpec: undefined as unknown as EnemySpec,
        charsModifier: {} as Record<string, AttributeModifier>,
        stageData: undefined,
        levelData: undefined,
        calcOutput: CalculatorHelper.createCalculatorOutput(),
      }),
      undefined,
      "resetStore",
    );
  },
});
