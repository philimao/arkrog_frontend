import { styled } from "styled-components";
import type { TopicData, Topics } from "~/types/gameData";
import { useSearchParams } from "react-router";
import React from "react";

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
  letter-spacing: 1px;
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
}: {
  topics: Topics;
  currentTopic: TopicData;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  function Nav({ ...props }: React.ComponentPropsWithoutRef<"div">) {
    return (
      <StyledTopicNavContainer {...props}>
        <StyledTopicNavInner>
          <StyledTopicNav>
            {Object.values(topics).map((topic) => (
              <div
                key={topic.id}
                className={
                  "ps-8 pe-16 py-1 text-sm font-han-sans font-bold " +
                  `${currentTopic.id === topic.id ? "bg-ak-blue text-black" : "bg-black text-white"} `
                }
                role="button"
                onClick={() => {
                  searchParams.set("topicId", topic.id);
                  setSearchParams(searchParams, {
                    preventScrollReset: true,
                  });
                }}
              >
                {topic.name}
              </div>
            ))}
          </StyledTopicNav>
        </StyledTopicNavInner>
      </StyledTopicNavContainer>
    );
  }

  return (
    <>
      <StyledBannerContainer>
        <Nav className="hidden md:flex" />
        <div
          className="h-64 w-full bg-dark-gray"
          style={{ aspectRatio: 729 / 155 }}
        >
          <img
            src={`${import.meta.env.VITE_API_BASE_URL}/images/topic_banner/${currentTopic.id}.png`}
            alt="topic_banner"
            className="h-full z-0 object-cover"
          />
        </div>
        <StyledBannerForeground>
          <LeftMask />
          <div className="text-[3.5rem] font-han-sans font-bold">
            {currentTopic.name}
          </div>
          <div className="flex-grow">
            <StyledDecorationText>{currentTopic.name_en}</StyledDecorationText>
          </div>
          <div className="whitespace-pre-wrap text-light-mid-gray text-sm leading-6">
            {currentTopic.lineText}
          </div>
        </StyledBannerForeground>
      </StyledBannerContainer>
      <div className="relative h-40 mb-4 md:h-0 md:mb-0">
        <Nav className="flex md:hidden" />
      </div>
    </>
  );
}
