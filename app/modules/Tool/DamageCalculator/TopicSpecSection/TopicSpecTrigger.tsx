import { Tooltip } from "@heroui/react";
import { Fragment } from "react/jsx-runtime";
import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";

const StyledTopicSpecContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StyledSpecTrigger = styled.div`
  height: 4rem;
  display: flex;
  gap: 1rem;
  color: var(--light-gray);
  user-select: none;
  cursor: pointer;
  & > div {
    text-align: center;
  }
`;

const StyledTopicSpecTriggerInfo = styled.div`
  padding: 0 0.75rem;
  background: #333333;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "NovecentoWide", sans-serif;
`;

const StyledTopicSpecTriggerInfoInner = styled.div`
  & > div {
    font-size: 0.9rem;
    line-height: 1.5rem;
  }
`;

const StyledTopicSpecNode = styled.div<{ $url: string; $invert: number }>`
  width: 4rem;
  height: 4rem;
  background: url(${(props) => props.$url}) no-repeat center center;
  background-size: contain;
  filter: invert(${(props) => props.$invert});
`;

export default function TopicSpecTrigger() {
  const { rogueKey, toggleShowTopicSpec, topicSpecItems } = useDamageCalculatorStore();

  if (rogueKey === "rogue_4")
    return (
      <StyledTopicSpecContainer>
        <StyledSpecTrigger onClick={toggleShowTopicSpec}>
          <StyledTopicSpecTriggerInfo>
            <StyledTopicSpecTriggerInfoInner>
              <div>灵感</div>
              <div>年代</div>
            </StyledTopicSpecTriggerInfoInner>
          </StyledTopicSpecTriggerInfo>
        </StyledSpecTrigger>
        {topicSpecItems
          .filter((node) => node)
          .map((node) => (
            <Tooltip
              key={node.id}
              closeDelay={300}
              content={
                <div className="px-1 py-2">
                  <div className="font-bold">{node.name}</div>
                  <div className="text-small">{node.desc}</div>
                </div>
              }
            >
              <StyledTopicSpecNode $url={node.url} $invert={node.invert} />
            </Tooltip>
          ))}
      </StyledTopicSpecContainer>
    );
  return null;
}
