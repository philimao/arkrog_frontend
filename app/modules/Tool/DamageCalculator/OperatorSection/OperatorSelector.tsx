import React, { useEffect, useState } from "react";
import { Listbox, ListboxItem } from "@heroui/react";
import type { CharData } from "~/types/gameData";
import { useGameDataStore } from "~/stores/gameDataStore";
import { debounce } from "@heroui/shared-utils";
import { professions } from "~/modules/Tool/DamageCalculator/utils";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { styled } from "styled-components";
import ToolInput from "~/modules/Tool/components/ToolInput";
import { StyledTitle } from "~/modules/Tool/components/Shared";

const StyledOperatorSelectorWrapper = styled.div`
  //min-height: 35vh;
`;

const StyledSelectorWrapper = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

export default function OperatorSelectorWrapper() {
  const { character_table } = useGameDataStore();
  const { charList, setCharData } = useDamageCalculatorStore();
  const allowCharNames = [
    "赫德雷",
    "Mon3tr",
    "维娜·维多利亚",
    "维什戴尔",
    "空弦",
    "玛恩纳",
    "安洁莉娜",
    "新约能天使",
    "逻各斯",
    "银灰",
  ];
  useEffect(() => {
    Object.values(character_table!)
      .filter((charData) => {
        return !["TOKEN", "TRAP"].includes(charData.profession) && allowCharNames.includes(charData.name);
      })
      .sort((char1, char2) => {
        return allowCharNames.indexOf(char1.name) - allowCharNames.indexOf(char2.name);
      })
      .forEach((charData, i) => {
        setCharData(charData!, i);
      });
  }, [character_table, setCharData]);

  // function addCharData() {
  //   setCharData(undefined, charList.length);
  // }

  return (
    <StyledOperatorSelectorWrapper>
      <div>当前仍在数据对接中，主要体验交互逻辑，反馈建议请加入影语集反馈群 909687635</div>
      <StyledTitle>选择干员</StyledTitle>
      <StyledSelectorWrapper>
        {charList.length > 0 ? (
          charList.map((charData, i) =>
            charData ? <OperatorButton charData={charData} i={i} key={i} /> : <OperatorSelector i={i} key={i} />,
          )
        ) : (
          <OperatorSelector i={0} />
        )}
        {/* {charList.length < 5 && charList[charList.length - 1] && (
          <div>
            <button onClick={() => addCharData()}>+</button>
          </div>
        )} */}
      </StyledSelectorWrapper>
    </StyledOperatorSelectorWrapper>
  );
}

const StyledOperatorButtonWrapper = styled.div<{ $active: boolean }>`
  position: relative;
  color: ${(props) => (props.$active ? "black" : "white")};
`;

const StyledOperatorButton = styled.button<{ $active: boolean }>`
  width: 10rem;
  height: 3rem;
  text-align: start;
  padding: 0 0.75rem;
  font-weight: bold;
  background: ${(props) => (props.$active ? "var(--ak-blue)" : "var(--dark-gray)")};
`;

const StyledRemoveButton = styled.button`
  position: absolute;
  padding: 0.75rem;
  right: 0;
  top: 0;
`;

export function OperatorButton({ charData, i }: { charData: CharData; i: number }) {
  const { activeCharName, setActiveCharName, removeCharData } = useDamageCalculatorStore();
  const active = activeCharName === charData.name;
  return (
    <StyledOperatorButtonWrapper $active={active}>
      <StyledOperatorButton $active={active} onClick={() => setActiveCharName(charData.name)}>
        {charData.name}
      </StyledOperatorButton>
      {/*<StyledRemoveButton onClick={() => removeCharData(i)}>*/}
      {/*  X*/}
      {/*</StyledRemoveButton>*/}
    </StyledOperatorButtonWrapper>
  );
}

export function OperatorSelector({ i }: { i: number }) {
  const { character_table } = useGameDataStore();
  const { setCharData, setActiveCharName } = useDamageCalculatorStore();
  const [showListBox, setShowListBox] = useState(false);
  const [value, setValue] = useState("");

  const [candidates, setCandidates] = useState<CharData[]>();
  useEffect(() => {
    debounce(
      () =>
        setCandidates(() => {
          if (!value) return [];
          return Object.values(character_table!).filter(
            (charData) =>
              !charData.isNotObtainable &&
              professions.includes(charData.profession) &&
              charData.name.toLowerCase().includes(value.toLowerCase()),
          );
        }),
      100,
    )();
  }, [character_table, value]);

  return (
    <div className="w-40 relative me-4" onBlur={() => setTimeout(() => setShowListBox(false), 300)}>
      <ToolInput
        value={value}
        setValue={setValue}
        onFocus={() => setShowListBox(true)}
        onEnter={(evt) => {
          evt.preventDefault();
          if (candidates?.length) {
            setActiveCharName(candidates[0].name);
            setCharData(candidates[0], i);
            setShowListBox(false);
          }
        }}
        placeholder="输入干员名称"
      />
      <div className="absolute z-50" style={{ top: "110%", left: 0 }}>
        {showListBox && candidates && (
          <Listbox aria-label="listbox" emptyContent="" classNames={{ base: "w-96 bg-black-gray" }}>
            {candidates.map((charData) => (
              <ListboxItem
                key={charData.name}
                textValue={charData.name}
                classNames={{ base: "bg-red rounded-none" }}
                onPress={() => {
                  setActiveCharName(charData.name);
                  setCharData(charData, i);
                }}
              >
                <div className="flex items-center p-2">
                  <div
                    className="w-12 h-12 me-2 border border-light-gray overflow-hidden flex-shrink-0"
                    style={{ borderRadius: "50%" }}
                  >
                    <OperatorAvatar name={charData.name} className="w-full h-full" />
                  </div>
                  <div className="flex items-center">
                    <div>
                      <div className="font-bold">{charData.name}</div>
                      <div className="text-[0.75rem] text-gray font-light">{charData.itemDesc}</div>
                    </div>
                  </div>
                </div>
              </ListboxItem>
            ))}
          </Listbox>
        )}
      </div>
    </div>
  );
}
