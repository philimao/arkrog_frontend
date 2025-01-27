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
  zones: Zones;
  traps: object;
  relics: object;
  items: object;
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
