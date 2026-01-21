import React from "react";
import { useState } from "react";
import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { SectionContainer } from ".";
import { SortIcon, StarIcon } from "~/components/Icons";
import { styled } from "styled-components";
import { StyledDivider, StyledStageTitleNum } from "../components/Shared";
import { getFinalStage } from "./TournamentFinalResult";

// Types
type SortByType = "point" | "date";

type SortProps = {
  sortBy: Record<string, SortByType>;
  rankingAscending: Record<string, boolean>;
  dateAscending: Record<string, boolean>;
  handleSort: (type: SortByType, tableId: string) => void;
  tableId: string; // Unique identifier for each table
};

type StageHeaderProps = {
  stageName: string;
  count: number;
  nextStageCount?: number;
  isFinal: boolean;
  isTeam?: boolean;
};

// Styled components
const StyledTableWrapper = styled.div`
  width: 100%;
  max-height: 95vh;
  overflow: auto;
  scrollbar-width: thin;
`;

const StyledIndividualTable = styled.table`
  min-width: 100%;

  td {
    padding: 8px;
  }
`;

const StyledTeamTable = styled.table`
  min-width: 100%;

  td {
    padding: 8px;
  }

  .player-name {
    padding-left: 30px;
  }
`;

const StyledTeamWinLose = styled.td<{ $isWinner: boolean }>`
  position: sticky;
  box-shadow: inset -1px 0px var(--mid-gray);
  left: 0;
  color: ${(props) => (props.$isWinner ? "var(--ak-blue)" : "white")};
  background-color: ${(props) => (props.$isWinner ? "#1c272c" : "#212121")};
`;

const StyledTeamName = styled.td<{
  $isTopTier: boolean;
  $sortByRanking: boolean;
}>`
  box-shadow: inset -1px 0px
    ${(props) => (props.$isTopTier ? "#0073A4CC" : "var(--mid-gray)")};
  position: sticky;
  left: 64px;
  background-color: ${(props) => (props.$isTopTier ? "#1c272c" : "#212121")};
`;

const StyledFinalPoint = styled.td<{ $isTopTier: boolean }>`
  box-shadow: inset 1px 0px
    ${(props) => (props.$isTopTier ? "#0073A4CC" : "var(--mid-gray)")};
`;

// Styled components for individual ranking tables
// Helps to keep the columns sticky
const StyledRankingColumn = styled.td<{ $isTopTier: boolean }>`
  left: 0;
  background-color: ${(props) => (props.$isTopTier ? "#1c272c" : "#212121")};
`;

const StyledPlayerNameColumn = styled.td<{ $isTopTier: boolean }>`
  box-shadow: inset -1px 0px
    ${(props) => (props.$isTopTier ? "#0073A4CC" : "var(--mid-gray)")};
  left: 64px;
  background-color: ${(props) => (props.$isTopTier ? "#1c272c" : "#212121")};
`;

const StyledScoreColumn = styled.td<{ $isTopTier: boolean }>`
  box-shadow: inset 1px 0px
    ${(props) => (props.$isTopTier ? "#0073A4CC" : "var(--mid-gray)")};
  right: 0;
  background-color: ${(props) => (props.$isTopTier ? "#1c272c" : "#212121")};
`;

const ignoreCustomKeys = ["promote", "rank"];

// Helper components
const StageHeader = ({
  stageName,
  count,
  nextStageCount,
  isFinal,
  isTeam = false,
}: StageHeaderProps) => (
  <div className="h-8 bg-dark-gray mb-4 inline-flex gap-3 px-4">
    <div className="font-medium text-xl pt-[2px]">{stageName}</div>
    <StyledStageTitleNum
      className={`${isFinal ? "text-ak-red" : "text-ak-blue"}`}
    >
      {count}
    </StyledStageTitleNum>
    {!isFinal && nextStageCount !== 0 && (
      <>
        <p className="font-medium text-xl pt-[2px]">
          {" "}
          {isTeam ? "队进" : "进"}{" "}
        </p>
        <StyledStageTitleNum className="text-ak-red">
          {nextStageCount}
        </StyledStageTitleNum>
      </>
    )}
    {isTeam && <p className="font-medium text-xl pt-[2px]"> 队</p>}
  </div>
);

const SortableHeader = ({
  label,
  sortType,
  sortProps,
}: {
  label: string;
  sortType: SortByType;
  sortProps: SortProps;
}) => {
  const { sortBy, rankingAscending, dateAscending, handleSort, tableId } =
    sortProps;

  const getOrder = () => {
    // Check if this table has a sort type set
    const tableSortBy = sortBy[tableId];
    if (!tableSortBy || tableSortBy !== sortType) return "null";

    // Return the appropriate order based on sort type
    if (sortType === "point") return rankingAscending[tableId] ? "asc" : "desc";
    return dateAscending[tableId] ? "asc" : "desc";
  };

  return (
    <div className="flex items-center w-max">
      <p>{label}</p>
      <SortIcon
        order={getOrder()}
        role="button"
        onClick={() => handleSort(sortType, tableId)}
      />
    </div>
  );
};

