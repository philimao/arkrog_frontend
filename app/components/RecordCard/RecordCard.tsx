import { StageTypes } from "~/types/constant";
import type { RecordType } from "~/types/recordType";
import { Divider } from "@heroui/react";
import { _post } from "~/utils/tools";
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { styled } from "styled-components";
import RecordTypeLabel from "~/components/RecordCard/RecordTypeLabel";
import CharAvatar from "~/components/RecordCard/CharAvatar";
import { SVGIcon } from "~/components/SVGIcon/SVGIcon";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useRecordStore } from "~/stores/recordStore";
import { openModal } from "~/utils/dom";
import type { RogueKey, StageData } from "~/types/gameData";
import { useGameDataStore } from "~/stores/gameDataStore";
import { toast } from "react-toastify";
import type { FavoriteItem } from "~/types/userInfo";

const StyledCardContainer = styled.div`
  width: 100%;
  height: 24rem;
  position: relative;
  overflow: hidden;
  background: #4e4e4e;
  box-shadow: 4px 4px 6px 0 rgba(0, 0, 0, 0.25);
`;

const StyledBasic = styled.div`
  position: absolute;
  background-size: auto 100%;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
`;

const StyledLeftTopDecoration = styled(StyledBasic)`
  background-image: url("/images/card/rogue_4_deco.png");
`;

const StyledRightBottomDecoration = styled(StyledBasic)`
  background-image: url("/images/card/rogue_4_deco.png");
  transform: rotate(180deg);
`;

const StyledLogo = styled(StyledBasic)`
  background-image: url(/images/card/rogue_4_logo.png);
  background-size: auto 40%;
`;

const StyledDotLayer = styled(StyledBasic)`
  background-image: url(/images/card/dots.png);
  background-repeat: repeat-x;
`;

const StyledChar = styled(StyledBasic)<{ url: string }>`
  background-image: url(${(props) => props.url});
  background-size: auto 300%;
  background-position: 100% 80%;
`;

const StyledLeftInfo = styled(StyledBasic)`
  display: flex;
  flex-direction: column;
  justify-content: end;
  z-index: 1;
  padding: 0 0 2rem 2rem;
`;

const StyledRightTeam = styled(StyledBasic)`
  width: 50%;
  height: unset;
  left: unset;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
`;

const StyledCornerMark = styled.div`
  position: absolute;
  height: 4rem;
  width: 4rem;
  right: 0;
  top: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 50%,
    var(--ak-red) 50%
  );
  & > span {
    position: absolute;
    right: 0.5rem;
    top: 0;
    font-family: "Novecento", sans-serif;
    font-size: 1.8rem;
  }
`;

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
  const [stageData, setStageData] = useState<StageData | undefined>();

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
  }

  const starred =
    record?._id && userInfo?.favorite.find((item) => item._id === record._id);
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
    return (
      <div className="w-full h-72 mb-4 p-8 last-of-type:mb-0 bg-mid-gray"></div>
    );
  }
  return (
    <div className="mb-4">
      {stageData && (
        <div className="mb-2 flex">
          <div className="bg-black-gray px-4 text-lg font-bold">
            <span>{`${record.team.length}人-${StageTypes[record.type]}-`}</span>
            <span className="text-ak-blue">{stageData.name}</span>
          </div>
        </div>
      )}
      {isStagePage && record.type !== "normal" && (
        <div className="my-3 font-bold">
          <div className="bg-dark-gray inline-block px-4 pe-12 relative">
            <span className="text-lg me-4">{StageTypes[record.type]}</span>
            <span
              className={
                "text-[2.5rem] absolute left-16 top-1/2 -translate-y-1/2 " +
                (record.type === "challenge" ? "text-ak-red" : "text-ak-purple")
              }
            >
              {record.team.length}
            </span>
          </div>
        </div>
      )}
      <StyledCardContainer>
        <StyledRightBottomDecoration />
        <StyledDotLayer />
        <StyledLeftTopDecoration />
        <StyledLogo />
        <StyledChar
          url={`${import.meta.env.VITE_API_BASE_URL}/images/char/wsde-1.png`}
        />
        <StyledCornerMark>
          <span>{record.level.replace("N", "")}</span>
        </StyledCornerMark>
        <StyledLeftInfo>
          <div className="">
            <span className="text-[7rem] me-4">
              {record.team.length + "人"}
            </span>
            <RecordTypeLabel type={record.type} />
          </div>
          <Divider className="mb-4 bg-white w-1/3" style={{ height: "1px" }} />
          <div className="flex">
            <a
              href={record.raiderLink}
              className="mb-2 flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={record.raiderImage}
                alt="raiderImage"
                className="w-10 h-10 rounded me-2"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <div className="flex flex-wrap content-center">
                <div>
                  <div>{record.raider}</div>
                  <div className="text-ak-blue">
                    {new Date(record.date_published).toLocaleDateString(
                      "zh-CN",
                    )}
                  </div>
                </div>
              </div>
            </a>
          </div>
          <div className="font-light">{record.note}</div>
        </StyledLeftInfo>
        <StyledRightTeam>
          <div className="flex flex-wrap">
            {Array(14)
              .fill(0)
              .map((_, i) => {
                return (
                  <CharAvatar
                    key={i}
                    memberData={record.team[bustOrderMapping(i)]}
                    className="w-[14.2%] p-1"
                    isBust={false}
                  />
                );
              })}
          </div>
          <div className="flex justify-end h-8 mt-2">
            <div className="flex justify-evenly w-24 bg-default-50 content-center flex-wrap">
              <SVGIcon
                name="star"
                className={
                  starred ? "text-yellow-300" : "hover:text-yellow-300"
                }
                role="button"
                onClick={() => {
                  if (!userInfo?.level) {
                    return openModal("login");
                  }
                  handleStarRecord();
                }}
              />
              <SVGIcon
                name="report"
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
                <SVGIcon
                  name="delete"
                  className="hover:text-yellow-300"
                  role="button"
                  onClick={handleDeleteRecord}
                />
              )}
            </div>
            <div className="w-28 bg-ak-deep-blue flex justify-center content-center flex-wrap">
              <a href={record.url} target="_blank" rel="noopener noreferrer">
                跳转原址
              </a>
            </div>
          </div>
        </StyledRightTeam>
      </StyledCardContainer>
    </div>
  );
}
