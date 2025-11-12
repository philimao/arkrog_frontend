import { StageTypes } from "~/types/constant";
import type { RecordType, TeamMemberData } from "~/types/recordType";
import { Divider } from "@heroui/react";
import { _post, findDuplicates } from "~/utils/tools";
import React, { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { styled } from "styled-components";
import RecordTypeLabel from "~/components/RecordCard/RecordTypeLabel";
import CharAvatar from "~/components/RecordCard/CharAvatar";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useRecordStore } from "~/stores/recordStore";
import { openModal } from "~/utils/dom";
import type { CharId, RogueKey, SkillId, StageData } from "~/types/gameData";
import { useGameDataStore } from "~/stores/gameDataStore";
import { toast } from "react-toastify";
import type { FavoriteItem } from "~/types/userInfo";
import ModalTemplate from "~/components/Modal";
import { useAppDataStore } from "~/stores/appDataStore";
import { DeleteIcon, ReportIcon, StarIcon } from "../Icons";
import { useRelicFreeStore } from "~/stores/relicFreeStore";

const StyledCardContainer = styled.div`
  width: 100%;
  height: 14rem;
  @media (min-width: 640px) {
    height: 16rem;
  }
  @media (min-width: 768px) {
    height: 18rem;
  }
  @media (min-width: 992px) {
    height: 20rem;
  }
  @media (min-width: 1024px) {
    height: 22rem;
  }
  @media (min-width: 1280px) {
    height: 24rem;
  }
  position: relative;
  overflow: hidden;
  background: var(--mid-gray);
  box-shadow: 4px 4px 6px 0 rgba(0, 0, 0, 0.25);
`;

const StyledBasic = styled.div`
  position: absolute;
  background-size: auto 100%;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
  top: 0;
`;

const StyledLeftTopDecoration = styled(StyledBasic)<{ $ro: string }>`
  background-image: url(${(props) => "/images/card/" + props.$ro + "_deco_l.png"});
`;

const StyledRightBottomDecoration = styled(StyledBasic)<{ $ro: string }>`
  left: initial;
  right: 0;
  background-image: url(${(props) => "/images/card/" + props.$ro + "_deco_r.png"});
  background-position: right;
`;

const StyledLogo = styled(StyledBasic)<{ $ro: string }>`
  background-image: url(${(props) => "/images/card/" + props.$ro + "_logo.png"});
  background-size: auto 40%;
`;

const StyledDotLayer = styled(StyledBasic)`
  background-image: url(/images/card/dots.png);
  background-repeat: repeat-x;
`;

const StyledChar = styled(StyledBasic)<{ $url: string }>`
  background-image: url(${(props) => props.$url});
  background-size: auto 100%;
  background-position: 30% 100%;
`;

const StyledLeftInfo = styled(StyledBasic)`
  display: flex;
  flex-direction: column;
  justify-content: end;
  z-index: 1;
  height: 100%;
  padding: 0 0 1rem 1.25rem;
  @media (min-width: 640px) {
    padding: 0 0 1.5rem 1.5rem;
  }
  @media (min-width: 1280px) {
    padding: 0 0 2rem 2rem;
  }
`;

const StyledRightTeam = styled(StyledBasic)`
  max-width: calc(100% - 12rem);
  max-height: 90%;
  left: unset;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StyledTeamContainer = styled.div<{ $singleRow: boolean; $isSmallScreen: boolean }>`
  height: ${({ $singleRow, $isSmallScreen }) =>
    $singleRow
      ? $isSmallScreen
        ? "100%"
        : "calc(100% - 4rem)"
      : $isSmallScreen
        ? "calc(50% - 0.5rem)"
        : "calc(50% - 2rem)"};
  display: flex;
  gap: ${({ $singleRow }) => ($singleRow ? "0.5rem" : "0.25rem")};
  justify-content: end;
  align-content: start;
`;

const StyledCardActions = styled.div`
  justify-content: end;
  align-items: center;
  height: 2.5rem;
  flex-shrink: 0;
`;

const StyledCornerMark = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0) 50%, var(--ak-dark-red) 50%);
  & > span {
    position: absolute;
    top: 0;
    font-family: "Novecento", sans-serif;
  }
`;

// 纵向排列干员头像，将横向序数映射到纵向序数
const bustOrderMapping = (i: number) => {
  if (i === 0) return -1;
  if (i >= 1 && i <= 6) return 2 * i - 1;
  if (i === 7) return 0;
  return 2 * (i - 7);
};

