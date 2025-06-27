import type { StateCreator } from "zustand";
import type { BuffContext } from "~/modules/Tool/DamageCalculator/calculator";
import type { EnemySpec, EnemySpecConfig } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";
import type { ITopicSpecItem } from "~/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecSelector";
import type {
  AttributeKeyFrame,
  CharAttributeModifier,
  CalculatorOutput,
  CharData,
  CharPhase,
  EnemyData,
  EnemyInput,
  LevelData,
  RelicDataExt,
  RelicWrapper,
  RogueKey,
  SkillData,
  SkillLevelData,
  StageData,
  StageOfRogue,
  UniEquipData,
  UniEquipPhaseData,
} from "~/types/gameData";
import type { GameDataState } from "../gameDataStore";
import type { ExpressionGroupNode } from "~/modules/Tool/DamageCalculator/calculator/ast";

export type SliceCreator<T> = StateCreator<
  DCalculatorState & DCalculatorActions,
  [["zustand/devtools", never], ["zustand/immer", never]],
  [],
  T
>;

export type DCalculatorState = SlicedCalcGameDataState &
  SlicedCalcCharState &
  SlicedCalcEnemyState &
  SlicedCalculatorState &
  SlicedCalcUIState &
  SlicedCalcRelicState;

export type DCalculatorActions = SlicedCalcGameDataActions &
  SlicedCalcCharActions &
  SlicedCalcEnemyActions &
  SlicedCalculatorActions &
  SlicedCalcUIActions &
  SlicedCalcRelicActions;

/** 肉鸽输入数据 */
export type RogueInput = {
  /** 肉鸽主题 */
  topic: RogueKey;
} & Record<
  RogueKey,
  {
    /** 层数 */
    zone: string;
    /** 科技树 */
    tech: string;
    /** 肉鸽难度 */
    difficulty: number;
    /** 思维负荷 清晰: NORMAL, 混乱: CONFUSION, 阻滞: STAGNATION */
    thoughtLoad: "NORMAL" | "CONFUSION" | "STAGNATION";
    /** 当前生效灵感 */
    inspiration?: string;
  }
>;

export interface SlicedCalcGameDataState {
  /** 肉鸽难度 */
  rogueInput: RogueInput;
  /** 肉鸽主题特殊效果列表 */
  topicSpecItems: ITopicSpecItem[];
  /** 技能解包数据 */
  skill_table: Record<string, SkillData>;
  /** 模组解包数据 */
  uniequip_table: Record<string, UniEquipData>;
  /** 关卡基础数据 */
  stages: Record<RogueKey, StageOfRogue>;
  /** 关卡详细解包数据 */
  levels: Record<string, LevelData>;
  /** 渲染关卡列表 */
  renderStages: StageData[];
  /** 当前选中的关卡 */
  stageId: string;
  /** 简略关卡数据 */
  stageData: StageData;
  /** 关卡详细解包数据 */
  levelData: LevelData;
}

