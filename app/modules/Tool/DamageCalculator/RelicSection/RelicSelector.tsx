import { useGameDataStore } from "~/stores/gameDataStore";
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, Divider, Input, Select, SelectItem } from "@heroui/react";
import type { ItemData } from "~/types/gameData";
import {
  allowedBlackboardKeyMap,
  finalizeRelicResults,
  inGameRelicNames,
  type RelicWrapper,
  wrapRelicData,
} from "~/modules/Tool/DamageCalculator/utils";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { styled } from "styled-components";
import { GridContainer, StyledTitle } from "~/modules/Tool/components/Shared";
import ToolSelect from "~/modules/Tool/components/ToolSelect";
import {
  StyledClearRelicsButton,
  StyledRelicCount,
  StyledRelicCountInner,
} from "~/modules/Tool/DamageCalculator/RelicSection/Shared";

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
  padding: 5rem 8rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  background: ${(props) =>
    props.$selected ? "var(--ak-blue)" : "var(--black-gray)"};
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

const filterFuncMap: Record<string, (relic: ItemData) => boolean> = {
  结局: (relic: ItemData) => relic.id.includes("final"),
  攻速: (relic: ItemData) => relic.usage.includes("攻击速度"),
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
`;

const StyledBuffContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const StyledBuffColumn = styled.div<{ $type: string }>`
  flex: 1 1;
  padding: 0.5rem 1rem;
  background: rgba(24, 24, 24, 0.7)
    url(/images/tool/calculator/${(props) => props.$type}_buff.png) no-repeat
    95% center / auto 80%;
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
    color: ${(props) =>
      props.$type === "operator" ? "var(--ak-blue)" : "var(--ak-red)"};
    line-height: 1.5rem;
  }
  & > div:last-child {
    font-size: 0.9rem;
    font-weight: bold;
  }
`;

const StyledBuffInfoInner = styled.div`
  text-align: center;
`;

const StyledBuffText = styled.div`
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(6, auto);
  grid-auto-flow: column;
  grid-auto-rows: auto;
  gap: 0.25rem;
  font-size: 0.8rem;
`;

export default function RelicSelector() {
  const { relics, items } = useGameDataStore();
  const { rogueKey, charData, difficulty, showRelics, toggleShowRelics } =
    useDamageCalculatorStore();

  // 按难度筛选藏品
  const relicsByDifficulty = useMemo(
    () =>
      Object.values(items![rogueKey])
        .filter((item) => {
          // 物品必须是藏品
          if (item.type !== "RELIC") return false;
          if (
            items![rogueKey][item.id + "_a"] ||
            items![rogueKey][item.id.replace(/_[a-z0-9]+$/, "_a")]
          ) {
            // 代表随等级难度变化的藏品
            const diff = parseInt(difficulty.slice(1));
            if (diff >= 9) return item.id.endsWith("_c");
            else if (diff >= 6) return item.id.endsWith("_b");
            else if (diff >= 3) return item.id.endsWith("_a");
            else return item.id[item.id.length - 2] !== "_";
          } else {
            // 随难度不变的藏品
            return true;
          }
        })
        .map((item) => ({
          ...item,
          ...relics![rogueKey][item.id],
        })),
    [difficulty, items, relics, rogueKey],
  );

  // 基于藏品和干员选择生成藏品池
  const relicsByChar = useMemo(
    () =>
      relicsByDifficulty
        .map((relicDataExt) => wrapRelicData(relicDataExt, charData))
        .filter((relicWrapper) =>
          relicWrapper.buffs.some((buff) => buff.isActive),
        ),
    [charData, relicsByDifficulty],
  );

  // useEffect(() => {
  //   console.log("relics", relicsByChar);
  // }, [relicsByChar]);

  // 藏品筛选
  const [searchValue, setSearchValue] = useState("");
  const relicValues = ["16", "12", "8", "1"];
  const [valueFilter, setValueFilter] = useState<Set<string>>(new Set(["16"]));

  const relicsByValue: RelicWrapper[] = useMemo(
    () =>
      relicsByChar.filter((relicWrapper) => {
        return (
          !(
            valueFilter.size &&
            !valueFilter.has(relicWrapper.relicData.value.toString())
          ) &&
          (!searchValue || relicWrapper.relicData.name.includes(searchValue))
        );
      }),
    [relicsByChar, searchValue, valueFilter],
  );

  // Tag筛选
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const relicsByTag = useMemo(
    () =>
      relicsByValue.filter(
        (relicWrapper) =>
          !selectedTags.length ||
          selectedTags.some((kw) =>
            filterFuncMap[kw]
              ? filterFuncMap[kw](relicWrapper.relicData)
              : relicWrapper.relicData.name.includes(kw) ||
                relicWrapper.relicData.usage.includes(kw),
          ),
      ),
    [relicsByValue, selectedTags],
  );

  // 藏品选择
  const [selectedRelicIds, setSelectedRelicIds] = useState<string[]>([]);
  const [charResult, setCharResult] = useState<Record<string, number>>({});
  const [enemyResult, setEnemyResult] = useState<Record<string, number>>({});

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

  // 应用藏品效果
  useEffect(() => {
    const { charResult, enemyResult } = finalizeRelicResults(
      relicsByChar,
      selectedRelicIds,
    );
    console.log(
      "relics",
      relicsByChar.filter((relicWrapper) =>
        selectedRelicIds.includes(relicWrapper.relicData.id),
      ), // 局内生效
    );
    console.log("charResult", charResult);
    console.log("enemyResult", enemyResult);
    setCharResult(charResult);
    setEnemyResult(enemyResult);
  }, [relicsByChar, selectedRelicIds]);

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
          {filterTags.map((keys, i) => (
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
              inputWrapper:
                "bg-black-gray h-14 group-data-[focus-visible=true]:!ring-0",
              label: "text-light-gray text-[0.8rem]",
              input: "font-bold",
            }}
          />
          <ToolSelect
            selectionMode="multiple"
            label="藏品价值"
            labelPlacement="inside"
            array={relicValues}
            selectedKeys={valueFilter}
            onSelectionChange={setValueFilter as never}
          />
        </GridContainer>

        <StyledSelectedRelics>
          <StyledRelicCount onClick={toggleShowRelics}>
            <StyledRelicCountInner>
              <div className="text-lg">{0}</div>
              <div>已选藏品</div>
            </StyledRelicCountInner>
          </StyledRelicCount>
          <StyledSelectedRelicsContainer></StyledSelectedRelicsContainer>
          <StyledClearRelicsButton>清空</StyledClearRelicsButton>
        </StyledSelectedRelics>

        <StyledBuffContainer>
          {Object.keys(typeMap).map((type) => (
            <StyledBuffColumn $type={type}>
              <StyledBuffInfo $type={type}>
                <StyledBuffInfoInner>
                  <div className="text-xl">0</div>
                  <div>{typeMap[type as never] + "加成"}</div>
                </StyledBuffInfoInner>
              </StyledBuffInfo>
              <StyledBuffText>
                <div>攻击力：100</div>
                <div>攻击力：100</div>
                <div>攻击力：100</div>
                <div>攻击力：100</div>
                <div>攻击力：100</div>
              </StyledBuffText>
            </StyledBuffColumn>
          ))}
        </StyledBuffContainer>

        <RelicsContainer
          relicsByTag={relicsByTag}
          selectedRelicIds={selectedRelicIds}
          setSelectedRelicIds={setSelectedRelicIds}
        />
      </StyledRelicSelectorInner>
    </StyledRelicSelector>
  );
}

const StyledRelicsContainer = styled.div`
  margin-top: 1rem;
