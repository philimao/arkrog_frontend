import { styled } from "styled-components";
import { relicAlterToBasic } from "~/modules/Tool/DamageCalculator/utils";
import React, { type FormEvent, useState } from "react";
import { LazyImage } from "~/components/LazyImage";
import { assetsHost } from "~/utils/tools";
import { StyledModeOption, StyledModeSelector, StyledTitle } from "~/modules/Tool/components/Shared";
import ToolInput from "~/modules/Tool/components/ToolInput";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import type { RelicWrapper } from "~/types/gameData";

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

export default function RelicsContainer({
  relicsWrappers,
  showIds,
}: {
  relicsWrappers: Record<string, RelicWrapper>;
  showIds: string[];
}) {
  const [showAll, setShowAll] = useState(true);
  const [mode, setMode] = useState("列表模式");

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
        {Object.values(relicsWrappers)
          .filter((relicWrapper) => showIds.includes(relicWrapper.id) && (showAll || !relicWrapper.disabled))
          .sort((a, b) => {
            const aDisabled = a.disabled;
            const bDisabled = b.disabled;
            if (aDisabled === bDisabled) return 0;
            return aDisabled ? 1 : -1;
          })
          .map((relicWrapper) => (
            <RelicBlock key={relicWrapper.id} relicWrapper={relicWrapper} />
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

function RelicBlock({ relicWrapper }: { relicWrapper: RelicWrapper }) {
  const { rogueInput, setRelicLayer, toggleRelicSelection } = useDamageCalculatorStore();
  const rogueKey = rogueInput.topic;
  const selectedIds = useDamageCalculatorStore((state) => state.selectedIdsMap[rogueKey]);
  const [layer, setLayer] = useState<string>(relicWrapper.layer.toString());

  function updateRelicLayer(evt: FormEvent) {
    evt.preventDefault();
    setLayer(setRelicLayer(relicWrapper.id, layer));
  }

  const selected = selectedIds.includes(relicWrapper.id);

  return (
    <StyledRelicBlock
      $selected={selected}
      $disabled={relicWrapper.disabled}
      key={relicWrapper.id}
      onClick={() => !relicWrapper.disabled && toggleRelicSelection(relicWrapper.id)}
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
