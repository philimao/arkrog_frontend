import type { RogueKey, StageData, TopicData } from "~/types/gameData";
import React, { type Dispatch, type SetStateAction, useMemo } from "react";
import { styled } from "styled-components";
import { useNavigate } from "react-router";
import SubmitRecordForm from "~/modules/RelicFree/Stage/SubmitRecordForm";
import type { RecordType } from "~/types/recordType";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useRelicFreeStore } from "~/stores/relicFreeStore";
import { assetsHost } from "~/utils/tools";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";

const StyledDescriptionBlock = styled.div`
  padding: 1.5rem;
  background: var(--black-gray);
  white-space: pre-wrap;
`;

const StyledDescriptionTag = styled.div<{ $tag: string }>`
  float: right;
  padding: 0.25rem 1rem;
  margin-left: 0.25rem;
  font-size: 0.8rem;
  background: ${(props) => (props.$tag === "紧急" ? "var(--ak-dark-red)" : "var(--ak-dark-purple)")};
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
  background: var(--black-gray);
`;

export default function StageDetail({
  topicData,
  stageData,
  setRecords,
}: {
  topicData: TopicData;
  stageData: StageData;
  setRecords: Dispatch<SetStateAction<RecordType[]>>;
}) {
  const navigate = useNavigate();

  const { stagePreview, stageEnemies } = useRelicFreeStore();
  const { stages } = useGameDataStore();

  // 关卡敌人信息
  const enemies = stageEnemies?.[stageData.id] || [];

  // 关卡面包屑描述
  const breadcrumb = `${topicData.name} ${stagePreview?.[stageData.id]?.breadcrumb ?? ""}`;

  // 查找是否有紧急作战数据
  const eliteStageData: StageData | null = useMemo(() => {
    if (!stages || !stageData.id.match(/ro\d_n/)) return null;
    const eliteId = stageData.id.replace("n", "e");
    const [ro] = stageData.id.split("_");
    const rogueKey: RogueKey = ("rogue_" + ro.slice(-1)) as RogueKey;
    return stages[rogueKey][eliteId];
  }, [stages, stageData]);

  console.log([stageData.description.replace(/<@[^>]+>(.+?)<\/>/g, "$1").replace(/\\n/g, "\n")]);

  const shouldShowEliteDesc = eliteStageData || stagePreview?.[stageData.id]?.boatDesc;
  const renderEliteDesc = () => {
    const tag = eliteStageData ? "紧急" : stagePreview?.[stageData.id]?.boatDesc ? "带船" : "";
    return (
      <>
        <StyledDescriptionTag $tag={tag}>{tag}</StyledDescriptionTag>
        {eliteStageData ? eliteStageData.eliteDesc : (stagePreview?.[stageData.id]?.boatDesc ?? "")}
      </>
    );
  };

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
        <SubmitRecordForm stageId={stageData.id} setRecords={setRecords} />
      </h1>
      <div className="text-ak-blue text-sm mb-8">{breadcrumb}</div>
      <div className="grid gap-4 grid-col-1 md:grid-cols-2 mb-8">
        <StyledDescriptionBlock>
          {stageData.description.replace(/<@[^>]+>(.+?)<\/>/g, "$1").replace(/\\n/g, "\n\n")}
        </StyledDescriptionBlock>
        {shouldShowEliteDesc && <StyledDescriptionBlock>{renderEliteDesc()}</StyledDescriptionBlock>}
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-8">
        <div>
          <span className="text-xl font-bold">地图</span>
          <img
            className="w-full mt-2"
            src={`${assetsHost}/map_preview/${stageData.id}.png`}
            alt="map"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>
        <div className="">
          <span className="text-xl font-bold">敌方情报</span>
          <div className="w-full aspect-video bg-mid-gray p-2 mt-2">
            <div className="h-full pt-4 overflow-y-auto flex flex-wrap justify-evenly gap-4">
              {[...enemies, ...Array(5).fill(0)].map((enemyName, i) => {
                return (
                  <div className="w-1/6" key={i}>
                    <EnemyAvatar name={enemyName} displayName={enemyName} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
