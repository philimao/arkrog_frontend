import { BuffContext, CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";
import type { SliceCreator, SlicedCalculatorActions, SlicedCalculatorState } from "../calcTypes";
import { initialCalculatorState } from "../calcConstants";
import { getRelicWrappers } from "../calcUtils/relicUtils";
import { getRelicsData } from "../calcUtils/relicUtils";
import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";
import type { RelicDataExt, RelicWrapper, RogueKey } from "~/types/gameData";
import { applyAnyRelics } from "~/modules/Tool/DamageCalculator/calculator/debug/print-relics-info";
import type { ExpressionGroupNode } from "~/modules/Tool/DamageCalculator/calculator/ast";

export const createCalculaotrSlice: SliceCreator<SlicedCalculatorState & SlicedCalculatorActions> = (set, get) => ({
  ...initialCalculatorState,
  initStore: async (gameDataStore) => {
    console.log("initStore", gameDataStore);
    const { topics, character_table, skill_table, uniequip_table, stages } = gameDataStore;
    const { rogueInput } = get();
    // const allowCharNames = Object.keys(
    //   import.meta.glob("/app/modules/Tool/DamageCalculator/calculator/charImpl/**/*.ts"),
    // ).map((filename) => filename.split("/").pop()?.split(".")[0]);
    const allowCharNames = Object.values(character_table).map((charData) => charData.name);
    /** 有效干员列表 */
    const charList = Object.values(character_table).filter((charData) => {
      return !["TOKEN", "TRAP"].includes(charData.profession) && allowCharNames.includes(charData.name);
    });
    /** 肉鸽主题 */
    const rogueKey = rogueInput.topic;
    /** 初始化藏品数据 */
    const relicDataMap: Record<RogueKey, Record<string, RelicDataExt>> = {} as never;
    /** 初始化藏品状态 */
    const relicWrapperMap: Record<RogueKey, Record<string, RelicWrapper>> = {} as never;
    /** 应用所有藏品加成上下文 */
    const anyRelicContextMap: Record<string, BuffContext> = {} as never;
    /** 遍历肉鸽主题 */
    for (const topicId of Object.keys(topics)) {
      const relicsData = getRelicsData(gameDataStore.relics, gameDataStore.items, topicId as RogueKey);
      const relicWrappers = getRelicWrappers(relicsData);
      const relicList = Object.entries(relicWrappers).map(([id, relicWrapper]) => ({
        ...relicsData[id],
        ...relicWrapper,
      }));
      const anyRelicContext = applyAnyRelics(relicList);
      const validRelicList = [
        /** 这里默认一些特殊生效藏品, 不会添加buff但逻辑特殊处理 */
        "烟花之手",
        "国王的铠甲",
      ];
      Object.values(anyRelicContext).forEach((value: string[] | Record<string, ExpressionGroupNode>) => {
        if (Array.isArray(value)) return;
        Object.values(value).forEach((node: ExpressionGroupNode) =>
          node.children.forEach((child) => validRelicList.push(child.tooltip)),
        );
      });
      Object.values(relicWrappers).forEach((relicWrapper) => {
        if (!validRelicList.includes(relicWrapper.name)) {
          relicWrapper.disabled = true;
        }
      });
      anyRelicContextMap[topicId as RogueKey] = anyRelicContext;
      relicDataMap[topicId as RogueKey] = relicsData;
      relicWrapperMap[topicId as RogueKey] = relicWrappers;
      if (import.meta.env.DEV && topicId === "rogue_4") {
        CalculatorHelper.printAdditionContext(anyRelicContext, relicList);
      }
    }
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
        state.relicDataMap = relicDataMap;
        // 初始化藏品映射
        state.relicWrapperMap = relicWrapperMap;
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
        state.selectedIdsMap = { [rogueKey]: selectedIds } as never;
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
    if (charInput) {
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
