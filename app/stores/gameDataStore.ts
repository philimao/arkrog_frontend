import { _get } from "~/utils/tools";
import type {
  CharData,
  CharId,
  ItemData,
  RogueKey,
  SkillData,
  StageOfRogue,
  TopicData,
  UniEquipData,
  WrappedRelicItem,
  WrappedRelicTopicArtifact,
  ZoneOfRogue,
} from "~/types/gameData";
import type { AutochessPayload } from "~/types/autochess";
import { api } from "~/services/api";
import { create } from "zustand";
import { toast } from "react-toastify";
import { devtools } from "zustand/middleware";

// 游戏数据
interface GameDataBasic {
  /** 肉鸽主题 */
  topics: Record<RogueKey, TopicData>;
  /** 特定肉鸽所有层 */
  zones: Record<RogueKey, ZoneOfRogue>;
  /** 特定肉鸽所有关卡 */
  stages: Record<RogueKey, StageOfRogue>;
}

interface GameDataExt {
  /** 支援道具数据 */
  // traps: BasicObject;
  /** 按主题懒加载的共享包装藏品，是 frontend 唯一藏品数据源。 */
  relics: Partial<Record<RogueKey, Record<string, WrappedRelicItem>>>;
  /** 物品数据 */
  items: Record<RogueKey, Record<string, ItemData>>;
  /** 干员解包数据 */
  character_table: Record<CharId, CharData>;
  /** 技能解包数据 */
  skill_table: Record<string, SkillData>;
  /** 模组解包数据 */
  uniequip_table: Record<string, UniEquipData>;
  /** 关卡敌人数据 @deprecated */
  // stageEnemies?: Record<RogueKey, Record<string, EnemyInput[]>>;
}

interface GameDataAddon {
  /** 自走棋数据 */
  autochess: AutochessPayload;
}

export type GameDataState = GameDataBasic &
  GameDataExt &
  GameDataAddon & {
    basicLoaded: boolean;
    extLoaded: boolean;
    autochessLoaded: boolean;
  };

type GameDataAction = {
  fetchGameDataBasic: () => Promise<void>;
  fetchGameDataExt: () => Promise<GameDataState>;
  /** 按用户当前选择懒加载单个主题的包装藏品，并在 store 中缓存。 */
  fetchRelicTopic: (topicId: RogueKey) => Promise<Record<string, WrappedRelicItem>>;
  fetchAutochessData: () => Promise<AutochessPayload>;
};

/** 同一主题并发请求复用一个 Promise，避免快速切换时重复下载。 */
const relicTopicRequests = new Map<string, Promise<Record<string, WrappedRelicItem>>>();

export const useGameDataStore = create<GameDataState & GameDataAction>()(
  devtools(
    (set, get) => ({
      topics: undefined,
      stages: undefined,
      zones: undefined,
      // traps: undefined,
      relics: {},
      items: undefined,
      character_table: undefined,
      skill_table: undefined,
      uniequip_table: undefined,
      autochess: undefined,
      basicLoaded: false,
      extLoaded: false,
      autochessLoaded: false,
      // stageEnemies: undefined,
      fetchGameDataBasic: async () => {
        try {
          if (get().basicLoaded) return;
          const data = await _get<GameDataState>("/gamedata/bundle");
          if (data) {
            set(
              (state) => ({
                ...state,
                ...data,
                basicLoaded: true,
              }),
              undefined,
              "fetchGameDataBasic",
            );
          }
          // console.log(get());
        } catch (err) {
          console.error(err);
          toast.error(`加载游戏基础数据失败！`);
        }
      },
      fetchGameDataExt: async () => {
        try {
          if (get().extLoaded) return get();
          // 忽略旧接口中的全量 relics，frontend 只保留 fetchRelicTopic 的按主题缓存。
          const extData = await _get<Omit<GameDataExt, "relics"> & { relics?: unknown }>("/gamedata/bundle-ext");
          const { relics: _legacyRelics, ...sharedData } = extData;
          set(
            (state) => ({
              ...state,
              ...sharedData,
              extLoaded: true,
            }),
            undefined,
            "fetchGameDataExt",
          );
          // console.log(get());
          return get();
        } catch (err) {
          console.error(err);
          toast.error("加载游戏补充数据失败！");
        }
      },
      fetchRelicTopic: async (topicId) => {
        const cached = get().relics[topicId];
        if (cached) return cached;

        const pending = relicTopicRequests.get(topicId);
        if (pending) return pending;

        const request = fetch(`/data/wrapped-relics/${topicId}.json`)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`加载包装藏品失败：${topicId} HTTP ${response.status}`);
            }
            const artifact = (await response.json()) as WrappedRelicTopicArtifact;
            // v4 起外层包含 backend 同规则拼音，且内层 usage 保证为字符串。
            if (artifact.schemaVersion !== 4) {
              throw new Error(`包装藏品版本不兼容：需要 v4，收到 v${artifact.schemaVersion}`);
            }
            if (artifact.topic.id !== topicId) {
              throw new Error(`包装藏品主题不匹配：请求 ${topicId}，收到 ${artifact.topic.id}`);
            }
            const relics = Object.fromEntries(
              artifact.items.map((item) => [item.id, item]),
            );
            set(
              (state) => ({
                ...state,
                relics: {
                  ...state.relics,
                  [topicId]: relics,
                },
              }),
              undefined,
              `fetchRelicTopic:${topicId}`,
            );
            return relics;
          })
          .finally(() => {
            // 成功结果已进入 store；失败请求允许用户下次重试。
            relicTopicRequests.delete(topicId);
          });
        relicTopicRequests.set(topicId, request);
        return request;
      },
      fetchAutochessData: async () => {
        try {
          if (get().autochessLoaded) return get().autochess;
          const { data } = await api.get<AutochessPayload>("/gamedata/autochess");
          set(
            (state) => ({
              ...state,
              autochess: data,
              autochessLoaded: true,
            }),
            undefined,
            "fetchAutochessData",
          );
          return data;
        } catch (err) {
          console.error(err);
          toast.error("加载卫戍协议数据失败！");
          throw err;
        }
      },
    }),
    { name: "gameDataStore" },
  ),
);
