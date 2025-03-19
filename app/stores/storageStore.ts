import { create } from "zustand/index";
import { _get } from "~/utils/tools";
import { toast } from "react-toastify";

type StorageStore = {
  Region: string;
  Bucket: string;
  Host: string;
};

type StorageAction = {
  getBucket: () => Promise<StorageStore | undefined>;
};

export const useStorageStore = create<StorageStore & StorageAction>(
  (set, get) => ({
    Region: "",
    Bucket: "",
    Host: "",
    getBucket: async () => {
      const { Region, Bucket, Host } = get();
      if (Region && Bucket && Host) return { Region, Bucket, Host };
      try {
        const { Region, Bucket, Host } =
          await _get<StorageStore>("/storage/bucket");
        set((state) => ({
          ...state,
          Region,
          Bucket,
          Host,
        }));
        return { Region, Bucket, Host };
      } catch (err) {
        toast.error(`${(err as Error).name}: ${(err as Error).message}`);
      }
    },
  }),
);
