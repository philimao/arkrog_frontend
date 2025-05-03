import type { BasicObject } from "~/types/core";

export type RogueKey =
  | "rogue_1"
  | "rogue_2"
  | "rogue_3"
  | "rogue_4"
  | "rogue_5"
  | "rogue_6"
  | "rogue_7"
  | "rogue_8";

// 游戏数据
export interface GameData {
  topics: Record<RogueKey, TopicData>;
  stages: Record<RogueKey, StageOfRogue>;
  enemies: Record<string, EnemyBasicData[]>;
  zones: Record<RogueKey, ZoneOfRogue>;
  traps: BasicObject;
  relics: Record<RogueKey, Record<string, RelicData>>;
  items: Record<RogueKey, Record<string, ItemData>>;
  character_basic?: Record<CharId, CharBasicData>;
  character_table?: Record<CharId, CharData>;
  skill_table?: Record<string, SkillData>;
  uniequip_table?: Record<string, UniEquipData>;
  uniequip_basic?: Record<string, UniEquipBasicData>;
  stageEnemies?: Record<RogueKey, Record<string, EnemyDataParsed[]>>;
}

// 肉鸽主题数据
export interface TopicData {
  id: RogueKey;
  lineText: string;
  name: string;
  name_en: string;
  startTime: number;
}

// 特定肉鸽所有层
export type ZoneOfRogue = Record<string, ZoneData>;

// 特定层
export interface ZoneData {
  id: string;
  name: string;
  description: string;
  clockPerformance: string | null; // 傀影
  displayTime: string | null;
  buffDescription: string | null; // 树洞buff
  endingDescription: string;
  [key: string]: string | object | number | null;
}

// 特定肉鸽所有关卡
export type StageOfRogue = Record<string, StageData>;

// 特定关卡信息
export interface StageData {
  id: string;
  code: string;
  name: string;
  levelId: string; // Obt/Roguelike/RO3/level_rogue3_b-5-b
  description: string;
  eliteDesc: string;
  difficulty: string;
  isBoss: 0 | 1;
  isElite: 0 | 1;
  [key: string]: string | object | number;
}

export interface LevelData {
  options: object;
  levelId: null;
  mapId: null;
  bgmEvent: string;
  environmentSe: string | null;
  mapData: { map: number[][]; tiles: object[] };
  tilesDisallowToLocate: string[];
  runes: null;
  optionalRunes: null;
  globalBuffs: null;
  routes: object[];
  extraRoutes: object[];
  enemies: EnemyData[];
  enemyDbRefs: object[];
  waves: object[];
  branches: null;
  predefines: object;
  hardPredefines: object;
  excludeCharIdList: string[] | null;
  randomSeed: number;
  operaConfig: null;
  cameraPlugin: null;
}

export type StagePreview = Record<string, StagePreviewData>;

// 关卡预览
export interface StagePreviewData {
  normalNum?: number;
  normalLevel?: string;
  eliteNum?: number;
  eliteLevel?: string;
  boatNum?: number;
  boatLevel?: string;
  description?: string;
  boatDesc?: string;
  breadcrumb?: string;
}

export type UniequipsBasic = Record<string, UniEquipBasicData>;

// 基础模组信息
export interface UniEquipBasicData {
  uniEquipId: string;
  uniEquipName: string;
  uniEquipDesc: string;
  typeIcon: string;
  typeName1: string;
  typeName2: string;
  equipShiningColor: string;
  unlockEvolvePhase: string;
  charEquipOrder: number;
}

export interface UniEquipPhaseData {
  equipLevel: number;
  parts: {
    resKey: string;
    target: string;
    isToken: boolean;
    addOrOverrideTalentDataBundle: {
      candidates: CharTalentData[] | null;
    };
    overrideTraitDataBundle: {
      candidates: CharTraitData[] | null;
    };
  }[];
  attributeBlackboard: BlackboardData[];
  tokenAttributeBlackboard: Record<string, BlackboardData[]>;
}

export interface UniEquipData {
  phases: UniEquipPhaseData[];
}

// 基础技能信息
export interface SkillBasicData {
  skillOrder: number;
  skillId: string;
  name: string;
  description: string;
}

