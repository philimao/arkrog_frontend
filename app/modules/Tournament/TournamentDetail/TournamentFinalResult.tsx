import type { TournamentData } from "~/types/tournamentsData";
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
const PlayerAvatar = ({ imageSrc }: { imageSrc: string }) => (
  <StyledFinalResultAvatar className="shrink-0 w-20 h-20 sm:min-w-20 sm:min-h-20 aspect-square pt-1 pr-1">
    <div className="imgWrapper">
      <img
        src={imageSrc}
        className="bg-dark-gray aspect-square"
        alt="avatar"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
    </div>
  </StyledFinalResultAvatar>
);

const ResultCardHeader = ({ rank }: { rank: number }) => (
  <div className="flex justify-between relative">
    <div className="text-ak-blue font-bold text-xl">{rankMap[rank]}</div>
    <StyledFinalResultRank>NO.{rank}</StyledFinalResultRank>
  </div>
);

// Helper functions
const getTopTiers = <T extends { finalRank?: number }>(
  items: T[] | undefined,
  maxRank: number,
): T[] => {
  return (
    items
      ?.filter(
        (item) =>
          item.finalRank && 0 < item.finalRank && item.finalRank <= maxRank,
      )
      .sort((a, b) =>
        a.finalRank && b.finalRank ? a.finalRank - b.finalRank : 0,
      ) || []
  );
};

// Individual tournament result component
export function TournamentFinalResultIndividual({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const final = tournamentData.stages[tournamentData.stages.length - 1];
  // TODO: replace isFinalOneOnOne with the data from tournament instead of player
  const finalPlayer = tournamentData.players?.find((player) =>
    player.games.find((g: any) => g.stage === final.name),
  );
  const isFinalOneOnOne =
    finalPlayer?.games[finalPlayer.games.length - 1].type === "1on1";
  const topTiers = getTopTiers(tournamentData.players, isFinalOneOnOne ? 2 : 3);

  if (!topTiers?.length) return <>暂无比赛结果</>;

  return (
    <div
      className={`grid ${isFinalOneOnOne ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-8`}
    >
      {topTiers.map((player, index) => {
        const lastGame = player.games[player.games.length - 1];
        const rank = index + 1;

        return (
          <div key={index} className="flex flex-col bg-black-gray-70 p-4 gap-4">
            <ResultCardHeader rank={rank} />
            <div className="relative flex flex-row sm:flex-col lg:flex-row gap-4">
              <PlayerAvatar imageSrc={player.face} />
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

  return (
    <div className="relative bg-black-gray flex items-center justify-between gap-4 pl-8 py-2">
      {isTeamLeader && (
        <span className="absolute h-full left-2 flex items-center">
          <StarIcon className="text-ak-blue" width="1rem" />
        </span>
      )}
      <div className="w-[25%]">{player?.name}</div>
      <div className="w-[20%]">
        {isKeyMember ? keyMemberAlias : memberAlias}
      </div>
      <div className="hidden lg:block w-[25%]">{lastGame?.starterSquad}</div>
      <div className="flex justify-center items-center w-[15%] lg:hidden">
        <img
          src={`/images/squad/${lastGame?.starterSquad}.png`}
          alt="squad"
          className="h-10 aspect-square object-contain"
        />
      </div>
      <div className="w-[15%]">{lastGame?.strategy}</div>
      <div className="w-[15%]">{lastGame?.point}</div>
    </div>
  );
};

// Team tournament result component
export function TournamentFinalResultTeam({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const topTiers = getTopTiers(tournamentData.teams, 2);

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
              <PlayerAvatar imageSrc={team.avatar} />
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
