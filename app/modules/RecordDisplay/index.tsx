import type { RecordType } from "~/types/recordType";
import RecordCard from "~/components/RecordCard/RecordCard";
import type { Dispatch, SetStateAction } from "react";

export default function RecordDisplay({
  records,
  setRecords,
  isStagePage,
  cols = 1,
}: {
  records: RecordType[];
  setRecords: Dispatch<SetStateAction<RecordType[]>>;
  isStagePage?: boolean;
  cols?: 1 | 2;
}) {
  const className = cols === 1 ? "" : "grid grid-cols-1 xl:grid-cols-2 gap-4";
  return (
    <div className={className}>
      {records.map((record) => (
        <RecordCard
          record={record}
          setRecords={setRecords}
          key={record._id}
          isStagePage={isStagePage}
        />
      ))}
    </div>
  );
}
