import type {
  TournamentData,
  TournamentGame,
  TournamentStage,
} from "~/types/tournamentsData";
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

const StyledBracketParticipant = styled.div<{ $isWinner?: boolean }>`
  border-left: 3px solid
    ${(props) => (props.$isWinner ? "var(--ak-blue)" : "transparent")};
`;

const StyledBracketMatch = styled.div`
  position: relative;
  padding: 1rem 1.25rem;
  background: var(--black-gray-70);
  border-radius: 1rem;
  min-height: 5.5rem;
`

const StyledBracketMatchWrapper = styled.div<{
  $showLeftConnector?: boolean;
  $showRightConnector?: boolean;
}>`
  position: relative;

  &::before {
    content: "";
    display: ${(props) => (props.$showLeftConnector ? "block" : "none")};
    position: absolute;
    left: -0.75rem;
    top: 50%;
    width: 0.75rem;
    height: 1px;
    background: var(--ak-blue);
  }

  &:nth-child(odd):after {
    content: "";
    position: absolute;
    display: ${(props) => (props.$showRightConnector ? "block" : "none")};
    border-top: 1px solid var(--ak-blue);
    border-top-right-radius: 0.3em;
    border-right: 1px solid var(--ak-blue);
    top: 50%;
    width: 0.75rem;
    height: 100%;
    right: -0.75rem;
  }

  &:nth-child(even):after {
    content: "";
    position: absolute;
    display: ${(props) => (props.$showRightConnector ? "block" : "none")};
    border-bottom: 1px solid var(--ak-blue);
    border-bottom-right-radius: 0.3em;
    border-right: 1px solid var(--ak-blue);
    bottom: 50%;
    width: 0.75rem;
    height: 100%;
    right: -0.75rem;
  }
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

/**
 * 获取决赛阶段
 * @param tournamentData 赛事数据
 * @returns
 */
export const getFinalStage = (
  tournamentData: TournamentData,
): { index: number; stage?: TournamentStage } => {
  if (!tournamentData.stages?.length) return { index: -1 };
  // 不是表演赛，且未定义晋升参数，或定义晋升参数且有玩家晋级
  const index = tournamentData.stages.findLastIndex(
    (stage) =>
      (stage.name !== "表演赛" && !stage.customStageKeys.promote) ||
      tournamentData.players.some(
        (player) =>
          player.games.find((game) => game.stage === stage.name)
            ?.customStageValues?.promote === "是",
      ),
  );
  return {
    index,
    stage: tournamentData.stages[index],
  };
};

type TournamentBracketParticipant = {
  id: string;
  name: string;
  result?: TournamentGame["result"];
  point?: number;
  face?: string;
};

type TournamentBracketMatch = {
  left: TournamentBracketParticipant;
  right: TournamentBracketParticipant;
  leftSourceIndex?: number;
  rightSourceIndex?: number;
};

type TournamentBracketRound = {
  stageName: string;
  matches: TournamentBracketMatch[];
};

export const buildTournamentBracketRounds = (
  tournamentData: TournamentData,
): TournamentBracketRound[] => {
  const finalInfo = getFinalStage(tournamentData);
  const finalStage = finalInfo.stage;
  const finalIndex = finalInfo.index;

  if (finalIndex < 0 || !finalStage || finalStage.type !== "1on1") {
    return [];
  }

  // only show bracket when final stage has at least one win and one lose recorded
  const finalStageName = finalStage.name;
  const hasWin = tournamentData.players.some((p) => p.games.find((g) => g.stage === finalStageName && g.result === "win"));
  const hasLose = tournamentData.players.some((p) => p.games.find((g) => g.stage === finalStageName && g.result === "lose"));
  if (!hasWin || !hasLose) return [];

  // collect consecutive 1on1 stages ending at finalIndex, stop when encountering non-1on1
  const allStages = tournamentData.stages ?? [];
  let startIdx = finalIndex;
  while (startIdx - 1 >= 0 && allStages[startIdx - 1].type === "1on1") {
    startIdx -= 1;
  }
  const includeStages = allStages.slice(startIdx, finalIndex + 1);

  const rounds = includeStages
    .sort((a, b) => a.startTime - b.startTime)
    .filter((stage) => stage.type === "1on1")
    .map((stage) => {
      const matchMap = new Map<
        string,
        {
          left?: TournamentBracketParticipant;
          right?: TournamentBracketParticipant;
        }
      >();

      tournamentData.players.forEach((player) => {
        const game = player.games.find((item) => item.stage === stage.name);
        if (!game) return;

        const rivalMid = game.rivalMid || player.mid;
        const key = [player.mid, rivalMid].sort().join("|");
        const isLeft = player.mid <= rivalMid;

        const participant: TournamentBracketParticipant = {
          id: player.mid,
          name: player.name,
          result: game.result,
          point: game.point,
          face: player.face,
        };

        const entry = matchMap.get(key) ?? {};
        if (isLeft) {
          entry.left = participant;
        } else {
          entry.right = participant;
        }
        matchMap.set(key, entry);
      });

      const matches = Array.from(matchMap.values())
        .map((entry) => ({
          left: entry.left || {
            id: `missing-${Math.random().toString(36).slice(2, 8)}`,
            name: "-",
          },
          right: entry.right || {
            id: `missing-${Math.random().toString(36).slice(2, 8)}`,
            name: "-",
          },
        }))
        .sort((a, b) => {
          if (a.left.name !== b.left.name) return a.left.name.localeCompare(b.left.name);
          return a.right.name.localeCompare(b.right.name);
        });

      return {
        stageName: stage.name,
        matches,
      };
    })
    .filter((round) => round.matches.length > 0);

  // Helper to pick a winner participant from a match if available
  const pickWinner = (
    match?: TournamentBracketMatch,
  ): TournamentBracketParticipant | undefined => {
    if (!match) return undefined;
    const { left, right } = match;
    if (left.result === "win") return left;
    if (right.result === "win") return right;
    // fallback to higher point if numeric
    const lPoint = typeof left.point === "number" ? left.point : Number.NEGATIVE_INFINITY;
    const rPoint = typeof right.point === "number" ? right.point : Number.NEGATIVE_INFINITY;
    if (lPoint !== Number.NEGATIVE_INFINITY || rPoint !== Number.NEGATIVE_INFINITY) {
      return lPoint >= rPoint ? left : right;
    }
    // otherwise prefer a real player (not placeholder "-")
    if (left.name && left.name !== "-") return left;
    if (right.name && right.name !== "-") return right;
    return undefined;
  };

  // For each next-round match, find which previous-round matches feed into its left/right
  // by matching participant ids, then reorder previous-round matches so feeding matches
  // become adjacent (2*i, 2*i+1 -> i). Do not overwrite actual next-round participants.
  for (let r = 1; r < rounds.length; r++) {
    const prevRound = rounds[r - 1];
    const currRound = rounds[r];
    const prev = prevRound.matches;

    // Map participant id -> prev match index
    const idToPrevIndex = new Map<string, number>();
    prev.forEach((m, idx) => {
      if (m.left?.id) idToPrevIndex.set(m.left.id, idx);
      if (m.right?.id) idToPrevIndex.set(m.right.id, idx);
    });

    // Determine source indices for current matches
    const leftSourceFor: Array<number | undefined> = [];
    const rightSourceFor: Array<number | undefined> = [];
    currRound.matches.forEach((m) => {
      const lId = m.left?.id;
      const rId = m.right?.id;
      const lIdx = lId ? idToPrevIndex.get(lId) : undefined;
      const rIdx = rId ? idToPrevIndex.get(rId) : undefined;
      leftSourceFor.push(lIdx);
      rightSourceFor.push(rIdx);
    });

    // Rebuild previous round order so that for each curr match j,
    // its left-source match comes first, then right-source match.
    const used = new Array(prev.length).fill(false);
    const newPrev: TournamentBracketMatch[] = [];
    for (let j = 0; j < currRound.matches.length; j++) {
      const lIdx = leftSourceFor[j];
      const rIdx = rightSourceFor[j];
      if (typeof lIdx === "number" && !used[lIdx]) {
        newPrev.push(prev[lIdx]);
        used[lIdx] = true;
        // annotate source index on current match
        (currRound.matches[j] as TournamentBracketMatch).leftSourceIndex = newPrev.length - 1;
      }
      if (typeof rIdx === "number" && !used[rIdx]) {
        newPrev.push(prev[rIdx]);
        used[rIdx] = true;
        (currRound.matches[j] as TournamentBracketMatch).rightSourceIndex = newPrev.length - 1;
      }
      // If neither source found, try to take by bracket position fallback
      if ((typeof lIdx !== "number" || used[lIdx]) && (typeof rIdx !== "number" || used[rIdx])) {
        const fallbackLeft = prev[j * 2];
        const fallbackRight = prev[j * 2 + 1];
        if (fallbackLeft && !used[j * 2]) {
          newPrev.push(fallbackLeft);
          used[j * 2] = true;
        }
        if (fallbackRight && !used[j * 2 + 1]) {
          newPrev.push(fallbackRight);
          used[j * 2 + 1] = true;
        }
      }
    }

    // Append any remaining unmatched prev matches
    prev.forEach((m, idx) => {
      if (!used[idx]) newPrev.push(m);
    });

    // Replace prev round matches order
    prevRound.matches = newPrev;
  }

  return rounds;
};

const TournamentBracketGraph = ({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) => {
  const rounds = buildTournamentBracketRounds(tournamentData);

  if (!rounds.length) {
    return null;
  }

  return (
    <div className="hidden lg:block border-t border-mid-gray pt-8">
      <div className="mb-4 text-xl font-semibold text-white">淘汰赛赛况</div>
      <div className="flex overflow-x-auto gap-6 pr-2">
        {rounds.map((round, roundIndex) => (
          <div key={round.stageName} className="min-w-[280px] flex flex-col gap-4">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-ak-blue">
              {round.stageName}
            </div>
            <div className="flex-1 space-y-6 flex justify-around flex-col">
              {round.matches.map((match, matchIndex) => {
                const leftIsWinner = match.left.result === "win";
                const rightIsWinner = match.right.result === "win";
                const nextRoundExists = roundIndex < rounds.length - 1;

                return (
                  <StyledBracketMatchWrapper
                    key={`${round.stageName}-${roundIndex}-${matchIndex}`}
                    $showLeftConnector={roundIndex > 0}
                    $showRightConnector={nextRoundExists}
                    className="h-full flex flex-col justify-center"
                  >
                    <StyledBracketMatch
                      className="grid gap-3"
                    >
                      <StyledBracketParticipant
                        $isWinner={leftIsWinner}
                        className={`flex items-center justify-between rounded-md bg-black-gray-70 px-3 py-2 ${
                          leftIsWinner ? "text-ak-blue" : "text-white"
                        }`}
                      >
                        <span className="truncate">{match.left.name}</span>
                        <span className="ml-2 text-xs text-light-mid-gray">
                          {match.left.result === "win" ? "胜" : match.left.result === "lose" ? "负" : "-"}
                        </span>
                      </StyledBracketParticipant>
                      <StyledBracketParticipant
                        $isWinner={rightIsWinner}
                        className={`flex items-center justify-between rounded-md bg-black-gray-70 px-3 py-2 ${
                          rightIsWinner ? "text-ak-blue" : "text-white"
                        }`}
                      >
                        <span className="truncate">{match.right.name}</span>
                        <span className="ml-2 text-xs text-light-mid-gray">
                          {match.right.result === "win" ? "胜" : match.right.result === "lose" ? "负" : "-"}
                        </span>
                      </StyledBracketParticipant>
                    </StyledBracketMatch>
                  </StyledBracketMatchWrapper>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

  const final = getFinalStage(tournamentData)?.stage;

  if (!final) return <>未找到决赛阶段</>;

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
    <div className="flex flex-col gap-8">
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
                    {(final.type === "1on1" ? "赛事积分：" : "") + lastGame.point}
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
      {isFinalOneOnOne ? <TournamentBracketGraph tournamentData={tournamentData} /> : null}
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
  const hasPoint = !!lastGame?.point;

  // not to display custom values to avoid content overflow

  // Count visible items to calculate widths (each custom stage value counts as one item)
  const visibleItemsCount = [
    hasName ? 1 : 0,
    hasRole ? 1 : 0,
    hasSquad ? 1 : 0,
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
  if (
    !tournamentData.teams ||
    tournamentData.teams.length === 0 ||
    !tournamentData.players ||
    tournamentData.players.length === 0
  ) {
    return <>暂无比赛结果</>;
  }

  const final = getFinalStage(tournamentData)?.stage;

  if (!final) return <>未找到决赛阶段</>;

  // 很tricky的格式转换，用于统一team和player类型
  const teams = tournamentData.teams.map((team) => {
    const stageGames = tournamentData
      .players!.filter((p) => team.members.includes(p.name))
      .map((p) => p.games.find((g) => g.stage === final.name))
      .filter((g) => g !== undefined);
    const point =
      final.type === "rank"
        ? stageGames.reduce((acc, game) => acc + (game.point || 0), 0)
        : stageGames.reduce(
            (acc, game) => acc + (game.result === "win" ? 1 : 0),
            0,
          );
    return {
      ...team,
      games: [{ stage: final.name, point }],
    };
  });

  const topTiers = getTopTiers(teams, final.name, 2);

  if (!topTiers?.length) return <>暂无比赛结果</>;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid lg:grid-cols-2 gap-8">
        {topTiers.map((team, index) => {
          const lastGame = team.games[team.games.length - 1];
          const rank = index + 1;

          if (!lastGame) return null;

          return (
            <div key={index} className="flex flex-col bg-black-gray-70 p-4 gap-4">
              <ResultCardHeader rank={rank} />
              <div className="relative flex flex-row gap-4">
                <PlayerAvatar imageSrc={team.avatar} name={team.name} />
                <div className="flex flex-col">
                  <div className="text-white text-3xl">{team.name}</div>
                  <div className="text-ak-blue text-xl pt-2">
                    {(final.type === "1on1" ? "队伍积分：" : "") + Number((lastGame.point).toFixed(3))}
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
      {final.type === "1on1" ? <TournamentBracketGraph tournamentData={tournamentData} /> : null}
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
