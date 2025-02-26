import { StageTypes } from "~/types/constant";
import type { RecordType } from "~/types/recordType";
import { Divider } from "@heroui/react";
import { _post, findDuplicates } from "~/utils/tools";
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { styled } from "styled-components";
import RecordTypeLabel from "~/components/RecordCard/RecordTypeLabel";
import CharAvatar from "~/components/RecordCard/CharAvatar";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useRecordStore } from "~/stores/recordStore";
import { openModal } from "~/utils/dom";
import type { RogueKey, StageData } from "~/types/gameData";
import { useGameDataStore } from "~/stores/gameDataStore";
import { toast } from "react-toastify";
import type { FavoriteItem } from "~/types/userInfo";
import ModalTemplate from "~/components/Modal";
import { useAppDataStore } from "~/stores/appDataStore";
import { DeleteIcon, ReportIcon, StarIcon } from "../Icons";

const StyledCardContainer = styled.div`
  width: 100%;
  height: 9rem;
  @media (min-width: 640px) {
    height: 12rem;
  }
  @media (min-width: 1024px) {
    height: 20rem;
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

const StyledLeftTopDecoration = styled(StyledBasic)<{ ro: string }>`
  background-image: url(${(props) =>
    "/images/card/" + props.ro + "_deco_l.png"});
`;

const StyledRightBottomDecoration = styled(StyledBasic)<{ ro: string }>`
  left: initial;
  right: 0;
  background-image: url(${(props) =>
    "/images/card/" + props.ro + "_deco_r.png"});
  background-position: right;
`;

const StyledLogo = styled(StyledBasic)<{ ro: string }>`
  background-image: url(${(props) => "/images/card/" + props.ro + "_logo.png"});
  background-size: auto 40%;
`;

const StyledDotLayer = styled(StyledBasic)`
  background-image: url(/images/card/dots.png);
  background-repeat: repeat-x;
`;

const StyledChar = styled(StyledBasic)<{ url: string }>`
  background-image: url(${(props) => props.url});
  background-size: contain;
  background-position: 30% 100%;
`;

const StyledLeftInfo = styled(StyledBasic)`
  display: flex;
  flex-direction: column;
  justify-content: end;
  z-index: 1;
  height: 100%;
  padding: 0 0 0.5rem 0.5rem;
  @media (min-width: 640px) {
    padding: 0 0 1rem 1rem;
  }
  @media (min-width: 1024px) {
    padding: 0 0 1.5rem 1.5rem;
  }
  @media (min-width: 1280px) {
    padding: 0 0 2rem 2rem;
  }
`;

const StyledRightTeam = styled(StyledBasic)`
  width: 60%;
  height: unset;
  left: unset;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
`;

const StyledCornerMark = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 50%,
    var(--ak-red) 50%
  );
  & > span {
    position: absolute;
    top: 0;
    font-family: "Novecento", sans-serif;
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
  }

  const starred =
    record?._id && userInfo?.favorite?.find((item) => item._id === record._id);
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

  const availableBg = findDuplicates([
    ...record.team.map((memberData) => memberData.charId),
    ...(charImages || []),
  ]);
  const charId = availableBg.length
    ? availableBg[Math.floor(availableBg.length * Math.random())]
    : "char_1035_wisdel";
  const bgChar = `${import.meta.env.VITE_API_BASE_URL}/images/char/${charId}.png`;

  return (
    <div className="mb-4">
      {stageData && (
        <div className="mb-2 flex">
          <div className="bg-black-gray px-4 text-lg font-bold font-han-sans">
            <span>{`${record.team.length}人-${StageTypes[record.type]}-`}</span>
            <span className="text-ak-blue">{stageData.name}</span>
          </div>
        </div>
      )}
      {isStagePage && (
        <div className="my-3 font-bold">
          <div className="bg-dark-gray inline-block px-4 pe-12 relative">
            <span className="text-lg me-4">{StageTypes[record.type]}</span>
            <span
              className={
                "text-[2.5rem] absolute left-16 top-1/2 -translate-y-1/2 " +
                (record.type === "normal"
                  ? "text-ak-blue"
                  : record.type === "challenge"
                    ? "text-ak-red"
                    : "text-ak-purple")
              }
            >
              {record.team.length}
            </span>
          </div>
        </div>
      )}
      <StyledCardContainer>
        <StyledRightBottomDecoration ro={ro} />
        <StyledDotLayer />
        <StyledLeftTopDecoration ro={ro} />
        <StyledLogo ro={ro} />
        <StyledChar url={bgChar} />
        <StyledCornerMark className="size-10 sm:size-14 lg:size-16">
          <span className="right-1 sm:right-2 text-lg sm:text-xl lg:text-2xl xl:text-3xl">
            {record.level.replace("N", "")}
          </span>
        </StyledCornerMark>
        <StyledLeftInfo>
          <div className="font-han-serif">
            <span className="text-[2rem] sm:text-[3rem] lg:text-[5rem] xl:text-[7rem] me-4">
              {record.team.length + "人"}
            </span>
            <RecordTypeLabel type={record.type} />
          </div>
          <Divider className="mb-4 bg-white w-1/3" style={{ height: "1px" }} />
          <div className="flex items-center text-[8px] sm:text-[12px] lg:text-[16px]">
            <a
              href={record.raiderLink}
              className="mb-2 flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={record.raiderImage}
                alt="raiderImage"
                style={{ borderRadius: "50%" }}
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 me-2"
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
          <div className="font-light whitespace-pre-wrap text-[8px] sm:text-[12px] lg:text-[16px] hidden sm:block">
            {record.note}
          </div>
        </StyledLeftInfo>
        <StyledRightTeam className="right-2 sm:right-4 lg:right-6 xl:right-8">
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
          <div className="hidden sm:flex justify-end h-4 sm:h-5 lg:h-7 xl:h-8 mt-2">
            <div className="flex justify-evenly w-12 sm:w-16 lg:w-20 xl:w-24 bg-default-50 content-center flex-wrap">
              <StarIcon
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
                <DeleteIcon
                  className="hover:text-yellow-300"
                  role="button"
                  onClick={handleDeleteRecord}
                />
              )}
            </div>
            <div className="w-[3.5rem] sm:w-[5rem] lg:w-[6rem] xl:w-[7rem] bg-ak-deep-blue flex justify-center content-center flex-wrap">
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-han-serif text-[10px] sm:text-[12px] lg:text-[14px] xl:text-[16px]"
              >
                跳转原址
              </a>
            </div>
          </div>
        </StyledRightTeam>
      </StyledCardContainer>
      {showNote && (
        <div className="mt-2 whitespace-pre-wrap p-2 bg-semi-black text-sm">
          {record.note}
        </div>
      )}
      <div className="flex sm:hidden mt-2 bg-semi-black py-2">
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
            className={
              starred
                ? "text-yellow-300 w-4 h-4"
                : "hover:text-yellow-300 w-4 h-4"
            }
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
            <DeleteIcon
              className="hover:text-yellow-300 w-4 h-4"
              role="button"
              onClick={handleDeleteRecord}
            />
          )}
        </div>
        <div className="w-1/3 flex items-center justify-center">
          <a
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-han-serif text-sm"
          >
            <button>跳转原址</button>
          </a>
        </div>
      </div>
    </div>
  );
}
