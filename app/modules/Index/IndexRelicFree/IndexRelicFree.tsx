import React, { useState } from "react";
import RecordCard from "~/components/RecordCard/RecordCard";

const types = ["推荐", "最新"];

export default function IndexRelicFree() {
  const [type, setType] = useState<string>(types[0]);
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
        <RecordCard />
        <RecordCard />
      </div>
    </div>
  );
}
