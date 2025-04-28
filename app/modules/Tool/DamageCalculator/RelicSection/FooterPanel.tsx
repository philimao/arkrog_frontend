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

const StyledRelicsContainer = styled.div`
  margin-right: auto;
`;

const StyledAttrButton = styled.button``;

export default function FooterPanel() {
  const { activeCharName, relicsMap, rogueKey, toggleShowRelics } =
    useDamageCalculatorStore();
  const activeRelics = relicsMap[activeCharName]?.[rogueKey];
  const selectedLength =
    activeRelics?.filter((relic) => relic.selected).length || 0;

  const [showBuff, setShowBuff] = useState(false);

  return (
    <StyledFooterPanel>
      <StyledRelicCount onClick={toggleShowRelics}>
        <Badge
          content="待选择藏品"
          isInvisible={selectedLength > 0}
          classNames={{
            badge:
              "border-none bg-ak-dark-red text-[0.75rem] px-3 font-bold top-[-5%] right-[-50%]",
          }}
        >
          <StyledRelicCountInner>
            <div className="text-lg">{selectedLength}</div>
            <div>收藏品</div>
          </StyledRelicCountInner>
        </Badge>
      </StyledRelicCount>
      <StyledRelicsContainer></StyledRelicsContainer>
      <BuffPanel show={showBuff} setShow={setShowBuff} />
      <StyledClearRelicsButton>清空</StyledClearRelicsButton>
    </StyledFooterPanel>
  );
}
