import React, { useEffect } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { Input } from "@heroui/react";

function MyInput({ value, setValue, label, onBlur }) {
  return (
    <Input
      value={value}
      onChange={(evt) => setValue(evt.target.value)}
      label={label}
      radius="none"
      classNames={{
        inputWrapper:
          "bg-black-gray h-14 group-data-[focus-visible=true]:!ring-0",
        label: "text-light-gray text-[0.8rem]",
        input: "font-bold",
      }}
      onBlur={onBlur}
    />
  );
}

export default function OperatorModifier() {
  const { setCharsModifier, activeCharName } = useDamageCalculatorStore();
  const [atkBase, setAtkBase] = React.useState<string>("0");
  const [atkPercent, setAtkPercent] = React.useState<string>("0");
  const [atkFinal, setAtkFinal] = React.useState<string>("0");

  function handleBlur() {
    const charModifier = {
      atkBase: parseFloat(atkBase) || 0,
      atkPercent: parseFloat(atkPercent) || 0,
      atkFinal: parseFloat(atkFinal) || 0,
    };
    setCharsModifier(activeCharName, charModifier);
  }

  useEffect(() => {
    handleBlur();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <MyInput
        value={atkBase}
        setValue={setAtkBase}
        label="基础攻击力（白值）"
        onBlur={handleBlur}
      />
      <MyInput
        value={atkPercent}
        setValue={setAtkPercent}
        label="百分比攻击力（藏品）"
        onBlur={handleBlur}
      />
      <MyInput
        value={atkFinal}
        setValue={setAtkFinal}
        label="最终攻击力（鼓舞）"
        onBlur={handleBlur}
      />
    </div>
  );
}
