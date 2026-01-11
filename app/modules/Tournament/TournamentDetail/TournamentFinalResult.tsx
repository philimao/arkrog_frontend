import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { styled } from "styled-components";
import { SectionContainer } from ".";
import { StarIcon } from "~/components/Icons";

// Styled components
const StyledFinalResultAvatar = styled.div`
  background: linear-gradient(
    to top right,
    transparent 0%,
    transparent 85%,
    var(--ak-blue) 85%,
    var(--ak-blue) 100%
  );

  .imgWrapper {
    padding: 4px;
    background: linear-gradient(
      to bottom,
      white 0%,
      var(--light-mid-gray) 100%
    );
  }
`;

const StyledFinalResultRank = styled.div`
  position: absolute;
  right: 0;
  top: -1rem;
  font-size: 3rem;
  font-weight: 700;
  font-family: "NovecentoWide", sans-serif;
  color: transparent;
  -webkit-text-stroke: 1px var(--mid-gray);
  user-select: none;
`;

// Constants
const rankMap: { [key: number]: string } = {
  1: "冠军",
  2: "亚军",
  3: "季军",
};

// Helper components
const PlayerAvatar = ({
  imageSrc,
  name,
}: {
  imageSrc: string;
  name: string;
}) => (
  <StyledFinalResultAvatar className="shrink-0 w-20 h-20 sm:min-w-20 sm:min-h-20 aspect-square pt-1 pr-1">
    <div className="imgWrapper w-full h-full">
      {imageSrc ? (
        <img
          src={imageSrc}
          className="bg-dark-gray aspect-square"
          alt="avatar"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      ) : (
        <p className="bg-mid-gray w-full h-full flex items-center justify-center text-5xl text-white">
          {name[0]}
        </p>
      )}
    </div>
  </StyledFinalResultAvatar>
);

const ResultCardHeader = ({ rank }: { rank: number }) => (
  <div className="flex justify-between relative">
    <div className="text-ak-blue font-bold text-xl">{rankMap[rank]}</div>
    <StyledFinalResultRank>NO.{rank}</StyledFinalResultRank>
  </div>
);

/** 获取指定数量排名靠前的玩家/队伍，如果没有设置finalRank，则根据point排序 */
const getTopTiers = <
  T extends { finalRank?: number; games: { stage: string; point?: number }[] },
>(
  items: T[] | undefined,
  stageName: string,
  maxRank: number,
): T[] => {
  if (!items) return [];

  // 如果 finalRank 不为空，则根据 finalRank 排序，否则根据 finalPoint 排序
  const _items = items.map((item) => {
    const game = item.games.find((game) => game.stage === stageName);
    return {
      ...item,
      finalPoint: game?.point || Number.NEGATIVE_INFINITY,
      _finalRank: 0,
    };
  });

  _items
    .sort((a, b) => b.finalPoint - a.finalPoint)
    .forEach((item, index) => {
      item._finalRank = item.finalRank ?? index + 1;
    });

  return _items.sort((a, b) => a._finalRank - b._finalRank).slice(0, maxRank);
};

