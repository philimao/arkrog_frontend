import { BuffContext, CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";
import type { SliceCreator, SlicedCalculatorActions, SlicedCalculatorState } from "../calcTypes";
import { initialCalculatorState } from "../calcConstants";
import { getRelicsData, getRelicUiStates } from "../calcUtils/relicUtils";
import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";
import type { RelicUiState, RogueKey, WrappedRelicItem } from "~/types/gameData";
import { applyAnyRelics } from "~/modules/Tool/DamageCalculator/calculator/debug/print-relics-info";
import type { ExpressionGroupNode } from "~/modules/Tool/DamageCalculator/calculator/ast";
import { useGameDataStore } from "~/stores/gameDataStore";

/** 对单个已加载主题克隆包装藏品，并单独构建展示派生状态。 */
function prepareRelicTopic(
  topicId: RogueKey,
  sourceRelics: Parameters<typeof getRelicsData>[0],
): {
  relics: Record<string, WrappedRelicItem>;
  relicUiStates: Record<string, RelicUiState>;
  anyRelicContext: BuffContext;
} {
  const relics = getRelicsData(sourceRelics);
  const relicUiStates = getRelicUiStates(relics);
  const relicList = Object.values(relics);
  const anyRelicContext = applyAnyRelics(relicList);
  const validRelicList = [
    // 这些藏品不写普通 buff，但在其他计算逻辑中有独立处理。
    "烟花之手",
    "国王的铠甲",
  ];
  Object.values(anyRelicContext).forEach((value: string[] | Record<string, ExpressionGroupNode>) => {
    if (Array.isArray(value)) return;
    Object.values(value).forEach((node: ExpressionGroupNode) =>
      node.children.forEach((child) => validRelicList.push(child.tooltip)),
    );
  });
  Object.values(relics).forEach((relic) => {
    if (!validRelicList.includes(relic.name)) relicUiStates[relic.id].disabled = true;
  });
  if (import.meta.env.DEV && ["rogue_4", "rogue_5", "rogue_6"].includes(topicId)) {
    CalculatorHelper.printAdditionContext(anyRelicContext, relicList);
  }
  return { relics, relicUiStates, anyRelicContext };
}

export const createCalculaotrSlice: SliceCreator<SlicedCalculatorState & SlicedCalculatorActions> = (set, get) => ({
  ...initialCalculatorState,
  initStore: async (gameDataStore) => {
    console.log("initStore", gameDataStore);
    const { character_table, skill_table, uniequip_table, zones, stages } = gameDataStore;
    const { rogueInput } = get();
    // const allowCharNames = Object.keys(
    //   import.meta.glob("/app/modules/Tool/DamageCalculator/calculator/charImpl/**/*.ts"),
    // ).map((filename) => filename.split("/").pop()?.split(".")[0]);
    const allowCharNames = Object.values(character_table).map((charData) => charData.name);
    /** 有效干员列表 */
    const charList = Object.values(character_table).filter((charData) => {
      return !["TOKEN", "TRAP"].includes(charData.profession) && allowCharNames.includes(charData.name);
    });
    // 首次进入只请求当前主题；其他主题在 setRogueKey 时按需加载。
    await get().loadRelicTopic(rogueInput.topic);
    /** 渲染关卡列表 */
    const renderStages = getStageList(zones, stages, rogueInput);
    /** 初始化关卡 */
    const stageId = renderStages[0].id;
    const { stageData, levelData, levels, relics, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages,
      levels: {},
      relics: [],
      stageId,
    });
    set(
      (state) => {
        // 初始化干员列表
        state.charList = charList;
        // 初始化解包数据
        state.skill_table = skill_table; // 重复储存，方便后续使用，考虑是否需要优化
        state.uniequip_table = uniequip_table;
        // 初始化关卡
        state.zones = zones;
        state.stages = stages;
        state.renderStages = renderStages;
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.rogueInput[rogueInput.topic].relics = relics;
        // 初始化敌人
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "initStore",
    );
  },
  loadRelicTopic: async (topicId) => {
    const current = get();
    if (current.relics[topicId] && current.relicUiStateMap[topicId]) return;

    const gameDataStore = useGameDataStore.getState();
    const sourceRelics = await gameDataStore.fetchRelicTopic(topicId);
    const prepared = prepareRelicTopic(topicId, sourceRelics);
    set(
      (state) => {
        state.relics[topicId] = prepared.relics;
        state.relicUiStateMap[topicId] = prepared.relicUiStates;
        state.anyRelicContextMap[topicId] = prepared.anyRelicContext;
      },
      undefined,
      `loadRelicTopic:${topicId}`,
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
