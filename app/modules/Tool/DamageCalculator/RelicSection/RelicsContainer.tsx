import { styled } from "styled-components";
import {
  allowedBlackboardKeyMap,
  relicAlterToBasic,
  type RelicWrapper,
} from "~/modules/Tool/DamageCalculator/utils";
import React, { type FormEvent, useState } from "react";
import { LazyImage } from "~/components/LazyImage";
import { assetsHost } from "~/utils/tools";
import { Divider } from "@heroui/react";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import ToolInput from "~/modules/Tool/components/ToolInput";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";

const StyledRelicsContainer = styled.div`
  margin-top: 1rem;
`;

const StyledRelicsInner = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
`;

export default function RelicsContainer({
  relicsWrappers,
}: {
  relicsWrappers: RelicWrapper[];
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
        {relicsWrappers
          .filter((relicWrapper) => relicWrapper.show)
          .map((relicWrapper) => (
            <RelicItem key={relicWrapper.id} relicWrapper={relicWrapper} />
          ))}
      </StyledRelicsInner>
    </StyledRelicsContainer>
  );
}

const StyledRelicItem = styled.div<{ $selected: boolean }>`
  display: flex;
  gap: 1rem;
  position: relative;
  padding: 1rem 0.75rem;
  background: ${(props) =>
    props.$selected ? "black" : "rgba(24, 24, 24, 0.70)"};
  border: 1px solid
    ${(props) => (props.$selected ? "var(--ak-blue)" : "transparent")};
  box-shadow: ${(props) =>
    props.$selected ? "0 0 4px 0 var(--ak-blue)" : "none"};
  user-select: none;
  cursor: pointer;
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

function RelicItem({ relicWrapper }: { relicWrapper: RelicWrapper }) {
  const { setRelicLayer, updateRelic } = useDamageCalculatorStore();
  const DEBUG = false;
  const [layer, setLayer] = useState<string>(relicWrapper.layer.toString());

  function updateRelicLayer(evt: FormEvent) {
    evt.preventDefault();
    setLayer(setRelicLayer(relicWrapper.id, layer));
  }

  return (
    <StyledRelicItem
      $selected={relicWrapper.selected}
      key={relicWrapper.id}
      onClick={() =>
        updateRelic(relicWrapper.id, "selected", !relicWrapper.selected)
      }
    >
      <StyledImageWrapper>
        <LazyImage
          src={
            assetsHost +
            `roguelike_topic_itempic/${relicAlterToBasic(relicWrapper.id)}.png`
          }
        />
      </StyledImageWrapper>
      {relicWrapper.hasLayer && (
        <StyledLayerWrapper>
          <span>层数</span>
          <ToolInput
            className="h-5 px-1 bg-[#333333]"
            value={layer}
            setValue={setLayer}
            onClick={(evt) => evt.stopPropagation()}
            onEnter={updateRelicLayer}
            onBlur={updateRelicLayer}
          />
        </StyledLayerWrapper>
      )}
      <div>
        <div className="font-bold mb-1">{relicWrapper.name}</div>
        <div className="text-xs font-light">{relicWrapper.usage}</div>
        {DEBUG && (
          <>
            <Divider className="my-1" />
            <div className="whitespace-pre-wrap text-xs font-light">
              {relicWrapper.id}
            </div>
            {/*<div className="whitespace-pre-wrap text-xs font-light">*/}
            {/*  {JSON.stringify(relicWrapper.buffs, null, 2)}*/}
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
          </>
        )}
      </div>
    </StyledRelicItem>
  );
}
