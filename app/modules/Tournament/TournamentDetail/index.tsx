import { useParams } from "react-router";
import { useGameDataStore } from "~/stores/gameDataStore";
import Loading from "~/components/Loading";
import type { RogueKey } from "~/types/gameData";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { useNavigate } from "react-router";
import { openModal } from "~/utils/dom";
import TournamentInfo from "./TournamentInfo";
import TournamentRanking from "./TournamentRanking";
import TournamentFinalResult from "./TournamentFinalResult";
import { ArrowRightIcon } from "~/components/Icons";
import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { StyledBackButton, StyledBackButtonContainer, StyledDivider, StyledEditButton } from "../components/Shared";

export function SectionContainer({
  title,
  content,
  showArrowButton,
  arrowButtonOnClick,
  navItems,
}: {
  title: string;
  content: React.ReactNode;
  showArrowButton?: boolean;
  arrowButtonOnClick?: () => void;
  navItems?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{title}</div>
          {showArrowButton && (
            <ArrowRightIcon className="w-4 h-4 text-light-gray" role="button" onClick={arrowButtonOnClick} />
          )}
        </div>
        {navItems}
      </div>
      <StyledDivider />
      <div className="whitespace-pre-line text-light-gray">{content}</div>
    </div>
  );
}

export function generateDateArray(startMs: number, endMs: number): Date[] {
  const dates: Date[] = [];
  const startDate = new Date(startMs);
  const endDate = new Date(endMs);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export default function TournamentDetail() {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  const { tournamentsData, fetchTournamentPlayer } = useTournamentDataStore();
  const { topics } = useGameDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const tournamentData = tournamentsData && tournamentsData.find((tournament) => tournament.id === tournamentId);

  useEffect(() => {
    const loadPlayers = async () => {
      if (tournamentId && tournamentData && !tournamentData.players) {
        setIsLoading(true);
        try {
          await fetchTournamentPlayer(tournamentId);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPlayers();
  }, [tournamentsData, tournamentId, fetchTournamentPlayer]);

  if (isLoading || !topics || !tournamentsData) return <Loading />;

  if (!tournamentData) {
    return <div className="text-2xl font-bold">暂未收录此比赛</div>;
  }

  const topicData = topics[tournamentData.rogue as RogueKey];

  const renderHeader = () => {
    return (
      <div className="flex gap-4 my-4">
        <div className="w-full max-w-40">
          <img
            src={tournamentData.avatar}
            className="rounded-xl aspect-square"
            alt="avatar"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>
        <div className="flex flex-col gap-4 pr-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <div className="text-4xl lg:text-6xl font-bold">{tournamentData.name}</div>
            <div className="flex items-center gap-6">
              {tournamentData.ongoing && <div className="bg-ak-dark-red px-2 rounded-sm">进行中</div>}
            </div>
          </div>
          <div className="text-ak-blue">
            {topicData.name + " // " + tournamentData.edition + " // " + tournamentData.level}
          </div>
          {tournamentData.labels && (
            <div className="flex gap-2 flex-wrap">
              {tournamentData.labels.map((label, index) => (
                <div key={index} className="bg-black-gray-70 px-2 rounded-sm">
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
    const player = tournamentData.players?.find((player) => player.mid === playerInfo || player.name === playerInfo);
    return (
      <>
        {player && (
          <div className={`flex items-center ${column ? "flex-col w-20 gap-1" : "gap-3"}`}>
            <div className="w-16 h-16 aspect-square bg-mid-gray flex items-center justify-center">
              {player.face ? (
                <img src={player.face} alt="avatar" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              ) : (
                <p className="text-5xl text-white">{player.name[0]}</p>
              )}
            </div>
            <div className={`text-white ${column ? "text-sm text-center" : ""}`}>{player.name}</div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="relative">
      <StyledBackButtonContainer>
        <div className="relative">
          <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
          <StyledEditButton onClick={() => navigate("edit")}>编辑</StyledEditButton>
        </div>
      </StyledBackButtonContainer>
      {renderHeader()}
      <div className="my-16">
        <SectionContainer
          title="比赛规则"
          content={tournamentData.rule}
          showArrowButton
          arrowButtonOnClick={() => openModal("tournament-rules")}
        />
      </div>

      <div className="my-16 grid sm:grid-cols-3 gap-8">
        <SectionContainer title="主办方" content={tournamentData.organizerName} />
        <SectionContainer title="观赛直播间" content={<Markdown>{tournamentData.room}</Markdown>} />
        <SectionContainer
          title="比赛时间"
          content={tournamentData.stages.map((stage, index) => (
            <div key={index} className="flex flex-wrap">
              <div>{`${stage.name}：`}</div>
              <div>{`${new Date(stage.startTime).getFullYear()}年${new Date(stage.startTime).getMonth() + 1}月${new Date(stage.startTime).getDate()}日~${new Date(stage.endTime).getMonth() + 1}月${new Date(stage.endTime).getDate()}日`}</div>
            </div>
          ))}
        />
      </div>

      <TournamentFinalResult tournamentData={tournamentData} />

      <TournamentInfo tournamentData={tournamentData} renderPlayer={renderPlayer} />

      <TournamentRanking tournamentData={tournamentData} />
    </div>
  );
}
