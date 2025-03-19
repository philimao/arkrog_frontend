import { useState } from "react";
import { cos } from "~/utils/storage";
import { useStorageStore } from "~/stores/storageStore";
import { toast } from "react-toastify";
import COS, { type CosObject } from "cos-js-sdk-v5";

type CosObjectWithUrl = CosObject & {
  url: string;
};

export const useCosList = () => {
  const [objects, setObjects] = useState<CosObjectWithUrl[]>([]);
  const { getBucket } = useStorageStore();

  const listBucket = async () => {
    try {
      const info = await getBucket();
      if (!info) return;
      const { Bucket, Region, Host } = info;

      console.log(info);
      const data: COS.GetBucketResult = await cos.getBucket({
        Bucket,
        Region,
      });
      const contents = data.Contents.map((object) => ({
        ...object,
        url: `https://${Host}/${object.Key}`,
      }));
      console.log(contents);
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
