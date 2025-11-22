import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { Badge } from "@heroui/badge";
import BuffPanel from "~/modules/Tool/DamageCalculator/RelicSection/BuffPanel";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  StyledClearRelicsButton,
  StyledRelicCount,
  StyledRelicCountInner,
} from "~/modules/Tool/DamageCalculator/RelicSection/Shared";
import { useShallow } from "zustand/react/shallow";
import RelicItem from "~/modules/Tool/DamageCalculator/RelicSection/RelicItem";
import TopicSpecTrigger from "../TopicSpecSection/TopicSpecTrigger";

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
  z-index: 105;
`;

const StyledCollapseButton = styled.div`
  //width: 10rem;
  //border-top: 2px solid rgba(255, 255, 255, 0);
  //border-bottom: 2px solid rgba(255, 255, 255, 0);
  //border-left: 2px solid rgba(255, 255, 255);
`;

export default function FooterPanel() {
  const relicsContainerRef = useRef<HTMLDivElement>(null);
  const { showRelics, toggleShowRelics, setSelectedIds, setTopicSpecItems } = useDamageCalculatorStore();
  const relicsState = useDamageCalculatorStore(useShallow((state) => state.relicWrapperMap[state.rogueInput.topic]));
  const selectedIds = useDamageCalculatorStore(useShallow((state) => state.rogueInput[state.rogueInput.topic].relics));

  const [showBuff, setShowBuff] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - relicsContainerRef.current!.offsetLeft);
    setScrollLeft(relicsContainerRef.current!.scrollLeft);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - relicsContainerRef.current!.offsetLeft;
      const walk = (x - startX) * 2;
      relicsContainerRef.current!.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 注册水平拖动事件
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, showRelics]);

  return (
    <StyledFooterPanel>
      {showRelics ? (
        <>
          <StyledCollapseButton>
            <StyledRelicCount onClick={toggleShowRelics}>
              <StyledRelicCountInner>
                <div className="text-lg">↓</div>
                <div>收起</div>
              </StyledRelicCountInner>
            </StyledRelicCount>
          </StyledCollapseButton>
          <div className="flex-auto" />
        </>
      ) : (
        <>
          <StyledRelicCount onClick={toggleShowRelics}>
            <Badge
              content="待选择藏品"
              isInvisible={selectedIds.length > 0}
              classNames={{
                badge: "border-none bg-ak-dark-red text-[0.75rem] px-3 font-bold top-[-5%] right-[-50%]",
              }}
            >
              <StyledRelicCountInner>
                <div className="text-lg">{selectedIds.length}</div>
                <div>收藏品</div>
              </StyledRelicCountInner>
            </Badge>
          </StyledRelicCount>
          {/* 底部藏品列表 */}
          <div className="flex flex-auto h-full overflow-hidden">
            {/* 底部藏品列表 - 滚动区域 */}
            <div
              ref={relicsContainerRef}
              className="flex gap-2 w-full h-full p-2 overflow-auto flex-nowrap scrollbar-hide cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
            >
              {selectedIds
                .map((id) => relicsState[id])
                .filter((i) => i)
                .map((relicWrapper) => (
                  <RelicItem key={relicWrapper.id} relicWrapper={relicWrapper} />
                ))}
            </div>
          </div>
        </>
      )}
      <TopicSpecTrigger />
      <BuffPanel show={showBuff} setShow={setShowBuff} />
      <StyledClearRelicsButton
        onClick={() => {
          setSelectedIds([]);
          setTopicSpecItems(() => []);
        }}
      >
        清空
      </StyledClearRelicsButton>
    </StyledFooterPanel>
  );
}
