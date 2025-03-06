import { useState } from "react";
import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { StyledDivider, StyledStageTitleNum } from ".";
import { SortIcon } from "~/components/Icons";

export type SortByType = 'ranking' | 'date';

export default function TournamentRanking({
  tournamentData,
}: {
  tournamentData: TournamentData,
}) {
  const players = tournamentData.players;
  if (!players?.length) return <div>暂无排名</div>;

  const [sortBy, setSortBy] = useState<SortByType[]>(new Array(tournamentData.stages.length).fill('ranking'));
  const [rankingAscending, setRankingAscending] = useState<boolean[]>(new Array(tournamentData.stages.length).fill(true));
  const [dateAscending, setDateAscending] = useState<boolean[]>(new Array(tournamentData.stages.length).fill(false));

  const handleSort = (type: SortByType, index: number) => {
    setSortBy(prev =>
      prev.map((value, i) => i === index ? type : value)
    );
    setRankingAscending(prev =>
      prev.map((value, i) => type === 'ranking' ? i === index ? !value : value : false)
    );
    setDateAscending(prev =>
      prev.map((value, i) => type === 'date' ? i === index ? !value : value : false)
    );
  }

  return tournamentData.stages?.map((stage, index) => {
    const schedule = new Map<string, TournamentGame>();
    let showSession = false;
    players.forEach((player) => {
      const game = player.games.find((game) => game.stage === stage.name);
      if (game) {
        schedule.set(player.id, game);
        if (game.session) {
          showSession = true;
        }
      }
    });

    const isFinal = index === tournamentData.stages.length - 1;
    const uniqlePlayersCount = schedule.size;

    let uniqlePlayersNextStageCount = 0;
    if (!isFinal) {
      const nextStage = tournamentData.stages[index + 1];
      const rankingNextStage = players.filter((player) => player.games.find((game) => game.stage === nextStage.name));
      if (rankingNextStage) {
        uniqlePlayersNextStageCount = rankingNextStage.length;
      }
    }
    const ranking = Array.from(schedule).sort((a, b) =>
      rankingAscending[index]
        ? a[1].rank && b[1].rank ? a[1].rank - b[1].rank : (b[1].point ?? 0) - (a[1].point ?? 0)
        : a[1].rank && b[1].rank ? b[1].rank - a[1].rank : (a[1].point ?? 0) - (b[1].point ?? 0)
    );
    const topTiers = rankingAscending[index]
      ? ranking.map((entry) => entry[0]).slice(0, isFinal ? 3 : uniqlePlayersNextStageCount)
      : ranking.map((entry) => entry[0]).slice(isFinal ? ranking.length - 3 : ranking.length - uniqlePlayersNextStageCount);
    const sortByDateRanking = Array.from(schedule).sort((a, b) =>
      dateAscending[index] ? a[1].date - b[1].date : b[1].date - a[1].date
    )
    const sortedRanking = sortBy[index] === 'ranking' ? ranking : sortByDateRanking

    return (
      <div key={index} className="mb-4">
        <div className="h-8 bg-dark-gray mb-4 inline-flex gap-3 px-4">
          <div className="font-medium text-xl pt-[2px]">{stage.name}</div>
          <StyledStageTitleNum className={`${isFinal ? "text-ak-red" : "text-ak-blue"}`}>{uniqlePlayersCount}</StyledStageTitleNum>
          {!isFinal && <>
            <div className="font-medium text-xl pt-[2px]"> 进 </div>
            <StyledStageTitleNum className="text-ak-red">{uniqlePlayersNextStageCount}</StyledStageTitleNum>
          </>}
        </div>
        <table className="w-full border-collapse table-auto">
          <thead className="bg-black-gray">
            <tr>
              {/* TODO: add sorting order for ranking */}
              <td className="p-4 flex items-center w-max">排名
                <SortIcon
                  order={sortBy[index] === 'ranking' ? rankingAscending[index] ? 'asc' : 'desc' : 'null'}
                  role="button"
                  onClick={() => handleSort('ranking', index)}
                />
              </td>
              <td>选手ID</td>
              {/* TODO: add filter for session */}
              {showSession && <td>场地</td>}
              {/* TODO: add sorting order for date */}
              <td className="flex items-center w-max">日程
                <SortIcon
                  order={sortBy[index] === 'date' ? dateAscending[index] ? 'asc' : 'desc' : 'null'}
                  role="button"
                  onClick={() => handleSort('date', index)}
                />
              </td>
              <td>分队</td>
              <td className="hidden md:table-cell">结局</td>
              <td>分数</td>
            </tr>
          </thead>
          <tbody className="border-collapse">
            {sortedRanking.map((entry, rankIndex) => {
              const player = tournamentData.players?.find((player) => player.id === entry[0]);
              return (
                // TODO: using a hardcoded hex color for top tiers, replace with the correct color
                <tr
                  key={rankIndex}
                  className={
                    `border-y-1 ${topTiers.indexOf(entry[0]) !== -1 ? "bg-[#1c272c] border-[#0073A4CC]" : "bg-black-gray-70 border-mid-gray"}
                    ${(rankIndex !== sortedRanking.length - 1 && topTiers.indexOf(sortedRanking[rankIndex+1][0]) !== -1) ? "border-b-[#0073A4CC]" : ""}
                    ${(rankIndex !== 0 && topTiers.indexOf(sortedRanking[rankIndex-1][0]) !== -1) ? "border-t-[#0073A4CC]" : ""}`
                  }
                >
                  <td className={`w-16 p-4 text-bold text-center ${topTiers.indexOf(entry[0]) !== -1 && "text-ak-blue"}`}>{entry[1].rank}</td>
                  <td>{player?.name}</td>
                  {showSession && <td>{entry[1].session}</td>}
                  <td>{entry[1].schedule}</td>
                  <td>
                    <span className="hidden md:block">{entry[1].starterSquad}</span>
                    <span className="block md:hidden">
                      <img
                        src={`/images/squad/${entry[1].starterSquad}.png`}
                        alt="squad"
                        className="h-10 aspect-square object-contain"
                      />
                    </span>
                  </td>
                  <td className="hidden md:table-cell">{entry[1].ending}</td>
                  <td>{entry[1].point}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <StyledDivider className={`${isFinal && "hidden"}`} />
      </div>
    )
  })
}