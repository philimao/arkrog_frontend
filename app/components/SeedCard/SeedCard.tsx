import { useEffect, useState } from "react";
import type { SeedType } from "~/types/seedType";

export default function SeedCard({ seed }: { seed: SeedType }) {
  useEffect(() => {}, []);

  return (
    <div className="bg-semi-black px-4 py-2">
      <div>
        <div>
          <span>{seed.type}</span>
          <span>{seed.title}</span>
        </div>
        <div>
          <span>复制</span>
          <span>收藏</span>
        </div>
      </div>
      <div>{seed.note}</div>
      <div>
        {seed.labels.map((label) => (
          <span>{label}</span>
        ))}
      </div>
      <hr className="text-ak-blue" />
      <div>
        <div>
          <img src={seed.raiderImage} alt="raider" />
          <span>{seed.raider}</span>
        </div>
        <div>{new Date(seed.date_created).toLocaleString("zh-CN")}</div>
        <div>
          <span>评论</span>
          <span>点赞</span>
          <span>点踩</span>
        </div>
      </div>
    </div>
  );
}
