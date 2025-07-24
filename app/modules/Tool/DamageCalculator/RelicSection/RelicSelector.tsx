import React, { useMemo, useState } from "react";
import { Input } from "@heroui/react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { styled } from "styled-components";
import { GridContainer, StyledTitle } from "~/modules/Tool/components/Shared";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import {
  StyledClearRelicsButton,
  StyledRelicCount,
  StyledRelicCountInner,
} from "~/modules/Tool/DamageCalculator/RelicSection/Shared";
import RelicsContainer from "~/modules/Tool/DamageCalculator/RelicSection/RelicsContainer";
import type { RelicWrapper } from "~/types/gameData";
import RelicItem from "~/modules/Tool/DamageCalculator/RelicSection/RelicItem";
import BuffText from "~/modules/Tool/DamageCalculator/RelicSection/BuffText";
import type { AdditionEntry } from "../calculator/helper";
import { CalculatorHelper } from "../calculator/helper";
import { useShallow } from "zustand/react/shallow";

const StyledRelicSelector = styled.div<{ $active: boolean }>`
  display: ${(props) => (props.$active ? "block" : "none")};
  position: fixed;
  width: 100vw;
  height: calc(100vh - 5rem);
  left: 0;
  top: 0;
  z-index: 101;
  overflow-x: auto;
  background: rgba(68, 68, 68, 0.85);
  backdrop-filter: blur(10px);
`;

const StyledBackButton = styled.button`
  position: fixed;
  top: 2rem;
  right: 0;
  background: var(--black-gray);
  font-size: 1rem;
  padding: 0.5rem 2rem;
`;

const StyledRelicSelectorInner = styled.div`
  padding: 5rem 8rem 1rem 8rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StyledTagContainer = styled.div`
  margin-top: -1rem;
`;

const StyledTagRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const StyledTagButton = styled.button<{ $selected: boolean }>`
  background: ${(props) => (props.$selected ? "var(--ak-blue)" : "var(--black-gray)")};
  color: ${(props) => (props.$selected ? "black" : "white")};
  font-weight: bold;
  font-size: 0.9rem;
  padding: 0.4rem 1.5rem;
`;

// 关键词筛选器
const filterTags = [
  ["结局", "攻速", "攻击", "防御", "生命", "技力", "再部署"],
  ["收藏", "物理", "法术", "真实", "元素", "异常", "召唤"],
];

const filterFuncMap: Record<string, (relic: RelicWrapper) => boolean> = {
  结局: (relic: RelicWrapper) => relic.id.includes("final"),
  攻速: (relic: RelicWrapper) => relic.usage.includes("攻击速度"),
  美愿: (relic: RelicWrapper) => ["国王", "诸王", "之手", "金酒之杯", "投币玩具"].some((kw) => relic.name.includes(kw)),
  伺烛: (relic: RelicWrapper) => relic.usage.includes("伺烛"),
  化境: (relic: RelicWrapper) => relic.usage.includes("化境"),
};

const StyledSelectedRelics = styled.div`
  background: rgba(24, 24, 24, 0.7);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
`;

const StyledSelectedRelicsContainer = styled.div`
  margin-right: auto;
  padding: 0 1rem;
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, 3.5rem);
  gap: 0.5rem;
`;

const StyledBuffContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const StyledBuffColumn = styled.div<{ $type: string }>`
  flex: 1 1;
  padding: 0.5rem 1rem;
  background: rgba(24, 24, 24, 0.7) url(/images/tool/calculator/${(props) => props.$type}_buff.png) no-repeat 95%
    center / auto 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "NovecentoWide", sans-serif;
`;

const typeMap = {
  operator: "干员",
  enemy: "敌方",
};

const StyledBuffInfo = styled.div<{ $type: string }>`
  height: 5rem;
  display: flex;
  margin-right: 1.25rem;
  align-items: center;
  & > div:first-child {
    color: ${(props) => (props.$type === "operator" ? "var(--ak-blue)" : "var(--ak-red)")};
    line-height: 1.5rem;
  }
  & > div:last-child {
    font-size: 0.9rem;
    font-weight: bold;
  }
`;

const StyledBuffInfoInner = styled.div`
  text-align: center;
  white-space: nowrap;
