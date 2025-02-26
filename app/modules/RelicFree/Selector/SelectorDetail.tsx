import { Tooltip } from "@heroui/react";
import { Link, useNavigate, useSearchParams } from "react-router";
import React from "react";
import { styled } from "styled-components";
import type { StageData, StageOfRogue } from "~/types/gameData";
import { useAppDataStore } from "~/stores/appDataStore";

const StyledZoneName = styled.div`
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--light-gray);
  background: #3d3d3d;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-size: 1.25rem;
  font-style: normal;
  font-weight: 700;
  font-family: "Source Han Sans CN";
`;

const StyledStageCard = styled.div`
  height: 5rem;
  margin-bottom: 2rem;
  filter: drop-shadow(4px 4px 5px rgba(0, 0, 0, 0.25));
`;

const StyledCardTitleText = styled.div<{ type: string }>`
  margin-right: 0.5rem;
  min-width: 2rem;
  user-select: none;
  color: ${(props) =>
    props.type === "normal"
      ? "var(--ak-blue)"
      : props.type === "elite"
        ? "var(--ak-red)"
        : "var(--ak-purple)"};
`;
const StyledCardTitleNum = styled.div`
  font-size: 2rem;
  font-family: "Novecento", sans-serif;
  transform: translateY(-1rem);
  user-select: none;
`;

const StyledCardBody = styled.div`
  position: relative;
  overflow: hidden;
  height: 3.5rem;
  background: var(--dark-gray);
`;

const StyledDifficulty = styled.div`
  font-size: 5rem;
  position: absolute;
  right: 0;
  top: -1.5rem;
  font-family: "Novecento", sans-serif;
  opacity: 0.1;
  user-select: none;
`;

const StyledStageName = styled.div`
  font-size: 1.25rem;
  line-height: 3.5rem;
  user-select: none;
`;

export default function SelectorDetail({
  zoneFilterId,
  stageOfRogue,
}: {
  zoneFilterId: string;
  stageOfRogue: StageOfRogue;
}) {
  // console.log(stageOfRogue);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { stagePreview } = useAppDataStore();

  const numOfMinorBoss = {
    ro1: 5,
    ro2: 3,
    ro3: 3,
    ro4: 3,
  };
  // 定义每层的名称，以及筛选器
  const navOfZone = [
    {
      id: "boss",
      name: "险路恶敌",
      filter: (stage: StageData, array: string[]) => {
        const excludeIds = ["ro4_b_9"];
        if (excludeIds.includes(stage.id)) return false;
        const args = stage.id.split("_");
        // eg: ro4_b_5_d
        if (args[1] !== "b") return false;
        // if (args[3]) return false; // 异格
        const cool =
          parseInt(args[2]) > // 如果该boss编号是小boss，跳过
          (numOfMinorBoss[args[0] as keyof typeof numOfMinorBoss] || 99);
        if (!cool || array.includes(stage.name)) return false;
        array.push(stage.name);
        return true;
      },
    },
    {
      id: "6",
      name: "第六层",
      filter: (stage: StageData) => {
        const args = stage.id.split("_");
        if (args[1] !== "n") return false;
        return args[2] === "6" || args[2] === "7"; // 洞天福地是7层
      },
    },
    {
      id: "5",
      name: "第五层",
      filter: (stage: StageData) => {
        const args = stage.id.split("_");
        if (args[1] !== "n") return false;
        return args[2] === "5";
      },
    },
    {
      id: "4",
      name: "第四层",
      filter: (stage: StageData) => {
        const args = stage.id.split("_");
        if (args[1] !== "n") return false;
        return args[2] === "4";
      },
    },
    {
      id: "others",
      name: "特殊关卡",
      filter: (stage: StageData) => {
        const args = stage.id.split("_");
        return ["ev", "t", "duel"].includes(args[1]);
      },
    },
  ];

  return (
    <>
      <div className="flex justify-end font-light mb-4">
        <span className="text-ak-blue font-bold me-4" role="button">
          按关卡
        </span>
        <Tooltip content="开发中，敬请期待">
          <span role="button">按干员</span>
        </Tooltip>
      </div>
      <div className="flex">
        {/* 新增全部筛选器，不参与下方每层的关卡渲染 */}
        {[{ id: "all", name: "全部" }, ...navOfZone].map((zone) => (
          <div
            className={
              "basis-1/6 text-center font-bold leading-[3rem] " +
              `${zoneFilterId === zone.id ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
            }
            key={zone.id}
            role="button"
            onClick={() => {
              searchParams.set("zoneId", zone.id);
              setSearchParams(searchParams, {
                preventScrollReset: true,
              });
            }}
          >
            {zone.name}
          </div>
        ))}
      </div>
      <div className="mb-4">
        <div className="w-1/3 sm:w-1/4 lg:w-1/6 px-4 py-4 text-xs text-wrap">
          注：前3层不做无藏收录，特定干员开局攻略见
          <Link to="/blog" className="text-ak-blue">
            攻略博客
          </Link>
          页
        </div>
      </div>
      <div>
        {/* 根据楼层筛选器，渲染每层的关卡 */}
        {navOfZone
          .filter((zone) => zoneFilterId === "all" || zoneFilterId === zone.id)
          .map((zone) => {
            const renderedStageIds: string[] = [];
            const renderStages = Object.values(stageOfRogue).filter((stage) =>
              zone.filter(stage, renderedStageIds),
            );
            return (
              <div className="flex mb-16" key={zone.id}>
                <div className="w-1/4 lg:w-1/5 xl:w-1/6 pe-2 sm:pe-3 lg:pe-6 xl:pe-8">
                  <StyledZoneName>{zone.name}</StyledZoneName>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 grow">
                  {renderStages.map((stage, i) => {
                    if (stage.id === "ghost")
                      return <StyledStageCard className="" key={"ghost" + i} />;
                    const stagePreviewData = stagePreview?.[stage.id];
                    const maxLevel = ["??", "N18", "N15"].reduce((a, b) =>
                      [
                        stagePreviewData?.normalLevel,
                        stagePreviewData?.eliteLevel,
                        stagePreviewData?.boatLevel,
                      ].includes(b)
                        ? b
                        : a,
                    );
                    return (
                      <StyledStageCard
                        role="button"
                        key={stage.id}
                        onClick={() => navigate(stage.id)}
                      >
                        <div className="h-6 bg-black-gray flex">
                          <div className="w-1/2 flex justify-center">
                            {stagePreviewData?.normalNum && (
                              <>
                                <StyledCardTitleText type="normal">
                                  普通
                                </StyledCardTitleText>
                                <StyledCardTitleNum>
                                  {stagePreviewData.normalNum}
                                </StyledCardTitleNum>
                              </>
                            )}
                          </div>
                          <div className="w-1/2 flex justify-center">
                            {(stagePreviewData?.eliteNum ||
                              stagePreviewData?.boatNum) && (
                              <>
                                <StyledCardTitleText
                                  type={
                                    stagePreviewData.eliteNum ? "elite" : "boss"
                                  }
                                >
                                  {stagePreviewData.eliteNum ? "紧急" : "带船"}
                                </StyledCardTitleText>
                                <StyledCardTitleNum>
                                  {stagePreviewData.eliteNum ||
                                    stagePreviewData.boatNum}
                                </StyledCardTitleNum>
                              </>
                            )}
                          </div>
                        </div>
                        <StyledCardBody>
                          <StyledDifficulty>{maxLevel}</StyledDifficulty>
                          <StyledStageName className="ps-2 sm:ps-3 lg:ps-4">
                            {stage.name}
                          </StyledStageName>
                        </StyledCardBody>
                      </StyledStageCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
