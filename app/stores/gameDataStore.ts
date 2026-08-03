import { _get, noCacheInit } from "~/utils/tools";
import type {
  CharData,
  CharId,
  ItemData,
  RelicData,
  RogueKey,
  SkillData,
  StageOfRogue,
  TopicData,
  UniEquipData,
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
  /** 藏品数据 */
  relics: Record<RogueKey, Record<string, RelicData>>;
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
    /** 基础数据两次尝试（含绕缓存重试）都失败时的错误，成功后清空 */
    basicError: Error | null;
    extLoaded: boolean;
    autochessLoaded: boolean;
  };

/**
 * 校验 /gamedata/bundle 的响应形状。
 * 非 JSON 响应（CDN 错误页、网关 HTML）会被 _get 的 text 兜底变成字符串，
 * 直接展开进 store 会把 basicLoaded 置真而 topics/zones/stages 仍为 undefined，
 * 闩锁就此永久关死且无从恢复——所以置位前必须验形状。
 */
function isValidBundle(data: unknown): data is GameDataBasic {
  if (!data || typeof data !== "object") return false;
  const bundle = data as Partial<GameDataBasic>;
  return !!bundle.topics && !!bundle.zones && !!bundle.stages;
}

/**
 * 单飞：basicLoaded 在响应回来后才置位，此前并发调用（RootLayout preload、
 * 各页面自己的 useEffect）会各打各的请求；绕缓存重试会把这个放大直打源站。
 * force 请求不并入，否则拿不到绕缓存的结果。
 */
let basicInflight: Promise<void> | null = null;

type GameDataAction = {
  /** `force` 跳过 basicLoaded 闩锁并绕过 /gamedata/bundle 的 24 小时强缓存 */
  fetchGameDataBasic: (options?: { force?: boolean }) => Promise<void>;
  fetchGameDataExt: () => Promise<GameDataState>;
  fetchAutochessData: () => Promise<AutochessPayload>;
};

export const useGameDataStore = create<GameDataState & GameDataAction>()(
  devtools(
    (set, get) => ({
      topics: undefined,
      stages: undefined,
      zones: undefined,
      // traps: undefined,
      relics: undefined,
      items: undefined,
      character_table: undefined,
      skill_table: undefined,
      uniequip_table: undefined,
      autochess: undefined,
      basicLoaded: false,
      basicError: null,
      extLoaded: false,
      autochessLoaded: false,
      // stageEnemies: undefined,
      fetchGameDataBasic: async (options) => {
        const force = options?.force ?? false;
        if (!force && get().basicLoaded) return;
        if (!force && basicInflight) return basicInflight;
        if (get().basicError) {
          set({ basicError: null }, undefined, "fetchGameDataBasic/retry");
        }

        const run = async (): Promise<void> => {
          try {
            const data = await _get<unknown>(
              "/gamedata/bundle",
              force ? noCacheInit : undefined,
            );
            if (!isValidBundle(data)) {
              throw new Error("游戏基础数据响应格式异常");
            }
            set(
              (state) => ({
                ...state,
                ...data,
                basicLoaded: true,
                basicError: null,
              }),
              undefined,
              "fetchGameDataBasic",
            );
          } catch (err) {
            if (force) {
              console.error(err);
              set(
                { basicError: err as Error },
                undefined,
                "fetchGameDataBasic/error",
              );
              toast.error(`加载游戏基础数据失败！`);
              return;
            }
            // 自愈：坏缓存副本或瞬时抖动，绕缓存重试一次。
            // 重试是本次调用内的第二次 await 而非 effect 驱动，结构上不会成环
            console.warn("游戏基础数据加载失败，绕缓存重试一次", err);
            await new Promise((resolve) => setTimeout(resolve, 300));
            return get().fetchGameDataBasic({ force: true });
          }
        };

        const task = run().finally(() => {
          if (!force) basicInflight = null;
        });
        if (!force) basicInflight = task;
        return task;
      },
      fetchGameDataExt: async () => {
        try {
          if (get().extLoaded) return get();
          const extData = await _get<GameDataExt>("/gamedata/bundle-ext");
          set(
            (state) => ({
              ...state,
              ...extData,
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
