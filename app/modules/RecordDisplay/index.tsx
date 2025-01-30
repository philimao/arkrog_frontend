import type { RecordType } from "~/types/recordType";
import RecordCard from "~/components/RecordCard/RecordCard";
import type { Dispatch, SetStateAction } from "react";

export default function RecordDisplay({
  records,
  setRecords,
}: {
  records: RecordType[];
  setRecords: Dispatch<SetStateAction<RecordType[]>>;
}) {
  return (
    <div>
      {records.map((record) => (
        <RecordCard record={record} setRecords={setRecords} key={record._id} />
      ))}
    </div>
  );
}
