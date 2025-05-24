import type { StageData } from "~/types/gameData";

export const numOfMinorBoss = {
  ro1: 5,
  ro2: 3,
  ro3: 3,
  ro4: 3,
};

// 定义每层的名称，以及筛选器
export const navOfZone = [
  {
    id: "zone_1",
    name: "第一层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n" && args[1] !== "e") return false;
      return args[2] === "1";
    },
  },
  {
    id: "zone_2",
    name: "第二层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n" && args[1] !== "e") return false;
      return args[2] === "2";
    },
  },
  {
    id: "zone_3",
    name: "第三层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && args[2] === "3") return true;
      if (args[1] === "b" && ["1", "2", "3"].includes(args[2])) return true;
      return false;
    },
  },
  {
    id: "zone_4",
    name: "第四层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] !== "n" && args[1] !== "e") return false;
      return args[2] === "4";
    },
  },
  {
    id: "zone_5",
    name: "第五层",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && args[2] === "5") return true;
      if (args[1] === "b" && ["4", "5"].includes(args[2])) return true;
      return false;
    },
  },
  {
    id: "zone_6",
    name: "第六层 · 爱国者",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && (args[2] === "6" || args[2] === "7")) return true;
      if (args[1] === "b" && ["6"].includes(args[2])) return true;
      return false;
    },
  },
  {
    id: "zone_7",
    name: "第六层 · 奎隆",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if ((args[1] === "n" || args[1] === "e") && (args[2] === "6" || args[2] === "7")) return true;
      if (args[1] === "b" && ["7"].includes(args[2])) return true;
      return false;
    },
  },
  {
    id: "zone_8",
    name: "第七层 · 魔王阿米娅",
    filter: (stage: StageData) => {
      const args = stage.id.split("_");
      if (args[1] === "b" && ["8"].includes(args[2])) return true;
      return false;
    },
  },
  // {
  //   id: "boss",
  //   name: "险路恶敌",
  //   filter: (stage: StageData, array: string[]) => {
  //     const excludeIds = ["ro4_b_9"];
  //     if (excludeIds.includes(stage.id)) return false;
  //     const args = stage.id.split("_");
  //     // eg: ro4_b_5_d
  //     if (args[1] !== "b") return false;
  //     // if (args[3]) return false; // 异格
  //     const cool =
  //       parseInt(args[2]) > // 如果该boss编号是小boss，跳过
  //       (numOfMinorBoss[args[0] as keyof typeof numOfMinorBoss] || 99);
  //     if (!cool || array.includes(stage.name)) return false;
  //     array.push(stage.name);
  //     return true;
  //   },
  // },
  // {
  //   id: "others",
  //   name: "特殊关卡",
  //   filter: (stage: StageData) => {
  //     const args = stage.id.split("_");
  //     return ["ev", "t", "duel"].includes(args[1]);
  //   },
  // },
];

/** 萨卡兹肉鸽关卡筛选器 */
// export function stageFilterByRogue4(stage: StageData[]) {
//   if (stage.id.includes("rogue_4")) {
//     return stage.filter((stage) => {
//       const args = stage.id.split("_");
//       if (args[1] !== "n" && args[1] !== "e") return false;
//       return args[2] === "1";
//     });
//   }
//   return stage;
// }