export interface SlicedCalcGameDataActions {
  setRogueInput: (rogueInput: RogueInput) => void;
  /** 设置肉鸽主题 */
  setRogueKey: (key: RogueKey) => void;
  /** 设置肉鸽难度 */
  setRogueDifficulty: (difficulty: number) => void;
  /** 设置肉鸽区域 */
  setRogueZone: (zone: string) => void;
  /** 设置肉鸽关卡 */
  setRogueStageId: (stageId: string) => void;
  /** 设置肉鸽思维负荷 */
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) => void;
  /** 设置肉鸽幕后加成 */
  setRogueTech: (tech: string) => void;
  setTopicSpecItems: (callback: (items: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
}

export interface CharInput {
  /** 干员名称 */
  name: string;
  /** 干员精英化阶段选项 */
  phases: CharPhase[];
  /** 精英化等级 */
  phaseLevel: number;
  /** 干员精英化阶段 */
  phase: CharPhase;
  /** 干员等级 */
  frameIndex: number;
  /** 干员等级选项 */
  keyFrames: AttributeKeyFrame[];
  /** 潜能 */
  potential: number;
  /** 技能键名 */
  skillKey: string;
  /** 技能选项 */
  skills: SkillData[];
  /** 技能等级选项 */
  skillLevels: { key: number; name: string }[];
  /** 技能等级 */
  skillLevel: number;
  /** 技能数据 */
  skill: SkillLevelData;
  /** 模组ID */
  uniEquipId: string;
  /** 模组选项 */
  equips: UniEquipData[];
  /** 模组等级 */
  uniEquipLevel: number;
  /** 模组数据 */
  uniEquip?: UniEquipPhaseData;
  /** 模组名称 */
  uniEquipName: string;
  /** 干员属性额外修改 */
  attributeModifier: CharAttributeModifier;
}

export interface SlicedCalcCharState {
  /** 干员列表 */
  charList: CharData[];
  /** 当前选中的角色 */
  activeCharName: string;
  /** 干员解包数据 */
  charData: CharData;
  /** 干员属性额外修改 @deprecated */
  charsModifier: Record<string, CharAttributeModifier>;
  /** 干员输入数据 */
  charInput: CharInput;
}

export interface SlicedCalcCharActions {
  addCharData: () => void;
  setCharData: (charData: CharData, i: number) => void;
  removeCharData: (i: number) => void;
  setActiveCharName: (
    charName: string,
    skill_table: Record<string, SkillData>,
    uniequip_table: Record<string, UniEquipData>,
  ) => void;
  setCharsModifier: (charName: string, modifier: CharAttributeModifier) => void;
  /** 设置精英化等级 */
  setPhaseLevel: (phaseLevel: string) => void;
  /** 设置干员等级 */
  setFrameIndex: (frameIndex: string) => void;
  /** 设置潜能 */
  setPotential: (potential: string) => void;
  /** 设置技能键名 */
  setSkillKey: (skillKey: string) => void;
  /** 设置技能等级 */
  setSkillLevel: (skillLevel: string) => void;
  /** 设置模组ID */
  setUniEquipId: (uniEquipId: string) => void;
  /** 设置模组等级 */
  setUniEquipLevel: (uniEquipLevel: string) => void;
}

export interface SlicedCalcEnemyState {
  /** 敌人解包数据 */
  enemyData: EnemyData;
  /** 敌人基础面板 */
  enemyBase: EnemyInput;
  /** 敌人特殊配置 */
  enemyConfig: EnemySpecConfig;
  /** 敌人特殊配置数据 */
  enemySpec: EnemySpec;
  /** 敌人示意图 */
  enemyIllust: React.ReactNode;
  /** 敌人属性表达式 */
  enemyExpression: Record<string, ExpressionGroupNode>;
}

export interface SlicedCalcEnemyActions {
  /** 设置敌人解包数据，进行完成敌人数据计算与更新 */
  setEnemyData: (enemyData: EnemyData) => void;
  /** 直接设置敌人基础面板（仅木桩使用） */
  setEnemyBase: (enemyBase: EnemyInput) => void;
  /** 用户修改敌人特殊配置选项 */
  updateEnemySpec: (index: number, result: { label: string; bbKey: string; key: string; value: number }) => void;
  /** 设置敌人属性表达式，在多个显示敌人面板的组件中使用 */
  setEnemyExpression: (expression: Record<string, ExpressionGroupNode>) => void;
}

export interface SlicedCalcRelicState {
  /** 肉鸽藏品列表 */
  relicDataMap: Record<RogueKey, Record<string, RelicDataExt>>;
  /** 预处理后的藏品列表 */
  relicWrapperMap: Record<RogueKey, Record<string, RelicWrapper>>;
  /** 选择的藏品ID */
  selectedIdsMap: Record<RogueKey, string[]>;
}

export interface SlicedCalcRelicActions {
  setRelicLayer: (id: string, layer: string) => string;
  updateRelic: (id: string, key: string, value: number | string | boolean) => void;
  updateRelics: (ids: string[], key: string, value: number | string | boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleRelicSelection: (id: string) => void;
  selectRelic: (id: string) => void;
  unselectRelic: (id: string) => void;
}

export interface SlicedCalculatorState {
  /** 应用所有藏品加成上下文 */
  anyRelicContextMap: Record<RogueKey, BuffContext>;
  /** 全局加成上下文 */
  globalAnalysisResult: BuffContext;
  /** 仅有藏品的加成上下文 */
  relicAnalysisResult: BuffContext;
  /** 计算结果 */
  calcOutput: CalculatorOutput;
}

export interface SlicedCalculatorActions {
  initStore: (gameDataStore: GameDataState) => void;
  setGlobalAnalysisResult: (context: BuffContext) => void;
  setRelicAnalysisResult: (relicAnalysisResult: BuffContext) => void;
  setCalcOutput: (output: CalculatorOutput) => void;
  /** 更新全局加成上下文 */
  updateGlobalAnalysisResult: (input: {
    charInput: CharInput;
    charData: CharData;
    relics: (RelicDataExt & RelicWrapper)[];
  }) => BuffContext;
  resetStore: () => void;
}

export interface SlicedCalcUIState {
  /** 是否显示藏品选择器页面 */
  showRelics: boolean;
  /** 是否显示肉鸽主题特殊效果选择器页面 */
  showTopicSpec: boolean;
}

export interface SlicedCalcUIActions {
  toggleShowRelics: () => void;
  toggleShowTopicSpec: () => void;
}
