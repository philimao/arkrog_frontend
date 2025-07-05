/* eslint-disable @typescript-eslint/no-unused-vars */
import { Select, ListboxItem as SelectItem } from "~/modules/Tool/components/SafeHeroPortal";
import type { SelectProps } from "@heroui/react";

export default function ToolSelect<T>({
  array,
  getKey = (item: T, _index: number) => item as unknown as string,
  getValue = (item: T, _index: number) => item as unknown as string,
  ...props
}: {
  /** 选项数组 */
  array: T[];
  /** 获取选项的值 */
  getKey?: (item: T, index: number) => string;
  /** 获取选项的描述 */
  getValue?: (item: T, index: number) => string;
} & Partial<SelectProps>) {
  return (
    <Select
      radius="none"
      labelPlacement="outside"
      disallowEmptySelection={true}
      classNames={{
        label: "text-light-gray text-[0.8rem]",
        trigger: "bg-black-gray h-12 data-[focus-visible=true]:!outline-none",
        value: "font-bold",
        popoverContent: "rounded-none",
        listbox: "rounded-none",
        ...props.classNames,
      }}
      {...(({ classNames, ...rest }) => rest)(props)}
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
