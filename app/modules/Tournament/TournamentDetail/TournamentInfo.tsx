import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { generateDateArray, SectionContainer, StyledDivider, StyledStageTitleNum } from ".";
import React, { useState } from "react";
import { StarIcon } from "~/components/Icons";
import TournamentProgress from "./TournamentProgress";

export function TournamentSchedule({
  tournamentData,
  renderPlayer,
}: {
  tournamentData: TournamentData;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
}) {
  const players = tournamentData.players;
  if (!players?.length) return <div>暂无赛程</div>;

  const renderScheduleUnit = (
    schedule: Map<string, TournamentGame>,
    date: string,
    session?: string,
    sessionIndex?: number,
  ) => {
    const sortedSchedule = Array.from(schedule.entries())
      .filter((entry) => new Date(entry[1].date).toDateString() === date)
      .sort((a, b) => a[1].date - b[1].date)
      .filter((entry) => (session ? entry[1].session === session : entry));

    return (
      <td key={sessionIndex} className="text-light-gray py-4 align-top">
        <div className="flex gap-6 px-4 flex-wrap">
          {sortedSchedule.map((entry, index) => (
            <span key={index}>{renderPlayer(entry[0], true)}</span>
          ))}
        </div>
      </td>
    );
  };

  return tournamentData.stages?.map((stage, index) => {
    const dates = generateDateArray(stage.startTime, stage.endTime);
    const schedule = new Map<string, TournamentGame>();
    const sessions = new Set<string>();
    players.forEach((player) => {
      const game = player.games.find((game) => game.stage === stage.name);
      if (game) {
        if (game.session) sessions.add(game.session);
        schedule.set(player.mid, game);
      }
    });
    const uniquePlayersCount = schedule.size;
    const isFinal = index === tournamentData.stages.length - 1;

    return (
      <div key={index} className="mb-4">
        <div className="h-8 bg-dark-gray mb-4 inline-flex gap-3 px-4">
          <div className="font-medium text-xl pt-[2px]">{stage.name}</div>
          <StyledStageTitleNum
            className={`${isFinal ? "text-ak-red" : "text-ak-blue"}`}
          >
            {uniquePlayersCount}
          </StyledStageTitleNum>
        </div>
        <table className="w-full border-collapse table-fixed">
          <tbody className="divide-y divide-mid-gray">
            {!!sessions.size && (
              <tr className="bg-black-gray text-center divide-x divide-mid-gray">
                <td className="opacity-0 w-16 sm:w-32">placeholder</td>
                {Array.from(sessions).map((session, index) => (
                  <td key={index} className="text-light-gray py-4">
                    {session}
                  </td>
                ))}
              </tr>
            )}
            {dates.map((date, dateIndex) => (
              <tr
                key={dateIndex}
                className="bg-black-gray-70 divide-x divide-mid-gray "
              >
                <td className="text-center w-16 sm:w-32">
                  <div className={"text-2xl text-white font-medium"}>
                    Day{dateIndex + 1}
                  </div>
                  <div className="text-sm">{`${date.getMonth() + 1}月${date.getDate()}日`}</div>
                </td>
                {sessions.size
                  ? Array.from(sessions)?.map((session, sessionIndex) =>
                      renderScheduleUnit(
                        schedule,
                        date.toDateString(),
                        session,
                        sessionIndex,
                      ),
                    )
                  : renderScheduleUnit(schedule, date.toDateString())}
              </tr>
            ))}
          </tbody>
        </table>
        <StyledDivider className={`${isFinal && "hidden"}`} />
      </div>
    );
  });
}

export function TournamentTeamInfo({
  tournamentData,
  renderPlayer,
}: {
  tournamentData: TournamentData;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
}) {
  return (
    <table className="w-full border-collapse table-auto divide-y divide-mid-gray">
      <thead className="bg-black-gray">
        <tr className="divide-x divide-mid-gray">
          <td className="p-4 text-center">队徽</td>
          <td className="p-4 text-center">队名</td>
          <td className="p-4 text-center">队员</td>
        </tr>
      </thead>
      <tbody className="bg-black-gray-70 border-collapse divide-y divide-mid-gray">
        {tournamentData.teams?.map((team, index) => (
          <tr key={index} className="divide-x divide-mid-gray">
            <td>
              <div className="flex items-center justify-center">
                <img
                  src={team.avatar}
                  alt="team avatar"
                  className="h-10 aspect-square object-contain"
                />
              </div>
            </td>
            <td>
              <div className="p-4 flex flex-col">
                <p className="text-white text-xl">{team.name}</p>
                <p className="text-xs">{team.id}</p>
              </div>
            </td>
            <td>
              <div className="p-4 flex gap-x-12 gap-y-4 justify-center flex-wrap">
                {team.members.map((member, index) =>
                  <div className="relative" key={index}>
                    {team.keyMember === member && <StarIcon className="text-ak-blue absolute -left-6 top-6" width="1rem" />}
                    {renderPlayer(member, true)}
                  </div>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function TournamentInfoWrapper({
  tournamentData,
  renderPlayer,
}: {
  tournamentData: TournamentData;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
}) {
  const [navItem, setNavItem] = useState(0);

  return (
    <div className="my-16">
      <SectionContainer
        title="赛程信息"
        content={
          navItem === 0
          ? tournamentData.type === 'team'
            ? <TournamentTeamInfo
                tournamentData={tournamentData}
                renderPlayer={renderPlayer}
              />
            : <TournamentSchedule
                tournamentData={tournamentData}
                renderPlayer={renderPlayer}
              />
          : <TournamentProgress
              tournamentData={tournamentData}
              renderPlayer={renderPlayer}
            />
        }
        navItems={
          <div className="flex gap-4">
            {([tournamentData.type === 'team' ? '参赛队伍' : '参赛选手', '比赛进程'] as const).map((item, index) => (
              <button
                key={item}
                className={`${navItem === index ? 'text-ak-blue' : 'text-light-gray'}`}
                onClick={() => setNavItem(index)}
              >
                {item}
              </button>
            ))}
          </div>
        }
      />
    </div>
  )
}
