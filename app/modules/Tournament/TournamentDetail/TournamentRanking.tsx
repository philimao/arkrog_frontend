import { useState } from "react";
import type {
  TournamentData,
  TournamentGame,
  TournamentTeamStage,
} from "~/types/tournamentsData";
import { SectionContainer } from ".";
import { SortIcon, StarIcon } from "~/components/Icons";
import { styled } from "styled-components";
import { StyledDivider, StyledStageTitleNum } from "../components/Shared";

// Types
type SortByType = "point" | "date";

type SortProps = {
  sortBy: SortByType[];
  rankingAscending: boolean[];
  dateAscending: boolean[];
  handleSort: (type: SortByType, index: number) => void;
  currentIndex: number;
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
  overflow-x: auto;
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
    {!isFinal && nextStageCount && (
      <>
        <p className="font-medium text-xl pt-[2px]">
          {" "}
          {isTeam ? "队进" : "进"}{" "}
        </p>
        <StyledStageTitleNum className="text-ak-red">
          {nextStageCount}
        </StyledStageTitleNum>
        {isTeam && <p className="font-medium text-xl pt-[2px]"> 队</p>}
      </>
    )}
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
  const { sortBy, rankingAscending, dateAscending, handleSort, currentIndex } =
    sortProps;

  const getOrder = () => {
    if (sortBy[currentIndex] !== sortType) return "null";
    if (sortType === "point")
      return rankingAscending[currentIndex] ? "asc" : "desc";
    return dateAscending[currentIndex] ? "asc" : "desc";
  };

  return (
    <div className="flex items-center w-max">
      <p>{label}</p>
      <SortIcon
        order={getOrder()}
        role="button"
        onClick={() => handleSort(sortType, currentIndex)}
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
const useSortingState = (stagesLength: number) => {
  const [sortBy, setSortBy] = useState<SortByType[]>(
    new Array(stagesLength).fill("point"),
  );
  const [rankingAscending, setRankingAscending] = useState<boolean[]>(
    new Array(stagesLength).fill(true),
  );
  const [dateAscending, setDateAscending] = useState<boolean[]>(
    new Array(stagesLength).fill(false),
  );

  const handleSort = (type: SortByType, index: number) => {
    setSortBy((prev) => prev.map((value, i) => (i === index ? type : value)));
    setRankingAscending((prev) =>
      prev.map((value, i) =>
        i === index ? (type === "point" ? !value : false) : value,
      ),
    );
    setDateAscending((prev) =>
      prev.map((value, i) =>
        i === index ? (type === "date" ? !value : false) : value,
      ),
    );
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
    ? (team: any) => team.stages.find((s: any) => s.name === nextStage.name)
    : (player: any) =>
        player.games.find((g: any) => g.stage === nextStage.name);

  const filteredItems = items.filter(filterFn);
  return filteredItems.length;
};

const createRankingMap = (schedule: Map<string, any>) => {
  const ranking = new Map<string, number>();

  Array.from(schedule)
    .sort((a, b) =>
      a[1].rank && b[1].rank
        ? a[1].rank - b[1].rank
        : (b[1].point ?? 0) - (a[1].point ?? 0),
    )
    .forEach((entry, index) => ranking.set(entry[0], index + 1));

  return ranking;
};

const getSortedRanking = (
  schedule: Map<string, any>,
  sortBy: SortByType,
  rankingAscending: boolean,
  dateAscending: boolean,
  playerSchedule?: Map<string, any>,
) => {
  if (sortBy === "point") {
    return Array.from(schedule).sort((a, b) =>
      rankingAscending
        ? a[1].rank && b[1].rank
          ? a[1].rank - b[1].rank
          : (b[1].point ?? 0) - (a[1].point ?? 0)
        : a[1].rank && b[1].rank
          ? b[1].rank - a[1].rank
          : (a[1].point ?? 0) - (b[1].point ?? 0),
    );
  } else {
    // For date sorting, use playerSchedule for team mode
    const scheduleToSort = playerSchedule || schedule;
    return Array.from(scheduleToSort).sort((a, b) =>
      dateAscending ? a[1].date - b[1].date : b[1].date - a[1].date,
    );
  }
};

// Individual ranking component
export function TournamentRankingIndividual({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const players = tournamentData.players!;

  const { sortBy, rankingAscending, dateAscending, handleSort } =
    useSortingState(tournamentData.stages.length);

  return tournamentData.stages?.map((stage, index) => {
    // Prepare data for this stage
    const schedule = new Map<string, TournamentGame>();

    players.forEach((player) => {
      const game = player.games.find((game) => game.stage === stage.name);
      if (game) {
        schedule.set(player.mid, game);
      }
    });

    const isFinal = index === tournamentData.stages.length - 1;
    const uniquePlayersCount = schedule.size;
    const uniquePlayersNextStageCount = getNextStageCount(
      tournamentData,
      index,
      false,
    );

    // Create ranking and determine top tiers
    const ranking = createRankingMap(schedule);
    const topTiers = Array.from(ranking.keys()).slice(
      0,
      isFinal ? 3 : uniquePlayersNextStageCount,
    );

    // Sort the ranking based on current sort settings
    const sortedRanking = getSortedRanking(
      schedule,
      sortBy[index],
      rankingAscending[index],
      dateAscending[index],
    );

    const sortProps: SortProps = {
      sortBy,
      rankingAscending,
      dateAscending,
      handleSort,
      currentIndex: index,
    };

    return (
      <div key={index} className="mb-4">
        <StageHeader
          stageName={stage.name}
          count={uniquePlayersCount}
          nextStageCount={uniquePlayersNextStageCount}
          isFinal={isFinal}
        />

        <StyledIndividualTable className="w-full border-collapse table-auto">
          <thead className="bg-black-gray">
            <tr>
              <td>
                <SortableHeader
                  label="排名"
                  sortType="point"
                  sortProps={sortProps}
                />
              </td>
              <td>选手ID</td>
              {Object.values(tournamentData.customPlayerKeys).map((key) => (
                <td key={key}>{key}</td>
              ))}
              {Object.values(stage.customStageKeys).map((key) => (
                <td key={key}>{key}</td>
              ))}
              <td>
                <SortableHeader
                  label="日程"
                  sortType="date"
                  sortProps={sortProps}
                />
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
                  <td
                    className={`w-4 p-4 text-bold text-center ${isTopTier && "text-ak-blue"}`}
                  >
                    {ranking.get(player?.mid || "")}
                  </td>
                  <td>{player?.name}</td>
                  {Object.values(entry[1].customStageValues).map((value) => (
                    <td key={value}>{value}</td>
                  ))}
                  <td>{entry[1].schedule}</td>
                  <td>
                    <SquadDisplay squadName={entry[1].starterSquad} />
                  </td>
                  <td className="hidden md:table-cell">{entry[1].ending}</td>
                  <td>{entry[1].point}</td>
                </tr>
              );
            })}
          </tbody>
        </StyledIndividualTable>

        {!isFinal && <StyledDivider />}
      </div>
    );
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
    useSortingState(tournamentData.stages.length);

  return tournamentData.stages?.map((stage, index) => {
    // Prepare data for this stage
    const playerSchedule = new Map<string, TournamentGame>();
    players.forEach((player) => {
      const game = player.games.find((game) => game.stage === stage.name);
      if (game) {
        playerSchedule.set(player.name, game);
      }
    });

    const teamSchedule = new Map<string, TournamentTeamStage>();
    teams.forEach((team) => {
      const teamStage = team.stages.find(
        (teamStage) => teamStage.name === stage.name,
      );
      if (teamStage) {
        teamSchedule.set(team.name, teamStage);
      }
    });

    const isFinal = index === tournamentData.stages.length - 1;
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

    // Sort the ranking based on current sort settings
    const sortedRanking = getSortedRanking(
      teamSchedule,
      sortBy[index],
      rankingAscending[index],
      dateAscending[index],
      playerSchedule,
    );

    const sortProps: SortProps = {
      sortBy,
      rankingAscending,
      dateAscending,
      handleSort,
      currentIndex: index,
    };

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
            <thead className="sticky top-0 bg-black-gray">
              <tr>
                <td className="sticky left-0 bg-black-gray">
                  <SortableHeader
                    label="排名"
                    sortType="point"
                    sortProps={sortProps}
                  />
                </td>
                <td className="sticky left-[64px] bg-black-gray min-w-20 sm:w-32 sm:min-w-32">
                  队伍
                </td>
                <td className="sticky left-[144px] sm:left-[192px] bg-black-gray player-name">
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
                  <td className="whitespace-nowrap" key={key}>
                    {key}
                  </td>
                ))}
                {Object.values(stage.customStageKeys).map((key) => (
                  <td className="whitespace-nowrap" key={key}>
                    {key}
                  </td>
                ))}
                <td>结局</td>
                <td>分数</td>
                <td className="min-w-20 sticky right-0 bg-black-gray">
                  队伍总分
                </td>
              </tr>
            </thead>
            <tbody className="border-collapse">
              {sortedRanking.map((entry, rankIndex) => {
                const team =
                  sortBy[index] === "point"
                    ? tournamentData.teams?.find(
                        (team) => team.name === entry[0],
                      )
                    : tournamentData.teams?.find((team) =>
                        team.members.includes(entry[0]),
                      );

                const players =
                  sortBy[index] === "point"
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
                    (sortBy[index] === "point" && isFirstPlayer) ||
                    sortBy[index] === "date";

                  return (
                    <tr
                      key={playerIndex}
                      className={`border-y-1
                        ${isTopTier ? "bg-[#1c272c] border-[#0073A4CC]" : "bg-black-gray-70 border-mid-gray"}
                        ${isLastPlayer && nextIsTopTier ? "border-b-[#0073A4CC]" : ""}
                        ${isFirstPlayer && prevIsTopTier ? "border-t-[#0073A4CC]" : ""}`}
                    >
                      {showRank && (
                        <td
                          rowSpan={
                            sortBy[index] === "point" ? players.length : 1
                          }
                          className={`sticky left-0 whitespace-nowrap w-4 p-4 text-bold text-center
                            ${isTopTier ? "bg-[#1c272c] text-ak-blue" : "bg-[#212121]"}`}
                        >
                          {ranking.get(team?.name || "")}
                        </td>
                      )}

                      {sortBy[index] === "point" ? (
                        isFirstPlayer && (
                          <StyledTeamName
                            $isTopTier={isTopTier}
                            $sortByRanking={true}
                            rowSpan={players.length}
                          >
                            {entry[0]}
                          </StyledTeamName>
                        )
                      ) : (
                        <StyledTeamName
                          $isTopTier={isTopTier}
                          $sortByRanking={false}
                          className="max-w-32 truncate"
                        >
                          {team?.name}
                        </StyledTeamName>
                      )}

                      <td
                        className={`sticky left-[144px] sm:left-[192px] ${isTopTier ? "bg-[#1c272c]" : "bg-[#212121]"} sm:min-w-32 player-name`}
                      >
                        {isTeamLeader && (
                          <div className="absolute top-0 left-2 h-full flex items-center">
                            <StarIcon className="text-ak-blue" width="1rem" />
                          </div>
                        )}
                        {player.name}
                      </td>

                      <td className="whitespace-nowrap">
                        {playerGame?.schedule}
                      </td>
                      <td className="whitespace-nowrap">
                        {isKeyMember
                          ? tournamentData.keyMemberAlias
                          : tournamentData.memberAlias}
                      </td>
                      <td className="whitespace-nowrap">
                        <SquadDisplay
                          squadName={playerGame?.starterSquad || ""}
                        />
                      </td>
                      <td className="whitespace-nowrap">
                        {playerGame?.starterOp}
                      </td>
                      {Object.values(player.customPlayerValues).map((value) => (
                        <td className="whitespace-nowrap" key={value}>
                          {value}
                        </td>
                      ))}
                      {Object.values(playerGame?.customStageValues).map(
                        (value) => (
                          <td className="whitespace-nowrap" key={value}>
                            {value}
                          </td>
                        ),
                      )}
                      <td className="whitespace-nowrap">
                        {playerGame?.ending}
                      </td>
                      <td className="whitespace-nowrap">{playerGame?.point}</td>

                      {sortBy[index] === "point" ? (
                        isFirstPlayer && (
                          <StyledFinalPoint
                            $isTopTier={isTopTier}
                            rowSpan={players.length}
                            className={`sticky right-0 whitespace-nowrap text-center ${isTopTier ? "bg-[#1c272c]" : "bg-[#212121]"}`}
                          >
                            {entry[1].point}
                          </StyledFinalPoint>
                        )
                      ) : (
                        <StyledFinalPoint
                          $isTopTier={isTopTier}
                          className="sticky right-0 bg-[#212121] whitespace-nowrap text-center"
                        >
                          {
                            team?.stages.find(
                              (teamStage) => teamStage.name === stage.name,
                            )?.point
                          }
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

// Main wrapper component
export default function TournamentRankingWrapper({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const renderTeam =
    tournamentData.type === "team" &&
    tournamentData.teams?.length &&
    tournamentData.players?.length;
  const renderIndividual =
    tournamentData.type === "individual" && tournamentData.players?.length;

  return (
    <div>
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
    </div>
  );
}
