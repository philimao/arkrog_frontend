import { create } from "zustand";
import { _get } from "~/utils/tools";
import type { ArticleType, BannerType } from "~/types/appData";
import { devtools } from "zustand/middleware";
import { toast } from "react-toastify";

type AppDataStore = {
  /** 首页banner */
  banners: BannerType[];
  /** 推荐无藏记录 */
  recommendRecordIds: string[];
  /** 最新无藏记录 */
  latestRecordIds: string[];
  /** 收录原则 */
  inclusionPrinciple: string;
  /** 推荐文章 */
  recommendArticles: ArticleType[];
  /** 已裁剪的有效干员图片 */
  charImages: string[];
  /** 应用数据是否已加载 */
  appDataLoaded: boolean;
};

type AppDataAction = {
  fetchAppData: () => Promise<void>;
};

export const useAppDataStore = create<AppDataStore & AppDataAction>()(
  devtools(
    (set, get) => ({
      banners: undefined,
      recommendRecordIds: undefined,
      latestRecordIds: undefined,
      inclusionPrinciple: undefined,
      recommendArticles: undefined,
      charImages: undefined,
      appDataLoaded: false,
      fetchAppData: async () => {
        try {
          if (get().appDataLoaded) return;
          const bundle = await _get<AppDataStore>("/app/bundle");
          set({ ...bundle, appDataLoaded: true }, undefined, "fetchAppData");
          console.log(get());
        } catch (err) {
          toast.error(`加载应用数据失败！\n${(err as Error).name}: ${(err as Error).message}`);
        }
      },
    }),
    { name: "appDataStore" },
  ),
);
