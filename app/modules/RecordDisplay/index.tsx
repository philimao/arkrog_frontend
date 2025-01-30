import type { RecordType } from "~/types/recordType";
import RecordCard from "~/components/RecordCard/RecordCard";
import type { Dispatch, SetStateAction } from "react";

export default function RecordDisplay({
  records,
  setRecords,
  isStagePage,
}: {
  records: RecordType[];
  setRecords: Dispatch<SetStateAction<RecordType[]>>;
  isStagePage?: boolean;
}) {
  return (
    <div>
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
