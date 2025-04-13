import { create } from "zustand";
import { _get } from "~/utils/tools";
import type { StagePreview } from "~/types/gameData";
import type { ArticleType, BannerType } from "~/types/appData";
import { devtools } from "zustand/middleware";

type AppDataStore = {
  banners?: BannerType[];
  stagePreview?: StagePreview;
  recommendRecordIds?: string[];
  latestRecordIds?: string[];
  inclusionPrinciple?: string;
  recommendArticles?: ArticleType[];
  charImages?: string[];
};

type AppDataAction = {
  fetchAppData: () => Promise<void>;
};

export const useAppDataStore = create<AppDataStore & AppDataAction>()(
  devtools(
    (set, get) => ({
      banners: undefined,
      stagePreview: undefined,
      recommendRecordIds: undefined,
      latestRecordIds: undefined,
      inclusionPrinciple: undefined,
      recommendArticles: undefined,
      charImages: undefined,
      fetchAppData: async () => {
        const bundle = await _get<AppDataStore>("/app/bundle");
        set({ ...bundle }, undefined, "fetchAppData");
        // console.log(get());
      },
    }),
    { name: "appDataStore" },
  ),
);
