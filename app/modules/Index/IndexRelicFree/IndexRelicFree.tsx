import React, { useEffect, useState } from "react";
import RecordCard from "~/components/RecordCard/RecordCard";
import { useAppDataStore } from "~/stores/appDataStore";
import type { RecordType } from "~/types/recordType";
import { _post } from "~/utils/tools";
import { toast } from "react-toastify";

const types = ["推荐", "最新"];

export default function IndexRelicFree() {
  const { recommendRecordIds } = useAppDataStore();
  const [type, setType] = useState<string>(types[0]);
  const [records, setRecords] = useState<RecordType[]>([]);

  useEffect(() => {
    if (!recommendRecordIds) return;
    async function load() {
      try {
        const records = await _post<RecordType[]>("/record/ids", {
          ids: recommendRecordIds,
        });
        if (records) {
          setRecords(records);
        }
      } catch (err) {
        toast.warning((err as Error).message);
      }
    }
    load();
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
