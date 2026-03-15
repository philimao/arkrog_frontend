import { _get } from "~/utils/tools";
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
    extLoaded: boolean;
    autochessLoaded: boolean;
  };

type GameDataAction = {
  fetchGameDataBasic: () => Promise<void>;
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
