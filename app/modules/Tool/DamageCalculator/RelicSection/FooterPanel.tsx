import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { Badge } from "@heroui/badge";
import BuffPanel from "~/modules/Tool/DamageCalculator/RelicSection/BuffPanel";
import React, { useState } from "react";
import {
  StyledClearRelicsButton,
  StyledRelicCount,
  StyledRelicCountInner,
} from "~/modules/Tool/DamageCalculator/RelicSection/Shared";
import { useShallow } from "zustand/react/shallow";
import RelicItem from "~/modules/Tool/DamageCalculator/RelicSection/RelicItem";

const StyledFooterPanel = styled.footer`
  width: 100vw;
  height: 5rem;
  position: fixed;
  left: 0;
  bottom: 0;
  background: var(--black-gray);
  box-shadow: 0 -5px 10px 0 #18d1ff80;
  padding: 0.5rem 2rem 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 100;
`;

const StyledCollapseButton = styled.div`
  //width: 10rem;
  //border-top: 2px solid rgba(255, 255, 255, 0);
  //border-bottom: 2px solid rgba(255, 255, 255, 0);
  //border-left: 2px solid rgba(255, 255, 255);
`;

const StyledRelicsContainer = styled.div`
  height: 4.5rem;
  padding: 0.5rem;
  margin-right: auto;
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
`;

const StyledAttrButton = styled.button``;

export default function FooterPanel() {
  const {
    showRelics,
    activeCharName,
    rogueKey,
    toggleShowRelics,
    selectedIds,
    setSelectedIds,
  } = useDamageCalculatorStore();
  const relicWrappers = useDamageCalculatorStore(
    useShallow((state) => state.relicsMap[activeCharName]?.[rogueKey]),
  );

  const [showBuff, setShowBuff] = useState(false);

  return (
    <StyledFooterPanel>
      {showRelics ? (
        <StyledCollapseButton>
          <StyledRelicCount onClick={toggleShowRelics}>
            <StyledRelicCountInner>
              <div className="text-lg">↓</div>
              <div>收起</div>
            </StyledRelicCountInner>
          </StyledRelicCount>
        </StyledCollapseButton>
      ) : (
        <>
          <StyledRelicCount onClick={toggleShowRelics}>
            <Badge
              content="待选择藏品"
              isInvisible={selectedIds.length > 0}
              classNames={{
                badge:
                  "border-none bg-ak-dark-red text-[0.75rem] px-3 font-bold top-[-5%] right-[-50%]",
              }}
            >
              <StyledRelicCountInner>
                <div className="text-lg">{selectedIds.length}</div>
                <div>收藏品</div>
              </StyledRelicCountInner>
            </Badge>
          </StyledRelicCount>
          <StyledRelicsContainer>
            {relicWrappers &&
              selectedIds
                .map((id) =>
                  relicWrappers.find((relicWrapper) => relicWrapper.id === id),
                )
                .filter((i) => i)
                .map((relicWrapper) => (
                  <RelicItem
                    key={relicWrapper!.id}
                    relicWrapper={relicWrapper!}
                  />
                ))}
          </StyledRelicsContainer>
          <BuffPanel show={showBuff} setShow={setShowBuff} />
          <StyledClearRelicsButton onClick={() => setSelectedIds([])}>
            清空
          </StyledClearRelicsButton>
        </>
      )}
    </StyledFooterPanel>
  );
}
