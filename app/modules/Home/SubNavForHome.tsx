import React, { type Dispatch } from "react";

interface HomeSubNav {
  title: string;
}

interface SubNavForHomeProps {
  navs: HomeSubNav[];
  title: string;
  setTitle: Dispatch<React.SetStateAction<string>>;
}

export function SubNavForHome({ navs, title, setTitle }: SubNavForHomeProps) {
  return (
    <div className="w-full flex mb-4">
      {navs.map((item) => {
        const className =
          "text-center h-10 leading-10 font-bold" +
          (item.title === title ? " bg-ak-blue text-black" : " bg-black");
        return (
          <div
            key={item.title}
            className={className}
            onClick={() => {
              console.log(item.title);
              setTitle(item.title);
            }}
            style={{ width: 100 / navs.length + "%" }}
            role="button"
          >
            {item.title}
          </div>
        );
      })}
    </div>
  );
}
