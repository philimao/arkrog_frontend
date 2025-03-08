import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { generateDateArray, StyledDivider, StyledStageTitleNum } from ".";
import React from "react";

export default function TournamentSchedule({
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