// Individual tournament result component
export function TournamentFinalResultIndividual({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  if (!tournamentData.stages || tournamentData.stages.length === 0) {
    return <>暂无比赛结果</>;
  }

  const final = tournamentData.stages[tournamentData.stages.length - 1];
  const isFinalOneOnOne = final.type === "1on1";
  const topTiers = getTopTiers(
    tournamentData.players,
    final.name,
    isFinalOneOnOne ? 2 : 3,
  );

  if (
    !topTiers?.length ||
    topTiers.every((player) => player.games.length === 0)
  )
    return <>暂无比赛结果</>;

  return (
    <div
      className={`grid ${isFinalOneOnOne ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-8`}
    >
      {topTiers.map((player, index) => {
        const lastGame = player.games.find((game) => game.stage === final.name);
        const rank = index + 1;

        if (!lastGame) return null;

        return (
          <div key={index} className="flex flex-col bg-black-gray-70 p-4 gap-4">
            <ResultCardHeader rank={rank} />
            <div className="relative flex flex-row sm:flex-col lg:flex-row gap-4">
              <PlayerAvatar imageSrc={player.face} name={player.name} />
              <div className="flex flex-col">
                <div className="text-white text-3xl">{player.name}</div>
                <div className="text-ak-blue text-xl pt-2">
                  {lastGame.point}
                </div>
              </div>
              <img
                src={`/images/squad/${lastGame.starterSquad}.png`}
                alt="squad"
                className="absolute bottom-0 right-0 h-14 aspect-square object-contain self-end opacity-30"
              />
            </div>
            <div className="bg-black-gray text-center p-2">
              {lastGame.ending}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Team member row component
const TeamMemberRow = ({
  isTeamLeader,
  isKeyMember,
  keyMemberAlias,
  memberAlias,
  player,
}: {
  isTeamLeader: boolean;
  isKeyMember: boolean;
  keyMemberAlias: string;
  memberAlias: string;
  player: any;
}) => {
  const lastGame = player?.games[player.games.length - 1];

  // Determine which items are present
  const hasName = !!player?.name;
  const hasRole = true; // Role is always shown (keyMemberAlias or memberAlias)
  const hasSquad = !!lastGame?.starterSquad;
  const hasCustomStageValues =
    !!lastGame?.customStageValues &&
    typeof lastGame.customStageValues === "object" &&
    Object.keys(lastGame.customStageValues).length > 0;
  const hasPoint = !!lastGame?.point;

  // Get custom stage values keys if they exist
  const customStageKeys = hasCustomStageValues
    ? Object.keys(lastGame.customStageValues)
    : [];

  // Count visible items to calculate widths (each custom stage value counts as one item)
  const visibleItemsCount = [
    hasName ? 1 : 0,
    hasRole ? 1 : 0,
    hasSquad ? 1 : 0,
    customStageKeys.length,
    hasPoint ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  // Calculate dynamic widths based on visible items
  // Allocate more space for name and squad as they're typically longer
  const getWidth = (isLarger = false) => {
    const baseWidth = 100 / visibleItemsCount;
    return isLarger ? `${baseWidth * 1.2}%` : `${baseWidth * 0.9}%`;
  };

  return (
    <div className="relative bg-black-gray flex items-center justify-between gap-4 pl-8 py-2">
      {isTeamLeader && (
        <span className="absolute h-full left-2 flex items-center">
          <StarIcon className="text-ak-blue" width="1rem" />
        </span>
      )}
      {hasName && <div style={{ width: getWidth(true) }}>{player.name}</div>}
      {hasRole && (
        <div style={{ width: getWidth() }}>
          {isKeyMember ? keyMemberAlias : memberAlias}
        </div>
      )}
      {hasSquad && (
        <>
          <div className="hidden lg:block" style={{ width: getWidth(true) }}>
            {lastGame.starterSquad}
          </div>
          <div
            className="flex justify-center items-center lg:hidden"
            style={{ width: getWidth() }}
          >
            <img
              src={`/images/squad/${lastGame.starterSquad}.png`}
              alt="squad"
              className="h-10 aspect-square object-contain"
            />
          </div>
        </>
      )}
      {hasCustomStageValues &&
        customStageKeys.map((key) => (
          <div key={key} style={{ width: getWidth() }}>
            {lastGame.customStageValues[key]}
          </div>
        ))}
      {hasPoint && <div style={{ width: getWidth() }}>{lastGame.point}</div>}
    </div>
  );
};

// Team tournament result component
export function TournamentFinalResultTeam({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  if (!tournamentData.teams || tournamentData.teams.length === 0) {
    return <>暂无比赛结果</>;
  }

  const final = tournamentData.stages[tournamentData.stages.length - 1];

  // 很tricky的格式转换，用于统一team和player类型
  const teams = tournamentData.teams.map((team) => {
    return {
      ...team,
      games: team.stages.map((stage) => ({
        stage: stage.name,
        point: stage.point,
      })),
    };
  });

  const topTiers = getTopTiers(teams, final.name, 2);

  if (!topTiers?.length) return <>暂无比赛结果</>;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {topTiers.map((team, index) => {
        const lastStage = team.stages[team.stages.length - 1];
        const rank = index + 1;

        return (
          <div key={index} className="flex flex-col bg-black-gray-70 p-4 gap-4">
            <ResultCardHeader rank={rank} />
            <div className="relative flex flex-row gap-4">
              <PlayerAvatar imageSrc={team.avatar} name={team.name} />
              <div className="flex flex-col">
                <div className="text-white text-3xl">{team.name}</div>
                <div className="text-ak-blue text-xl pt-2">
                  {lastStage.point}
                </div>
              </div>
            </div>
            {team.members.map((member, memberIndex) => {
              const player = tournamentData.players?.find(
                (player) => player.name === member,
              );
              const isKeyMember = team.keyMember === member;
              const isTeamLeader = team.leader === member;

              return (
                <TeamMemberRow
                  key={memberIndex}
                  isTeamLeader={isTeamLeader}
                  isKeyMember={isKeyMember}
                  keyMemberAlias={tournamentData.keyMemberAlias}
                  memberAlias={tournamentData.memberAlias}
                  player={player}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Main wrapper component
export default function TournamentFinalResultWrapper({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  if (!tournamentData.stages || tournamentData.stages.length === 0) {
    return null;
  }

  const lastStage = tournamentData.stages[tournamentData.stages.length - 1];
  const isResultAvailable = new Date().getTime() >= lastStage.endTime;

  if (!isResultAvailable) return null;

  return (
    <div className="my-16">
      <SectionContainer
        title="比赛结果"
        content={
          tournamentData.type === "team" ? (
            <TournamentFinalResultTeam tournamentData={tournamentData} />
          ) : (
            <TournamentFinalResultIndividual tournamentData={tournamentData} />
          )
        }
      />
    </div>
  );
}
