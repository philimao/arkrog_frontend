import React from "react";
import type { TournamentData } from "~/types/tournamentsData";
import { useGameDataStore } from "~/stores/gameDataStore";
import Loading from "~/components/Loading";
import type { RogueKey } from "~/types/gameData";
import Markdown from "~/components/Markdown";
import TournamentInfo from "./TournamentInfo";
import TournamentRanking from "./TournamentRanking";
import TournamentFinalResult from "./TournamentFinalResult";
import { SectionContainer } from ".";
import BilibiliUser from "~/components/BilibiliUser";
import { openModal } from "~/utils/dom";

export interface TournamentViewProps {
  tournamentData: TournamentData;
  children?: React.ReactNode;
  showPreviewBanner?: boolean;
}

export default function TournamentView({
  tournamentData,
  children,
  showPreviewBanner = false,
}: TournamentViewProps) {
  const { topics } = useGameDataStore();

  if (!topics) return <Loading />;

  const topicData = tournamentData.rogue
    ? topics[tournamentData.rogue as RogueKey]
    : Object.values(topics)[0];

  const renderHeader = () => {
    return (
      <div className="flex gap-4 mb-8 sm:mb-16">
        {tournamentData.avatar && (
          <div className="w-full max-w-40">
            <img
              src={tournamentData.avatar}
              className="rounded-xl aspect-square"
              alt="赛事图标"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          </div>
        )}
        <div className="flex flex-col gap-4 pr-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <div className="text-4xl lg:text-6xl font-bold">
              {tournamentData.name}
            </div>
            {tournamentData.ongoing && (
              <div className="flex items-center gap-6">
                <div className="bg-ak-dark-red px-2 rounded-sm">进行中</div>
              </div>
            )}
          </div>
          <div className="text-ak-blue">
            {topicData.name +
              " // " +
              tournamentData.edition +
              (tournamentData.level ? " // " + tournamentData.level : "")}
          </div>
          {tournamentData.labels && tournamentData.labels.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {tournamentData.labels.map((label, index) => (
                <div
                  key={index}
                  className="bg-black-gray-70 px-2 rounded-sm whitespace-nowrap"
                >
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlayer = (playerInfo: string, column?: boolean) => {
    const player = tournamentData.players?.find(
      (player) => player.mid === playerInfo || player.name === playerInfo,
    );
    return (
      <>
        {player && (
          <div
            className={`flex items-center ${column ? "flex-col w-20 gap-1" : "gap-3"}`}
          >
            <div className="w-16 h-16 aspect-square bg-mid-gray flex items-center justify-center">
              {player.face ? (
                <img
                  src={player.face}
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <p className="text-5xl text-white">{player.name[0]}</p>
              )}
            </div>
            <div
              className={`text-white ${column ? "text-sm text-center" : ""}`}
            >
              {player.name}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="relative">
      {showPreviewBanner && (
        <div className="bg-ak-dark-red py-2 text-xl font-bold mb-6 text-center">
          预览模式
        </div>
      )}
      {children}
      {renderHeader()}
      <div className="mb-16 relative">
        <SectionContainer
          title="比赛规则"
          content={
            tournamentData.rule && (
              <div className="bg-black-gray-70 p-4">
                <Markdown>{tournamentData.rule}</Markdown>
              </div>
            )
          }
        />
        {tournamentData.detailRule && (
          <div
            className="absolute right-0 top-0 h-8 leading-8 text-ak-blue text-sm cursor-pointer"
            onClick={() => openModal("tournament-rules")}
          >
            详细规则
          </div>
        )}
      </div>

      <div className="my-16 grid sm:grid-cols-3 gap-8">
        <SectionContainer
          title="主办方"
          content={
            <div>
              {tournamentData.organizers?.map((organizer, index) => (
                <BilibiliUser
                  key={organizer.mid === '0' ? index : organizer.mid}
                  mid={organizer.mid}
                  name={organizer.name}
                  face={organizer.avatar}
                />
              ))}
            </div>
          }
        />
        {!tournamentData.ongoing && tournamentData.playback ? (
          <SectionContainer
            title="比赛回放"
            content={
              <div className="h-14 p-2 flex items-center rounded-md cursor-pointer hover:bg-mid-gray transition-colors">
                <a
                  className="flex items-center gap-2 text-ak-blue"
                  href={tournamentData.playback}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="24" height="24">
                    <use href="#bilibili-svg" />
                  </svg>
                  点击跳转回放链接
                </a>
              </div>
            }
          />
        ) : (
          <SectionContainer
            title="观赛直播间"
            content={
              <div>
                {tournamentData.rooms?.map((room, index) => (
                  <BilibiliUser
                    key={room.mid}
                    mid={room.mid}
                    name={room.name}
                    face={room.avatar}
                    room_id={room.room_id}
                  />
                ))}
              </div>
            }
          />
        )}
        <SectionContainer
          title="比赛时间"
          content={
            tournamentData.stages && tournamentData.stages.length > 0
              ? tournamentData.stages.map((stage, index) => {
                  const startDate = new Date(stage.startTime);
                  const endDate = new Date(stage.endTime);
                  const isSameYear =
                    startDate.getFullYear() === endDate.getFullYear();

                  const timeRange = isSameYear
                    ? `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日~${endDate.getMonth() + 1}月${endDate.getDate()}日`
                    : `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日~${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日`;

                  return (
                    <div key={index} className="flex flex-wrap">
                      <div>{`${stage.name}：`}</div>
                      <div>{timeRange}</div>
                    </div>
                  );
                })
              : "暂无比赛时间"
          }
        />
      </div>

      <TournamentFinalResult tournamentData={tournamentData} />

      <TournamentInfo
        tournamentData={tournamentData}
        renderPlayer={renderPlayer}
      />

      <TournamentRanking tournamentData={tournamentData} />

      {Svg}
    </div>
  );
}

const Svg = (
  <svg className="hidden">
    <symbol
      id="bilibili-svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M4.977 3.561a1.31 1.31 0 111.818-1.884l2.828 2.728c.08.078.149.163.205.254h4.277a1.32 1.32 0 01.205-.254l2.828-2.728a1.31 1.31 0 011.818 1.884L17.82 4.66h.848A5.333 5.333 0 0124 9.992v7.34a5.333 5.333 0 01-5.333 5.334H5.333A5.333 5.333 0 010 17.333V9.992a5.333 5.333 0 015.333-5.333h.781L4.977 3.56zm.356 3.67a2.667 2.667 0 00-2.666 2.667v7.529a2.667 2.667 0 002.666 2.666h13.334a2.667 2.667 0 002.666-2.666v-7.53a2.667 2.667 0 00-2.666-2.666H5.333zm1.334 5.192a1.333 1.333 0 112.666 0v1.192a1.333 1.333 0 11-2.666 0v-1.192zM16 11.09c-.736 0-1.333.597-1.333 1.333v1.192a1.333 1.333 0 102.666 0v-1.192c0-.736-.597-1.333-1.333-1.333z"
      />
    </symbol>
  </svg>
);
