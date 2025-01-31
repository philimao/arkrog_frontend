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
  topics: Topics;
  stages: Stages;
  enemies: Enemies;
  zones: Zones;
  traps: BasicObject;
  relics: BasicObject;
  items: BasicObject;
  character_basic?: CharsBasic;
  character_table?: BasicObject;
  skill_table?: BasicObject;
  uniequipDict?: BasicObject;
}

// 肉鸽主题
export type Topics = {
  [key in RogueKey]: TopicData;
};

// 肉鸽主题数据
export interface TopicData {
  id: RogueKey;
  lineText: string;
  name: string;
  name_en: string;
  startTime: number;
}

// 所有肉鸽所有层
export type Zones = {
  [key in RogueKey]: ZoneOfRogue;
};

// 特定肉鸽所有层
export type ZoneOfRogue = {
  [key: string]: ZoneData;
};

// 特定层
export interface ZoneData {
  id: string;
  name: string;
  description: string;
  clockPerformance: string | null; // 傀影
  displayTime: string | null;
  buffDescription: string | null; // 树洞buff
  endingDescription: string;
  [key: string]: any;
}

// 所有肉鸽所有关卡
export type Stages = {
  [key in RogueKey]: StageOfRogue;
};

// 特定肉鸽所有关卡
export type StageOfRogue = {
  [key: string]: StageData;
};

// 特定关卡信息
export interface StageData {
  id: string;
  code: string;
  name: string;
  description: string;
  eliteDesc: string;
  difficulty: string;
  isBoss: 0 | 1;
  isElite: 0 | 1;
  [key: string]: any;
}

export interface StagePreview {
  [key: string]: StagePreviewData;
}

export interface StagePreviewData {
  normalNum?: number;
  normalLevel?: string;
  eliteNum?: number;
  eliteLevel?: string;
  boatNum?: number;
  boatLevel?: string;
  description?: string;
}

// 干员信息
export interface UniequipsBasic {
  [key: string]: UniequipBasicData;
}

export interface UniequipBasicData {
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

export interface SkillBasicData {
  skillOrder: number;
  skillId: string;
  name: string;
  description: string;
}

export interface SkillsBasic {
  [key: string]: SkillBasicData;
}

export interface CharsBasic {
  [key: string]: CharBasicData;
}

export interface CharBasicData {
  charId: string;
  name: string;
  description: string;
  displayNumber: string;
  appellation: string;
  rarity: string;
  profession: string;
  subProfessionId: string;
  skills: SkillsBasic;
  uniequip: UniequipsBasic;
}

// 敌人
export interface EnemyData {
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

export interface Enemies {
  [key: string]: EnemyData[];
}
