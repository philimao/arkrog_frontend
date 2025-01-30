import { Link } from "react-router";
import { Skeleton } from "@heroui/react";

const tools = [
  { name: "干员记录", to: "#", img: "" },
  { name: "趣味百科", to: "#", img: "" },
  {
    name: "短脖兔杯",
    to: "https://www.bilibili.com/opus/974653453867417601",
    img: "/images/icons/短脖兔杯.png",
  },
  {
    name: "五藏杯",
    to: "https://www.bilibili.com/opus/1014496937776250885",
    img: "/images/icons/五藏杯.png",
  },
  {
    name: "集生百态",
    to: "https://www.bilibili.com/opus/1024075694097825808",
    img: "",
  },
];

export default function MyToolbox() {
  return (
    <div className="mb-10 flex justify-center">
      {tools.map((tool) => (
        <Link
          target="_blank"
          rel="noopener noreferrer"
          to={tool.to}
          key={tool.name}
          className="me-8 last-of-type:me-0 text-white hover:text-ak-blue"
        >
          <div className="w-16 aspect-square mb-1 text-white flex flex-column justify-center">
            {tool.img ? (
              <img
                src={tool.img}
                alt="icon"
                className="w-full object-contain"
              />
            ) : (
              <Skeleton
                className="w-full h-full"
                style={{ background: "#4E4E4E" }}
              />
            )}
          </div>
          <div className="text-center text-sm">{tool.name}</div>
        </Link>
      ))}
    </div>
  );
}