export interface SkillLevelData {
  name: string;
  rangeId: string | null;
  description: string;
  skillType: "MANUAL";
  durationType: "AMMO";
  spData: {
    spType: "INCREASE_WITH_TIME";
    levelUpCost: null;
    maxChargeTime: number;
    spCost: number;
    initSp: number;
    increment: number;
  };
  duration: number;
  blackboard: BlackboardData[];
}

export interface SkillData {
  skillId: string;
  levels: SkillLevelData[];
}

export type CharId = `char_${number}_${string}`;

type SkillId = `skchr_${string}`;

export type SkillsBasic = Record<SkillId, SkillBasicData>;

export type Profession =
  | "VANGUARD"
  | "SNIPER"
  | "CASTER"
  | "MEDIC"
  | "GUARD"
  | "DEFENDER"
  | "SPECIALIST"
  | "SUPPORTER";

// 干员基础信息
export interface CharBasicData {
  charId: CharId;
  name: string;
  description: string;
  displayNumber: string;
  appellation: string;
  rarity: `TIER_${number}`;
  profession: Profession;
  subProfessionId: string;
  skills: SkillsBasic;
  uniequip: UniequipsBasic;
}

export interface BlackboardData {
  key: string;
  value: number;
  valueStr: string | null;
}

// 阶段面板数据
export interface CharAttribute {
  maxHp: number;
  atk: number;
  def: number;
  magicResistance: number;
  cost: number;
  blockCnt: number;
  moveSpeed: number;
  attackSpeed: number;
  baseAttackTime: number;
  respawnTime: number;
  hpRecoveryPerSec: number;
  spRecoveryPerSec: number;
  maxDeployCount: number;
  maxDeckStackCnt: number;
  tauntLevel: number;
  massLevel: number;
  baseForceLevel: number;
  stunImmune: boolean;
  silenceImmune: boolean;
  sleepImmune: boolean;
  frozenImmune: boolean;
  levitateImmune: boolean;
  disarmedCombatImmune: boolean;
  fearedImmune: boolean;
}

export type CharAttributeExt = CharAttribute & {
  damageScale: number;
};

export interface AttributeKeyFrame {
  level: number;
  data: CharAttribute;
}

// 精英化阶段
export interface CharPhase {
  rangeId: string;
  maxLevel: number;
  attributesKeyFrames: AttributeKeyFrame[];
  evolveCost: null;
}

// 天赋
export interface CharTalent {
  candidates: CharTalentData[];
}

export interface CharTalentData {
  unlockCondition: { phase: `Phase_${number}`; level: 1 | 2 };
  requiredPotentialRank: number;
  name: string;
  description: string;
  blackboard: BlackboardData[];
}

// 特性
export interface CharTraitData {
  additionalDescription: string;
  unlockCondition: {
    phase: string;
    level: number;
  };
  requiredPotentialRank: number;
  blackboard: BlackboardData[];
  overrideDescription: string | null;
  rangeId: null;
}

export interface AttributeModifier {
  attributeType: string;
  formulaItem: "ADDITION";
  value: number;
  loadFromBlackboard: boolean;
}

export interface CharPotential {
  type: "BUFF" | "CUSTOM";
  description: string;
  buff: {
    attributes: {
      attributeModifiers: AttributeModifier[];
    };
  } | null;
  equivalentCost: null;
}

// 干员详细信息
export interface CharData {
  name: string;
  description: string;
  displayNumber: string;
  appellation: string;
  position: "MELEE" | "RANGED";
  rarity: `TIER_${number}`;
  profession: Profession;
  subProfessionId: string;
  displayTokenDict: object | null;
  isNotObtainable: boolean;
  itemDesc: string;
  itemUsage: string;
  favorKeyFrames: AttributeKeyFrame[];
  phases: CharPhase[];
  talents: CharTalent[];
  potentialRanks: CharPotential[];
}

/**
 * 藏品信息
 */
export interface ItemData {
  id: `rogue_${number}_${string}`;
  name: string;
  description: string | null;
  usage: string;
  type: string;
  subType: string;
  rarity: string;
  value: number;
}

export interface RelicBuff {
  key: string;
  blackboard: BlackboardData[];
}

export type RelicDataExt = ItemData &
  RelicData & {
    show: boolean;
  };

export interface RelicData {
  id: `rogue_${number}_${string}`;
  buffs: RelicBuff[];
}

export interface RelicWrapperBuff {
  key: string;
  isActive: boolean;
  charResult: Record<string, number>;
  enemyResult: Record<string, number>;
}

