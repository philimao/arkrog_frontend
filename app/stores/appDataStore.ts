import { create } from "zustand";
import { _get } from "~/utils/tools";

type AppDataStore = {
  banners?: string[];
  recommendRecordIds?: string[];
};

type AppDataAction = {
  fetchAppData: () => Promise<void>;
};

export const useAppDataStore = create<AppDataStore & AppDataAction>(
  (set, get) => ({
    banners: undefined,
    recommendRecordIds: undefined,
    fetchAppData: async () => {
      const bundle = await _get<AppDataStore>("/app/bundle");
      set({ ...bundle });
      console.log(get());
    },
  }),
);
