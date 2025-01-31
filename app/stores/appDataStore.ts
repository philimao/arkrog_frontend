import { create } from "zustand";
import { _get } from "~/utils/tools";
import type { StagePreview } from "~/types/gameData";
import type { ArticleType } from "~/types/appData";

type AppDataStore = {
  banners?: string[];
  stagePreview?: StagePreview;
  recommendRecordIds?: string[];
  latestRecordIds?: string[];
  inclusionPrinciple?: string;
  recommendArticles?: ArticleType[];
};

type AppDataAction = {
  fetchAppData: () => Promise<void>;
};

export const useAppDataStore = create<AppDataStore & AppDataAction>(
  (set, get) => ({
    banners: undefined,
    stagePreview: undefined,
    recommendRecordIds: undefined,
    latestRecordIds: undefined,
    inclusionPrinciple: undefined,
    recommendArticles: undefined,
    fetchAppData: async () => {
      const bundle = await _get<AppDataStore>("/app/bundle");
      set({ ...bundle });
      console.log(get());
    },
  }),
);