const SquadDisplay = ({ squadName }: { squadName: string }) => (
  <>
    <span className="hidden md:block">{squadName}</span>
    <span className="block md:hidden">
      <img
        src={`/images/squad/${squadName}.png`}
        alt="squad"
        className="h-10 aspect-square object-contain"
      />
    </span>
  </>
);

// Sorting logic
const useSortingState = () => {
  // Initialize with empty objects to store table-specific sort settings
  const [sortBy, setSortBy] = useState<Record<string, SortByType>>({});
  const [rankingAscending, setRankingAscending] = useState<
    Record<string, boolean>
  >({});
  const [dateAscending, setDateAscending] = useState<Record<string, boolean>>(
    {},
  );

  const handleSort = (type: SortByType, tableId: string) => {
    // Update sort type for this specific table
    setSortBy((prev) => ({
      ...prev,
      [tableId]: type,
    }));

    // Update ascending/descending state based on sort type
    if (type === "point") {
      setRankingAscending((prev) => ({
        ...prev,
        [tableId]: prev[tableId] !== undefined ? !prev[tableId] : true,
      }));
      setDateAscending((prev) => ({
        ...prev,
        [tableId]: false,
      }));
    } else {
      setDateAscending((prev) => ({
        ...prev,
        [tableId]: prev[tableId] !== undefined ? !prev[tableId] : false,
      }));
      setRankingAscending((prev) => ({
        ...prev,
        [tableId]: false,
      }));
    }
  };

  return { sortBy, rankingAscending, dateAscending, handleSort };
};

// Helper functions
const getNextStageCount = (
  tournamentData: TournamentData,
  index: number,
  isTeam: boolean,
) => {
  if (index === tournamentData.stages.length - 1) return 0;

  const nextStage = tournamentData.stages[index + 1];
  const items = isTeam ? tournamentData.teams : tournamentData.players;

  if (!items) return 0;

  const filterFn = isTeam
    ? (team: any) =>
        team.members.some((member: any) =>
          tournamentData.players
            .find((p: any) => p.name === member)
            ?.games.find((g: any) => g.stage === nextStage.name),
        )
    : (player: any) =>
        player.games.find((g: any) => g.stage === nextStage.name);

  const filteredItems = items.filter(filterFn);
  return filteredItems.length;
};

const createRankingMap = (schedule: Map<string, any>) => {
  const ranking = new Map<string, number>();

  Array.from(schedule)
    .sort((a, b) => (b[1].point ?? 0) - (a[1].point ?? 0))
    .sort((a, b) => {
      // 如果有自定义排名，则按照自定义排名排序
      const rankA = a[1].customStageValues?.rank ?? 999;
      const rankB = b[1].customStageValues?.rank ?? 999;
      return rankA - rankB;
    })
    .forEach((entry, index) => ranking.set(entry[0], index + 1));

  return ranking;
};

const getSortedRanking = (
  schedule: Map<string, any>,
  sortByMap: Record<string, SortByType>,
  rankingAscendingMap: Record<string, boolean>,
  dateAscendingMap: Record<string, boolean>,
  tableId: string,
  playerSchedule?: Map<string, any>,
) => {
  // Get sort settings for this specific table
  const sortBy = sortByMap[tableId] || "point";
  const rankingAscending =
    rankingAscendingMap[tableId] !== undefined
      ? rankingAscendingMap[tableId]
      : true;
  const dateAscending =
    dateAscendingMap[tableId] !== undefined ? dateAscendingMap[tableId] : false;

  if (sortBy === "point") {
    const sortedSchedule = Array.from(schedule)
      .sort((a, b) => (b[1].point ?? 0) - (a[1].point ?? 0))
      .sort((a, b) => {
        // 如果有自定义排名，则按照自定义排名排序
        const rankA = a[1].customStageValues?.rank ?? 999;
        const rankB = b[1].customStageValues?.rank ?? 999;
        return rankA - rankB;
      });
    return rankingAscending ? sortedSchedule : sortedSchedule.reverse();
  } else {
    // For date sorting, use playerSchedule for team mode
    const scheduleToSort = playerSchedule || schedule;
    return Array.from(scheduleToSort).sort((a, b) =>
      dateAscending ? a[1].date - b[1].date : b[1].date - a[1].date,
    );
  }
};

