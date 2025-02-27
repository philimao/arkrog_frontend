import React, { useState } from "react";
import BlogPreview from "~/components/BlogPreview/BlogPreview";

const types = ["推荐", "最新"];

export default function IndexBlog() {
  const [type, setType] = useState<string>(types[0]);
  return (
    <div>
      <div className="flex mb-5">
        <div className="font-bold text-2xl">攻略分享</div>
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
      <BlogPreview />
    </div>
  );
}
