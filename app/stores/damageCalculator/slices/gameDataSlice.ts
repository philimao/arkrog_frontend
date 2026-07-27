import type { RogueInput, SlicedCalcGameDataState } from "../calcTypes";
import type { SliceCreator, SlicedCalcGameDataActions } from "../calcTypes";
import { initialCalcGameDataState } from "../calcConstants";

import { getStageList, handleUpdateStageId } from "../calcUtils/gameDataUtils";
import { RogueTopic, type RogueKey } from "~/types/gameData";
import {
  getDefaultLayerForStage,
  getDefaultLayerForZone,
} from "~/modules/Tool/DamageCalculator/EnemySection/enemyUtils";

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
    // 等待目标主题藏品准备完成后再切换 topic，避免消费者读取空映射。
    await get().loadRelicTopic(rogueTopic);
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

    const renderStages = getStageList(state.zones, state.stages, rogueInput);
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

        // 当难度低于14时，为年代之刺与饮泣之刺取消年代印痕减伤
        if (["trap_760_skztzs", "enemy_2073_skzrck"].includes(state.enemyData.id)) {
          if (difficulty < 14) {
            state.enemySpec.value[0] = {
              label: "年代印痕减伤",
              key: "0",
              blackboard: [{ bbKey: "enemy_damage_resistance", value: 0 }],
            };
          } else {
            state.enemySpec.value[0] = {
              label: "年代印痕减伤",
              key: "0.5",
              blackboard: [{ bbKey: "enemy_damage_resistance", value: 0.5 }],
            };
          }
        }
      },
      undefined,
      "setRogueDifficulty",
    );
  },
  setRogueZone: async (zone) => {
    const state = get();
    const rogueInput = JSON.parse(JSON.stringify(state.rogueInput));
    const rogueKey = rogueInput.topic as RogueKey;

    rogueInput[rogueKey].zone = zone;

    const renderStages = getStageList(state.zones, state.stages, rogueInput);
    const stageId = renderStages[0].id;

    // 根据区域更新难度层数
    const newLayer = getDefaultLayerForZone(stageId, rogueInput, state.zones);
    rogueInput[rogueKey].layer = newLayer;

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
        state.rogueInput[rogueKey].layer = newLayer;
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

    // 根据关卡更新难度层数
    const newLayer = getDefaultLayerForStage(stageId, state.rogueInput);

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
