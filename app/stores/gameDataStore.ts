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
 * 校验 /gamedata/bundle-ext 的响应形状。理由同 isValidBundle，而且更要紧：
 * 版本化改造后这个响应会被浏览器以一年 immutable 缓存住，一份坏副本能一直活到
 * 数据下次更新（可能是几周），期间刷新都救不回来——不像改造前最多脏 24 小时。
 */
function isValidExtBundle(data: unknown): data is GameDataExt {
  if (!data || typeof data !== "object") return false;
  const bundle = data as Partial<GameDataExt>;
  return !!bundle.relics && !!bundle.items && !!bundle.character_table;
}

/**
 * 单飞：basicLoaded 在响应回来后才置位，此前并发调用（RootLayout preload、
 * 各页面自己的 useEffect）会各打各的请求；绕缓存重试会把这个放大直打源站。
 * force 请求不并入，否则拿不到绕缓存的结果。
 */
let basicInflight: Promise<void> | null = null;

/**
 * 数据版本号，用于走 /gamedata/bundle/v/:version 这条一年 immutable 的路由。
 *
 * 原来两个 bundle 都是 24 小时强缓存，等于每人每天重下 594KB
 * （2026-08-16 CDN 明细：合计 1.637GB/日，占全站流量 19.8%）。后端按 bundle
 * 内容算了个哈希当版本号，/gamedata/version 是 no-store 的几十字节响应，
 * 每次启动问一次，版本没变就整条 bundle 走本地缓存、零请求。
 *
 * 版本号在**路径**里而不是 query：腾讯云 CDN 默认忽略 query string 做缓存键，
 * 放 query 会让新旧版本撞进同一份缓存，等于把一年 immutable 喂给错误的 body。
 *
 * 拿不到版本号（老后端、接口抖动）就返回 null，调用方退回无版本号的老路由，
 * 行为与改造前完全一致。整个会话只解析一次。
 */
type DataVersion = { bundle: string; bundleExt: string };
let versionPromise: Promise<DataVersion | null> | null = null;

function resolveDataVersion(): Promise<DataVersion | null> {
  versionPromise ??= _get<Partial<DataVersion>>("/gamedata/version")
    .then((v) =>
      typeof v?.bundle === "string" && typeof v?.bundleExt === "string"
        ? { bundle: v.bundle, bundleExt: v.bundleExt }
        : null,
    )
    .catch((err) => {
      console.warn("获取数据版本号失败，退回无版本号路由", err);
      return null;
    });
  return versionPromise;
}

/** 版本号可用就走 immutable 路由，否则退回老路由 */
async function bundleUrl(name: keyof DataVersion): Promise<string> {
  const base = name === "bundle" ? "/gamedata/bundle" : "/gamedata/bundle-ext";
  const version = await resolveDataVersion();
  return version ? `${base}/v/${version[name]}` : base;
}

type GameDataAction = {
  /** `force` 跳过 basicLoaded 闩锁并绕过 /gamedata/bundle 的 24 小时强缓存 */
  fetchGameDataBasic: (options?: { force?: boolean }) => Promise<void>;
  /** `force` 跳过 extLoaded 闩锁，并绕开版本化 URL 与浏览器强缓存 */
  fetchGameDataExt: (options?: { force?: boolean }) => Promise<GameDataState>;
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
            // force 是坏缓存自愈路径：显式走无版本号的老路由 + 绕缓存，
            // 否则会被自己刚写进浏览器缓存的那份 immutable 副本挡住
            const data = await _get<unknown>(
              force ? "/gamedata/bundle" : await bundleUrl("bundle"),
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
      fetchGameDataExt: async (options) => {
        const force = options?.force ?? false;
        try {
          if (!force && get().extLoaded) return get();
          // force 是坏缓存自愈路径：走无版本号的老路由 + 绕缓存，
          // 否则会被自己刚写进浏览器缓存的那份 immutable 副本挡住
          const extData = await _get<unknown>(
            force ? "/gamedata/bundle-ext" : await bundleUrl("bundleExt"),
            force ? noCacheInit : undefined,
          );
          if (!isValidExtBundle(extData)) {
            throw new Error("游戏补充数据响应格式异常");
          }
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
          if (force) {
            console.error(err);
            toast.error("加载游戏补充数据失败！");
            return get();
          }
          // 自愈：坏缓存副本或瞬时抖动，绕缓存重试一次。与 basic 同构。
          console.warn("游戏补充数据加载失败，绕缓存重试一次", err);
          await new Promise((resolve) => setTimeout(resolve, 300));
          return get().fetchGameDataExt({ force: true });
        }
      },
      fetchAutochessData: async () => {
        try {
          if (get().autochessLoaded) return get().autochess;
          const { data } = await api.get<AutochessPayload>(
            "/gamedata/autochess",
          );
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