export interface RelicWrapper {
  id: string;
  name: string;
  value: number;
  usage: string;
  isActive: boolean;
  userActive: boolean;
  isFavorite: boolean;
  hasLayer: boolean;
  layer: number;
  show: boolean;
  buffs: RelicWrapperBuff[];
}

// 带*的域代表对计算非常重要
export interface CharInput {
  phaseLevel: number; // 精英化等级
  phase?: CharPhase; // 精英化数据
  level: number; // 干员等级
  attribute?: CharAttributeExt; // 干员局外面板*
  skillKey: string; // 技能键名
  skillLevel: number; // 技能等级
  skill: SkillLevelData; // 选择的技能数据*
  uniEquipId: string; // 模组ID
  uniEquipLevel: number; // 模组等级
  uniEquip: UniEquipPhaseData; // 选择的模组数据*
  potential: number; // 潜能等级*
}

// 计算器返回值
export interface CalculatorOutput {
  attack: DamageData; // 普攻
  skill: DamageData; // 技能
  cycle: DamageData; // 周期
  logs: string[]; // 运算过程
}

// 伤害数据
export interface DamageData {
  dph: number; // 面板攻击力
  dps: DamageByType; // dps
  total_damage: DamageByType; // 总伤
}

// 伤害分布
export interface DamageByType {
  phy?: number; // 物理
  mag?: number; // 法术
  pure?: number; // 真实
  ep?: number; // 元素
}

// 敌人
export interface EnemyBasicData {
  profile: string;
  name: string;
  num: number;
  status: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  adf: number;
  int: number;
  wt: number;
  mov: number;
  rng: number;
  hpr: number;
  talent?: string;
  skills?: string[];
}

export interface DefinedData<T> {
  m_defined: boolean;
  m_value: T;
}

export interface EnemySkillData {
  prefabKey: string;
  priority: number;
  cooldown: number;
  initCooldown: number;
  spCost: number;
  blackboard: BlackboardData[] | null;
}

export interface EnemyData {
  id: string;
  level: 0 | 1 | 2;
  name: DefinedData<string>;
  description: DefinedData<string>;
  prefabKey: DefinedData<string>;
  attributes: {
    maxHp: DefinedData<number>;
    atk: DefinedData<number>;
    def: DefinedData<number>;
    magicResistance: DefinedData<number>;
    blockCnt: DefinedData<number>;
    moveSpeed: DefinedData<number>;
    attackSpeed: DefinedData<number>;
    baseAttackTime: DefinedData<number>;
    tauntLevel: DefinedData<number>;
    epDamageResistance: DefinedData<number>;
    epResistance: DefinedData<number>;
    damageHitratePhysical: DefinedData<number>;
    damageHitrateMagical: DefinedData<number>;
    stunImmune: DefinedData<boolean>;
    silenceImmune: DefinedData<boolean>;
    sleepImmune: DefinedData<boolean>;
    frozenImmune: DefinedData<boolean>;
    levitateImmune: DefinedData<boolean>;
    disarmedCombatImmune: DefinedData<boolean>;
    fearedImmune: DefinedData<boolean>;
  };
  applyWay: {
    m_defined: true;
    m_value: "MELEE" | "RANGED";
  };
  motion: DefinedData<string>;
  enemyTags: DefinedData<string[]>;
  lifePointReduce: DefinedData<number>;
  levelType: {
    m_defined: true;
    m_value: "BOSS" | "ELITE" | "NORMAL";
  };
  rangedRadius: DefinedData<number>;
  numOfExtraDrops: DefinedData<number>;
  viewRadius: DefinedData<number>;
  notCountInTotal: DefinedData<boolean>;
  talentBlackboard: BlackboardData[] | null;
  skills: EnemySkillData[] | null;
  spData: null;
}

export interface EnemyDataParsed {
  id: string;
  level: 0 | 1 | 2;
  name: string;
  description: string;
  attributes: {
    maxHp: number;
    atk: number;
    def: number;
    magicResistance: number;
    blockCnt: number;
    moveSpeed: number;
    attackSpeed: number;
    baseAttackTime: number;
    epDamageResistance: number;
    epResistance: number;
  };
  levelType: "BOSS" | "ELITE" | "NORMAL";
  rangedRadius: number | null;
}
