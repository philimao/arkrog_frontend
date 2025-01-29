import React from "react";

export function SVGIcon({
  name,
  width = "1rem",
  height = "1rem",
  className = "",
  ...props
}: {
  name: string;
  width?: string;
  height?: string;
  className?: string;
} & React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg className={className} style={{ width, height }} {...props}>
      <use href={`#${name}`} />
    </svg>
  );
}
