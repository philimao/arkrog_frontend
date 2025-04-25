import { useState } from "react";
import type { TournamentData, TournamentGame, TournamentTeamStage } from "~/types/tournamentsData";
import { SectionContainer, StyledDivider, StyledStageTitleNum } from ".";
import { SortIcon, StarIcon } from "~/components/Icons";
import { styled } from "styled-components";

type SortByType = "ranking" | "date";

const StyledTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
`

const StyledIndividualTable = styled.table`
  min-width: 100%;

  td {
    padding: 8px;
  }
`

const StyledTeamTable = styled.table`
  min-width: 100%;

  td {
    padding: 8px;
  }

  .player-name {
    padding-left: 30px;
  }
`
const StyledTeamName = styled.td<{ $isTopTier: boolean, $sortByRanking: boolean }>`
  box-shadow: inset -1px 0px ${(props) => props.$isTopTier ?  "#0073A4CC" : "var(--mid-gray)"};
  position: sticky;
  left: 64px;
  background-color: ${(props) => props.$isTopTier ? "#1c272c" : "#212121"}
`

const StyledFinalPoint = styled.td<{ $isTopTier: boolean }>`
  box-shadow: inset 1px 0px ${(props) => props.$isTopTier ?  "#0073A4CC" : "var(--mid-gray)"};
