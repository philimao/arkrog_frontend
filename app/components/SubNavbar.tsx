import React, { type Dispatch } from "react";

interface HomeSubNav {
  title: string;
}

interface SubNavForHomeProps {
  navs: HomeSubNav[];
  title: string;
  setTitle: Dispatch<React.SetStateAction<string>>;
}

export function SubNavbar({ navs, title, setTitle }: SubNavForHomeProps) {
  return (
    <div className="w-full flex mb-4">
      {navs.map((item) => {
        const className =
          "text-center h-12 leading-12 font-bold text-lg" +
          (item.title === title ? " bg-ak-blue text-black" : " bg-semi-black");
        return (
          <div
            key={item.title}
            className={className}
            onClick={() => {
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
