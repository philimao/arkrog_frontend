import { Tooltip } from "~/modules/Tool/components/SafeHeroPortal";
import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { cosHost } from "~/utils/tools";

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
  background: #333333 url("${cosHost}/images%2Frogue_4%2F%E7%81%B5%E6%84%9F%E5%B9%B4%E4%BB%A3.png") no-repeat center
    center / contain;
  aspect-ratio: 4/3;
  font-family: "NovecentoWide", sans-serif;
`;

const StyledTopicSpecTriggerInfoInner = styled.div`
  padding-top: 2.25rem;
  font-size: 0.9rem;
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
  const { rogueInput, toggleShowTopicSpec, topicSpecItems, setTopicSpecItems } = useDamageCalculatorStore();
  const rogueKey = rogueInput.topic;

  if (rogueKey === "rogue_4")
    return (
      <StyledTopicSpecContainer>
        <StyledSpecTrigger onClick={toggleShowTopicSpec}>
          <StyledTopicSpecTriggerInfo>
            <StyledTopicSpecTriggerInfoInner>灵感&年代</StyledTopicSpecTriggerInfoInner>
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
                    console.log(updated);
                    updated.find((updatedItem) => updatedItem?.id === item.id)!.userActive = !item.userActive;
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