export default function RecordCard({
  isStagePage,
  record,
  setRecords,
}: {
  isStagePage?: boolean;
  record?: RecordType;
  setRecords?: Dispatch<SetStateAction<RecordType[]>>;
}) {
  const { userInfo, updateUserInfo } = useUserInfoStore();
  const { setActiveRecord } = useRecordStore();
  const { stages } = useGameDataStore();
  const { fetchStagePreview } = useRelicFreeStore();
  const { charImages } = useAppDataStore();
  const [stageData, setStageData] = useState<StageData | undefined>();
  const [showNote, setShowNote] = useState<boolean>(false);

  const ro = "rogue_" + record?.stageId.split("_")[0].slice(-1);

  async function handleDeleteRecord() {
    if (!record) return;
    if (!window.confirm("是否确定删除")) return;
    await _post("/record/delete", { _id: record._id });
    setRecords?.((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((r) => r._id === record._id);
      updated.splice(index, 1);
      return updated;
    });
    setTimeout(() => {
      fetchStagePreview(true);
    }, 2000);
  }

  const starred = record?._id && userInfo?.favorite?.find((item) => item._id === record._id);
  async function handleStarRecord() {
    if (!record?._id) return;
    try {
      const favorite = await _post<FavoriteItem[]>("/user/favorite", {
        operate: starred ? "remove" : "add",
        item: { _id: record._id, type: "record" },
      });
      updateUserInfo({ favorite });
    } catch (error) {
      toast.warning((error as Error).message);
    }
  }

  useEffect(() => {
    if (isStagePage || !stages || !record) return;
    // ro4_b_4
    const topicId = "rogue_" + record.stageId.split("_")[0].slice(-1);
    const stageData = stages[topicId as RogueKey]?.[record.stageId];
    if (stageData) setStageData(stageData);
  }, [isStagePage]);

  if (!record) {
    return <div className="w-full h-72 mb-4 p-8 last-of-type:mb-0 bg-[#181818CC]"></div>;
  }

  // 从后端返回的可用立绘中进行选择，默认维什戴尔
  const availableBg = findDuplicates([...record.team.map((memberData) => memberData.charId), ...(charImages || [])]);
  const charId = availableBg.length ? availableBg[Math.floor(availableBg.length * Math.random())] : "char_1035_wisdel";
  const bgChar = `${import.meta.env.VITE_API_BASE_URL}/images/char/${charId}.png`;

  // 使用单行干员展示
  const isLargeScreen = window.matchMedia("(min-width: 1024px)").matches;
  const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;
  // 是否单行展示，要求队伍长度小于一定值
  const [singleRow, setSingleRow] = useState(
    isLargeScreen || isSmallScreen ? record.team.length <= 4 : record.team.length <= 5,
  );
  // 双行展示时，需要补全的干员数量
  const [doubleRowPatchNum, setDoubleRowPatchNum] = useState(isLargeScreen || isSmallScreen ? 5 : 7);

  useEffect(() => {
    const handler = () => {
      // 如果大屏幕或小屏幕，卡片长度不足
      if (window.matchMedia("(min-width: 1024px)").matches || window.matchMedia("(max-width: 640px)").matches) {
        setSingleRow(record.team.length <= 4);
        setDoubleRowPatchNum(5);
      } else {
        setSingleRow(record.team.length <= 5);
        setDoubleRowPatchNum(7);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="mb-4">
      {stageData && (
        <div className="mb-2 flex">
          <div className="bg-[#181818CC] px-4 text-lg font-bold font-han-sans">
            <span>{`${record.team.length}人-${StageTypes[record.type]}-`}</span>
            <span className="text-ak-blue">{stageData.name}</span>
          </div>
        </div>
      )}

      <StyledCardContainer>
        {/* 右下装饰 */}
        <StyledRightBottomDecoration className="right-bottom-decoration" $ro={ro} />
        {/* 点层 */}
        <StyledDotLayer className="dot-layer" />
        {/* 左上装饰 */}
        <StyledLeftTopDecoration className="left-top-decoration" $ro={ro} />
        {/* 主题logo */}
        <StyledLogo className="logo" $ro={ro} />
        {/* 背景立绘 */}
        <StyledChar className="char-image" $url={bgChar} />
        {/* 难度角标 */}
        <StyledCornerMark className="difficulty-mark size-10 sm:size-14 lg:size-16">
          <span className="right-1 sm:right-2 text-lg sm:text-xl lg:text-2xl xl:text-3xl">
            {record.level.replace("N", "")}
          </span>
        </StyledCornerMark>
        {/* 左侧信息区 */}
        <StyledLeftInfo className="left-info">
          <div>
            <span className="font-han-serif text-[3rem] md:text-[4rem] lg:text-[5rem] xl:text-[7rem] me-0 md:me-2 xl:me-4">
              {record.team.length + "人"}
            </span>
            <RecordTypeLabel className="font-han-sans" type={record.type} />
          </div>
          <Divider className="mb-4 bg-white w-36" style={{ height: "1px" }} />
          <div className="flex items-center text-[10px] sm:text-[12px] lg:text-[16px]">
            <a href={record.raiderLink} className="mb-2 flex" target="_blank" rel="noopener noreferrer">
              <img
                src={record.raiderImage}
                alt="raiderImage"
                style={{ borderRadius: "50%" }}
                className="size-8 md:size-10 lg:size-12 me-2"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <div className="flex flex-wrap content-center">
                <div>
                  <div>{record.raider}</div>
                  <div className="text-ak-blue">{new Date(record.date_published).toLocaleDateString("zh-CN")}</div>
                </div>
              </div>
            </a>
          </div>
          <div className="font-light whitespace-pre-wrap text-[8px] sm:text-[12px] lg:text-[16px] hidden sm:block">
            {record.note}
          </div>
        </StyledLeftInfo>
        {/* 右侧信息区 */}
        <StyledRightTeam className="right-info right-2 sm:right-4 lg:right-6 xl:right-8">
          {/* 队伍信息 */}
          {singleRow ? (
            <StyledTeamContainer className="team-info" $singleRow={singleRow} $isSmallScreen={isSmallScreen}>
              {Array(Math.max(3, record.team.length))
                .fill(0)
                .map((_, i) => (
                  <CharAvatar key={"member" + i} memberData={record.team[i]} isBust={true} className="flex" />
                ))}
            </StyledTeamContainer>
          ) : (
            <>
              <StyledTeamContainer className="team-info" $singleRow={singleRow} $isSmallScreen={isSmallScreen}>
                {Array(Math.max((record.team.length + 1) / 2, doubleRowPatchNum))
                  .fill(0)
                  .map((_, i) => {
                    const memberData = record.team[bustOrderMapping(i)];
                    return (
                      <CharAvatar
                        key={"member" + i}
                        memberData={memberData}
                        isBust={false}
                        className="flex first-of-type:opacity-0"
                      />
                    );
                  })}
              </StyledTeamContainer>
              <StyledTeamContainer className="team-info" $singleRow={singleRow} $isSmallScreen={isSmallScreen}>
                {Array(Math.max((record.team.length + 1) / 2, doubleRowPatchNum))
                  .fill(0)
                  .map((_, i) => {
                    const memberData = record.team[bustOrderMapping(i + 7)];
                    return <CharAvatar key={"member" + i} memberData={memberData} isBust={false} className="flex" />;
                  })}
              </StyledTeamContainer>
            </>
          )}
          {/* 操作按钮 */}
          <StyledCardActions className="card-actions hidden sm:flex">
            <div className="flex justify-evenly w-32 h-full bg-[#181818CC] content-center flex-wrap">
              <StarIcon
                className={starred ? "text-yellow-300" : "hover:text-yellow-300"}
                role="button"
                onClick={() => {
                  if (!userInfo?.level) {
                    return openModal("login");
                  }
                  handleStarRecord();
                }}
              />
              <ReportIcon
                className="hover:text-yellow-300"
                role="button"
                onClick={() => {
                  if (!userInfo?.level) {
                    return openModal("login");
                  }
                  setActiveRecord(record);
                  openModal("report-modal");
                }}
              />
              {userInfo?.level !== undefined && userInfo?.level > 2 && (
                <DeleteIcon className="hover:text-yellow-300" role="button" onClick={handleDeleteRecord} />
              )}
            </div>
            <div className="w-[3.5rem] sm:w-[5rem] lg:w-[6rem] xl:w-[7rem] h-full bg-[#0073A4CC] flex justify-center content-center flex-wrap">
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-han-sans text-[10px] sm:text-[12px] lg:text-[14px] xl:text-[16px]"
              >
                跳转原址
              </a>
            </div>
          </StyledCardActions>
        </StyledRightTeam>
      </StyledCardContainer>
      {showNote && (
        <div className="mt-2 whitespace-pre-wrap p-2 bg-[#181818CC] text-sm">{record.note || "无备注信息"}</div>
      )}
      <div className="flex sm:hidden mt-2 bg-[#181818CC] py-2">
        <div className="w-1/3 flex items-center justify-center text-sm">
          <button
            onClick={() => {
              setShowNote((prev) => !prev);
            }}
          >
            {showNote ? "关闭备注" : "查看备注"}
          </button>
        </div>
        <ModalTemplate triggerId={record._id}>
          <div className="p-4">{record.note}</div>
        </ModalTemplate>
        <div className="w-1/3 flex items-center justify-evenly">
          <StarIcon
            className={starred ? "text-yellow-300 w-4 h-4" : "hover:text-yellow-300 w-4 h-4"}
            role="button"
            onClick={() => {
              if (!userInfo?.level) {
                return openModal("login");
              }
              handleStarRecord();
            }}
          />
          <ReportIcon
            className="hover:text-yellow-300 w-4 h-4"
            role="button"
            onClick={() => {
              if (!userInfo?.level) {
                return openModal("login");
              }
              setActiveRecord(record);
              openModal("report-modal");
            }}
          />
          {userInfo?.level !== undefined && userInfo?.level > 2 && (
            <DeleteIcon className="hover:text-yellow-300 w-4 h-4" role="button" onClick={handleDeleteRecord} />
          )}
        </div>
        <div className="w-1/3 flex items-center justify-center">
          <a href={record.url} target="_blank" rel="noopener noreferrer" className="font-han-sans text-sm">
            <button>跳转原址</button>
          </a>
        </div>
      </div>
    </div>
  );
}
