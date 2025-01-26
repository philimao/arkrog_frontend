import { Skeleton } from "@heroui/react";

export default function BlogPreview() {
  return (
    <div className="w-full h-36 mb-4 last-of-type:mb-0">
      <Skeleton className="w-full h-full" style={{ background: "#4E4E4E" }} />
    </div>
  );
}
