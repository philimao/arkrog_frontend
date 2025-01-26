import { Skeleton } from "@heroui/react";

export default function RecordCard() {
  return (
    <div className="w-full h-72 mb-4 last-of-type:mb-0">
      <Skeleton className="w-full h-full" style={{ background: "#4E4E4E" }} />
    </div>
  );
}
