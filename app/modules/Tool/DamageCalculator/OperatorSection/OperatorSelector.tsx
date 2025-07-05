import React, { useEffect, useState } from "react";
import { Listbox, ListboxItem } from "~/modules/Tool/components/SafeHeroPortal";
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
  const { charList } = useDamageCalculatorStore();

  return (
    <StyledOperatorSelectorWrapper>
      {/* <div>当前仍在数据对接中，主要体验交互逻辑，反馈建议请加入影语集反馈群 909687635</div> */}
      <StyledTitle>选择干员</StyledTitle>
      <StyledSelectorWrapper>
        {charList.length > 0 ? (
          charList.map((charData, i) => <OperatorButton charData={charData} key={i} />)
        ) : (
          <OperatorSelector />
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

export function OperatorButton({ charData }: { charData: CharData }) {
  const { skill_table, uniequip_table } = useGameDataStore();
  const { activeCharName, setActiveCharName } = useDamageCalculatorStore();
  const active = activeCharName === charData.name;
  return (
    <StyledOperatorButtonWrapper $active={active}>
      <StyledOperatorButton
        $active={active}
        onClick={() => setActiveCharName(charData.name, skill_table, uniequip_table)}
      >
        {charData.name}
      </StyledOperatorButton>
      {/*<StyledRemoveButton onClick={() => removeCharData(i)}>*/}
      {/*  X*/}
      {/*</StyledRemoveButton>*/}
    </StyledOperatorButtonWrapper>
  );
}

export function OperatorSelector() {
  const { character_table, skill_table, uniequip_table } = useGameDataStore();
  const { setActiveCharName } = useDamageCalculatorStore();
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
            setActiveCharName(candidates[0].name, skill_table, uniequip_table);
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
                  setActiveCharName(charData.name, skill_table, uniequip_table);
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
