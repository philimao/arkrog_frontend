import { styled } from "styled-components";
import type { TopicData, Topics } from "~/types/gameData";
import type { Dispatch, SetStateAction } from "react";

const StyledBannerContainer = styled.div`
  margin-bottom: 2rem;
  position: relative;
`;

const StyledBannerForeground = styled.div`
  padding: 1.5rem 0 2rem 2.5rem;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  flex-direction: column;
`;

const StyledDecorationText = styled.div`
  display: inline-block;
  padding-bottom: 0.25rem;
  font-family: "Novecento", sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  border-bottom: var(--ak-blue) 0.5rem solid;
  transform: translateY(-0.3rem);
`;

const LeftMask = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 30%;
  background: linear-gradient(
    270deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.75) 50%,
    #000 75%
  );
  z-index: -1;
`;

const StyledTopicNavContainer = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 100%;
  width: 100vw;
  z-index: 10;
`;

const StyledTopicNavInner = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: end;
  align-items: center;
`;

const StyledTopicNav = styled.div`
  display: grid;
  gap: 0.5rem;
`;

export default function SelectorBanner({
  topics,
  currentTopic,
  setCurrentTopic,
}: {
  topics: Topics;
  currentTopic: TopicData;
  setCurrentTopic: Dispatch<SetStateAction<TopicData>>;
}) {
  return (
    <StyledBannerContainer>
      <StyledTopicNavContainer>
        <StyledTopicNavInner>
          <StyledTopicNav>
            {Object.values(topics).map((topic) => (
              <div
                key={topic.id}
                className={
                  "ps-8 pe-16 py-1 font-bold text-sm " +
                  `${currentTopic.id === topic.id ? "bg-ak-blue text-black" : "bg-black text-white"} `
                }
                role="button"
                onClick={() => setCurrentTopic(topic)}
              >
                {topic.name}
              </div>
            ))}
          </StyledTopicNav>
        </StyledTopicNavInner>
      </StyledTopicNavContainer>
      <img
        src={`/images/topic_banner/${currentTopic.id}.png`}
        alt="topic_banner"
        className="w-full h-auto z-0"
      />
      <StyledBannerForeground>
        <LeftMask />
        <div className="font-bold text-[3.5rem]">{currentTopic.name}</div>
        <div className="flex-grow">
          <StyledDecorationText>{currentTopic.name_en}</StyledDecorationText>
        </div>
        <div className="whitespace-pre-wrap text-light-mid-gray text-sm leading-6">
          {currentTopic.lineText}
        </div>
      </StyledBannerForeground>
    </StyledBannerContainer>
  );
}
