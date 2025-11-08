import type { RogueInput, SlicedCalcGameDataState } from "../calcTypes";
import type { SliceCreator, SlicedCalcGameDataActions } from "../calcTypes";
import { initialCalcGameDataState } from "../calcConstants";

import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";
import { RogueTopic, type RogueKey } from "~/types/gameData";

export const createGameDataSlice: SliceCreator<SlicedCalcGameDataState & SlicedCalcGameDataActions> = (set, get) => ({
  ...initialCalcGameDataState,
  setRogue4DisasterSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue4_disaster_spec_items = callback(state.rogue4_disaster_spec_items);
      },
      undefined,
      "setRogue4DisasterSpecItems",
    ),
  setRogue4InspirationSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue4_inspiration_spec_items = callback(state.rogue4_inspiration_spec_items);
      },
      undefined,
      "setRogue4InspirationSpecItems",
    ),
  setRogue5WrathSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue5_wrath_spec_items = callback(state.rogue5_wrath_spec_items);
      },
      undefined,
      "setRogue5WrathSpecItems",
    ),
  setRogue5CopperSpecItems: (callback) =>
    set(
      (state) => {
        state.rogue5_copper_spec_items = callback(state.rogue5_copper_spec_items);
      },
      undefined,
      "setRogue5CopperSpecItems",
    ),
  setTopicSpecItems: (callback) =>
    set(
      (state) => {
        state.topicSpecItems = callback(state.topicSpecItems);
      },
      undefined,
      "setTopicSpecItems",
    ),
  setRogueInput: (rogueInput: RogueInput) =>
    set(
      (state) => {
        state.rogueInput = rogueInput;
      },
      undefined,
      "setRogueInput",
    ),
  setRogueKey: async (rogueTopic: RogueTopic) => {
    const state = get();
    const rogueInput = JSON.parse(JSON.stringify(state.rogueInput));
    rogueInput.topic = rogueTopic;

    // 切换主题时使用默认值，不使用本地存储
    const defaultValues = initialCalcGameDataState.rogueInput;

    const topicDefaults = defaultValues[rogueTopic];
    rogueInput[rogueTopic].zone = topicDefaults.zone;
    rogueInput[rogueTopic].layer = topicDefaults.layer;
    rogueInput[rogueTopic].difficulty = topicDefaults.difficulty;
    rogueInput[rogueTopic].tech = topicDefaults.tech;
    rogueInput[rogueTopic].relics = topicDefaults.relics;

    // 设置主题特定属性
    if (rogueTopic === RogueTopic.ROGUE_4) {
      rogueInput[rogueTopic].thoughtLoad = topicDefaults.thoughtLoad;
      rogueInput[rogueTopic].inspiration = topicDefaults.inspiration;
      rogueInput[rogueTopic].disaster = topicDefaults.disaster;
    } else if (rogueTopic === RogueTopic.ROGUE_5) {
      rogueInput[rogueTopic].wraths = topicDefaults.wraths;
      rogueInput[rogueTopic].coppers = topicDefaults.coppers;
    }

    const renderStages = getStageList(state.stages, rogueInput);
    const stageId = renderStages[0].id;
    const { stageData, levelData, levels, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages: state.stages,
      levels: state.levels,
      relics: topicDefaults.relics,
      stageId,
    }); // immer可以获得最新的state
    set(
      (state) => {
        state.rogueInput.topic = rogueTopic;
        state.rogueInput[rogueTopic].difficulty = topicDefaults.difficulty!;
        state.rogueInput[rogueTopic].zone = topicDefaults.zone!;
        state.rogueInput[rogueTopic].layer = topicDefaults.layer;
        state.rogueInput[rogueTopic].tech = topicDefaults.tech;
        state.rogueInput[rogueTopic].relics = topicDefaults.relics;
        state.renderStages = renderStages;
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;

        // 设置主题特定属性
        if (rogueTopic === RogueTopic.ROGUE_4) {
          state.rogueInput[rogueTopic].thoughtLoad = topicDefaults.thoughtLoad;
          state.rogueInput[rogueTopic].inspiration = topicDefaults.inspiration;
          state.rogueInput[rogueTopic].disaster = topicDefaults.disaster;
        } else if (rogueTopic === RogueTopic.ROGUE_5) {
          state.rogueInput[rogueTopic].wraths = topicDefaults.wraths;
          state.rogueInput[rogueTopic].coppers = topicDefaults.coppers;
        }
      },
      undefined,
      "setRogueKey",
    );
  },
  setRogueDifficulty: (difficulty) => {
    return set(
      (state) => {
        state.rogueInput[get().rogueInput.topic].difficulty = difficulty;
      },
      undefined,
      "setRogueDifficulty",
    );
  },
  setRogueZone: async (zone) => {
    const state = get();
    const rogueInput = JSON.parse(JSON.stringify(state.rogueInput));
    const rogueKey = rogueInput.topic as RogueKey;

    // 根据区域和关卡设置默认层数
    const getDefaultLayerForZone = (zone: string, topic: string, stageId?: string): string => {
      if (topic === "rogue_4") {
        // 萨卡兹主题的层数映射
        const sarkazZoneToLayerMap: Record<string, string> = {
          zone_1: "layer_1", // I 熔魂之始 → 第一层
          zone_2: "layer_2", // II 锻铁根须 → 第二层
          zone_3: "layer_3", // III 灰铸迷城 → 第三层
          zone_4: "layer_4", // IV 或然歧域 → 第四层
          zone_5: "layer_5", // V 虚实疆界 → 第五层
          zone_6: "layer_6", // VI 辉光天顶·爱国者 → 第六层
          zone_7: "layer_6", // VI 逍遥兰若·奎隆 → 第六层
          zone_8: "layer_7", // VII 无终安息·魔王阿米娅 → 第七层
        };

        // 不期而遇区域的特殊处理
        if (zone === "zone_9") {
          return "layer_4"; // 默认关卡显示时光凯旋，默认第四层
        }

        // 诡异行商区域的特殊处理
        if (zone === "zone_10") {
          return "layer_4"; //默认关卡显示叙事要约，默认第四层
        }

        return sarkazZoneToLayerMap[zone] || "layer_1";
      } else {
        // 界园主题的层数映射
        const jiayuanZoneToLayerMap: Record<string, string> = {
          zone_1: "layer_1", // I 洪陆楼 → 第一层
          zone_2: "layer_2", // II 山水阁 → 第二层
          zone_3: "layer_3", // III 云瓦亭 → 第三层
          zone_4: "layer_4", // IV 汝吾门 → 第四层
          zone_5: "layer_5", // V 见字祠 → 第五层
          zone_6: "layer_6", // VI 始末陵·"望" → 第六层
          zone_7: "layer_2", // 岁兽残识 → 第二层
          zone_8: "layer_1", // 不期而遇 → 第一层
        };

        // 诡异行商区域的特殊处理
        if (zone === "zone_10") {
          if (stageId === "ro5_ev_1") return "layer_1"; // 神游天外 → 第一层
          if (stageId === "ro5_ev_2") return "layer_4"; // 作壁上观 → 第四层
          return "layer_1"; // 默认第一层
        }

        // 指点迷津区域的特殊处理
        if (zone === "zone_11") {
          if (stageId === "ro5_dv_5") return "layer_5"; // 分明 → 第五层
          return "layer_5"; // 默认第五层
        }

        return jiayuanZoneToLayerMap[zone] || "layer_1";
      }
    };

    rogueInput[rogueKey].zone = zone;

    const renderStages = getStageList(state.stages, rogueInput);
    const stageId = renderStages[0].id;

    // 根据第一个关卡的默认层数设置层数
    const getDefaultLayerForStage = (stageId: string, topic: string): string => {
      if (topic === "rogue_4") {
        if (stageId === "ro4_ev_1") return "layer_1"; // 物权纠纷 → 第一层
        if (stageId === "ro4_ev_2") return "layer_4"; // 叙事要约 → 第四层
      } else if (topic === "rogue_5") {
        if (stageId === "ro5_ev_1") return "layer_1"; // 神游天外 → 第一层
        if (stageId === "ro5_ev_2") return "layer_4"; // 作壁上观 → 第四层
      }
      // 对于非商店关卡，使用区域默认层数
      return getDefaultLayerForZone(zone, rogueKey);
    };

    const defaultLayer = getDefaultLayerForStage(stageId, rogueKey);
    rogueInput[rogueKey].layer = defaultLayer;
    const { stageData, levelData, levels, relics, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput,
      stages: state.stages,
      levels: state.levels,
      relics: state.rogueInput[rogueKey].relics,
      stageId,
    });
    set(
      (state) => {
        state.rogueInput[rogueKey].zone = zone;
        state.rogueInput[rogueKey].layer = defaultLayer;
        state.renderStages = renderStages;
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.rogueInput[rogueKey].relics = relics;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
      },
      undefined,
      "setRogueZone",
    );
  },
  setRogueLayer: (layer) => {
    const state = get();
    const rogueKey = state.rogueInput.topic as RogueKey;
    return set(
      (state) => {
        state.rogueInput[rogueKey].layer = layer;
      },
      undefined,
      "setRogueLayer",
    );
  },
  setRogueStageId: async (stageId) => {
    const state = get();
    const rogueKey = state.rogueInput.topic as RogueKey;
    const { stageData, levelData, levels, relics, enemyData, enemyBase } = await handleUpdateStageId({
      rogueInput: state.rogueInput,
      stages: state.stages,
      levels: state.levels,
      relics: state.rogueInput[rogueKey].relics,
      stageId,
    });

    // 根据关卡设置默认层数
    const getDefaultLayerForStage = (stageId: string, topic: string): string => {
      if (topic === "rogue_4") {
        if (stageId === "ro4_ev_1") return "layer_1"; // 物权纠纷 → 第一层
        if (stageId === "ro4_ev_2") return "layer_4"; // 叙事要约 → 第四层
        // 萨卡兹主题不期而遇关卡特定层数设置
        if (stageId === "ro4_e_t_2") return "layer_5"; // 紧急信号灯 → 第五层
        if (stageId === "ro4_t_1") return "layer_1"; // 失败的试胆 → 第一层
        if (stageId === "ro4_t_2") return "layer_2"; // 普通信号灯 → 第二层
        if (stageId === "ro4_t_3") return "layer_3"; // 劫虚济实 → 第三层
        if (stageId === "ro4_t_4") return "layer_6"; // 鸭速公路 → 第六层
        if (stageId === "ro4_t_5") return "layer_4"; // 战场侧面 → 第四层
        if (stageId === "ro4_t_6") return "layer_4"; // 继承 → 第四层
        if (stageId === "ro4_t_7") return "layer_4"; // 时光凯旋 → 第四层
        if (stageId === "ro4_t_8") return "layer_5"; // 玩具的报复 → 第五层
      } else if (topic === "rogue_5") {
        if (stageId === "ro5_ev_1") return "layer_1"; // 神游天外 → 第一层
        if (stageId === "ro5_ev_2") return "layer_4"; // 作壁上观 → 第四层
        // 界园主题不期而遇关卡特定层数设置
        if (stageId === "ro5_t_1") return "layer_1"; // 源源不断 → 第一层
        if (stageId === "ro5_t_2") return "layer_3"; // 闪闪发光 → 第三层
        if (stageId === "ro5_t_3") return "layer_3"; // 循循善诱 → 第三层
        if (stageId === "ro5_t_4") return "layer_6"; // 易易鸭鸭 → 第六层
        if (stageId === "ro5_t_5") return "layer_6"; // 劫罚 → 第六层
        if (stageId === "ro5_t_6") return "layer_5"; // 生百相 → 第五层
        if (stageId === "ro5_t_7") return "layer_3"; // 硕果累累 → 第三层
        if (stageId === "ro5_t_8") return "layer_3"; // 以逸待劳 → 第三层
        if (stageId === "ro5_t_9_a") return "layer_4"; // 喜从驮来 → 第四层
        if (stageId === "ro5_t_9_b") return "layer_4"; // 硅基伥的宴席 → 第四层
        if (stageId === "ro5_t_9_c") return "layer_4"; // 彻底失控 → 第四层
        if (stageId === "ro5_t_10") return "layer_3"; // 为崖作伥 → 第三层
        // 界园主题指点迷津关卡特定层数设置
        if (stageId === "ro5_dv_5") return "layer_5"; // 分明 → 第五层
        if (stageId === "ro5_fs_1") return "layer_5"; // 谤天 → 第五层
        if (stageId === "ro5_fs_1_b") return "layer_5"; // 谤天(紧急) → 第五层
        if (stageId === "ro5_fs_2") return "layer_5"; // 迎雷 → 第五层
        if (stageId === "ro5_fs_2_b") return "layer_5"; // 迎雷(紧急) → 第五层
        if (stageId === "ro5_fs_3") return "layer_5"; // 蔑震 → 第五层
        if (stageId === "ro5_fs_3_b") return "layer_5"; // 蔑震(紧急) → 第五层
        if (stageId === "ro5_fs_4") return "layer_5"; // 赴陨 → 第五层
        if (stageId === "ro5_fs_4_b") return "layer_5"; // 赴陨(紧急) → 第五层
        if (stageId === "ro5_fs_5") return "layer_5"; // 斥洪 → 第五层
        if (stageId === "ro5_fs_5_b") return "layer_5"; // 斥洪(紧急) → 第五层
      }
      return state.rogueInput[rogueKey].layer; // 保持当前层数
    };

    const newLayer = getDefaultLayerForStage(stageId, rogueKey);

    set(
      (state) => {
        state.stageId = stageId;
        state.stageData = stageData;
        state.levelData = levelData as never;
        state.levels = levels;
        state.rogueInput[rogueKey].relics = relics;
        state.enemyData = enemyData as never;
        state.enemyBase = enemyBase;
        state.rogueInput[rogueKey].layer = newLayer;
      },
      undefined,
      "setRogueStageId",
    );
  },
  setRogueTech: (tech) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        state.rogueInput[rogueKey].tech = tech;
      },
      undefined,
      "setRogueTech",
    ),
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.thoughtLoad = thoughtLoad;
      },
      undefined,
      "setRogueThoughtLoad",
    ),
  setRogue4Inspiration: (inspiration) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.inspiration = inspiration;
      },
      undefined,
      "setRogue4Inspiration",
    ),
  setRogue4Disaster: (disaster) =>
    set(
      (state) => {
        state.rogueInput.rogue_4.disaster = disaster;
      },
      undefined,
      "setRogue4Disaster",
    ),
  setRogue5Wraths: (wraths) =>
    set(
      (state) => {
        if (Array.isArray(wraths)) {
          state.rogueInput.rogue_5.wraths = wraths;
        } else {
          const updated = [...state.rogueInput.rogue_5.wraths];
          if (updated.includes(wraths)) updated.splice(updated.indexOf(wraths), 1);
          else updated.unshift(wraths);
          state.rogueInput.rogue_5.wraths = updated;
        }
      },
      undefined,
      "setRogueWraths",
    ),
  setRogue5Coppers: (coppers) =>
    set(
      (state) => {
        if (Array.isArray(coppers)) {
          state.rogueInput.rogue_5.coppers = coppers;
        } else {
          const updated = [...state.rogueInput.rogue_5.coppers];
          if (updated.includes(coppers)) updated.splice(updated.indexOf(coppers), 1);
          else updated.unshift(coppers);
          state.rogueInput.rogue_5.coppers = updated;
        }
      },
      undefined,
      "setRogueCoppers",
    ),
});
