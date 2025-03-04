import { useEffect, useState } from "react";
import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { styled } from "styled-components";
import { ArrowLeftIcon, ArrowRightIcon } from "~/components/Icons";
import { generateDateArray } from ".";

const StyledNav = styled.nav`
  position: relative;

  &:not(:last-child)::after {
    width: 100%;
    content: '';
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
  tournamentData: TournamentData,
  renderPlayer: (playerId: string, column?: boolean) => React.ReactNode
}) {
  const players = tournamentData.players;
  if (!players) return <div>暂无比赛进程</div>;

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const currentStage = tournamentData.stages[currentStageIndex];
  const dates = generateDateArray(currentStage.startTime, currentStage.endTime);
  const schedule = new Map<string, TournamentGame>();
  const sessions = new Set<string>();

  players.forEach((player) => {
    const game = player.games.find(
      (game) =>
        game.stage === currentStage.name &&
        new Date(game.date).toDateString() === new Date(dates[activeIndex]).toDateString()
    );

    if (game) {
      game.session && sessions.add(game.session);
      schedule.set(player.id, game);
    }
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [currentStageIndex]);

  const renderScheduleUnit = (session?: string) => {
    const sortedSchedule = Array.from(schedule.entries())
      .sort((a, b) => a[1].date - b[1].date)
      .filter((entry) => session ? entry[1].session === session : entry);

    if (sortedSchedule.length === 0) {
      return <td className="text-center p-2 text-xl">暂无赛事</td>
    }

    return <>
      {sortedSchedule.map((entry, index) => (
        <td key={index} className="flex justify-between items-center text-white px-8 py-6">
          {renderPlayer(entry[0])}
          <div className="text-center">{new Date(entry[1].date).toLocaleTimeString('zh-CN').slice(0, -3)}</div>
        </td>
      ))}
    </>
  }

  const renderSchedule = () => {
    return <>
      {!!sessions.size
        ? Array.from(sessions).map((session, index) => (
          <tr key={index} className="sm:table-cell bg-black-gray-70 align-top">
            <td
              key={index}
              className="flex justify-center border-mid-gray border-b-1 bg-black-gray text-light-gray py-4">
                {session}
            </td>
            {renderScheduleUnit(session)}
          </tr>
        ))
        : <tr className="sm:table-cell bg-black-gray-70 align-top">
            {renderScheduleUnit()}
          </tr>
      }
    </>
  }

  return (
    <>
      <div className="relative">
        {currentStageIndex > 0 &&
          <ArrowLeftIcon className="w-4 h-4 text-ak-blue absolute -top-6 sm:top-2 left-0 sm:-left-6" role="button" onClick={() => setCurrentStageIndex(currentStageIndex - 1)} />
        }
        <div className="bg-black-gray flex hide-scroll overflow-scroll mb-4 mt-8 sm:mt-4 gap-[1px]">
          {dates.map((date, index) => {
            return (
              <StyledNav
                key={index}
                className={
                  "flex justify-center gap-2 p-1 flex-wrap " +
                  `${activeIndex === index && "bg-ak-blue"}`
                }
                role="button"
                onClick={() => setActiveIndex(index)}
                style={{ minWidth: `calc(${100 / Math.min(dates.length, 6)}% - 1px)` }}
              >
                <div className={`font-bold ${activeIndex === index ? "text-black" : "text-white"}`}>Day{index+1}</div>
                <div className={`${activeIndex === index ? "text-black" : "text-light-mid-gray"}`}>{`${date.getMonth()+1}月${date.getDate()}日`}</div>
              </StyledNav>
            )
          })}
        </div>
        {currentStageIndex < tournamentData.stages.length - 1 &&
          <ArrowRightIcon className="w-4 h-4 text-ak-blue absolute -top-6 sm:top-2 right-0 sm:-right-6" role="button" onClick={() => setCurrentStageIndex(currentStageIndex + 1)} />
        }
      </div>
      <table className="w-full border-collapse table-fixed">
        <tbody className="max-sm:divide-y sm:divide-x divide-mid-gray">
          {renderSchedule()}
        </tbody>
      </table>
    </>
  )
}
