import type {
  GameData,
  RogueKey,
  StageData,
  TopicData,
} from "~/types/gameData";
import React, { type Dispatch, useMemo } from "react";
import { styled } from "styled-components";
import { Skeleton } from "@heroui/react";
import { useNavigate } from "react-router";
import SubmitForm from "~/modules/RecordForm/SubmitForm";

// @ts-ignore
const StyledDescriptionBlock = styled.div.attrs((props) => ({
  // @ts-ignore
  "data-type": props.type,
}))`
  padding: 1.5rem;
  background: ${(props) => props.theme.blackGray};
  white-space: pre-wrap;
  position: relative;
  &::after {
    display: ${(props) =>
      // @ts-ignore
      props.type ? "block" : "none"};
    content: attr(data-type);
    position: absolute;
    right: 1rem;
    top: 1rem;
    padding: 0.25rem 1rem;
    font-size: 0.8rem;
    background: ${(props) =>
      // @ts-ignore
      props.type === "紧急" ? props.theme.akRed : props.theme.akPurple};
  }
`;

const StyledBackButtonContainer = styled.div`
  position: absolute;
  width: 100vw;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
`;

const StyledBackButton = styled.button`
  position: absolute;
  right: 0;
  top: 2rem;
  padding: 0.5rem 2rem;
  background: ${(props) => props.theme.blackGray};
`;

export default function StageDetail({
  topicData,
  stageData,
  gameData,
  setRecords,
}: {
  topicData: TopicData;
  stageData: StageData;
  gameData: GameData;
  setRecords: Dispatch<any>;
}) {
  const breadcrumb = useMemo(() => {
    // const [ro, type] = stageData.id.split("_");
    // console.log(topicData);
    return `${topicData.name} // 第？层 // 等待手工录入`;
  }, [topicData]);

  const eliteStageData: StageData | null = useMemo(() => {
    if (!stageData.id.match(/ro\d_n/)) return null;
    const eliteId = stageData.id.replace("n", "e");
    const [ro] = stageData.id.split("_");
    const rogueKey: RogueKey = ("rogue_" + ro.slice(-1)) as RogueKey;
    return gameData.stages[rogueKey][eliteId];
  }, [gameData, stageData]);

  const navigate = useNavigate();

  return (
    <div className="mb-10 relative">
      <StyledBackButtonContainer>
        <div className="relative">
          <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
        </div>
      </StyledBackButtonContainer>
      <h1 className="font-bold mb-2 flex items-end">
        <span className="text-[2.5rem] leading-10 me-2">{stageData.name}</span>
        <span className="text-2xl">{stageData.code}</span>
        <SubmitForm stageId={stageData.id} setRecords={setRecords} />
      </h1>
      <div className="text-ak-blue text-sm mb-8">{breadcrumb}</div>
      <div className="grid gap-4 grid-cols-2 mb-8">
        <StyledDescriptionBlock>{stageData.description}</StyledDescriptionBlock>
        {/* @ts-ignore */}
        <StyledDescriptionBlock type={eliteStageData ? "紧急" : "带船"}>
          {eliteStageData ? eliteStageData.eliteDesc : "带船信息需手动录入"}
        </StyledDescriptionBlock>
      </div>
      <div className="grid gap-4 grid-cols-2 mb-8">
        <div>
          <span className="text-lg  font-bold mb-2">地图</span>
          <Skeleton>
            <div className="bg-mid-gray h-[15rem]">这里是一张地图</div>
          </Skeleton>
        </div>
        <div>
          <span className="text-lg font-bold mb-2">敌方情报</span>
          <Skeleton>
            <div className="bg-mid-gray h-[15rem]">还没做好</div>
          </Skeleton>
        </div>
      </div>
    </div>
  );
}
