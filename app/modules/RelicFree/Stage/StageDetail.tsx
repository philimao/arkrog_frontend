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
import { toast } from "react-toastify";

const StyledStageDetailContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
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
  top: 0;
  width: 5.5rem;
  height: 2.5rem;
  background: var(--black-gray);
`;

const StyledDescriptionBlock = styled.div`
  padding: 1.5rem;
  background: #181818b2;
  white-space: pre-wrap;
`;

const StyledDescriptionTag = styled.div<{ $tag: string }>`
  float: right;
  padding: 0.25rem 1rem;
  margin-left: 0.25rem;
  font-size: 0.8rem;
  background: ${(props) => (props.$tag === "紧急" ? "var(--ak-dark-red)" : "var(--ak-dark-purple)")};
`;

const StyledStageInfoContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StyledStageHeader = styled.h1`
  font-weight: bold;
  display: flex;
  align-items: end;
  gap: 0.5rem;
`;

const StyledStageBreadcrumb = styled.div`
  font-size: 0.875rem;
  color: var(--ak-blue);
  display: inline-block;
`;

const StyledStageActions = styled.div`
  display: inline-block;
  align-self: end;
`;

const StyledStageNavButton = styled.button`
  width: 5rem;
  height: 2.5rem;
  font-weight: bold;
  background: var(--mid-gray);
  margin-right: 0.5rem;

  &:hover {
    opacity: 0.8;
  }
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

  // 是否渲染紧急/带船信息
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

  // 上一关（stagePreview 拉取失败时为空，导航按钮自然隐藏）
  const stageIds = Object.keys(stagePreview ?? {});
  const prevStageIdx = stageIds.indexOf(stageData.id) - 1;
  const nextStageIdx = stageIds.indexOf(stageData.id) + 1;

  // 处理返回按钮点击
  const handleBack = () => {
    // 检查是否有保存的返回URL（从列表页跳转过来时保存的）
    const returnUrl = sessionStorage.getItem("relicFreeReturnUrl");
    if (returnUrl) {
      // 清除保存的URL，避免影响其他导航
      sessionStorage.removeItem("relicFreeReturnUrl");
      navigate(returnUrl);
    } else {
      // 如果没有保存的URL，使用浏览器历史记录返回
      navigate(-1);
    }
  };

  return (
    <StyledStageDetailContainer>
      {/* 宽屏下返回按钮 */}
      <StyledBackButtonContainer>
        <div className="relative">
          <StyledBackButton className="hidden lg:block" onClick={handleBack}>
            返回
          </StyledBackButton>
        </div>
      </StyledBackButtonContainer>
      {/* 顶部关卡信息展示区与操作按钮区 */}
      <StyledStageInfoContainer>
        <StyledStageHeader>
          <span className="text-[2.5rem] leading-10">{stageData.name}</span>
          <span className="text-2xl">{stageData.code}</span>
          {/* 窄屏下返回按钮 */}
          <StyledBackButton className="text-small py-1.5 block lg:hidden" onClick={handleBack}>
            返回
          </StyledBackButton>
        </StyledStageHeader>
        <div className="flex justify-between">
          <StyledStageBreadcrumb>{breadcrumb}</StyledStageBreadcrumb>
          <StyledStageActions>
            {prevStageIdx >= 0 && (
              <StyledStageNavButton
                className="text-small py-1.5"
                onClick={() => navigate(`/relic-free/${stageIds[prevStageIdx]}`)}
              >
                上一关
              </StyledStageNavButton>
            )}
            {nextStageIdx < stageIds.length && (
              <StyledStageNavButton
                className="text-small py-1.5"
                onClick={() => navigate(`/relic-free/${stageIds[nextStageIdx]}`)}
              >
                下一关
              </StyledStageNavButton>
            )}
            <SubmitRecordForm stageId={stageData.id} setRecords={setRecords} />
          </StyledStageActions>
        </div>
      </StyledStageInfoContainer>
      {/* 关卡描述与紧急条件描述 */}
      <div className="grid gap-4 grid-col-1 md:grid-cols-2 mb-8">
        <StyledDescriptionBlock>
          {stageData.description.replace(/<@[^>]+>(.+?)<\/>/g, "$1").replace(/\\n/g, "\n\n")}
        </StyledDescriptionBlock>
        {shouldShowEliteDesc && <StyledDescriptionBlock>{renderEliteDesc()}</StyledDescriptionBlock>}
      </div>
      {/* 地图与敌方情报 */}
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
    </StyledStageDetailContainer>
  );
}
