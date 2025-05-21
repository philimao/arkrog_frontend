import React, { useEffect } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { Checkbox, CheckboxGroup, cn, Input, Radio, RadioGroup, Tooltip } from "@heroui/react";

function MyInput({ value, setValue, label, onBlur }) {
  return (
    <Input
      value={value}
      onChange={(evt) => setValue(evt.target.value)}
      label={label}
      radius="none"
      classNames={{
        inputWrapper: "bg-black-gray h-14 group-data-[focus-visible=true]:!ring-0",
        label: "text-light-gray text-[0.8rem]",
        input: "font-bold",
      }}
      onBlur={onBlur}
    />
  );
}

export const CustomRadio = (props) => {
  const { children, className, ...otherProps } = props;

  return (
    <Radio
      {...otherProps}
      classNames={{
        base: cn(
          "inline-flex m-0 bg-content1 hover:bg-content2 items-center justify-between",
          "flex-row-reverse max-w-[400px] cursor-pointer rounded-lg gap-4 p-4 border-2 border-transparent",
          "data-[selected=true]:border-primary",
          className,
        ),
      }}
    >
      {children}
    </Radio>
  );
};

export default function OperatorModifier() {
  const { setCharsModifier, activeCharName } = useDamageCalculatorStore();
  const [atkBase, setAtkBase] = React.useState<string>("0");
  const [atkPercent, setAtkPercent] = React.useState<string>("0");
  const [atkFinal, setAtkFinal] = React.useState<string>("0");
  const [mindLoad, setMindLoad] = React.useState<string>("清晰");

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
  }, [activeCharName]);

  return (
    <>
      <div className="flex flex-col gap-2">
        <MyInput value={atkBase} setValue={setAtkBase} label="基础攻击力（白值）" onBlur={handleBlur} />
        <MyInput value={atkPercent} setValue={setAtkPercent} label="百分比攻击力（藏品）" onBlur={handleBlur} />
        <MyInput value={atkFinal} setValue={setAtkFinal} label="最终攻击力（鼓舞）" onBlur={handleBlur} />
      </div>
      <div className="flex flex-col gap-2">
        <RadioGroup className="w-[400px]" label="思维负荷" value={mindLoad} onValueChange={setMindLoad}>
          <CustomRadio
            color="success"
            value="清晰"
            className={mindLoad === "清晰" ? "border-success" : ""}
            description="思维清晰，一切正常"
          >
            清晰
          </CustomRadio>
          <CustomRadio
            color="warning"
            value="混乱"
            className={`w-[400px] ${mindLoad === "混乱" ? "border-warning" : ""}`}
            description="每前进一步，失去1点目标生命（不会使目标生命低于1），进入战斗时，所有单位部署费用+3，攻击力-20%，技力自然回复速度-20%"
          >
            混乱
          </CustomRadio>
          {/* <Tooltip content="负荷超过阻滞点，思维已阻滞" delay={500} closeDelay={150}>
            <CustomRadio color="danger" value="阻滞" className={mindLoad === "阻滞" ? "border-danger" : ""}>
              <span>阻滞</span>
            </CustomRadio>
          </Tooltip> */}
        </RadioGroup>
      </div>
    </>
  );
}
