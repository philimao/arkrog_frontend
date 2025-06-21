import { styled } from "styled-components";
import { relicAlterToBasic } from "~/modules/Tool/DamageCalculator/utils";
import React, { type FormEvent, useEffect, useMemo, useState } from "react";
import { LazyImage } from "~/components/LazyImage";
import { assetsHost } from "~/utils/tools";
import { StyledModeOption, StyledModeSelector, StyledTitle } from "~/modules/Tool/components/Shared";
import ToolInput from "~/modules/Tool/components/ToolInput";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import type { RelicWrapper } from "~/types/gameData";
import { applyAnyRelics } from "../calculator/debug/print-relics-info";
import { useGameDataStore } from "~/stores/gameDataStore";

const StyledRelicsContainer = styled.div`
  margin-top: 1rem;
  max-height: calc(100vh - 23rem);
  overflow-y: auto;
`;

const StyledRelicsInner = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
`;

export default function RelicsContainer({ relicsWrappers }: { relicsWrappers: RelicWrapper[] }) {
  const [showAll, setShowAll] = useState(true);
  const [mode, setMode] = useState("列表模式");
  const { relics, items } = useGameDataStore();
  const { rogueInput } = useDamageCalculatorStore();
  const rogueKey = rogueInput.topic;

  /** 此处通过分析藏品buff计算哪些藏品生效, 达到禁选无效藏品功能 */
  const invalidRelicList = useMemo<string[]>(() => {
    // 需要补充relicData
    const relicList = Object.values(items![rogueKey])
      .filter((item) => item.type === "RELIC")
      .map((item) => ({
        ...item,
        ...relics![rogueKey][item.id],
        show: true,
      }));
    const result: string[] = [
      /** 这里默认一些特殊生效藏品, 不会添加buff但逻辑特殊处理 */
      "烟花之手",
      "国王的铠甲",
      "轰鸣之手",
    ];

    // 获取应用了所有藏品的加成上下文
    const context = applyAnyRelics(
      relicsWrappers.map((r) => ({
        ...r,
        relicData: relicList.find((relic) => relic.id === r?.id)!,
      })),
    );
    // 遍历生效的所有buff取藏品名
    Object.values(context.relic_rune_add).forEach((value) => {
      value.children.forEach((node) => result.push(node.tooltip));
    });
    Object.values(context.relic_rune_mul).forEach((value) => {
      value.children.forEach((node) => result.push(node.tooltip));
    });
    Object.values(context.in_game_buff_add).forEach((value) => {
      value.children.forEach((node) => result.push(node.tooltip));
    });
    Object.values(context.in_game_buff_mul).forEach((value) => {
      value.children.forEach((node) => result.push(node.tooltip));
    });
    Object.values(context.in_game_buff_final_mul).forEach((value) => {
      value.children.forEach((node) => result.push(node.tooltip));
    });
    Object.values(context.global_buff_stack).forEach((value) => {
      value.children.forEach((node) => result.push(node.tooltip));
    });
    // 排除生效的buff
    return relicsWrappers.filter((relic) => !result.includes(relic.name)).map((relic) => relic.name);
  }, [relicsWrappers, rogueKey]);

  return (
    <StyledRelicsContainer>
      <StyledTitle modes={["列表模式", "集中模式"]} activeMode={mode} setActiveMode={setMode}>
        <StyledModeSelector>
          <StyledModeOption $active={showAll} onClick={() => setShowAll(true)}>
            显示全部
          </StyledModeOption>
          <StyledModeOption $active={!showAll} onClick={() => setShowAll(false)}>
            隐藏无关
          </StyledModeOption>
        </StyledModeSelector>
      </StyledTitle>
      <StyledRelicsInner>
        {relicsWrappers
          .filter((relicWrapper) => relicWrapper.show && (showAll || relicWrapper.isActive))
          .sort((a, b) => {
            const aDisabled = invalidRelicList.includes(a.name);
            const bDisabled = invalidRelicList.includes(b.name);
            if (aDisabled === bDisabled) return 0;
            return aDisabled ? 1 : -1;
          })
          .map((relicWrapper) => (
            <RelicBlock key={relicWrapper.id} relicWrapper={relicWrapper} invalidRelicList={invalidRelicList} />
          ))}
      </StyledRelicsInner>
    </StyledRelicsContainer>
  );
}

const StyledRelicBlock = styled.div<{ $selected: boolean; $disabled: boolean }>`
  display: flex;
  gap: 1rem;
  position: relative;
  padding: 1rem 0.75rem;
  background: ${(props) => (props.$selected ? "black" : "rgba(24, 24, 24, 0.70)")};
  border: 1px solid ${(props) => (props.$selected ? "var(--ak-blue)" : "transparent")};
  box-shadow: ${(props) => (props.$selected ? "0 0 4px 0 var(--ak-blue)" : "none")};
  user-select: none;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.$disabled ? "0.5" : "1")};
  position: relative;

  &:hover::after {
    content: ${(props) => (props.$disabled ? "'该藏品暂未生效'" : "''")};
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    display: ${(props) => (props.$disabled ? "block" : "none")};
  }
`;

const StyledImageWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
  & > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const StyledLayerWrapper = styled.div`
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  width: 5rem;
  color: var(--ak-blue);
  display: flex;
  & > span {
    white-space: nowrap;
    font-size: 0.8rem;
    font-weight: bold;
    margin-right: 0.5rem;
  }
`;

function RelicBlock({ relicWrapper, invalidRelicList }: { relicWrapper: RelicWrapper; invalidRelicList: string[] }) {
  const { setRelicLayer, toggleRelicSelection, selectedIds } = useDamageCalculatorStore();
  const [layer, setLayer] = useState<string>(relicWrapper.layer.toString());

  useEffect(() => {
    setLayer((prev) => {
      if (prev !== "NaN") {
        return relicWrapper.layer.toString();
      } else return prev;
    });
  }, [relicWrapper]);

  function updateRelicLayer(evt: FormEvent) {
    evt.preventDefault();
    setLayer(setRelicLayer(relicWrapper.id, layer));
  }

  const selected = selectedIds.includes(relicWrapper.id);
  const isDisabled = invalidRelicList.includes(relicWrapper.name);

  return (
    <StyledRelicBlock
      $selected={selected}
      $disabled={isDisabled}
      key={relicWrapper.id}
      onClick={() => !isDisabled && toggleRelicSelection(relicWrapper.id)}
    >
      <StyledImageWrapper>
        <LazyImage src={assetsHost + `roguelike_topic_itempic/${relicAlterToBasic(relicWrapper.id)}.png`} />
      </StyledImageWrapper>
      {relicWrapper.hasLayer && (
        <StyledLayerWrapper>
          <span>层数</span>
          <ToolInput
            className="h-5 bg-[#333333] text-center"
            style={{ padding: "0" }}
            value={layer}
            setValue={setLayer}
            onClick={(evt) => evt.stopPropagation()}
            onEnter={updateRelicLayer}
            onBlur={updateRelicLayer}
            changeOnWheel
          />
        </StyledLayerWrapper>
      )}
      <div>
        <div className="font-bold mb-1">{relicWrapper.name}</div>
        <div className="text-xs font-light">{relicWrapper.usage}</div>
      </div>
    </StyledRelicBlock>
  );
}
