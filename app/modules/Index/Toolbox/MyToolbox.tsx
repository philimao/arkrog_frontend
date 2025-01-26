import { Link } from "react-router";
import { Skeleton } from "@heroui/react";

const tools = [
  { name: "干员记录", to: "#", img: "" },
  { name: "趣味百科", to: "#", img: "" },
  { name: "种子分享", to: "#", img: "" },
  { name: "短脖兔杯", to: "#", img: "" },
  { name: "五藏杯", to: "#", img: "" },
  { name: "集生百态", to: "#", img: "" },
];

export default function MyToolbox() {
  return (
    <div className="mb-10 flex justify-center">
      {tools.map((tool) => (
        <Link
          to={tool.to}
          key={tool.name}
          className="me-8 last-of-type:me-0 text-white hover:text-ak-blue"
        >
          <div className="w-16 h-16 mb-1 text-white">
            <Skeleton
              className="w-full h-full"
              style={{ background: "#4E4E4E" }}
            />
          </div>
          <div className="text-center text-sm">{tool.name}</div>
        </Link>
      ))}
    </div>
  );
}
