import { BuffContext, CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";
import type { SliceCreator, SlicedCalculatorActions, SlicedCalculatorState } from "../calcTypes";
import { initialCalculatorState } from "../calcConstants";
import { getRelicList } from "../calcUtils/calculatorUtils";
import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";
import { wrapRelicData } from "~/modules/Tool/DamageCalculator/utils";

export const createCalculaotrSlice: SliceCreator<SlicedCalculatorState & SlicedCalculatorActions> = (set, get) => ({
  ...initialCalculatorState,
  initStore: async (gameDataStore) => {
    console.log("initStore", gameDataStore);
    const { character_table, skill_table, uniequip_table, stages } = gameDataStore;
    const { rogueInput } = get();
    const allowCharNames = Object.keys(
      import.meta.glob("/app/modules/Tool/DamageCalculator/calculator/charImpl/**/*.ts"),
    ).map((filename) => filename.split("/").pop()?.split(".")[0]);
    /** 有效干员列表 */
    const charList = Object.values(character_table).filter((charData) => {
      return !["TOKEN", "TRAP"].includes(charData.profession) && allowCharNames.includes(charData.name);
    });
    /** 肉鸽主题 */
    const rogueKey = rogueInput.topic;
    /** 藏品列表 */
    const relicList = getRelicList(gameDataStore.relics, gameDataStore.items, rogueKey);
    /** 初始化藏品映射 */
    const relicsMap = {
      [rogueKey]: relicList.map((relic) => wrapRelicData(relic)),
    };
    /** 渲染关卡列表 */
    const renderStages = getStageList(stages, rogueInput);
    /** 初始化关卡 */
    const stageId = renderStages[0].id;
    const { stageData, levelData, levels, selectedIds, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages,
      levels: {},
      selectedIds: [],
      stageId,
    });
    set(
      (state) => {
        // 初始化干员列表
        state.charList = charList;
        // 初始化藏品列表
        state.relicList = relicList;
        // 初始化藏品映射
        state.relicsMap = relicsMap as never;
        // 初始化解包数据
        state.skill_table = skill_table; // 重复储存，方便后续使用，考虑是否需要优化
        state.uniequip_table = uniequip_table;
        // 初始化关卡
        state.stages = stages;
        state.renderStages = renderStages;
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.selectedIds = selectedIds;
        // 初始化敌人
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "initStore",
    );
  },
  resetStore: () => {
    console.log("resetStore");
    // set(() => initialCalculatorState, undefined, "resetStore");
  },
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
