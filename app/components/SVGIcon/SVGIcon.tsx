import React from "react";

export function SVGIcon({
  name,
  className = "",
  ...props
}: {
  name: string;
  className?: string;
} & React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg className={"w-4 h-4 " + className} {...props}>
      <use href={`#${name}`} />
    </svg>
  );
}
