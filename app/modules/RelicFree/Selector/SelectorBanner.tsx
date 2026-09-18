import { styled } from "styled-components";
import type { RogueKey, TopicData } from "~/types/gameData";
import { useSearchParams } from "react-router";
import React from "react";

const StyledBannerContainer = styled.div`
  margin-bottom: 2rem;
  position: relative;
`;

const StyledBannerForeground = styled.div`
  padding: 0.5rem 0 0.5rem 1rem;
  @media (min-width: 640px) {
    padding: 1rem 0 1rem 1.5rem;
  }
  @media (min-width: 1024px) {
    padding: 1.25rem 0 1.25rem 2rem;
  }
  @media (min-width: 1280px) {
    padding: 1.5rem 0 2rem 2.5rem;
  }
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
  width: 100%;
  background: linear-gradient(
    45deg,
    #000 0%,
    rgba(0, 0, 0, 0.75) 10%,
    rgba(0, 0, 0, 0) 90%,
    transparent
  );
  z-index: -1;
`;

const StyledTopicNavContainer = styled.div<{ $mobile: boolean }>`
  position: ${({ $mobile }) => ($mobile ? "relative" : "absolute")};
  top: 0;
  left: ${({ $mobile }) => ($mobile ? "0" : "50%")};
  transform: ${({ $mobile }) => ($mobile ? "none" : "translateX(-50%)")};
  height: ${({ $mobile }) => ($mobile ? "auto" : "100%")};
  width: ${({ $mobile }) => ($mobile ? "100%" : "100vw")};
  z-index: 10;
`;

const StyledTopicNavInner = styled.div<{ $mobile: boolean }>`
  width: 100%;
  height: 100%;
  display: ${({ $mobile }) => ($mobile ? "block" : "flex")};
  justify-content: end;
  align-items: center;
`;

const StyledTopicNav = styled.div<{ $mobile: boolean }>`
  display: grid;
  grid-template-columns: ${({ $mobile }) =>
    $mobile ? "repeat(auto-fit, minmax(10rem, 1fr))" : "none"};
  gap: ${({ $mobile }) => ($mobile ? "0" : "0.5rem")};
`;

export default function SelectorBanner({
  topics,
  currentTopic,
}: {
  topics: Record<RogueKey, TopicData>;
  currentTopic: TopicData;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  function Nav({ mobile = false }: { mobile?: boolean }) {
    return (
      <StyledTopicNavContainer
        className={mobile ? "mb-4 md:hidden" : "hidden md:flex"}
        $mobile={mobile}
      >
        <StyledTopicNavInner $mobile={mobile}>
          <StyledTopicNav $mobile={mobile}>
            {Object.values(topics).map((topic) => (
              <div
                key={topic.id}
                className={
                  (mobile
                    ? "text-center font-bold leading-[2rem] p-1 "
                    : "ps-8 pe-16 py-1 text-sm font-han-sans font-bold ") +
                  (currentTopic.id === topic.id
                    ? "bg-ak-blue text-black"
                    : mobile
                      ? "bg-black-gray text-white"
                      : "bg-black text-white")
                }
                role="button"
                onClick={() => {
                  searchParams.set("topicId", topic.id);
                  if (topic.id !== currentTopic.id)
                    searchParams.delete("zoneId");
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
      <Nav mobile />
      <StyledBannerContainer>
        <Nav />
        <div
          className="h-64 w-full bg-dark-gray"
          style={{ aspectRatio: 729 / 155 }}
        >
          <img
            src={`${import.meta.env.VITE_API_BASE_URL}/images/topic_banner/${currentTopic.id}.jpg`}
            alt="topic_banner"
            className="w-full h-full z-0 object-cover"
          />
        </div>
        <StyledBannerForeground>
          <LeftMask />
          <div className="text-[2rem] sm:text-[2.5ren] lg:text-[3rem] xl:text-[3.5rem] font-han-sans font-bold">
            {currentTopic.name}
          </div>
          <div className="grow">
            <StyledDecorationText>{currentTopic.name_en}</StyledDecorationText>
          </div>
          <div className="whitespace-pre-wrap text-light-mid-gray text-sm leading-6">
            {currentTopic.lineText}
          </div>
        </StyledBannerForeground>
      </StyledBannerContainer>
    </>
  );
}