`;

const StyledDisplayControl = styled.div`
  display: flex;
  justify-content: end;
  border-bottom: var(--ak-blue) 1px solid;
  margin-bottom: 1rem;
  font-size: 0.8rem;
`;

const StyledDisplayControlSpan = styled.span<{ $active: boolean }>`
  margin-left: 0.5rem;
  color: ${(props) => (props.$active ? "var(--ak-blue)" : "white")};
`;

const StyledRelicsInner = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
`;

function RelicsContainer({
  relicsByTag,
  selectedRelicIds,
  setSelectedRelicIds,
}: {
  relicsByTag: RelicWrapper[];
  selectedRelicIds: string[];
  setSelectedRelicIds: Dispatch<SetStateAction<string[]>>;
}) {
  const [mode, setMode] = useState("列表模式");
  return (
    <StyledRelicsContainer>
      <StyledTitle
        modes={["列表模式", "集中模式"]}
        activeMode={mode}
        setActiveMode={setMode}
      >
        <span />
      </StyledTitle>
      <StyledRelicsInner>
        {relicsByTag.map((relicWrapper) => (
          <div
            className={
              "px-3 py-2" +
              (selectedRelicIds.includes(relicWrapper.relicData.id)
                ? " shadow shadow-ak-blue"
                : "")
            }
            key={relicWrapper.relicData.id}
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() =>
              setSelectedRelicIds((prev) => {
                const updated = [...prev];
                const index = updated.findIndex(
                  (item) => item === relicWrapper.relicData.id,
                );
                if (index > -1) updated.splice(index, 1);
                else updated.push(relicWrapper.relicData.id);
                return updated;
              })
            }
          >
            <div className="font-bold mb-1">{relicWrapper.relicData.name}</div>
            <div className="text-xs font-light">
              {relicWrapper.relicData.usage}
            </div>
            {/*<Divider className="my-1" />*/}
            {/*<div className="whitespace-pre-wrap text-xs font-light">*/}
            {/*  {relicWrapper.relicData.id}*/}
            {/*</div>*/}
            {/*<div className="whitespace-pre-wrap text-xs font-light">*/}
            {/*  {JSON.stringify(relicWrapper.relicData.buffs, null, 2)}*/}
            {/*</div>*/}
            <Divider className="my-1" />
            {relicWrapper.buffs
              .map((buff) => buff.charResult)
              .flat()
              .map((bb, i) => {
                return Object.keys(bb).map((key) => (
                  <div className="text-xs font-light" key={i + key}>
                    {"干员" + allowedBlackboardKeyMap[key] + ": " + bb[key]}
                  </div>
                ));
              })}
            {relicWrapper.buffs
              .map((buff) => buff.enemyResult)
              .flat()
              .map((bb, i) => {
                return Object.keys(bb).map((key) => (
                  <div className="text-xs font-light" key={i + key}>
                    {"敌方" + allowedBlackboardKeyMap[key] + ": " + bb[key]}
                  </div>
                ));
              })}
            {relicWrapper.buffs.some((buff) => buff.layer) && (
              <div className="text-xs font-light">层数: 1</div>
            )}
          </div>
        ))}
      </StyledRelicsInner>
    </StyledRelicsContainer>
  );
}
