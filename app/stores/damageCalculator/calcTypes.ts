import type { StateCreator } from "zustand";
import type { BuffContext } from "~/modules/Tool/DamageCalculator/calculator";
import type { EnemySpec } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";
import type { ITopicSpecItem } from "~/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecSelector";
import type {
  AttributeModifier,
  CalculatorOutput,
  CharData,
  CharInput,
  EnemyData,
  EnemyInput,
  LevelData,
  RelicWrapper,
  RogueInput,
  RogueKey,
  StageData,
} from "~/types/gameData";

export type SliceCreator<T> = StateCreator<
  DCalculatorState & DCalculatorActions,
  [["zustand/devtools", never], ["zustand/immer", never]],
  [],
  T
>;

export type DCalculatorState = SlicedCalcGameDataState &
  SlicedCalcOperatorState &
  SlicedCalcEnemyState &
  SlicedCalculatorState &
  SlicedCalcUIState;

export type DCalculatorActions = SlicedCalcGameDataActions &
  SlicedCalcOperatorActions &
  SlicedCalcEnemyActions &
  SlicedCalculatorActions &
  SlicedCalcUIActions;

export interface SlicedCalcGameDataState {
  /** 肉鸽主题 */
  rogueKey: RogueKey;
  /** 肉鸽难度 */
  rogueInput: RogueInput;
  /** 肉鸽难度 */
  difficulty: number;
  /** 肉鸽主题特殊效果列表 */
  topicSpecItems: ITopicSpecItem[];
  /** 预处理后的藏品列表 */
  relicsMap: Record<RogueKey, RelicWrapper[]>;
  /** 选择的藏品ID */
  selectedIds: string[];
  /** 简略关卡数据 */
  stageData?: StageData;
  /** 关卡详细解包数据 */
  levelData?: LevelData;
}

export interface SlicedCalcOperatorState {
  /** 干员列表 */
  charList: CharData[];
  /** 当前选中的角色 */
  activeCharName: string;
  /** 干员属性额外修改 */
  charsModifier: Record<string, AttributeModifier>;
}

export interface SlicedCalcEnemyState {
  /** 敌人解包数据 */
  enemyData: EnemyData;
  /** 敌人基础面板 */
  enemyBase: EnemyInput;
  /** 敌人输入数据 @deprecated */
  enemyDataParsed: EnemyInput;
  /** 敌人特殊配置数据 */
  enemySpec: EnemySpec;
  /** 敌人加成上下文 */
  enemyContext: BuffContext;
}

export interface SlicedCalculatorState {
  /** 全局加成上下文 */
  globalAnalysisResult: BuffContext;
  /** 仅有藏品的加成上下文 */
  relicAnalysisResult: BuffContext;
  /** 计算结果 */
  calcOutput: CalculatorOutput;
}

export interface SlicedCalcUIState {
  /** 是否显示藏品选择器页面 */
  showRelics: boolean;
  /** 是否显示肉鸽主题特殊效果选择器页面 */
  showTopicSpec: boolean;
}

export interface SlicedCalcGameDataActions {
  setRogueKey: (key: RogueKey) => void;
  setRogueInput: (rogueInput: RogueInput) => void;
  setRogueDifficulty: (difficulty: number) => void;
  setRogueZone: (zone: string) => void;
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) => void;
  setRougeTech: (tech: string) => void;
  setRelicWrapper: (rogueKey: RogueKey, relics: RelicWrapper[]) => void;
  setTopicSpecItems: (callback: (items: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
  setRelicLayer: (id: string, layer: string) => string;
  updateRelic: (id: string, key: string, value: number | string | boolean) => void;
  updateRelics: (ids: string[], key: string, value: number | string | boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleRelicSelection: (id: string) => void;
  selectRelic: (id: string) => void;
  unselectRelic: (id: string) => void;
  setStageData: (stageData: StageData) => void;
  setLevelData: (levelData: LevelData) => void;
}

export interface SlicedCalcOperatorActions {
  addCharData: () => void;
  setCharData: (charData: CharData, i: number) => void;
  removeCharData: (i: number) => void;
  setActiveCharName: (charName: string) => void;
  setCharsModifier: (charName: string, modifier: AttributeModifier) => void;
}

export interface SlicedCalcEnemyActions {
  setEnemyData: (enemyData: EnemyData) => void;
  setEnemyBase: (enemyBase: EnemyInput) => void;
  setEnemyDataParsed: (enemyDataParsed: EnemyInput) => void;
  setEnemySpec: (enemySpec: EnemySpec) => void;
  setEnemyContext: (enemyContext: BuffContext) => void;
}

export interface SlicedCalculatorActions {
  setGlobalAnalysisResult: (context: BuffContext) => void;
  setRelicAnalysisResult: (relicAnalysisResult: BuffContext) => void;
  setCalcOutput: (output: CalculatorOutput) => void;

  /** 更新全局加成上下文 */
  updateGlobalAnalysisResult: (input: {
    charInput: CharInput;
    charData: CharData;
    relics: RelicWrapper[];
  }) => BuffContext;
  resetStore: () => void;
}

export interface SlicedCalcUIActions {
  toggleShowRelics: () => void;
  toggleShowTopicSpec: () => void;
}
