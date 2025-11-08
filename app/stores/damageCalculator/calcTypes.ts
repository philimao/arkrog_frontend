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
  BlackboardData,
  RogueTopic,
  ZoneOfRogue,
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
  topic: RogueTopic;
} & Record<
  RogueKey,
  {
    /** 区域 */
    zone: string;
    /** 层数选择 */
    layer: string;
    /** 科技树 */
    tech: string;
    /** 肉鸽难度 */
    difficulty: number;
    /** 关卡id，但似乎从没更新过 */
    stage: string;
    /** 敌人名称 */
    enemyName: string;
    /** 藏品id列表 */
    relics: string[];
    /** 思维负荷 清晰: NORMAL, 混乱: CONFUSION, 阻滞: STAGNATION */
    thoughtLoad: "NORMAL" | "CONFUSION" | "STAGNATION";
    /** 当前生效灵感 */
    inspiration?: string;
    /** 年代 */
    disaster?: string;
    /** 岁时 */
    wraths: string[];
    /** 通宝 */
    coppers: string[];
  }
>;

export interface SlicedCalcGameDataState {
  /** 肉鸽难度 */
  rogueInput: RogueInput;
  /** 萨卡兹主题 年代加成 */
  rogue4_disaster_spec_items: ITopicSpecItem[];
  /** 萨卡兹主题 灵感加成 */
  rogue4_inspiration_spec_items: ITopicSpecItem[];
  /** 界园主题 岁时加成列表 */
  rogue5_wrath_spec_items: ITopicSpecItem[];
  /** 界园主题 通宝加成列表 */
  rogue5_copper_spec_items: ITopicSpecItem[];
  /** 肉鸽主题特殊效果列表 @deprecated 解耦后不再使用 */
  topicSpecItems: ITopicSpecItem[];
  /** 技能解包数据 */
  skill_table: Record<string, SkillData>;
  /** 模组解包数据 */
  uniequip_table: Record<string, UniEquipData>;
  /** 区域数据 */
  zones: Record<string, ZoneOfRogue>;
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
  setRogueKey: (rogueTopic: RogueTopic) => Promise<void>;
  /** 设置肉鸽难度 */
  setRogueDifficulty: (difficulty: number) => void;
  /** 设置肉鸽区域 */
  setRogueZone: (zone: string) => Promise<void>;
  /** 设置肉鸽层数 */
  setRogueLayer: (layer: string) => void;
  /** 设置肉鸽关卡 */
  setRogueStageId: (stageId: string) => Promise<void>;
  /** 设置肉鸽幕后加成 */
  setRogueTech: (tech: string) => void;
  /** 设置肉鸽思维负荷 */
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) => void;
  /** 设置肉鸽灵感 */
  setRogue4Inspiration: (inspiration?: string) => void;
  /** 设置肉鸽年代 */
  setRogue4Disaster: (disaster?: string) => void;
  /** 设置肉鸽岁时 */
  setRogue5Wraths: (wraths: string | string[]) => void;
  /** 设置肉鸽通宝 */
  setRogue5Coppers: (coppers: string | string[]) => void;
  /** 设置萨卡兹主题 年代加成列表 */
  setRogue4DisasterSpecItems: (callback: (disasters: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
  /** 设置萨卡兹主题 灵感加成列表 */
  setRogue4InspirationSpecItems: (callback: (inspirations: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
  /** 设置界园主题 岁时加成列表 */
  setRogue5WrathSpecItems: (callback: (wraths: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
  /** 设置界园主题 通宝加成列表 */
  setRogue5CopperSpecItems: (callback: (coppers: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
  /** 设置肉鸽主题特殊效果列表 */
  setTopicSpecItems: (callback: (items: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
}

export type CharSpecConfig = {
  /** 配置类型 */
  type: "switch" | "select";
  /** 配置名称（短） */
  label: string;
  /** 效果描述（长） */
  desc: string;
  /** 解锁条件 */
  unlockCondition: {
    phase: number;
    level: number;
  };
  /** 潜能要求 */
  requiredPotentialRank: number;
  /** 选项 */
  options: { key: string; value: number }[];
  /** 应用函数 */
  apply: (key: string, value: number, active: boolean) => CharSpec;
};

export type CharSpec = {
  active: boolean;
  label: string;
  key: string;
  value: number;
  blackboard: BlackboardData[];
};

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
  /** 是否为伺烛客 rogue_5限定 */
  candleHolder: boolean;
  /** 干员特殊配置 */
  charSpec: CharSpec[];
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
  /** 干员特殊配置 */
  charSpecConfigs: CharSpecConfig[];
  /** 干员输入数据 */
  charInput: CharInput;
}

export interface SlicedCalcCharActions {
  addCharData: () => void;
  setCharData: (charData: CharData, i: number) => void;
  removeCharData: (i: number) => void;
  /** 设置当前选中的干员 */
  setActiveCharName: (
    charName: string,
    skill_table: Record<string, SkillData>,
    uniequip_table: Record<string, UniEquipData>,
  ) => void;
  /** 移除当前选中的干员 */
  removeActiveCharName: () => void;
  /** 设置干员属性额外修改 */
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
  /** 设置干员特殊配置 */
  setCharSpec: (label: string, key: string, value: number) => void;
  /** 设置是否为伺烛客 rogue_5限定 */
  setCandleHolder: (candleHolder: boolean) => void;
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