const RankingTable = ({
  stage,
  groupBy = "",
  group = "",
  index,
  tournamentData,
  sortProps,
  isFinal,
  uniquePlayersCount,
  uniquePlayersNextStageCount,
  ranking,
  topTiers,
  sortedRanking,
}: {
  stage: any;
  groupBy?: string;
  group?: string;
  index: number;
  tournamentData: TournamentData;
  sortProps: SortProps;
  isFinal: boolean;
  uniquePlayersCount: number;
  uniquePlayersNextStageCount: number;
  ranking: Map<string, number>;
  topTiers: string[];
  sortedRanking: [string, any][];
}) => {
  const showStarterOp = Array.from(sortedRanking).some(
    (entry) => entry[1].starterOp,
  );
  const showEnding = Array.from(sortedRanking).some((entry) => entry[1].ending);

  return (
    <div key={index} className="mb-4">
      <StageHeader
        stageName={stage.name + group}
        count={uniquePlayersCount}
        nextStageCount={uniquePlayersNextStageCount}
        isFinal={isFinal}
      />

      <StyledTableWrapper>
        <StyledIndividualTable className="w-full border-collapse table-auto">
          <thead className="sticky top-0 bg-black-gray z-10">
            <tr>
              <td className="sticky top-0 left-0 bg-black-gray w-[64px] min-w-[64px] z-10">
                <SortableHeader
                  label="排名"
                  sortType="point"
                  sortProps={sortProps}
                />
              </td>
              <td className="sticky left-[64px] bg-black-gray min-w-32 z-10">
                选手ID
              </td>
              <td>
                <SortableHeader
                  label="日程"
                  sortType="date"
                  sortProps={sortProps}
                />
              </td>
              <td>分队</td>
              {showStarterOp && <td>开局干员</td>}
              {Object.keys(tournamentData.customPlayerKeys).map((key) => (
                <td key={key}>{tournamentData.customPlayerKeys[key]}</td>
              ))}
              {Object.keys(stage.customStageKeys)
                .filter(
                  (key) => key !== groupBy && !ignoreCustomKeys.includes(key),
                )
                .map((key) => (
                  <td key={key}>{stage.customStageKeys[key]}</td>
                ))}
              {showEnding && <td>结局</td>}
              <td className="sticky right-0 bg-black-gray min-w-20 z-10">
                分数
              </td>
            </tr>
          </thead>
          <tbody className="border-collapse">
            {sortedRanking.map((entry, rankIndex) => {
              const player = tournamentData.players?.find(
                (player) => player.mid === entry[0],
              );
              const isTopTier = topTiers.indexOf(entry[0]) !== -1;
              const nextIsTopTier =
                rankIndex !== sortedRanking.length - 1 &&
                topTiers.indexOf(sortedRanking[rankIndex + 1][0]) !== -1;
              const prevIsTopTier =
                rankIndex !== 0 &&
                topTiers.indexOf(sortedRanking[rankIndex - 1][0]) !== -1;

              return (
                <tr
                  key={rankIndex}
                  className={`border-y-1
                    ${isTopTier ? "bg-[#1c272c] border-[#0073A4CC]" : "bg-black-gray-70 border-mid-gray"}
                    ${nextIsTopTier ? "border-b-[#0073A4CC]" : ""}
                    ${prevIsTopTier ? "border-t-[#0073A4CC]" : ""}`}
                >
                  <StyledRankingColumn
                    $isTopTier={isTopTier}
                    className={`sticky w-4 p-4 text-bold text-center ${isTopTier && "text-ak-blue"}`}
                  >
                    {ranking.get(player?.mid || "")}
                  </StyledRankingColumn>
                  <StyledPlayerNameColumn
                    $isTopTier={isTopTier}
                    className="sticky"
                  >
                    {player?.name}
                  </StyledPlayerNameColumn>
                  <td>{entry[1].schedule}</td>
                  <td>
                    <SquadDisplay squadName={entry[1].starterSquad} />
                  </td>
                  {showStarterOp && <td>{entry[1].starterOp}</td>}
                  <>
                    {Object.keys(tournamentData.customPlayerKeys).map((key) => (
                      <td key={key}>{player?.customPlayerValues[key]}</td>
                    ))}
                  </>
                  <>
                    {Object.keys(stage.customStageKeys)
                      .filter(
                        (key) =>
                          key !== groupBy && !ignoreCustomKeys.includes(key),
                      )
                      .map((key) => (
                        <td key={key}>
                          {!entry[1].customStageValues[key] ? (
                            "-"
                          ) : key === "playback" ? (
                            <a
                              href={entry[1].customStageValues[key]}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <svg
                                width="16"
                                height="16"
                                className="text-ak-blue"
                              >
                                <use href="#bilibili-svg" />
                              </svg>
                            </a>
                          ) : (
                            entry[1].customStageValues[key]
                          )}
                        </td>
                      ))}
                  </>
                  {showEnding && <td>{entry[1].ending}</td>}
                  <StyledScoreColumn $isTopTier={isTopTier} className="sticky">
                    {entry[1].point}
                  </StyledScoreColumn>
                </tr>
              );
            })}
          </tbody>
        </StyledIndividualTable>
      </StyledTableWrapper>

      {!isFinal && <StyledDivider />}
    </div>
  );
};

