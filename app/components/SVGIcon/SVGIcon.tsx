import React from "react";

export function SVGIcon({
  name,
  className = "",
  ...props
}: {
  name: string;
  className?: string;
} & React.ComponentPropsWithoutRef<"svg">) {
  const cls =
    className.match(/(?<![a-z])w-[[\d]/) || className.match(/(?<![a-z])h-[[\d]/)
      ? className
      : className + " w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4";
  return (
    <svg className={cls} {...props}>
      <use href={`#${name}`} />
    </svg>
  );
}
