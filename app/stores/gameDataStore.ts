import { _get } from "~/utils/tools";
import type { GameData } from "~/types/gameData";
import { create } from "zustand";

type GameDataState = {
  gameData: GameData | null;
  fetchGameData: () => Promise<void>;
  fetchGameDataExt: () => Promise<void>;
};

export const useGameDataStore = create<GameDataState>((set) => ({
  gameData: null,
  fetchGameData: async () => {
    const data: GameData | undefined = await _get("/gamedata/bundle");
    if (data) {
      set({ gameData: data });
    }
  },
  fetchGameDataExt: async () => {
    const extData: GameData | undefined = await _get("/gamedata/bundle-ext");
    if (extData) {
      set((state) => ({
        gameData: { ...state.gameData, ...extData },
      }));
    }
  },
}));
