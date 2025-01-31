import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import RecordCard from "~/components/RecordCard/RecordCard";
import { useAppDataStore } from "~/stores/appDataStore";
import type { RecordType } from "~/types/recordType";
import { _post } from "~/utils/tools";
import { toast } from "react-toastify";

const types = ["推荐", "最新"];

export default function IndexRelicFree() {
  const { recommendRecordIds, latestRecordIds } = useAppDataStore();
  const [type, setType] = useState<string>(types[0]);
  const [recommend, setRecommend] = useState<RecordType[]>([]);
  const [latest, setLatest] = useState<RecordType[]>([]);
  const records = useMemo(() => {
    return type === "推荐" ? recommend : latest;
  }, [type, recommend, latest]);

  useEffect(() => {
    if (!recommendRecordIds || !latestRecordIds) return;
    async function load(
      ids: string[],
      func: Dispatch<SetStateAction<RecordType[]>>,
    ) {
      try {
        const records = await _post<RecordType[]>("/record/ids", { ids });
        if (records) func(records);
      } catch (err) {
        toast.warning((err as Error).message);
      }
    }
    Promise.all([
      load(recommendRecordIds, setRecommend),
      load(latestRecordIds, setLatest),
    ]);
  }, [recommendRecordIds, latestRecordIds]);

  return (
    <div className="mb-10">
      <div className="flex mb-5">
        <div className="font-bold text-2xl">无藏记录</div>
        <div className="ms-auto">
          {types.map((tp) => {
            const color = tp === type ? "text-ak-blue" : "text-white";
            return (
              <span
                key={tp}
                className={`${color} first-of-type:me-3`}
                onClick={() => setType(tp)}
                role="button"
              >
                {tp}
              </span>
            );
          })}
        </div>
      </div>
      <div>
        {records.map((record) => (
          <RecordCard record={record} isStagePage={false} key={record._id} />
        ))}
      </div>
    </div>
  );
}
