import { _get } from "~/utils/tools";
import type { GameData } from "~/types/gameData";
import { create } from "zustand";
import type { BasicObject } from "~/types/core";
import { toast } from "react-toastify";

type GameDataState = {
  gameData: GameData | null;
  loading: boolean;
  fetchGameData: () => Promise<void>;
  fetchGameDataExt: () => Promise<void>;
  fetchCharacterTable: () => Promise<void>;
};

export const useGameDataStore = create<GameDataState>((set, get) => ({
  gameData: null,
  loading: false,
  fetchGameData: async () => {
    try {
      set({ loading: true });
      const dataArray: any[] = await Promise.all([
        _get("/gamedata/bundle"),
        _get("/gamedata/character-basic"),
      ]);
      console.log(dataArray);
      if (dataArray.every((i) => i)) {
        dataArray.forEach((data) => {
          set((state) => ({
            gameData: { ...(state.gameData || {}), ...data },
          }));
        });
      }
      const gameData = get().gameData;
      const uniequipDict: BasicObject = {};
      Object.values(gameData?.character_basic || {}).forEach((charData) => {
        const { uniequip } = charData;
        for (const key in uniequip) {
          uniequipDict[key] = uniequip[key];
        }
      });
      set((state) => ({
        gameData: { ...(state.gameData as GameData), uniequipDict },
      }));
      set({ loading: false });
      console.log(get().gameData);
    } catch (err) {
      console.error(err);
      toast.error("游戏数据加载失败\n" + (err as Error).message);
    }
  },
  fetchGameDataExt: async () => {
    try {
      set({ loading: true });
      const extData: GameData | undefined = await _get("/gamedata/bundle-ext");
      if (extData) {
        set((state) => ({
          gameData: { ...state.gameData, ...extData },
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
          gameData: { ...state.gameData, ...data },
        }));
      }
      set({ loading: false });
    } catch (err) {
      toast.error("干员数据加载失败\n" + (err as Error).message);
    }
  },
}));
