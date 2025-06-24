import type { BuffContext } from "~/modules/Tool/DamageCalculator/calculator/buff-context";
import type { CharInput, RogueInput } from "~/stores/damageCalculator/calcTypes";

export type RogueKey = "rogue_1" | "rogue_2" | "rogue_3" | "rogue_4" | "rogue_5" | "rogue_6" | "rogue_7" | "rogue_8";

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

/** 关卡简略信息 */
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

/** 关卡详细信息，包括敌人、路线、地图等 */
export interface LevelData {
  options: object;
  levelId: null;
  mapId: null;
  bgmEvent: string;
  environmentSe: string | null;
  mapData: { map: number[][]; tiles: object[] };
  tilesDisallowToLocate: string[];
  runes: LevelDataRune[];
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

export interface LevelDataRune {
  blackboard: BlackboardData[];
  difficultyMask: "ALL";
  key: "enemy_attribute_mul";
  professionMask: number;
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
    target: "DISPLAY" | "TALENT_DATA_ONLY" | "TALENT" | "TRAIT" | "TRAIT_DATA_ONLY";
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

export type UniEquipData = UniEquipBasicData & {
  phases?: UniEquipPhaseData[];
};

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
    spType: "INCREASE_WITH_TIME" | "INCREASE_WHEN_ATTACK";
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

export type Profession = "VANGUARD" | "SNIPER" | "CASTER" | "MEDIC" | "GUARD" | "DEFENDER" | "SPECIALIST" | "SUPPORTER";

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
  /** 最大生命值 */
  maxHp: number;
  /** 攻击力 */
  atk: number;
  /** 防御力 */
  def: number;
  /** 法术抗性 */
  magicResistance: number;
  /** 部署费用 */
  cost: number;
  /** 阻挡数 */
  blockCnt: number;
  /** 移动速度 */
  moveSpeed: number;
  /** 攻击速度 */
  attackSpeed: number;
  /** 基础攻击间隔 */
  baseAttackTime: number;
  /** 再部署时间 */
  respawnTime: number;
  /** 每秒生命恢复 */
  hpRecoveryPerSec: number;
  /** 每秒技力恢复 */
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
  unlockCondition: { phase: `PHASE_${number}`; level: number };
  requiredPotentialRank: number;
  name: string | null;
  description: string | null;
  overrideDescription: string | null;
  upgradeDescription: string | null;
  blackboard: BlackboardData[];
}

// 特性
export interface CharTraitData {
  additionalDescription: string | null;
  unlockCondition: {
    phase: `PHASE_${number}`;
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
  sortIndex: number;
  displayNumber: string;
  position: "MELEE" | "RANGED";
  tagList: string[];
  rarity: `TIER_${number}`;
  profession: Profession;
  subProfessionId: string;
  /** 潜能物品ID */
  potentialItemId: string;
  appellation: string;
  displayTokenDict: object | null;
  isNotObtainable: boolean;
  itemDesc: string;
  itemUsage: string;
  favorKeyFrames: AttributeKeyFrame[];
  phases: CharPhase[];
  skills: { skillId: string }[];
  talents: CharTalent[];
  potentialRanks: CharPotential[];
}

/**
 * 藏品信息
 */
export interface ItemData {
  id: string;
  name: string;
  description: string | null;
  usage: string;
  type: string;
  subType: string;
  rarity: string;
  value: number;
  pinyin: string;
}

export interface RelicBuff {
  key: string;
  blackboard: BlackboardData[];
}

export type RelicDataExt = ItemData & RelicData;

export interface RelicData {
  id: string;
  buffs: RelicBuff[];
  /** 藏品效果 */
  usage: string;
  /** 藏品名称 */
  name: string;
  /** 藏品层数 */
  layer: number;
}

export interface RelicWrapper {
  /** 藏品ID */
  id: string;
  /** 藏品名称 */
  name: string;
  /** 藏品价值 */
  value: number;
  /** 藏品效果 */
  usage: string;
  /** 是否被用户收藏 TODO */
  isFavorite: boolean;
  /** 是否被用户选中生效，默认生效 */
  userActive: boolean;
  /** 是否存在层数 */
  hasLayer: boolean;
  /** 藏品层数 */
  layer: number;
  /** 拼音 */
  pinyin: string;
  /** 首字母 */
  initials: string;
  /** 是否尚未实现效果 */
  disabled: boolean;
}

export interface CharAttributeModifier {
  /** 攻击力 藏品rune加算 局外藏品、合约 (atkOutPercent / 100)% */
  atkOutPercent: number;
  /** 攻击力 局内rune加算 局内藏品、血怒 (atkInPercent / 100)% */
  atkInPercent: number;
  /** 攻击力 最终加算 鼓舞 */
  atkFinal: number;
  /** 攻击速度 */
  atkSpd: number;
}

/** 伤害数据 */
export interface DamageData {
  /** 面板攻击力 */
  dph: number;
  /** dps */
  dps: DamageByType;
  /** 总伤 */
  total_damage: DamageByType;
}

/** 伤害分布 */
export interface DamageByType {
  /** 物理伤害 */
  phy: number;
  /** 法术伤害 */
  mag: number;
  /** 真实伤害 */
  pure: number;
  /** 元素伤害 */
  ep: number;
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
  m_value: T | null;
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
    cost: DefinedData<number>;
    blockCnt: DefinedData<number>;
    moveSpeed: DefinedData<number>;
    attackSpeed: DefinedData<number>;
    baseAttackTime: DefinedData<number>;
    respawnTime: DefinedData<number>;
    hpRecoveryPerSec: DefinedData<number>;
    spRecoveryPerSec: DefinedData<number>;
    maxDeployCount: DefinedData<number>;
    massLevel: DefinedData<number>;
    baseForceLevel: DefinedData<number>;
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
  rangeRadius: DefinedData<number>;
  numOfExtraDrops: DefinedData<number>;
  viewRadius: DefinedData<number>;
  notCountInTotal: DefinedData<boolean>;
  talentBlackboard: BlackboardData[] | null;
  skills: EnemySkillData[] | null;
  spData: null;
}

/** 敌人输入数据结构 */
export interface EnemyInput {
  id: string;
  level: 0 | 1 | 2;
  name: string;
  description: string;
  // prefabKey: string;
  attributes: EnemyAttribute;
  applyWay: "MELEE" | "RANGED";
  // motion: string;
  enemyTags: string[];
  // lifePointReduce: number;
  /** 敌人等级类型 */
  levelType: "BOSS" | "ELITE" | "NORMAL";
  rangedRadius: number | null;
  // numOfExtraDrops: number;
  // viewRadius: number;
  // notCountInTotal: boolean;
  // talentBlackboard: BlackboardData[] | null;
  // skills: EnemySkillData[] | null;
  // spData: null;
}

/** 敌人最终面板 */
export interface EnemyAttribute {
  /** 最大生命值 */
  maxHp: number;
  /** 攻击力 */
  atk: number;
  /** 防御力 */
  def: number;
  /** 法术抗性 */
  magicResistance: number;
  /** 部署费用 */
  cost: number;
  /** 阻挡数 */
  blockCnt: number;
  /** 移动速度 */
  moveSpeed: number;
  /** 攻击速度 */
  attackSpeed: number;
  /** 基础攻击间隔 */
  baseAttackTime: number;
  /** 再部署时间 */
  respawnTime: number;
  /** 每秒生命恢复 */
  hpRecoveryPerSec: number;
  /** 每秒技力恢复 */
  spRecoveryPerSec: number;
  /** 最大部署数量 */
  maxDeployCount: number;
  /** 重量等级 */
  massLevel: number;
  /** 基础力量等级 */
  baseForceLevel: number;
  /** 嘲讽等级 */
  tauntLevel: number;
  /** 元素伤害抗性 */
  epDamageResistance: number;
  /** 元素抗性 */
  epResistance: number;
  /** 物理命中率 */
  damageHitratePhysical: number;
  /** 法术命中率 */
  damageHitrateMagical: number;
  /** 眩晕免疫 */
  stunImmune: boolean;
  /** 沉默免疫 */
  silenceImmune: boolean;
  /** 睡眠免疫 */
  sleepImmune: boolean;
  /** 冻结免疫 */
  frozenImmune: boolean;
  /** 浮空免疫 */
  levitateImmune: boolean;
  /** 缴械免疫 */
  disarmedCombatImmune: boolean;
  /** 恐惧免疫 */
  fearedImmune: boolean;
  /** 物理法术减伤 */
  damageResistance: number;
}

/** 伤害计算器输入参数 */
export interface CalculatorInput {
  /** buff加成上下文 */
  buffContext: BuffContext;
  /** 干员输入数据结构 */
  charInput: CharInput & { attribute: CharAttribute };
  /** 干员基础数据 */
  charData: CharData;
  /** 敌人最终面板 */
  enemyInput: EnemyInput;
  /** 敌人基础数据 */
  enemyData: EnemyData;
  /** 藏品 */
  relics: (RelicDataExt & RelicWrapper)[];
  /** 肉鸽输入数据 */
  rogueInput: RogueInput;
}

/** 伤害计算器输出参数 */
export interface CalculatorOutput {
  /** 普攻伤害 */
  attack: DamageData;
  /** 技能伤害 */
  skill: DamageData;
  /** 周期伤害 */
  cycle: DamageData;
  /** 运算过程 */
  logs: string[];
}
