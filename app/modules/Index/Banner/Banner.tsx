import React from "react";
import { Skeleton } from "@heroui/react";

export default function Banner() {
  return (
    <div className="mb-10 w-full h-72">
      <Skeleton
        className="rounded-lg w-full h-full"
        style={{ background: "#4E4E4E" }}
      />
    </div>
  );
}
