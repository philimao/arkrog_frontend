export type RogueKey =
  | "rogue_1"
  | "rogue_2"
  | "rogue_3"
  | "rogue_4"
  | "rogue_5"
  | "rogue_6"
  | "rogue_7"
  | "rogue_8";

export interface GameData {
  topics: Topics;
  stages: Stages;
  zones: Zones;
  traps: object;
  relics: object;
  items: object;
}

export type Topics = {
  [key in RogueKey]: TopicData;
};

export interface TopicData {
  id: RogueKey;
  lineText: string;
  name: string;
  name_en: string;
  startTime: number;
}

export type Zones = {
  [key in RogueKey]: ZoneOfRogue;
};

export type ZoneOfRogue = {
  [key: string]: ZoneData;
};

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

export type Stages = {
  [key in RogueKey]: StageOfRogue;
};

export type StageOfRogue = {
  [key in RogueKey]: StageData;
};

export interface StageData {
  id: string;
  code: string;
  name: string;
  description: string;
  difficulty: string;
  isBoss: 0 | 1;
  isElite: 0 | 1;
  [key: string]: any;
}