`;

const StyledBuffText = styled.div`
  height: 100%;
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(10, auto);
  //grid-auto-flow: column;
  grid-auto-rows: auto;
  gap: 0.25rem;
  font-size: 0.8rem;
`;

export default function RelicSelector() {
  const { showRelics, toggleShowRelics, setSelectedIds, rogueInput, relicAnalysisResult } = useDamageCalculatorStore();
  const rogueKey = rogueInput.topic;
  const difficulty = rogueInput[rogueKey].difficulty;
  const relicWrappers = useDamageCalculatorStore(useShallow((state) => state.relicWrapperMap[rogueKey]));
  const selectedIds = useDamageCalculatorStore(useShallow((state) => state.rogueInput[state.rogueInput.topic].relics));

  const filterTagsMemo: string[][] = useMemo(() => {
    const result = JSON.parse(JSON.stringify(filterTags));
    if (rogueKey === "rogue_4") {
      result[0].unshift("美愿");
    } else if (rogueKey === "rogue_5") {
      result[0].unshift("化境");
      result[0].unshift("伺烛");
    }
    return result;
  }, [rogueKey]);

  /** Tag筛选 */
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  /** 藏品关键字筛选 */
  const [searchValue, setSearchValue] = useState("");

  const relicValues = ["SUPER_RARE", "RARE", "NORMAL"];
  /** 藏品价值筛选 */
  const [valueFilter, setValueFilter] = useState<Set<string>>(new Set(["SUPER_RARE", "RARE", "NORMAL"]));

  /** 用户筛选藏品id */
  const showIds = useMemo(
    () =>
      Object.values(relicWrappers)
        // 难度筛选
        .filter((relicWrapper) => {
          if (relicWrappers[relicWrapper.id + "_a"] || relicWrappers[relicWrapper.id.replace(/_[a-z0-9]+$/, "_a")]) {
            // 代表随等级难度变化的藏品
            if (difficulty >= 9) return relicWrapper.id.endsWith("_c");
            else if (difficulty >= 6) return relicWrapper.id.endsWith("_b");
            else if (difficulty >= 3) return relicWrapper.id.endsWith("_a");
            else return relicWrapper.id[relicWrapper.id.length - 2] !== "_";
          } else {
            // 随难度不变的藏品
            return true;
          }
        })
        // Tag筛选
        .filter(
          (relicWrapper) =>
            !(valueFilter.size && !valueFilter.has(relicWrapper.rarity)) &&
            (!searchValue ||
              relicWrapper.name.includes(searchValue) ||
              relicWrapper.pinyin.includes(searchValue) ||
              relicWrapper.initials.includes(searchValue) ||
              relicWrapper.usage.includes(searchValue)),
        )
        // 藏品价值与关键字筛选
        .filter(
          (relicWrapper) =>
            !selectedTags.length ||
            selectedTags.some((kw) =>
              filterFuncMap[kw]
                ? filterFuncMap[kw](relicWrapper)
                : relicWrapper.name.includes(kw) || relicWrapper.usage.includes(kw),
            ),
        )
        .map((r) => r.id),
    [difficulty, relicWrappers, searchValue, selectedTags, valueFilter],
  );

  // // 根据 JSON 格式的藏品 ID 数组选中对应的藏品
  // const selectRelicsByIds = (ids: string[]) => {
  //   setSelectedRelicIds((prev) => {
  //     // 合并并去重
  //     return [...new Set([...prev, ...ids])];
  //   });
  // };

  // const [inputRelicIds, setInputRelicIds] = useState<string>("");
  // // 处理输入框中的藏品 ID
  // const handleSelectFromInput = () => {
  //   try {
  //     const ids = JSON.parse(inputRelicIds);
  //     if (Array.isArray(ids)) {
  //       selectRelicsByIds(ids);
  //     } else {
  //       alert("请输入有效的 JSON 数组格式！");
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     alert("输入格式错误，请输入有效的 JSON 数组！");
  //   }
  // };

  let additionEntry: AdditionEntry = {
    in_game_char: [],
    out_game_char: [],
    enemy: [],
  };
  if (relicAnalysisResult) {
    additionEntry = CalculatorHelper.outputAdditionEntry(relicAnalysisResult);
  }

  return (
    <StyledRelicSelector $active={showRelics}>
      <StyledBackButton onClick={toggleShowRelics}>返回</StyledBackButton>
      <StyledRelicSelectorInner>
        <StyledTitle>选择藏品</StyledTitle>
        {/*<div className="mb-4">*/}
        {/*  <textarea*/}
        {/*    className="w-full p-2 border rounded"*/}
        {/*    rows={3}*/}
        {/*    placeholder='请输入藏品 ID 数组，例如：["rogue_4_relic_legacy_82","rogue_4_relic_legacy_81"]'*/}
        {/*    value={inputRelicIds}*/}
        {/*    onChange={(e) => setInputRelicIds(e.target.value)}*/}
        {/*  />*/}
        {/*  <Button*/}
        {/*    className="mt-2"*/}
        {/*    color="primary"*/}
        {/*    onPress={handleSelectFromInput}*/}
        {/*  >*/}
        {/*    根据输入选中藏品*/}
        {/*  </Button>*/}
        {/*</div>*/}
        <StyledTagContainer>
          {filterTagsMemo.map((keys, i) => (
            <StyledTagRow key={i}>
              {keys.map((key) => (
                <StyledTagButton
                  $selected={selectedTags.includes(key)}
                  key={key}
                  onClick={() =>
                    setSelectedTags((prev) => {
                      const updated = [...prev];
                      const index = updated.findIndex((item) => item === key);
                      if (index > -1) updated.splice(index, 1);
                      else updated.push(key);
                      return updated;
                    })
                  }
                >
                  {key}
                </StyledTagButton>
              ))}
            </StyledTagRow>
          ))}
        </StyledTagContainer>
        <GridContainer>
          <Input
            value={searchValue}
            onChange={(evt) => setSearchValue(evt.target.value)}
            label="输入藏品名称"
            radius="none"
            classNames={{
              inputWrapper: "bg-black-gray h-14 group-data-[focus-visible=true]:!ring-0",
              label: "text-light-gray text-[0.8rem]",
              input: "font-bold",
            }}
          />
          <ToolSelect
            selectionMode="multiple"
            label="藏品价值"
            labelPlacement="inside"
            array={relicValues}
            getValue={(item) =>
              ({
                SUPER_RARE: "超稀有",
                RARE: "稀有",
                NORMAL: "普通",
              })[item]!
            }
            selectedKeys={valueFilter}
            onSelectionChange={setValueFilter as never}
          />
        </GridContainer>

        <StyledSelectedRelics>
          <StyledRelicCount onClick={toggleShowRelics}>
            <StyledRelicCountInner>
              <div className="text-lg">{selectedIds.length}</div>
              <div>已选藏品</div>
            </StyledRelicCountInner>
          </StyledRelicCount>
          <StyledSelectedRelicsContainer>
            {selectedIds
              .map((id) => relicWrappers[id])
              .filter((i) => i)
              .map((relicWrapper) => (
                <RelicItem key={relicWrapper.id} relicWrapper={relicWrapper} editable={true} />
              ))}
          </StyledSelectedRelicsContainer>
          <StyledClearRelicsButton onClick={() => setSelectedIds([])}>清空</StyledClearRelicsButton>
        </StyledSelectedRelics>

        <StyledBuffContainer>
          {Object.keys(typeMap).map((type) => (
            <StyledBuffColumn $type={type} key={type}>
              <StyledBuffInfo $type={type}>
                <StyledBuffInfoInner>
                  <div className="text-xl">
                    {type === "operator"
                      ? additionEntry.out_game_char.length + additionEntry.in_game_char.length
                      : additionEntry.enemy.length}
                  </div>
                  <div>{typeMap[type as never] + "加成"}</div>
                </StyledBuffInfoInner>
              </StyledBuffInfo>
              <StyledBuffText>
                {type === "operator" ? (
                  <BuffText additions={additionEntry.out_game_char.concat(additionEntry.in_game_char)} />
                ) : (
                  <BuffText additions={additionEntry.enemy} />
                )}
              </StyledBuffText>
            </StyledBuffColumn>
          ))}
        </StyledBuffContainer>

        <RelicsContainer relicsWrappers={relicWrappers} showIds={showIds} />
      </StyledRelicSelectorInner>
    </StyledRelicSelector>
  );
}
