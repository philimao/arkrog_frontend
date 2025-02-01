import { Link } from "react-router";
import { Skeleton } from "@heroui/react";
import { openModal } from "~/utils/dom";

const tools = [
  {
    name: "收录原则",
    to: "#",
    img: "/images/icons/收录原则.png",
    targetModal: "inclusion-principle",
  },
  { name: "干员记录", to: "#", img: "/images/icons/干员记录.png" },
  { name: "趣味百科", to: "#", img: "/images/icons/趣味百科.png" },
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
    img: "/images/icons/集生百态.png",
  },
];

export default function MyToolbox() {
  return (
    <div className="mb-10 mx-2 flex justify-start sm:justify-center overflow-x-auto hide-scroll">
      {tools.map((tool) => (
        <Link
          target="_blank"
          rel="noopener noreferrer"
          to={tool.to}
          key={tool.name}
          className="me-8 last-of-type:me-0 text-white hover:text-ak-blue"
          onClick={(evt) => {
            if (tool.targetModal) {
              evt.preventDefault();
              console.log(tool.targetModal);
              openModal(tool.targetModal);
            } else if (tool.to === "#") {
              evt.preventDefault();
            }
          }}
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
