import { useState } from "react";
import { cos } from "~/utils/storage";
import { useStorageStore } from "~/stores/storageStore";
import { toast } from "react-toastify";
import COS, { type CosObject } from "cos-js-sdk-v5";

type CosObjectWithUrl = CosObject & {
  url: string;
};

/**
 * 根据指定目录，获取目录内元素，当元素>1000时需翻页，暂未实现
 */
export const useCosList = () => {
  const [objects, setObjects] = useState<CosObjectWithUrl[]>([]);
  const { getBucket } = useStorageStore();

  /**
   * 查询目录内元素
   * @param [Prefix] 目录前缀
   */
  const listBucket = async (Prefix?: string) => {
    try {
      const info = await getBucket();
      if (!info) return;
      const { Bucket, Region, Host } = info;
      const data: COS.GetBucketResult = await cos.getBucket({
        Bucket,
        Region,
        Prefix: Prefix || "",
      });
      const contents = data.Contents.map((object) => ({
        ...object,
        url: `https://${Host}/${object.Key}`,
      }));
      contents.sort(
        (a, b) =>
          new Date(b.LastModified).getTime() -
          new Date(a.LastModified).getTime(),
      );
      // console.log(contents);
      setObjects(contents);
    } catch (err) {
      console.log(err);
      toast.error(
        `查询失败！${(err as Error).name}: ${(err as Error).message}`,
      );
    }
  };

  return {
    objects,
    listBucket,
  };
};