const OneOnOneTable = ({
  stage,
  index,
  tournamentData,
  isFinal,
  uniquePlayersCount,
  uniquePlayersNextStageCount,
  winnedGames,
  losedGames,
}: {
  stage: any;
  index: number;
  tournamentData: TournamentData;
  isFinal: boolean;
  uniquePlayersCount: number;
  uniquePlayersNextStageCount: number;
  winnedGames: Map<string, TournamentGame>;
  losedGames: Map<string, TournamentGame>;
}) => {
  const showStarterOp =
    Array.from(winnedGames.values()).some((game) => game.starterOp) ||
    Array.from(losedGames.values()).some((game) => game.starterOp);
  const showEnding =
    Array.from(winnedGames.values()).some((game) => game.ending) ||
    Array.from(losedGames.values()).some((game) => game.ending);

  return (
    <div key={index} className="mb-4">
      <StageHeader
        stageName={stage.name}
        count={uniquePlayersCount}
        nextStageCount={uniquePlayersNextStageCount}
        isFinal={isFinal}
      />

      <StyledTableWrapper>
        <StyledIndividualTable className="w-full border-collapse table-auto">
          <thead className="sticky top-0 bg-black-gray z-10">
            <tr>
              <td className="sticky left-0 bg-black-gray w-[64px] min-w-[64px] whitespace-nowrap z-10">
                结果
              </td>
              <td className="sticky left-[64px] bg-black-gray min-w-32 z-10">
                选手ID
              </td>
              <td>日程</td>
              <td>分队</td>
              {showStarterOp && <td>开局干员</td>}
              {Object.keys(tournamentData.customPlayerKeys).map((key) => (
                <td key={key}>{tournamentData.customPlayerKeys[key]}</td>
              ))}
              {Object.keys(stage.customStageKeys)
                .filter((key) => !ignoreCustomKeys.includes(key))
                .map((key) => (
                  <td key={key}>{stage.customStageKeys[key]}</td>
                ))}
              {showEnding && <td>结局</td>}
              <td className="sticky right-0 bg-black-gray min-w-20 z-10">
                分数
              </td>
            </tr>
          </thead>
          <tbody className="border-collapse">
            {Array.from(winnedGames)
              .sort((a, b) => a[1].date - b[1].date)
              .map((entry, groupIndex) => {
                const winner = tournamentData.players?.find(
                  (player) => player.mid === entry[0],
                );
                const winnerGame = (winner &&
                  winnedGames.get(winner?.mid)) as TournamentGame;
                const loser = tournamentData.players?.find(
                  (player) => player.mid === String(winnerGame.rivalMid),
                );
                const losedGame = (loser &&
                  losedGames.get(loser?.mid)) as TournamentGame;

                return (
                  <React.Fragment key={`group-${groupIndex}`}>
                    <tr
                      key={`${groupIndex}-win`}
                      className="border-y-1 bg-[#1c272c] border-[#0073A4CC]"
                    >
                      <StyledRankingColumn
                        $isTopTier={true}
                        className="sticky w-12 text-bold text-ak-blue"
                      >
                        {winnerGame.point === undefined ? "-" : "win"}
                      </StyledRankingColumn>
                      <StyledPlayerNameColumn
                        $isTopTier={true}
                        className="sticky"
                      >
                        {winner?.name}
                      </StyledPlayerNameColumn>
                      <td>{winnerGame.schedule}</td>
                      <td>
                        <SquadDisplay
                          squadName={winnerGame.starterSquad || ""}
                        />
                      </td>
                      {showStarterOp && <td>{winnerGame.starterOp}</td>}
                      <>
                        {Object.keys(tournamentData.customPlayerKeys)
                          .filter((key) => !ignoreCustomKeys.includes(key))
                          .map((key) => (
                            <td key={key}>{winner?.customPlayerValues[key]}</td>
                          ))}
                      </>
                      <>
                        {Object.keys(stage.customStageKeys)
                          .filter((key) => !ignoreCustomKeys.includes(key))
                          .map((key) => (
                            <td key={key}>
                              {!winnerGame.customStageValues[key] ? (
                                "-"
                              ) : key === "playback" ? (
                                <a
                                  href={winnerGame.customStageValues[key]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    className="text-ak-blue"
                                  >
                                    <use href="#bilibili-svg" />
                                  </svg>
                                </a>
                              ) : (
                                winnerGame.customStageValues[key]
                              )}
                            </td>
                          ))}
                      </>
                      {showEnding && <td>{winnerGame.ending}</td>}
                      <StyledScoreColumn $isTopTier={true} className="sticky">
                        {winnerGame.point}
                      </StyledScoreColumn>
                    </tr>
                    {losedGame && (
                      <tr
                        key={`${groupIndex}-lose`}
                        className="bg-black-gray-70 border-b-8 border-b-[#363636]"
                      >
                        <StyledRankingColumn
                          $isTopTier={false}
                          className="sticky w-12"
                        >
                          {losedGame.point === undefined ? "-" : "lose"}
                        </StyledRankingColumn>
                        <StyledPlayerNameColumn
                          $isTopTier={false}
                          className="sticky"
                        >
                          {loser?.name}
                        </StyledPlayerNameColumn>
                        <td>{losedGame.schedule}</td>
                        <td>
                          <SquadDisplay
                            squadName={losedGame.starterSquad || ""}
                          />
                        </td>
                        <td>{losedGame.starterOp}</td>
                        <>
                          {Object.keys(tournamentData.customPlayerKeys).map(
                            (key) => (
                              <td key={key}>
                                {loser?.customPlayerValues[key]}
                              </td>
                            ),
                          )}
                        </>
                        <>
                          {Object.keys(stage.customStageKeys)
                            .filter((key) => !ignoreCustomKeys.includes(key))
                            .map((key) => (
                              <td key={key}>
                                {!losedGame.customStageValues[key] ? (
                                  "-"
                                ) : key === "playback" ? (
                                  <a
                                    href={losedGame.customStageValues[key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      className="text-ak-blue"
                                    >
                                      <use href="#bilibili-svg" />
                                    </svg>
                                  </a>
                                ) : (
                                  losedGame.customStageValues[key]
                                )}
                              </td>
                            ))}
                        </>
                        <td>{losedGame?.ending}</td>
                        <StyledScoreColumn
                          $isTopTier={false}
                          className="sticky"
                        >
                          {losedGame?.point}
                        </StyledScoreColumn>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </StyledIndividualTable>
      </StyledTableWrapper>

      {!isFinal && <StyledDivider />}
    </div>
  );
};

// Individual ranking component
export function TournamentRankingIndividual({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const players = tournamentData.players!;

  const { sortBy, rankingAscending, dateAscending, handleSort } =
    useSortingState();

  return tournamentData.stages
    ?.sort((a, b) => a.startTime - b.startTime)
    .map((stage, index) => {
      const isFinal = getFinalStage(tournamentData).index === index;

      if (stage.type === "rank") {
        if (
          stage.customStageKeys &&
          stage.groupBy &&
          stage.customStageKeys[stage.groupBy]
        ) {
          const groups = new Set<string>();
          players.forEach((player) => {
            const game = player.games.find((game) => game.stage === stage.name);
            if (game) {
              groups.add(game.customStageValues[stage.groupBy]);
            }
          });
          const sortedGroups = Array.from(groups).sort();
          return sortedGroups.map((group) =>
            createRankingTable(true, stage.groupBy, group, sortedGroups),
          );
        } else {
          return createRankingTable(false);
        }

        function createRankingTable(
          hasGroups: boolean,
          groupBy?: string,
          group?: string,
          groups?: string[],
        ) {
          const schedule = new Map<string, TournamentGame>();

          players.forEach((player) => {
            const game = player.games.find((game) => game.stage === stage.name);
            if (
              game &&
              (!hasGroups || game?.customStageValues[groupBy!] === group)
            ) {
              schedule.set(player.mid, game);
            }
          });

          const uniquePlayersCount = schedule.size;
          let uniquePlayersNextStageCount;
          // 如果有自定义晋升参数
          if (stage.customStageKeys.promote) {
            uniquePlayersNextStageCount = Array.from(schedule.values())
              .map((game) => game.customStageValues.promote)
              .filter((promote) => promote === "是").length;
          } else {
            uniquePlayersNextStageCount =
              getNextStageCount(tournamentData, index, false) /
              (hasGroups && groups ? groups.length : 1);
          }

          // Create ranking and determine top tiers
          const ranking = createRankingMap(schedule);
          const topTiers = Array.from(ranking.keys()).slice(
            0,
            isFinal ? 3 : uniquePlayersNextStageCount,
          );

          // Generate a unique tableId for this table
          const tableId = `individual-${stage.name}${group ? `-${group}` : ""}`;

          // Sort the ranking based on current sort settings for this table
          const sortedRanking = getSortedRanking(
            schedule,
            sortBy,
            rankingAscending,
            dateAscending,
            tableId,
          );

          const sortProps: SortProps = {
            sortBy,
            rankingAscending,
            dateAscending,
            handleSort,
            tableId,
          };
          if (sortBy[tableId] === undefined) {
            handleSort("point", tableId);
          }

          return (
            <RankingTable
              key={hasGroups ? group : index}
              stage={stage}
              groupBy={groupBy}
              group={group}
              index={hasGroups && groups ? groups.indexOf(group!) : index}
              tournamentData={tournamentData}
              sortProps={sortProps}
              isFinal={isFinal}
              uniquePlayersCount={uniquePlayersCount}
              uniquePlayersNextStageCount={uniquePlayersNextStageCount}
              ranking={ranking}
              topTiers={topTiers}
              sortedRanking={sortedRanking}
            />
          );
        }
      } else {
        // 1on1
        const winnedGames = new Map<string, TournamentGame>();
        const losedGames = new Map<string, TournamentGame>();

        const gameList: TournamentGame[] = [];

        players.forEach((player) => {
          const game = player.games.find((game) => game.stage === stage.name);
          if (game) {
            gameList.push(game);
            if (game.result === "win") {
              winnedGames.set(player.mid, game);
            } else {
              losedGames.set(player.mid, game);
            }
          }
        });

        const uniquePlayersCount = winnedGames.size + losedGames.size;
        let uniquePlayersNextStageCount;
        // 如果有自定义晋升参数
        if (stage.customStageKeys.promote) {
          uniquePlayersNextStageCount = gameList
            .map((game) => game.customStageValues?.promote)
            .filter((promote) => promote === "是").length;
        } else {
          uniquePlayersNextStageCount = getNextStageCount(
            tournamentData,
            index,
            false,
          );
        }

        return (
          <OneOnOneTable
            stage={stage}
            index={index}
            tournamentData={tournamentData}
            isFinal={isFinal}
            uniquePlayersCount={uniquePlayersCount}
            uniquePlayersNextStageCount={uniquePlayersNextStageCount}
            winnedGames={winnedGames}
            losedGames={losedGames}
            key={index}
          />
        );
      }
    });
}

// Team ranking component
export function TournamentRankingTeam({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const teams = tournamentData.teams!;
  const players = tournamentData.players!;

  const { sortBy, rankingAscending, dateAscending, handleSort } =
    useSortingState();

  return tournamentData.stages
    ?.sort((a, b) => a.startTime - b.startTime)
    .map((stage, index) => {
      // Prepare data for this stage
      const playerSchedule = new Map<string, TournamentGame>();
      players.forEach((player) => {
        const game = player.games.find((game) => game.stage === stage.name);
        if (game) {
          playerSchedule.set(player.name, game);
        }
      });

      /** 获取Stage中定义的customStageKey数量，用于填充队伍中未参与该阶段选手的customStageValues */
      const customStageKeyLen = Object.keys(stage.customStageKeys).length;

      /** 是否为淘汰赛 */
      const isOneOnOne = stage.type === "1on1";
      /** 淘汰赛对手映射 */
      const teamRivalMap = new Map<string, string>();

      /** 队伍日程 */
      const teamSchedule = new Map<string, { name: string; point: number }>();
      teams.forEach((team) => {
        /** 获取队伍在该阶段的所有比赛 */
        const stageGames = players
          .filter((p) => team.members.includes(p.name))
          .map((p) => p.games.find((g) => g.stage === stage.name))
          .filter((g) => g !== undefined);
        if (stageGames.length !== 0) {
          // 对于团体赛，如果为积分赛赛制，积分point为各选手总分
          // 如果为个人淘汰赛制，积分point为该队伍选手总获胜场次
          const point =
            stage.type === "rank"
              ? stageGames.reduce((acc, game) => acc + (game.point || 0), 0)
              : stageGames.reduce(
                  (acc, game) => acc + (game.result === "win" ? 1 : 0),
                  0,
                );
          teamSchedule.set(team.name, {
            name: stage.name,
            point,
          });
          // 如果是淘汰赛赛制，设置队伍的对手
          if (isOneOnOne && !teamRivalMap.has(team.name)) {
            const rivalMid = stageGames[0]?.rivalMid;
            const rivalName = players.find((p) => p.mid === rivalMid)?.name;
            if (rivalName) {
              const rivalTeam = teams.find((t) =>
                t.members.includes(rivalName),
              );
              if (rivalTeam) {
                teamRivalMap.set(team.name, rivalTeam.name);
              }
            }
          }
        }
      });

      const isFinal = getFinalStage(tournamentData).index === index;
      const uniqueTeamsCount = teamSchedule.size;
      const uniqueTeamsNextStageCount = getNextStageCount(
        tournamentData,
        index,
        true,
      );

      // Create ranking and determine top tiers
      const ranking = createRankingMap(teamSchedule);
      const topTiers = Array.from(ranking.keys()).slice(
        0,
        isFinal ? 1 : uniqueTeamsNextStageCount,
      );

      // Generate a unique tableId for this team table
      const tableId = `team-${stage.name}`;

      // Sort the ranking based on current sort settings for this table
      const sortedRanking = getSortedRanking(
        teamSchedule,
        sortBy,
        rankingAscending,
        dateAscending,
        tableId,
        playerSchedule,
      );

      if (isOneOnOne && sortBy[tableId] === "point") {
        // 如果是团队淘汰赛，按照胜者、败者依次排序
        sortedRanking.slice(0, sortedRanking.length / 2).map((entry) => {
          const teamName = entry[0];
          const rivalTeamName = teamRivalMap.get(teamName);
          const winnedIndex = sortedRanking.findIndex((e) => e[0] === teamName);
          const loseIndex = sortedRanking.findIndex(
            (e) => e[0] === rivalTeamName,
          );
          const loseGame = sortedRanking.splice(loseIndex, 1)[0];
          sortedRanking.splice(winnedIndex + 1, 0, loseGame);
        });
      }

      const sortProps: SortProps = {
        sortBy,
        rankingAscending,
        dateAscending,
        handleSort,
        tableId,
      };

      if (sortBy[tableId] === undefined) {
        handleSort("point", tableId);
      }

      return (
        <div key={index} className="mb-4">
          <StageHeader
            stageName={stage.name}
            count={uniqueTeamsCount}
            nextStageCount={uniqueTeamsNextStageCount}
            isFinal={isFinal}
            isTeam={true}
          />

          <StyledTableWrapper>
            <StyledTeamTable>
              <thead className="sticky top-0 bg-black-gray z-10">
                <tr>
                  <td className="sticky z-10 left-0 bg-black-gray w-[64px] min-w-[64px]">
                    {isOneOnOne ? (
                      <SortableHeader
                        label="结果"
                        sortType="point"
                        sortProps={sortProps}
                      />
                    ) : (
                      <SortableHeader
                        label="排名"
                        sortType="point"
                        sortProps={sortProps}
                      />
                    )}
                  </td>
                  <td className="sticky z-10 left-[64px] bg-black-gray w-[112px] min-w-[112px]">
                    队伍
                  </td>
                  <td className="sticky z-10 left-[176px] bg-black-gray player-name">
                    选手ID
                  </td>
                  <td>
                    <SortableHeader
                      label="日程"
                      sortType="date"
                      sortProps={sortProps}
                    />
                  </td>
                  <td>位置</td>
                  <td className="min-w-12">分队</td>
                  <td>开局干员</td>
                  {Object.values(tournamentData.customPlayerKeys).map((key) => (
                    <td key={key}>{key}</td>
                  ))}
                  {Object.values(stage.customStageKeys).map((key) => (
                    <td key={key}>{key}</td>
                  ))}
                  <td>结局</td>

                  {isOneOnOne && (
                    <>
                      <td>对手</td>
                      <td>结果</td>
                    </>
                  )}

                  <td>分数</td>
                  <td className="min-w-20 sticky right-0 bg-black-gray z-10">
                    队伍积分
                  </td>
                </tr>
              </thead>
              <tbody className="border-collapse">
                {sortedRanking.map((entry, rankIndex) => {
                  const team =
                    sortBy[tableId] === "point"
                      ? tournamentData.teams?.find(
                          (team) => team.name === entry[0],
                        )
                      : tournamentData.teams?.find((team) =>
                          team.members.includes(entry[0]),
                        );

                  const players =
                    sortBy[tableId] === "point"
                      ? tournamentData.players?.filter((player) =>
                          team?.members.includes(player.name),
                        )
                      : tournamentData.players?.filter(
                          (player) => player.name === entry[0],
                        );

                  const isTopTier = topTiers.indexOf(entry[0]) !== -1;
                  const nextIsTopTier =
                    rankIndex !== sortedRanking.length - 1 &&
                    topTiers.indexOf(sortedRanking[rankIndex + 1][0]) !== -1;
                  const prevIsTopTier =
                    rankIndex !== 0 &&
                    topTiers.indexOf(sortedRanking[rankIndex - 1][0]) !== -1;

                  return players?.map((player, playerIndex) => {
                    const isFirstPlayer = playerIndex === 0;
                    const isLastPlayer = playerIndex === players.length - 1;
                    const playerGame = player.games.find(
                      (game) => game.stage === stage.name,
                    );

                    const isKeyMember = player.name === team?.keyMember;
                    const isTeamLeader = player.name === team?.leader;
                    const showRank =
                      !isOneOnOne &&
                      ((sortBy[tableId] === "point" && isFirstPlayer) ||
                        sortBy[tableId] === "date");

                    /** 根据排序方式+奇偶性判断是否为胜者组 */
                    const isWinner = rankingAscending[tableId]
                      ? rankIndex % 2 === 0
                      : rankIndex % 2 === 1;
                    /** 是否为奇数，奇数组下方添加边框 */
                    const isOdd = rankIndex % 2 === 1;
                    /** 对手名称 */
                    const rivalName = tournamentData.players?.find(
                      (p) => p.mid === playerGame?.rivalMid,
                    )?.name;

                    const className = `border-y-1
                        ${isTopTier || (isOneOnOne && isWinner) ? "bg-[#1c272c] border-[#0073A4CC]" : "bg-black-gray-70 border-mid-gray"}
                        ${isLastPlayer && nextIsTopTier ? "border-b-[#0073A4CC] " : ""}
                        ${isOneOnOne && isLastPlayer && isOdd ? "border-b-8 border-b-[#363636]" : ""}
                        ${isFirstPlayer && prevIsTopTier ? "border-t-[#0073A4CC]" : ""}`
                      .replace(/\s+/g, " ")
                      .replace(/\n/g, "");

                    return (
                      <tr key={playerIndex} className={className}>
                        {showRank && (
                          <td
                            rowSpan={
                              sortBy[tableId] === "point" ? players.length : 1
                            }
                            className={`sticky left-0 whitespace-nowrap w-4 p-4 text-bold text-center
                            ${isTopTier || (isOneOnOne && isWinner) ? "bg-[#1c272c] text-ak-blue" : "bg-[#212121]"}`}
                          >
                            {ranking.get(team?.name || "")}
                          </td>
                        )}

                        {isOneOnOne && isFirstPlayer && (
                          <StyledTeamWinLose
                            $isWinner={isWinner}
                            rowSpan={players.length}
                            className="sticky"
                          >
                            {isWinner ? "win" : "lose"}
                          </StyledTeamWinLose>
                        )}

                        {sortBy[tableId] === "point" ? (
                          isFirstPlayer && (
                            <StyledTeamName
                              $isTopTier={isTopTier || (isOneOnOne && isWinner)}
                              $sortByRanking={true}
                              rowSpan={players.length}
                              className="sticky"
                            >
                              {entry[0]}
                            </StyledTeamName>
                          )
                        ) : (
                          <StyledTeamName
                            $isTopTier={isTopTier || (isOneOnOne && isWinner)}
                            $sortByRanking={false}
                            className="sticky max-w-32 truncate"
                          >
                            {team?.name}
                          </StyledTeamName>
                        )}

                        <td
                          className={`sticky left-[176px] ${isTopTier || (isOneOnOne && isWinner) ? "bg-[#1c272c]" : "bg-[#212121]"} min-w-32 player-name`}
                        >
                          {isTeamLeader && (
                            <div className="absolute top-0 left-2 h-full flex items-center">
                              <StarIcon className="text-ak-blue" width="1rem" />
                            </div>
                          )}
                          {player.name}
                        </td>

                        <td>{playerGame?.schedule}</td>
                        <td>
                          {isKeyMember
                            ? tournamentData.keyMemberAlias
                            : tournamentData.memberAlias}
                        </td>
                        <td>
                          <SquadDisplay
                            squadName={playerGame?.starterSquad || ""}
                          />
                        </td>
                        <td>{playerGame?.starterOp}</td>
                        {Object.values(player.customPlayerValues).map(
                          (value) => (
                            <td key={value}>{value}</td>
                          ),
                        )}
                        {playerGame
                          ? Object.keys(stage.customStageKeys).map((key) => (
                              <td key={key}>
                                {!playerGame.customStageValues[key] ? (
                                  "-"
                                ) : key === "playback" ? (
                                  <a
                                    href={playerGame.customStageValues[key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      className="text-ak-blue"
                                    >
                                      <use href="#bilibili-svg" />
                                    </svg>
                                  </a>
                                ) : (
                                  playerGame.customStageValues[key]
                                )}
                              </td>
                            ))
                          : Array(customStageKeyLen)
                              .fill(0)
                              .map((_, index) => <td key={index}>-</td>)}
                        <td>{playerGame?.ending}</td>

                        {stage.type === "1on1" && (
                          <>
                            <td>{rivalName}</td>
                            <td>{playerGame?.result}</td>
                          </>
                        )}

                        <td>{playerGame?.point}</td>

                        {sortBy[tableId] === "point" ? (
                          isFirstPlayer && (
                            <StyledFinalPoint
                              $isTopTier={isTopTier || (isOneOnOne && isWinner)}
                              rowSpan={players.length}
                              className={`sticky right-0 whitespace-nowrap text-center ${isTopTier || (isOneOnOne && isWinner) ? "bg-[#1c272c]" : "bg-[#212121]"}`}
                            >
                              {entry[1].point}
                            </StyledFinalPoint>
                          )
                        ) : (
                          <StyledFinalPoint
                            $isTopTier={isTopTier || (isOneOnOne && isWinner)}
                            className="sticky right-0 bg-[#212121] whitespace-nowrap text-center"
                          >
                            {teamSchedule.get(team!.name)?.point}
                          </StyledFinalPoint>
                        )}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </StyledTeamTable>
          </StyledTableWrapper>

          {!isFinal && <StyledDivider />}
        </div>
      );
    });
}

const StyledTournamentRanking = styled.div`
  td:not(.sticky) {
    white-space: nowrap;
  }
`;

// Main wrapper component
export default function TournamentRankingWrapper({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  if (!tournamentData.stages || tournamentData.stages.length === 0) {
    return (
      <div>
        <SectionContainer title="排名情况" content={<div>暂无排名</div>} />
      </div>
    );
  }

  const renderTeam =
    tournamentData.type === "team" &&
    tournamentData.teams?.length &&
    tournamentData.players?.length;
  const renderIndividual =
    tournamentData.type === "individual" && tournamentData.players?.length;

  return (
    <StyledTournamentRanking>
      <SectionContainer
        title="排名情况"
        content={
          renderTeam ? (
            <TournamentRankingTeam tournamentData={tournamentData} />
          ) : renderIndividual ? (
            <TournamentRankingIndividual tournamentData={tournamentData} />
          ) : (
            <div>暂无排名</div>
          )
        }
      />
    </StyledTournamentRanking>
  );
}
