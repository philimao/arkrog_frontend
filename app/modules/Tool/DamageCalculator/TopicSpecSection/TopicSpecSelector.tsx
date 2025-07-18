import { styled } from "styled-components";
import { useMemo } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import Rogue5Selector from "./components/Rogue5Selector";
import Rogue4Selector from "./components/Rogue4Selector";
import type { BlackboardData, RelicBuff } from "~/types/gameData";

/** 主题特殊效果，模拟藏品 */
export interface ITopicSpecItem {
  id: string;
  name: string;
  description: string;
  userActive: boolean;
  buffs: RelicBuff[];
  layer: number;
  url: string;
  invert: number;
  rows: number;
}

export interface ITopicSpecConfig {
  id: string;
  name: string;
  functionDesc: (blackboard: BlackboardData[]) => string;
  values: RelicBuff[][];
  disabled?: boolean;
}

const StyledTopicSpecSelector = styled.div<{ $active: boolean }>`
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

const StyledTopicSpecSelectorInner = styled.div`
  padding: 5rem 8rem 1rem 8rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const StyledGridContainer = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$cols || 3}, 1fr);
  gap: 0.5rem;
`;

export const StyledGridItem = styled.div<{ $selected: boolean; $disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 3%;
  cursor: pointer;
  background: ${(props) => (props.$selected ? "black" : "rgba(24, 24, 24, 0.70)")};
  border: 1px solid ${(props) => (props.$selected ? "var(--ak-blue)" : "transparent")};
  box-shadow: ${(props) => (props.$selected ? "0 0 4px 0 var(--ak-blue)" : "none")};
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
`;

export const StyledGridItemInner = styled.div`
  height: 100%;
  display: flex;
  gap: 0.5rem;
  position: relative;
`;

export const StyledGridItemTitle = styled.div`
  display: flex;
  align-items: flex-end;
  & > span:first-child {
    margin-right: 0.5rem;
  }
`;

export const StyledGridItemIcon = styled.div<{ $url: string; $invert?: number }>`
  width: 4rem;
  background: url(${(props) => props.$url}) no-repeat center center;
  background-size: contain;
  flex-shrink: 0;
  filter: invert(${(props) => props.$invert || 0});
`;

export default function TopicSpecSelector() {
  const { rogueInput, showTopicSpec, toggleShowTopicSpec } = useDamageCalculatorStore();

  const Selector = useMemo(() => {
    switch (rogueInput.topic) {
      case "rogue_4":
        return <Rogue4Selector />;
      case "rogue_5":
        return <Rogue5Selector />;
      default:
        return null;
    }
  }, [rogueInput.topic]);

  return (
    <StyledTopicSpecSelector $active={showTopicSpec}>
      <StyledBackButton onClick={toggleShowTopicSpec}>返回</StyledBackButton>
      <StyledTopicSpecSelectorInner>{Selector}</StyledTopicSpecSelectorInner>
    </StyledTopicSpecSelector>
  );
}
