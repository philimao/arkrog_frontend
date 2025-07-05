import { Chip } from "@heroui/react";

import { Popover, PopoverContent, PopoverTrigger, Tooltip } from "~/modules/Tool/components/SafeHeroPortal";

/** 属性计算公式Token */
export interface AttrCalcToken {
  tooltip: string;
  tags: React.ReactNode[];
}

/** 属性展示 */
export function AttrDisplay(props: { calcTokens: AttrCalcToken[]; children: React.ReactNode }) {
  const { calcTokens, children } = props;

  if (calcTokens.length === 0) {
    return <span>{children}</span>;
  }
  return (
    <Popover placement="top">
      <PopoverTrigger>
        <span className="cursor-pointer">{children}</span>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-1 py-2">
          {calcTokens.map((group, index) => (
            <span key={group.tooltip}>
              {"( "}
              {group.tags.map((tag, i) => {
                if (i < group.tags.length - 1) return <span key={i}>{tag} + </span>;
                return <span key={i}>{tag}</span>;
              })}
              {index < calcTokens.length - 1 ? " ) * " : " )"}
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AttrTag(props: { children: React.ReactNode; tooltip: string }) {
  return (
    <Tooltip content={props.tooltip}>
      <Chip color="warning" variant="faded">
        {props.children}
      </Chip>
    </Tooltip>
  );
}