`

export function TournamentRankingIndividual({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const players = tournamentData.players;
  if (!players?.length) return <div>暂无排名</div>;

  const [sortBy, setSortBy] = useState<SortByType[]>(
    new Array(tournamentData.stages.length).fill("ranking"),
  );
  const [rankingAscending, setRankingAscending] = useState<boolean[]>(
    new Array(tournamentData.stages.length).fill(true),
  );
  const [dateAscending, setDateAscending] = useState<boolean[]>(
    new Array(tournamentData.stages.length).fill(false),
  );

  const handleSort = (type: SortByType, index: number) => {
    setSortBy((prev) => prev.map((value, i) => (i === index ? type : value)));
    setRankingAscending((prev) =>
      prev.map((value, i) =>
        i === index ? type === "ranking" ? !value : false : value
      ),
    );
    setDateAscending((prev) =>
      prev.map((value, i) =>
        i === index ? type === "date" ? !value : false : value
      ),
    );
  };

  return tournamentData.stages?.map((stage, index) => {
    const schedule = new Map<string, TournamentGame>();
    let showSession = false;
    players.forEach((player) => {
      const game = player.games.find((game) => game.stage === stage.name);
      if (game) {
        schedule.set(player.mid, game);
        if (game.session) {
          showSession = true;
        }
      }
    });

    const isFinal = index === tournamentData.stages.length - 1;
    const uniquePlayersCount = schedule.size;

    let uniquePlayersNextStageCount = 0;
    if (!isFinal) {
      const nextStage = tournamentData.stages[index + 1];
      const rankingNextStage = players.filter((player) =>
        player.games.find((game) => game.stage === nextStage.name),
      );
      if (rankingNextStage) {
        uniquePlayersNextStageCount = rankingNextStage.length;
      }
    }
    const ranking = Array.from(schedule).sort((a, b) =>
      rankingAscending[index]
        ? a[1].rank && b[1].rank
          ? a[1].rank - b[1].rank
          : (b[1].point ?? 0) - (a[1].point ?? 0)
        : a[1].rank && b[1].rank
          ? b[1].rank - a[1].rank
          : (a[1].point ?? 0) - (b[1].point ?? 0),
    );
    const topTiers = rankingAscending[index]
      ? ranking
          .map((entry) => entry[0])
          .slice(0, isFinal ? 3 : uniquePlayersNextStageCount)
      : ranking
          .map((entry) => entry[0])
          .slice(
            isFinal
              ? ranking.length - 3
              : ranking.length - uniquePlayersNextStageCount,
          );
    const sortByDateRanking = Array.from(schedule).sort((a, b) =>
      dateAscending[index] ? a[1].date - b[1].date : b[1].date - a[1].date,
    );
    const sortedRanking =
      sortBy[index] === "ranking" ? ranking : sortByDateRanking;

    return (
      <div key={index} className="mb-4">
        <div className="h-8 bg-dark-gray mb-4 inline-flex gap-3 px-4">
          <div className="font-medium text-xl pt-[2px]">{stage.name}</div>
          <StyledStageTitleNum
            className={`${isFinal ? "text-ak-red" : "text-ak-blue"}`}
          >
            {uniquePlayersCount}
          </StyledStageTitleNum>
          {!isFinal && (
            <>
              <p className="font-medium text-xl pt-[2px]"> 进 </p>
              <StyledStageTitleNum className="text-ak-red">
                {uniquePlayersNextStageCount}
              </StyledStageTitleNum>
            </>
          )}
        </div>
        <StyledIndividualTable className="w-full border-collapse table-auto">
          <thead className="bg-black-gray">
            <tr>
              <td>
                <div className="flex items-center w-max">
                  <p>排名</p>
                  <SortIcon
                    order={
                      sortBy[index] === "ranking"
                        ? rankingAscending[index]
                          ? "asc"
                          : "desc"
                        : "null"
                    }
                    role="button"
                    onClick={() => handleSort("ranking", index)}
                  />
                </div>
              </td>
              <td>选手ID</td>
              {/* TODO: add filter for session */}
              {showSession && <td>场地</td>}
              <td>
                <div className="flex items-center w-max">
                  <p>日程</p>
                  <SortIcon
                    order={
                      sortBy[index] === "date"
                        ? dateAscending[index]
                          ? "asc"
                          : "desc"
                        : "null"
                    }
                    role="button"
                    onClick={() => handleSort("date", index)}
                  />
                </div>
              </td>
              <td>分队</td>
              <td className="hidden md:table-cell">结局</td>
              <td>分数</td>
            </tr>
          </thead>
          <tbody className="border-collapse">
            {sortedRanking.map((entry, rankIndex) => {
              const player = tournamentData.players?.find(
                (player) => player.mid === entry[0],
              );
              return (
                // TODO: using a hardcoded hex color for top tiers, replace with the correct color
                <tr
                  key={rankIndex}
                  className={`border-y-1 ${topTiers.indexOf(entry[0]) !== -1 ? "bg-[#1c272c] border-[#0073A4CC]" : "bg-black-gray-70 border-mid-gray"}
                    ${rankIndex !== sortedRanking.length - 1 && topTiers.indexOf(sortedRanking[rankIndex + 1][0]) !== -1 ? "border-b-[#0073A4CC]" : ""}
                    ${rankIndex !== 0 && topTiers.indexOf(sortedRanking[rankIndex - 1][0]) !== -1 ? "border-t-[#0073A4CC]" : ""}`}
                >
                  <td
                    className={`w-4 p-4 text-bold text-center ${topTiers.indexOf(entry[0]) !== -1 && "text-ak-blue"}`}
                  >
                    {entry[1].rank}
                  </td>
                  <td>{player?.name}</td>
                  {showSession && <td>{entry[1].session}</td>}
                  <td>{entry[1].schedule}</td>
                  <td>
                    <span className="hidden md:block">
                      {entry[1].starterSquad}
                    </span>
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
              );
            })}
          </tbody>
        </StyledIndividualTable>
        <StyledDivider className={`${isFinal && "hidden"}`} />
      </div>
    );
  });
}

export function TournamentRankingTeam({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const teams = tournamentData.teams;
  const players = tournamentData.players;

  if (!teams?.length || !players?.length) return <div>暂无排名</div>;

  const [sortBy, setSortBy] = useState<SortByType[]>(
    new Array(tournamentData.stages.length).fill("ranking"),
  );
  const [rankingAscending, setRankingAscending] = useState<boolean[]>(
    new Array(tournamentData.stages.length).fill(true),
  );
  const [dateAscending, setDateAscending] = useState<boolean[]>(
    new Array(tournamentData.stages.length).fill(false),
  );

  const handleSort = (type: SortByType, index: number) => {
    setSortBy((prev) => prev.map((value, i) => (i === index ? type : value)));
    setRankingAscending((prev) =>
      prev.map((value, i) =>
        i === index ? type === "ranking" ? !value : false : value
      ),
    );
    setDateAscending((prev) =>
      prev.map((value, i) =>
        i === index ? type === "date" ? !value : false : value
      ),
    );
  };

  return tournamentData.stages?.map((stage, index) => {
    const playerSchedule = new Map<string, TournamentGame>();
    players.forEach((player) => {
      const game = player.games.find((game) => game.stage === stage.name);
      if (game) {
        playerSchedule.set(player.name, game);
      }
    });

    const teamSchedule = new Map<string, TournamentTeamStage>();
    teams.forEach((team) => {
      const teamStage = team.stages.find((teamStage) => teamStage.name === stage.name)
      if (teamStage) {
        teamSchedule.set(team.name, teamStage);
      }
    });

    const isFinal = index === tournamentData.stages.length - 1;
    const uniqueTeamsCount = teamSchedule.size;

    let uniqueTeamsNextStageCount = 0;
    if (!isFinal) {
      const nextStage = tournamentData.stages[index + 1];
      const rankingNextStage = teams.filter((team) =>
        team.stages.find((teamStage) => teamStage.name === nextStage.name),
      );
      if (rankingNextStage) {
        uniqueTeamsNextStageCount = rankingNextStage.length;
      }
    }

    const ranking = Array.from(teamSchedule).sort((a, b) =>
      rankingAscending[index]
        ? a[1].rank && b[1].rank
          ? a[1].rank - b[1].rank
          : (b[1].point ?? 0) - (a[1].point ?? 0)
        : a[1].rank && b[1].rank
          ? b[1].rank - a[1].rank
          : (a[1].point ?? 0) - (b[1].point ?? 0),
    );
    const topTiers = rankingAscending[index]
      ? ranking
          .map((entry) => entry[0])
          .slice(0, isFinal ? 1 : uniqueTeamsNextStageCount)
      : ranking
          .map((entry) => entry[0])
          .slice(
            isFinal
              ? ranking.length - 1
              : ranking.length - uniqueTeamsNextStageCount,
          );
    const sortByDateRanking = Array.from(playerSchedule).sort((a, b) =>
      dateAscending[index] ? a[1].date - b[1].date : b[1].date - a[1].date,
    );
    const sortedRanking =
      sortBy[index] === "ranking" ? ranking : sortByDateRanking;

    return (
      <div key={index} className="mb-4">
        <div className="h-8 bg-dark-gray mb-4 inline-flex gap-3 px-4">
          <div className="font-medium text-xl pt-[2px]">{stage.name}</div>
          <StyledStageTitleNum
            className={`${isFinal ? "text-ak-red" : "text-ak-blue"}`}
          >
            {uniqueTeamsCount}
          </StyledStageTitleNum>
          {!isFinal && (
            <>
              <p className="font-medium text-xl pt-[2px]"> 队进 </p>
              <StyledStageTitleNum className="text-ak-red">
                {uniqueTeamsNextStageCount}
              </StyledStageTitleNum>
              <p className="font-medium text-xl pt-[2px]"> 队</p>
            </>
          )}
        </div>
        <StyledTableWrapper>
          <StyledTeamTable>
            <thead className="sticky top-0 bg-black-gray">
              <tr>
                <td className="sticky left-0 bg-black-gray">
                  <div className="flex items-center w-max">
                    <p>排名</p>
                    <SortIcon
                      order={
                        sortBy[index] === "ranking"
                          ? rankingAscending[index]
                            ? "asc"
                            : "desc"
                          : "null"
                      }
                      role="button"
                      onClick={() => handleSort("ranking", index)}
                    />
                  </div>
                </td>
                <td className="sticky left-[64px] bg-black-gray min-w-20 sm:w-32 sm:min-w-32">队伍</td>
                <td className="sticky left-[144px] sm:left-[192px] bg-black-gray player-name">选手ID</td>
                <td>
                  <div className="flex items-center w-max">
                    <p>日程</p>
                    <SortIcon
                      order={
                        sortBy[index] === "date"
                          ? dateAscending[index]
                            ? "asc"
                            : "desc"
                          : "null"
                      }
                      role="button"
                      onClick={() => handleSort("date", index)}
                    />
                  </div>
                </td>
                <td>位置</td>
                <td className="min-w-12">分队</td>
                <td>开局干员</td>
                <td className="min-w-32">“相遇”节点选择</td>
                <td>结局</td>
                <td>分数</td>
                <td className="min-w-20 sticky right-0 bg-black-gray">队伍总分</td>
              </tr>
            </thead>
            <tbody className="border-collapse">
              {sortedRanking.map((entry, rankIndex) => {
                const team = sortBy[index] === "ranking"
                  ? tournamentData.teams?.find(
                    (team) => team.name === entry[0],
                  )
                  : tournamentData.teams?.find(
                    (team) => team.members.includes(entry[0]),
                  );
                const players = sortBy[index] === "ranking"
                  ? tournamentData.players?.filter(
                    (player) => team?.members.includes(player.name),
                  )
                  : tournamentData.players?.filter(
                    (player) => player.name === entry[0]
                  );
                const isTopTier = topTiers.indexOf(entry[0]) !== -1;

                return players?.map((player, playerIndex) => {
                  return (
                    <tr
                      key={playerIndex}
                      className={`border-y-1 ${isTopTier ? "bg-[#1c272c] border-[#0073A4CC]" : "bg-black-gray-70 border-mid-gray"}
                        ${playerIndex === players.length - 1 && rankIndex !== sortedRanking.length - 1 && topTiers.indexOf(sortedRanking[rankIndex + 1][0]) !== -1 ? "border-b-[#0073A4CC]" : ""}
                        ${playerIndex === 0 && rankIndex !== 0 && topTiers.indexOf(sortedRanking[rankIndex - 1][0]) !== -1 ? "border-t-[#0073A4CC]" : ""}`}
                    >
                      {sortBy[index] === "ranking" ?
                        playerIndex === 0 &&
                          <td
                            rowSpan={players.length}
                            className={`sticky left-0 whitespace-nowrap w-4 p-4 text-bold text-center ${isTopTier ? "bg-[#1c272c] text-ak-blue" : "bg-[#212121]"}`}
                          >
                            {rankingAscending[index] ? rankIndex + 1 : sortedRanking.length - rankIndex}
                          </td>
                        : <td
                            className={`sticky left-0 whitespace-nowrap w-4 p-4 text-bold text-center ${isTopTier ? "bg-[#1c272c] text-ak-blue" : "bg-[#212121]"}`}
                          >
                            {player.finalRank}
                          </td>
                      }
                      {sortBy[index] === "ranking" ?
                        playerIndex === 0 && <StyledTeamName $isTopTier={isTopTier} $sortByRanking={true} rowSpan={players.length}>{entry[0]}</StyledTeamName>
                        : <StyledTeamName $isTopTier={isTopTier} $sortByRanking={false} className="max-w-32 truncate">{team?.name}</StyledTeamName>
                      }
                      <td className={`sticky left-[144px] sm:left-[192px] ${isTopTier ? "bg-[#1c272c]" : "bg-[#212121]"} sm:min-w-32 player-name`}>
                        {player.name === team?.keyMember && <div className="absolute top-0 left-2 h-full flex items-center">
                          <StarIcon className="text-ak-blue" width="1rem" />
                        </div>}
                        {player.name}
                      </td>
                      <td className="whitespace-nowrap">{player.games.find((game) => game.stage === stage.name)?.schedule}</td>
                      <td className="whitespace-nowrap">{player.name === team?.keyMember ? '创想家' : '讲述者'}</td>
                      <td className="whitespace-nowrap">
                        <span className="hidden md:block">
                          {player.games.find((game) => game.stage === stage.name)?.starterSquad}
                        </span>
                        <span className="block md:hidden">
                          <img
                            src={`/images/squad/${player.games.find((game) => game.stage === stage.name)?.starterSquad}.png`}
                            alt="squad"
                            className="h-10 aspect-square object-contain"
                          />
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{player.games.find((game) => game.stage === stage.name)?.starterOp}</td>
                      <td className="whitespace-nowrap">{player.games.find((game) => game.stage === stage.name)?.strategy}</td>
                      <td className="whitespace-nowrap">{player.games.find((game) => game.stage === stage.name)?.ending}</td>
                      <td className="whitespace-nowrap">{player.games.find((game) => game.stage === stage.name)?.point}</td>
                      {sortBy[index] === "ranking"
                        ? playerIndex === 0 && <StyledFinalPoint $isTopTier={isTopTier} rowSpan={players.length} className={`sticky right-0 whitespace-nowrap text-center ${isTopTier ? "bg-[#1c272c]" : "bg-[#212121]"}`}>{entry[1].point}</StyledFinalPoint>
                        : <StyledFinalPoint $isTopTier={isTopTier} className="sticky right-0 bg-[#212121] whitespace-nowrap text-center">{team?.stages.find((teamStage) => teamStage.name === stage.name)?.point}</StyledFinalPoint>
                      }
                    </tr>
                  )
                })
              })}
            </tbody>
          </StyledTeamTable>
        </StyledTableWrapper>
        <StyledDivider className={`${isFinal && "hidden"}`} />
      </div>
    );
  });
}

export default function TournamentRankingWrapper({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  return (
    <div>
      <SectionContainer
        title="排名情况"
        content={
          tournamentData.type === 'team'
            ? <TournamentRankingTeam tournamentData={tournamentData} />
            : <TournamentRankingIndividual tournamentData={tournamentData} />
        }
      />
    </div>
  )
}
