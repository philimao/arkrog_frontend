import React, { useEffect, useState } from "react";
import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { styled } from "styled-components";
import { ArrowLeftIcon, ArrowRightIcon } from "~/components/Icons";
import { generateDateArray } from "./index";

const StyledNav = styled.nav`
  position: relative;
  text-align: center;

  &:not(:last-child)::after {
    width: 100%;
    content: "";
    position: absolute;
    right: -1px;
    top: 5px;
    bottom: 5px;
    border-right: 1px solid var(--light-mid-gray);
    pointer-events: none;
    z-index: 1;
  }
`;

export default function TournamentProgress({
  tournamentData,
  renderPlayer,
}: {
  tournamentData: TournamentData;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
}) {
  const players = tournamentData.players;
  if (!players) return <div>暂无比赛进程</div>;

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const isTeam = tournamentData.type === "team";
  const currentStage = tournamentData.stages[currentStageIndex];
  const dates = generateDateArray(currentStage.startTime, currentStage.endTime);
  const schedule = new Map<string, TournamentGame>();
  const sessions = new Set<string>();

  players.forEach((player) => {
    const game = player.games.find(
      (game) =>
        game.stage === currentStage.name &&
        new Date(game.date).toDateString() ===
          new Date(dates[activeIndex]).toDateString(),
    );

    if (game) {
      if (game.session) sessions.add(game.session);
      isTeam ? schedule.set(player.name, game) : schedule.set(player.mid, game);
    }
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [currentStageIndex]);

  const renderScheduleIndividual = (session?: string) => {
    const sortedSchedule = Array.from(schedule.entries())
      .sort((a, b) => a[1].date - b[1].date)
      .filter((entry) => (session ? entry[1].session === session : entry));

    if (sortedSchedule.length === 0) {
      return <tbody><tr><td className="text-center p-2 text-xl">暂无赛事</td></tr></tbody>;
    }

    return (
      <tbody className="divide-y divide-mid-gray">
        {sortedSchedule.map((entry, index) => (
          <tr
            key={index}
            className="divide-x divide-mid-gray"
          >
            <td className="hidden md:table-cell p-4 w-[25%]">
              <div className="flex items-center">
                {renderPlayer(entry[0])}
              </div>
            </td>
            <td className="table-cell md:hidden py-4 w-[25%]">
              <div className="flex justify-center items-center">
                {renderPlayer(entry[0], true)}
              </div>
            </td>
            <td className="hidden md:table-cell p-4 w-[15%]">
              <div className="flex flex-col justify-center items-center">
                <p>{entry[1].starterSquad}</p>
              </div>
            </td>
            <td className="table-cell p-4 md:hidden w-[15%]">
              <div className="flex justify-center items-center">
                <img
                  src={`/images/squad/${entry[1].starterSquad}.png`}
                  alt="squad"
                  className="h-10 aspect-square object-contain"
                />
              </div>
            </td>
            <td className="hidden sm:table-cell p-4 w-[30%]">
              <div className="flex justify-center items-center">
                {entry[1].ending}
              </div>
            </td>
            <td className="w-[20%]">
              <div className="flex flex-col justify-center items-center p-2">
                <p className="text-ak-blue text-xl">{entry[1].point}</p>
              </div>
            </td>
            <td className="w-[10%]">
              <div className="flex justify-center items-center p-2">
                {new Date(entry[1].date).toLocaleTimeString("zh-CN").slice(0, -3)}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  const renderScheduleTeam = (session?: string) => {
    const sortedSchedule = Array.from(schedule.entries())
      .sort((a, b) => a[1].date - b[1].date)
      .filter((entry) => (session ? entry[1].session === session : entry));

    if (sortedSchedule.length === 0) {
      return <td className="text-center p-2 text-xl">暂无赛事</td>;
    }

    return (
      <tbody className="divide-y divide-mid-gray">
        {sortedSchedule.map((entry, index) => {
          const team = tournamentData.teams?.find(
            (team) => team.name === entry[0],
          )

          return (
            <tr
              key={index}
              className="divide-x divide-mid-gray"
            >
              <td>
                <div className="flex justify-center items-center">
                  <img
                    src={team?.avatar}
                    className="h-16 w-16 aspect-square"
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </div>
              </td>
              <td className="hidden lg:table-cell p-4">
                <div className="flex items-center">
                  {renderPlayer(entry[0])}
                </div>
              </td>
              <td className="table-cell lg:hidden p-4">
                <div className="flex justify-center items-center">
                  {renderPlayer(entry[0], true)}
                </div>
              </td>
              <td className="hidden md:table-cell p-4">
                <div className="flex flex-col justify-center items-center">
                  <p>{entry[1].starterSquad}</p>
                  <p>{entry[1].starterOp}</p>
                </div>
              </td>
              <td className="table-cell p-4 md:hidden">
                <div className="flex justify-center items-center">
                  <img
                    src={`/images/squad/${entry[1].starterSquad}.png`}
                    alt="squad"
                    className="h-10 aspect-square object-contain"
                  />
                </div>
              </td>
              <td className="hidden sm:table-cell p-4 w-20">
                <div className="flex justify-center items-center">
                  {entry[1].strategy}
                </div>
              </td>
              <td className="hidden sm:table-cell p-4">
                <div className="flex justify-center items-center">
                  {entry[1].ending}
                </div>
              </td>
              <td>
                <div className="flex flex-col justify-center items-center p-2">
                  <p>{entry[0] === team?.keyMember ? '创想家' : '讲述者'}</p>
                  <p className="text-ak-blue text-xl">{entry[1].point}</p>
                </div>
              </td>
              <td>
                <div className="flex justify-center items-center p-2">
                  {new Date(entry[1].date).toLocaleTimeString("zh-CN").slice(0, -3)}
                </div>
              </td>
            </tr>
          )}
        )}
      </tbody>
    );
  };

  const renderSchedule = (session?: string, index?: number) => {
    return (
      <table
        key={index}
        className="w-full bg-black-gray-70 align-top divide-y divide-mid-gray"
      >
        <thead>
          <tr>
            <td className="text-center bg-black-gray text-light-gray py-4" colSpan={7}>{currentStage.name}{session}</td>
          </tr>
        </thead>
        {isTeam ? renderScheduleTeam(session) : renderScheduleIndividual(session)}
      </table>
    );
  };

  return (
    <>
      <div className="relative">
        {currentStageIndex > 0 && (
          <ArrowLeftIcon
            className="w-4 h-4 text-ak-blue absolute -top-6 sm:top-2 left-0 sm:-left-6"
            role="button"
            onClick={() => setCurrentStageIndex(currentStageIndex - 1)}
          />
        )}
        <div className="bg-black-gray flex hide-scroll overflow-scroll mb-4 mt-8 sm:mt-4 gap-[1px]">
          {dates.map((date, index) => {
            return (
              <StyledNav
                key={index}
                className={
                  "flex justify-center items-center gap-x-2 p-1 flex-wrap " +
                  `${activeIndex === index && "bg-ak-blue"}`
                }
                role="button"
                onClick={() => setActiveIndex(index)}
                style={{
                  minWidth: `calc(${Math.max(100 / dates.length, 18)}% - 1px)`,
                }}
              >
                <div
                  className={`font-bold ${activeIndex === index ? "text-black" : "text-white"}`}
                >
                  Day{index + 1}
                </div>
                <div
                  className={`${activeIndex === index ? "text-black" : "text-light-mid-gray"}`}
                >{`${date.getMonth() + 1}月${date.getDate()}日`}</div>
              </StyledNav>
            );
          })}
        </div>
        {currentStageIndex < tournamentData.stages.length - 1 && (
          <ArrowRightIcon
            className="w-4 h-4 text-ak-blue absolute -top-6 sm:top-2 right-0 sm:-right-6"
            role="button"
            onClick={() => setCurrentStageIndex(currentStageIndex + 1)}
          />
        )}
      </div>
      <div className="w-full flex flex-col divide-y divide-mid-gray">
        {sessions.size ? (
          Array.from(sessions).map((session, index) => renderSchedule(session, index))
        ) : (
          renderSchedule()
        )}
      </div>
    </>
  );
}
