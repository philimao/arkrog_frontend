import { styled } from "styled-components";
import { relicAlterToBasic } from "~/modules/Tool/DamageCalculator/utils";
import React, { type FormEvent, useMemo, useState } from "react";
import { LazyImage } from "~/components/LazyImage";
import { assetsHost } from "~/utils/tools";
import { StyledModeOption, StyledModeSelector, StyledTitle } from "~/modules/Tool/components/Shared";
import ToolInput from "~/modules/Tool/components/ToolInput";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import type { WrappedRelicItem } from "~/types/gameData";
import { CalculatorHelper } from "../calculator";
import { useShallow } from "zustand/react/shallow";

const StyledRelicsContainer = styled.div`
  margin-top: 1rem;
  max-height: calc(100vh - 20.5rem);
  overflow-y: auto;
`;

const StyledRelicsInner = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
`;

export default function RelicsContainer({
  relics,
  showIds,
}: {
  relics: Record<string, WrappedRelicItem>;
  showIds: string[];
}) {
  const [showAll, setShowAll] = useState(true);
  const [mode, setMode] = useState("列表模式");
  const relicUiStates = useDamageCalculatorStore((state) => state.relicUiStateMap[state.rogueInput.topic]);

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
        {Object.values(relics)
          .filter((relic) => showIds.includes(relic.id) && (showAll || !relicUiStates[relic.id].disabled))
          .sort((a, b) => {
            // unsupported 藏品在“显示全部”时排到最后。
            const aDisabled = relicUiStates[a.id].disabled;
            const bDisabled = relicUiStates[b.id].disabled;
            if (aDisabled === bDisabled) return 0;
            return aDisabled ? 1 : -1;
          })
          .map((relic) => (
            <RelicBlock key={relic.id} relic={relic} />
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

/** 在藏品下方显示对当前干员、关卡、敌人的生效情况，此时不要打开藏品生效过程的debugRelic */
const debugRelic = false;

function RelicBlock({ relic }: { relic: WrappedRelicItem }) {
  const { charData, charInput, enemyData, stageData, setRelicLayer, toggleRelicSelection } = useDamageCalculatorStore();
  const topic = useDamageCalculatorStore((state) => state.rogueInput.topic);
  const relicUiState = useDamageCalculatorStore((state) => state.relicUiStateMap[topic][relic.id]);
  const selectedIds = useDamageCalculatorStore(useShallow((state) => state.rogueInput[state.rogueInput.topic].relics));
  const [layer, setLayer] = useState<string>(relic.layer.toString());

  function updateRelicLayer(evt: FormEvent) {
    evt.preventDefault();
    setLayer(setRelicLayer(relic.id, layer));
  }

  const selected = selectedIds.includes(relic.id);

  const buffStrs = useMemo(() => {
    if (!debugRelic) return [];
    const context = CalculatorHelper.createAdditionContext();
    CalculatorHelper.applyRelic(
      {
        relic,
        relics: [relic],
        charData,
        charInput,
        enemyData,
        stageData,
      },
      context,
    );
    return CalculatorHelper.printRelic(relic.name, context);
  }, [charData, charInput, enemyData, relic, stageData]);

  return (
    <StyledRelicBlock
      $selected={selected}
      $disabled={relicUiState.disabled}
      key={relic.id}
      onClick={() => !relicUiState.disabled && toggleRelicSelection(relic.id)}
    >
      <StyledImageWrapper>
        <LazyImage src={assetsHost + `roguelike_topic_itempic/${relicAlterToBasic(relic.id)}.png`} />
      </StyledImageWrapper>
      {relicUiState.hasLayer && (
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
        <div className="font-bold mb-1">{relic.name}</div>
        <div className="text-xs font-light">{relic.relic.usage}</div>
        {buffStrs.length > 0 && (
          <div className="text-tiny mt-2 pt-2 whitespace-pre-wrap" style={{ borderTop: "1px solid var(--ak-blue)" }}>
            {buffStrs.join("\n")}
          </div>
        )}
      </div>
    </StyledRelicBlock>
  );
}
