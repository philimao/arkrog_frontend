import React, { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { Input, type InputProps } from "@heroui/react";

function MyInput({
  value,
  setValue,
  label,
  onBlur,
  ...props
}: {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  label: string | React.ReactNode;
  onBlur: () => void;
} & InputProps) {
  return (
    <Input
      value={value}
      onChange={(evt) => setValue(evt.target.value)}
      label={label}
      radius="none"
      classNames={{
        inputWrapper: "bg-black-gray h-14 w-[12rem] group-data-[focus-visible=true]:!ring-0",
        label: "text-light-gray text-[0.8rem] w-full",
        input: "font-bold",
      }}
      onBlur={onBlur}
      {...props}
    />
  );
}

export default function OperatorModifier() {
  const { setCharsModifier, activeCharName } = useDamageCalculatorStore();
  const [atkBase, setAtkBase] = React.useState<string>("0");
  const [atkPercent, setAtkPercent] = React.useState<string>("0");
  const [atkFinal, setAtkFinal] = React.useState<string>("0");
  const [atkSpd, setAtkSpd] = React.useState<string>("0");

  const handleBlur = useCallback(() => {
    const charModifier = {
      atkBase: parseFloat(atkBase) || 0,
      atkPercent: parseFloat(atkPercent) || 0,
      atkFinal: parseFloat(atkFinal) || 0,
      atkSpd: parseInt(atkSpd) || 0,
    };
    setCharsModifier(activeCharName, charModifier);
  }, [activeCharName, atkBase, atkFinal, atkPercent, atkSpd, setCharsModifier]);

  useEffect(() => {
    handleBlur();
  }, [activeCharName, handleBlur]);

  return (
    <div className="flex flex-col gap-2">
      <MyInput
        value={atkBase}
        setValue={setAtkBase}
        label="攻击力变化百分比（局外藏品）"
        onBlur={handleBlur}
        endContent={<span>%</span>}
      />
      <MyInput
        value={atkPercent}
        setValue={setAtkPercent}
        label="攻击力变化百分比（局内血怒）"
        onBlur={handleBlur}
        endContent={<span>%</span>}
      />
      <MyInput value={atkFinal} setValue={setAtkFinal} label="攻击力变化最终值（局内鼓舞）" onBlur={handleBlur} />
      <MyInput value={atkSpd} setValue={setAtkSpd} label="攻击速度变化值（暂未实现）" onBlur={handleBlur} />
    </div>
  );
}
