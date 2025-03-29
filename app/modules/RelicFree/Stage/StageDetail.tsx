import type { RogueKey, StageData, TopicData } from "~/types/gameData";
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { styled } from "styled-components";
import { useNavigate } from "react-router";
import SubmitRecordForm from "~/modules/RelicFree/Stage/SubmitRecordForm";
import type { RecordType } from "~/types/recordType";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useAppDataStore } from "~/stores/appDataStore";

const StyledDescriptionBlock = styled.div`
  padding: 1.5rem;
  background: var(--black-gray);
  white-space: pre-wrap;
`;

const StyledDescriptionTag = styled.div<{ tag: string }>`
  float: right;
  padding: 0.25rem 1rem;
  margin-left: 0.25rem;
  font-size: 0.8rem;
  background: ${(props) =>
    props.tag === "紧急" ? "var(--ak-dark-red)" : "var(--ak-dark-purple)"};
`

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
  const { stagePreview } = useAppDataStore();
  const { stages, enemies } = useGameDataStore();
  const mapRef = useRef<HTMLImageElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const enemyOfStage = enemies?.[stageData.id] || [];

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.onload = () => {
        setMapLoaded(true);
      };
    }
  }, [mapRef]);

  const breadcrumb = `${topicData.name} ${stagePreview?.[stageData.id]?.breadcrumb ?? ''}`;

  const eliteStageData: StageData | null = useMemo(() => {
    if (!stages || !stageData.id.match(/ro\d_n/)) return null;
    const eliteId = stageData.id.replace("n", "e");
    const [ro] = stageData.id.split("_");
    const rogueKey: RogueKey = ("rogue_" + ro.slice(-1)) as RogueKey;
    return stages[rogueKey][eliteId];
  }, [stages, stageData]);

  const navigate = useNavigate();

  const shouldShowAdditionalDesc = eliteStageData || stagePreview?.[stageData.id]?.boatDesc;
  const renderAdditionalDesc = () => {
    const tag = eliteStageData
      ? "紧急"
      : stagePreview?.[stageData.id]?.boatDesc
        ? "带船"
        : ""
    return <>
      <StyledDescriptionTag tag={tag}>
        {tag}
      </StyledDescriptionTag>
      {eliteStageData
        ? eliteStageData.eliteDesc
        : stagePreview?.[stageData.id]?.boatDesc ?? ""
      }
    </>
  }

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
          {stageData.description
            .replace(/\\n/g, "\n")
            .replace(/。/g, "。\n")
            .replace(/<@.*?>/, "")
            .replace(/<\/>/g, "")}
        </StyledDescriptionBlock>
        {<StyledDescriptionBlock>
          {shouldShowAdditionalDesc && renderAdditionalDesc()}
        </StyledDescriptionBlock>}
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-8">
        <div>
          <span className="text-xl font-bold mb-2">地图</span>
          <img
            ref={mapRef}
            className="w-full"
            src={`https://torappu.prts.wiki/assets/map_preview/${stageData.id}.png`}
            alt="map"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>
        <div className="">
          <span className="text-xl font-bold mb-2">敌方情报</span>
          <div className="w-full aspect-video bg-mid-gray p-2">
            <div className="h-full pt-4 overflow-y-auto flex flex-wrap justify-evenly gap-4">
              {[...enemyOfStage, ...Array(5).fill(0)].map((enemyData, i) => {
                return (
                  <div className="w-1/6" key={i}>
                    {enemyData ? (
                      <>
                        <img
                          className="w-full"
                          src={
                            enemyData.profile
                              .replace("thumb/", "")
                              .split("/50px")[0]
                          }
                          alt="profile"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <div className="text-center">{enemyData.name}</div>
                      </>
                    ) : null}
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
