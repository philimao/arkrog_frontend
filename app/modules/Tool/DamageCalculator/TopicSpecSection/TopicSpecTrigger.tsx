import { Tooltip } from "@heroui/react";
import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { cosHost } from "~/utils/tools";

const triggerConfigs = {
  rogue_4: {
    text: "灵感&年代",
    background: "/images%2Frogue_4%2F%E7%81%B5%E6%84%9F%E5%B9%B4%E4%BB%A3.png",
  },
  rogue_5: {
    text: "通宝&岁时",
    background: "/images%2Frogue_5%2F%E9%80%9A%E5%AE%9D%E5%B2%81%E6%97%B6.png",
  },
};

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

const StyledTopicSpecTriggerInfo = styled.div<{ $background: string }>`
  background: #333333 url("${({ $background }) => cosHost + $background}") no-repeat center center / contain;
  aspect-ratio: 4/3;
  font-family: "NovecentoWide", sans-serif;
`;

const StyledTopicSpecTriggerInfoInner = styled.div`
  padding-top: 2.25rem;
  font-size: 0.9rem;
`;

const StyledTopicSpecNode = styled.div<{ $url: string; $invert: number; $userActive: boolean; $rows: number }>`
  width: 4rem;
  height: ${(props) => props.$rows * 2}rem;
  background: url(${(props) => props.$url}) no-repeat center center;
  background-size: contain;
  filter: invert(${(props) => props.$invert});
  opacity: ${(props) => (props.$userActive ? "1" : "0.3")};
  user-select: none;
  cursor: pointer;
  grid-row: span ${(props) => props.$rows};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledTopicSpecNodeWrapper = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: 2rem 2rem;
  grid-auto-columns: 4rem;
  height: 4rem;
  gap: 0 0.5rem;
`;

export default function TopicSpecTrigger() {
  const { rogueInput, toggleShowTopicSpec, topicSpecItems, setTopicSpecItems } = useDamageCalculatorStore();
  const rogueKey = rogueInput.topic;

  const allowedRogueKeys = ["rogue_4", "rogue_5"];
  if (allowedRogueKeys.includes(rogueKey))
    return (
      <StyledTopicSpecContainer>
        <StyledSpecTrigger onClick={toggleShowTopicSpec}>
          <StyledTopicSpecTriggerInfo $background={triggerConfigs[rogueKey as keyof typeof triggerConfigs].background}>
            <StyledTopicSpecTriggerInfoInner>
              {triggerConfigs[rogueKey as keyof typeof triggerConfigs].text}
            </StyledTopicSpecTriggerInfoInner>
          </StyledTopicSpecTriggerInfo>
        </StyledSpecTrigger>
        <StyledTopicSpecNodeWrapper>
          {topicSpecItems
            .filter((item) => item)
            .map((item) => (
              <Tooltip
                key={item.id}
                closeDelay={300}
                content={
                  <div className="px-1 py-2">
                    <div className="font-bold">{item.name}</div>
                    <div className="text-small">{item.description}</div>
                  </div>
                }
              >
                <StyledTopicSpecNode
                  onClick={() => {
                    setTopicSpecItems((items) => {
                      const updated = [...items];
                      updated.find((updatedItem) => updatedItem?.id === item.id)!.userActive = !item.userActive;
                      return updated;
                    });
                  }}
                  $url={item.url}
                  $invert={item.invert}
                  $userActive={item.userActive}
                  $rows={item.rows}
                >
                  {item.url === "#" && <div className="text-tiny font-bold">{item.name}</div>}
                </StyledTopicSpecNode>
              </Tooltip>
            ))}
        </StyledTopicSpecNodeWrapper>
      </StyledTopicSpecContainer>
    );
  return null;
}
