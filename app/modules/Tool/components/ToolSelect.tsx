import { Select, SelectItem, type SelectProps } from "@heroui/react";
import { styled } from "styled-components";
import type { HTMLAttributes } from "react";

export default function ToolSelect<T>({
  array,
  getKey = (item) => item as string,
  getValue = (item) => item as string,
  ...props
}: {
  array: T[];
  getKey?: (item: T, index: number) => string;
  getValue?: (item: T, index: number) => string;
} & Partial<SelectProps>) {
  return (
    <Select
      radius="none"
      labelPlacement="outside"
      classNames={{
        label: "text-light-gray text-[0.8rem]",
        trigger: "bg-black-gray h-12 data-[focus-visible=true]:!outline-none",
        value: "font-bold",
        popoverContent: "rounded-none",
        listbox: "rounded-none",
      }}
      {...props}
    >
      {array.map((item, index) => (
        <SelectItem
          key={getKey(item, index)}
          classNames={{
            base: "rounded-none data-[hover=true]:!bg-ak-deep-blue data-[focus-visible=true]:!outline-none",
          }}
        >
          {getValue(item, index)}
        </SelectItem>
      ))}
    </Select>
  );
}
