import { _get } from "~/utils/tools";
import type { GameData } from "~/types/gameData";
import { create } from "zustand";
import type { BasicObject } from "~/types/core";
import { toast } from "react-toastify";

type GameDataAction = {
  loading: boolean;
  fetchGameData: () => Promise<void>;
  fetchGameDataExt: () => Promise<void>;
  fetchCharacterTable: () => Promise<void>;
};

export const useGameDataStore = create<Partial<GameData> & GameDataAction>(
  (set, get) => ({
    topics: undefined,
    stages: undefined,
    zones: undefined,
    traps: undefined,
    relics: undefined,
    items: undefined,
    character_basic: undefined,
    character_table: undefined,
    skill_table: undefined,
    uniequipDict: undefined,
    loading: false,
    fetchGameData: async () => {
      try {
        set({ loading: true });
        const dataArray = await Promise.all([
          _get<Partial<GameData>>("/gamedata/bundle"),
          _get<Partial<GameData>>("/gamedata/character-basic"),
        ]);
        if (dataArray.every((i) => i)) {
          dataArray.forEach((data) => {
            set((state) => ({
              ...state,
              ...data,
            }));
          });
        }
        const character_basic = get().character_basic;
        const uniequipDict: BasicObject = {};
        Object.values(character_basic || {}).forEach((charData) => {
          const { uniequip } = charData;
          for (const key in uniequip) {
            uniequipDict[key] = uniequip[key];
          }
        });
        set({ uniequipDict: uniequipDict, loading: false });
        console.log(get());
      } catch (err) {
        console.error(err);
        toast.error("游戏数据加载失败\n" + (err as Error).message);
      }
    },
    fetchGameDataExt: async () => {
      try {
        set({ loading: true });
        const extData: GameData | undefined = await _get(
          "/gamedata/bundle-ext",
        );
        if (extData) {
          set((state) => ({
            ...state,
            ...extData,
          }));
        }
        set({ loading: false });
      } catch (err) {
        toast.error("游戏补充数据加载失败\n" + (err as Error).message);
      }
    },
    fetchCharacterTable: async () => {
      try {
        set({ loading: true });
        const data: GameData | undefined = await _get(
          "/gamedata/character-table",
        );
        if (data) {
          set((state) => ({
            ...state,
            ...data,
          }));
        }
        set({ loading: false });
      } catch (err) {
        toast.error("干员数据加载失败\n" + (err as Error).message);
      }
    },
  }),
);
