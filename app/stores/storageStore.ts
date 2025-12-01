import { create } from "zustand/index";
import { _get } from "~/utils/tools";
import { toast } from "react-toastify";
import { devtools } from "zustand/middleware";
import type { CosObjectWithUrl } from "~/hooks/useCosList";

type StorageStore = {
  /** COS地区 */
  Region: string;
  /** COS桶名 */
  Bucket: string;
  /** COS主机 */
  Host: string;
  /** 打开本次上传目录 */
  uploadDirectory: string;
  /** 本次默认上传标签 */
  uploadLabel: string;
  /** 处理点击上传对象事件 */
  onUploadedItemClick: null | ((item: CosObjectWithUrl) => void);
};

type StorageAction = {
  /** 获取COS桶信息 */
  getBucket: () => Promise<StorageStore | undefined>;
  /** 设置本次上传的目录 */
  setUploadDirectory: (directory: string) => void;
  /** 设置本次默认上传标签 */
  setUploadLabel: (label: string) => void;
  /** 设置处理点击上传对象事件 */
  setOnUploadedItemClick: (callback: (item: CosObjectWithUrl) => void) => void;
  /** 清空上传参数 */
  clearUploadParams: () => void;
};

export const useStorageStore = create<StorageStore & StorageAction>()(
  devtools(
    (set, get) => ({
      Region: "",
      Bucket: "",
      Host: "",
      uploadDirectory: "",
      uploadLabel: "",
      onUploadedItemClick: null,
      setUploadDirectory: (directory: string) =>
        set({ uploadDirectory: directory }, undefined, "setUploadDirectory"),
      setUploadLabel: (label: string) =>
        set({ uploadLabel: label }, undefined, "setUploadLabel"),
      setOnUploadedItemClick: (callback: (item: CosObjectWithUrl) => void) =>
        set(
          { onUploadedItemClick: callback },
          undefined,
          "setOnUploadedItemClick",
        ),
      clearUploadParams: () =>
        set(
          { uploadDirectory: "", uploadLabel: "", onUploadedItemClick: null },
          undefined,
          "clearUploadParams",
        ),
      getBucket: async () => {
        const { Region, Bucket, Host } = get();
        if (Region && Bucket && Host) return { Region, Bucket, Host };
        try {
          const { Region, Bucket, Host } =
            await _get<StorageStore>("/storage/bucket");
          set(
            (state) => ({
              ...state,
              Region,
              Bucket,
              Host,
            }),
            undefined,
            "getBucket",
          );
          return { Region, Bucket, Host };
        } catch (err) {
          toast.error(`${(err as Error).name}: ${(err as Error).message}`);
        }
      },
    }),
    { name: "storageStore" },
  ),
);
