/**
 * 无藏收录页面用关卡筛选器，不要与计算器页面关卡筛选器混用
 */

import type { StageData } from "~/types/gameData";

// 三层boss关数量（异格记为同一个）
export const numOfMinorBoss = {
  ro1: 5,
  ro2: 3,
  ro3: 3,
  ro4: 3,
  ro5: 3,
  ro6: 3, // 黑流树海：b_1~b_3 为三层小boss，不计入险路恶敌（与后端 numOfZone3Boss 同值）
};

// 定义每层的名称，以及筛选器
export const navOfZone = [
  {
    id: "boss",
    name: "险路恶敌",
    filter: (stage: StageData, array: string[]) => {
      const excludeIds = ["ro4_b_9"];
      if (excludeIds.includes(stage.id)) return false;
      const args = stage.id.split("_");
      // eg: ro4_b_5_d
      if (args[1] !== "b") return false;
      // if (args[3]) return false; // 异格
      const cool =
        parseInt(args[2]) > // 如果该boss编号是小boss，跳过
        (numOfMinorBoss[args[0] as keyof typeof numOfMinorBoss] || 99);
      if (!cool || array.includes(stage.name)) return false;
      array.push(stage.name);
      return true;
    },
  },
  {
    id: "6",
    name: "第六层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n") return false;
      return args[2] === "6" || args[2] === "7"; // 洞天福地是7层
    },
  },
  {
    id: "5",
    name: "第五层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n") return false;
      return args[2] === "5";
    },
  },
  {
    id: "4",
    name: "第四层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n") return false;
      return args[2] === "4";
    },
  },
  {
    id: "zone_sky_1",
    name: "是非境",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "sv") return false;
      return args.slice(-1)[0] !== "dlc1";
    },
  },
  {
    id: "zone_sky_2",
    name: "今昔境",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "sv") return false;
      return args.slice(-1)[0] === "dlc1";
    },
  },
  {
    id: "zone_portal",
    name: "未萌生的摇篮",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      return args[1] === "c"; // 黑流树海 GRID_ZONE 传送门关卡
    },
  },
  {
    id: "others",
    name: "特殊关卡",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      return [
        "ev", // 不期而遇
        "t", // 不期而遇
        "duel", // 狭路
        "dv", //分明
      ].includes(args[1]);
    },
  },
];
