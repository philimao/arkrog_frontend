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

const StyledTopicSpecNode = styled.div<{ $url: string; $invert: number; $userActive: boolean }>`
  width: 4rem;
  height: 4rem;
  background: url(${(props) => props.$url}) no-repeat center center;
  background-size: contain;
  filter: invert(${(props) => props.$invert});
  opacity: ${(props) => (props.$userActive ? "1" : "0.3")};
  user-select: none;
  cursor: pointer;
`;

export default function TopicSpecTrigger() {
  const { rogueKey, toggleShowTopicSpec, topicSpecItems, setTopicSpecItems } = useDamageCalculatorStore();

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
          .filter((item) => item)
          .map((item) => (
            <Tooltip
              key={item.id}
              closeDelay={300}
              content={
                <div className="px-1 py-2">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-small">{item.desc}</div>
                </div>
              }
            >
              <StyledTopicSpecNode
                onClick={() => {
                  setTopicSpecItems((items) => {
                    const updated = [...items];
                    updated.find((i) => i.id === item.id)!.userActive = !item.userActive;
                    return updated;
                  });
                }}
                $url={item.url}
                $invert={item.invert}
                $userActive={item.userActive}
              />
            </Tooltip>
          ))}
      </StyledTopicSpecContainer>
    );
  return null;
}
