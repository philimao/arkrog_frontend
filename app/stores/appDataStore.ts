import { create } from "zustand";
import { _get } from "~/utils/tools";
import type { StagePreview } from "~/types/gameData";

type AppDataStore = {
  banners?: string[];
  stagePreview?: StagePreview;
  recommendRecordIds?: string[];
};

type AppDataAction = {
  fetchAppData: () => Promise<void>;
};

export const useAppDataStore = create<AppDataStore & AppDataAction>(
  (set, get) => ({
    banners: undefined,
    stagePreview: undefined,
    recommendRecordIds: undefined,
    fetchAppData: async () => {
      const bundle = await _get<AppDataStore>("/app/bundle");
      set({ ...bundle });
      // console.log(get());
    },
  }),
);
