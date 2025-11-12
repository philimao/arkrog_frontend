import type { BasicObject } from "~/types/core";
import { RogueTopic } from "./gameData";

export const StageTypes: BasicObject = {
  normal: "普通",
  elite: "紧急",
  boat: "带船",
};

export const SeedTypes: BasicObject = {
  good: "胡种",
  bad: "毒种",
  tool: "工具种",
  other: "其他",
};

export const SeedTypeColors: BasicObject = {
  good: "ak-red",
  bad: "ak-purple",
  tool: "ak-blue",
  other: "ak-pink",
};

/**
 * 可用的关卡难度等级
 */
export const StageLevels = ["N0", "N15", "N18"];

/**
 * 肉鸽主题最高难度等级
 */
export const topicMaxLevels = {
  [RogueTopic.ROGUE_1]: "N18",
  [RogueTopic.ROGUE_2]: "N18",
  [RogueTopic.ROGUE_3]: "N15",
  [RogueTopic.ROGUE_4]: "N18",
  [RogueTopic.ROGUE_5]: "N15",
};
