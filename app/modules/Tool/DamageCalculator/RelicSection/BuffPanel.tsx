import { styled } from "styled-components";
import React, { type Dispatch, type SetStateAction, useRef } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { useShallow } from "zustand/react/shallow";
import BuffText from "~/modules/Tool/DamageCalculator/RelicSection/BuffText";

const StyledBuffPanel = styled.div`
  display: flex;
`;

const typeMap = {
  operator: "干员",
  enemy: "敌方",
};

export default function BuffPanel({
  show,
  setShow,
}: {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
}) {
  const tooltip = useRef(null);
  return (
    <StyledBuffPanel>
      {Object.keys(typeMap).map((type) => (
        <BuffTrigger
          type={type}
          key={type}
          onClick={() => {
            if (show) return;
            const listener = (evt: MouseEvent) => {
              if (
                !(tooltip.current! as HTMLDivElement).contains(
                  evt.target as HTMLElement,
                )
              ) {
                document.removeEventListener("click", listener);
                setShow(false);
              }
            };
            setShow(true);
            document.addEventListener("click", listener);
          }}
        />
      ))}
      <div ref={tooltip}>
        <BuffTooltip show={show} />
      </div>
    </StyledBuffPanel>
  );
}

const StyledBuffTrigger = styled.div`
  height: 4rem;
  width: 6rem;
  display: flex;
  gap: 1rem;
  color: var(--light-gray);
  user-select: none;
  cursor: pointer;
  & > div {
    text-align: center;
  }
`;

const StyledBuffTriggerInfo = styled.div<{ $type: string }>`
  padding: 0 0.75rem;
  background: #333333
    url(/images/tool/calculator/${(props) => props.$type}_buff.png) no-repeat
    center / contain;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "NovecentoWide", sans-serif;
`;

const StyledBuffTriggerInfoInner = styled.div`
  & > div:first-child {
    font-size: 1.5rem;
    line-height: 1.75rem;
  }
  & > div:last-child {
    font-size: 0.9rem;
  }
`;

function BuffTrigger({ type, onClick }: { type: string; onClick: () => void }) {
  const { enemyBuff, activeCharName: charName } = useDamageCalculatorStore();
  const charBuff = useDamageCalculatorStore(
    useShallow((state) => state.charsBuff[charName]),
  );
  const charBuffInGame = useDamageCalculatorStore(
    useShallow((state) => state.charsBuffInGame[charName]),
  );
  return (
    <StyledBuffTrigger onClick={onClick}>
      <StyledBuffTriggerInfo $type={type}>
        <StyledBuffTriggerInfoInner>
          <div>
            {type === "operator"
              ? Object.keys(charBuff || {}).length +
                Object.keys(charBuffInGame || {}).length
              : Object.keys(enemyBuff || {}).length}
          </div>
          <div>{typeMap[type as never] + "加成"}</div>
        </StyledBuffTriggerInfoInner>
      </StyledBuffTriggerInfo>
    </StyledBuffTrigger>
  );
}

const StyledBuffTooltip = styled.div<{ $show: boolean }>`
  display: ${(props) => (props.$show ? "flex" : "none")};
  background: rgba(24, 24, 24, 0.99);
  position: fixed;
  right: 0;
  bottom: 5.5rem;
  width: 40rem;
  height: 15rem;
  padding: 1rem 2rem;
  & > div:first-child {
    width: 63%;
  }
  & > div:last-child {
    width: 37%;
  }
`;

const StyledBuffTooltipCol = styled.div<{ $type: string }>`
  height: 100%;
  position: relative;
`;

const StyledBuffTooltipImg = styled.img`
  position: absolute;
  width: auto;
  height: 90%;
  object-fit: cover;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: -1;
  opacity: 0.2;
`;

const StyledBuffTooltipTitle = styled.div<{ $type: string }>`
  font-weight: bold;
  border-bottom: var(--mid-gray) 1px solid;
  width: ${(props) => (props.$type === "operator" ? 16.5 : 12)}rem;
  padding-bottom: 0.7rem;
  margin-bottom: 0.7rem;
  display: flex;
  align-items: start;
  & > span:first-child {
    margin-right: 1rem;
  }
  & > span:nth-child(2) {
    color: ${(props) =>
      props.$type === "operator" ? "var(--ak-blue)" : "var(--ak-red)"};
    font-size: 2rem;
    line-height: 1.7rem;
  }
`;

const StyledBuffTooltipText = styled.div<{ $type: string }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $type }) => ($type === "operator" ? 2 : 1)},
    1fr
  );
  grid-template-rows: repeat(6, auto);
  grid-auto-flow: column;
  grid-auto-rows: auto;
  gap: 0.25rem;
  font-size: 0.9rem;
`;

/** Buff加成面板Tooltip */
function BuffTooltip({ show }: { show: boolean }) {
  const { enemyBuff, activeCharName: charName } = useDamageCalculatorStore();
  const charBuff = useDamageCalculatorStore(
    useShallow((state) => state.charsBuff[charName]),
  );
  const charBuffInGame = useDamageCalculatorStore(
    useShallow((state) => state.charsBuffInGame[charName]),
  );
  return (
    <StyledBuffTooltip $show={show}>
      {Object.keys(typeMap).map((type) => (
        <StyledBuffTooltipCol $type={type} key={type}>
          <StyledBuffTooltipImg
            src={`/images/tool/calculator/${type}_buff.png`}
            alt="bg"
          />
          <StyledBuffTooltipTitle $type={type}>
            <span>{typeMap[type as never] + "加成"}</span>
            <span>
              {type === "operator"
                ? Object.keys(charBuff || {}).length +
                  Object.keys(charBuffInGame || {}).length
                : Object.keys(enemyBuff || {}).length}
            </span>
          </StyledBuffTooltipTitle>
          <StyledBuffTooltipText $type={type}>
            {type === "operator" ? (
              <BuffText charBuff={charBuff} inGameBuff={charBuffInGame} />
            ) : (
              <BuffText enemyBuff={enemyBuff} />
            )}
          </StyledBuffTooltipText>
        </StyledBuffTooltipCol>
      ))}
    </StyledBuffTooltip>
  );
}
