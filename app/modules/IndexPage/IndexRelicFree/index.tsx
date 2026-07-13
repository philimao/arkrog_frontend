import React, { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import RecordCard from "~/components/RecordCard/RecordCard";
import { useAppDataStore } from "~/stores/appDataStore";
import type { RecordType } from "~/types/recordType";
import { _post } from "~/utils/tools";
import { toast } from "react-toastify";

const types = ["推荐", "最新"];

async function load(ids: string[], setRecords: Dispatch<SetStateAction<RecordType[]>>) {
  try {
    const records = await _post<RecordType[]>("/record/ids", { ids });
    if (records) setRecords(records);
  } catch (err) {
    console.error(err);
    toast.warning(`加载记录失败！`);
  }
}

export default function IndexRelicFree() {
  const { recommendRecordIds, latestRecordIds } = useAppDataStore();
  const [type, setType] = useState<string>(types[0]);
  const [recommend, setRecommend] = useState<RecordType[]>([]);
  const [latest, setLatest] = useState<RecordType[]>([]);

  const records = type === "推荐" ? recommend : latest;
  const setRecords = type === "推荐" ? setRecommend : setLatest;

  useEffect(() => {
    load(recommendRecordIds, setRecommend);
  }, [recommendRecordIds]);

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
                onClick={() => {
                  setType(tp);
                  if (tp === "推荐" && !recommend.length) {
                    load(recommendRecordIds, setRecommend);
                  } else if (tp === "最新" && !latest.length) {
                    load(latestRecordIds, setLatest);
                  }
                }}
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
          <RecordCard record={record} setRecords={setRecords} isStagePage={false} key={record._id} />
        ))}
      </div>
    </div>
  );
}
