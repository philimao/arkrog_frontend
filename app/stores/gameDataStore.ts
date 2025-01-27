import { _get } from "~/utils/tools";
import type { GameData } from "~/types/gameData";
import { create } from "zustand";

type GameDataState = {
  gameData: GameData | null;
  loading: boolean;
  fetchGameData: () => Promise<void>;
  fetchGameDataExt: () => Promise<void>;
};

export const useGameDataStore = create<GameDataState>((set) => ({
  gameData: null,
  loading: false,
  fetchGameData: async () => {
    set({ loading: true });
    const data: GameData | undefined = await _get("/gamedata/bundle");
    if (data) {
      set({ gameData: data });
    }
    set({ loading: false });
  },
  fetchGameDataExt: async () => {
    set({ loading: true });
    const extData: GameData | undefined = await _get("/gamedata/bundle-ext");
    if (extData) {
      set((state) => ({
        gameData: { ...state.gameData, ...extData },
      }));
    }
    set({ loading: false });
  },
}));
