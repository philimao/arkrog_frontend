import type { TournamentData } from "~/types/tournamentsData";
import { styled } from "styled-components";
import { SectionContainer } from ".";
import { StarIcon } from "~/components/Icons";

const StyledFinalResultAvatar = styled.div`
  background: linear-gradient(
    to top right,
    transparent 0%,
    transparent 85%,
    var(--ak-blue) 85%,
    var(--ak-blue) 100%
  );

  .imgWrapper {
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

const rankMap: { [key: number]: string } = {
  1: "冠军",
  2: "亚军",
  3: "季军",
};

export function TournamentFinalResultIndividual({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const topTiers = tournamentData.players
    ?.filter(
      (player) =>
        player.finalRank && 0 < player.finalRank && player.finalRank <= 3,
    )
    .sort((a, b) =>
      a.finalRank && b.finalRank ? a.finalRank - b.finalRank : 0,
    );

  if (!topTiers?.length) return <>暂无比赛结果</>;

  return (
    <div className="grid sm:grid-cols-3 gap-8">
      {topTiers?.map((player, index) => (
        <div key={index} className="flex flex-col bg-black-gray-70 p-4 gap-4">
          <div className="flex justify-between relative">
            <div className="text-ak-blue font-bold text-xl">
              {rankMap[index + 1]}
            </div>
            <StyledFinalResultRank>NO.{index + 1}</StyledFinalResultRank>
          </div>
          <div className="relative flex flex-row sm:flex-col lg:flex-row gap-4">
            <StyledFinalResultAvatar className="shrink-0 w-20 h-20 sm:min-w-20 sm:min-h-20 aspect-square pt-1 pr-1">
              <div className="imgWrapper">
                <img
                  src={player.face}
                  className="p-1 aspect-square"
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
            </StyledFinalResultAvatar>
            <div className="flex flex-col">
              <div className="text-white text-3xl">{player.name}</div>
              <div className="text-ak-blue text-xl pt-2">
                {player.games[player.games.length - 1].point}
              </div>
            </div>
            <img
              src={`/images/squad/${player.games[player.games.length - 1].starterSquad}.png`}
              alt="squad"
              className="absolute bottom-0 right-0 h-14 aspect-square object-contain self-end opacity-30"
            />
          </div>
          <div className="bg-black-gray text-center p-2">
            {player.games[player.games.length - 1].ending}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TournamentFinalResultTeam({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  const topTiers = tournamentData.teams
    ?.filter(
      (team) =>
        team.finalRank && 0 < team.finalRank && team.finalRank <= 2,
    )
    .sort((a, b) =>
      a.finalRank && b.finalRank ? a.finalRank - b.finalRank : 0,
    );

  if (!topTiers?.length) return <>暂无比赛结果</>;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {topTiers?.map((team, index) => (
        <div key={index} className="flex flex-col bg-black-gray-70 p-4 gap-4">
          <div className="flex justify-between relative">
            <div className="text-ak-blue font-bold text-xl">
              {rankMap[index + 1]}
            </div>
            <StyledFinalResultRank>NO.{index + 1}</StyledFinalResultRank>
          </div>
          <div className="relative flex flex-row gap-4">
            <StyledFinalResultAvatar className="shrink-0 w-20 h-20 sm:min-w-20 sm:min-h-20 aspect-square pt-1 pr-1">
              <div className="imgWrapper">
                <img
                  src={team.avatar}
                  className="p-1 aspect-square"
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
            </StyledFinalResultAvatar>
            <div className="flex flex-col">
              <div className="text-white text-3xl">{team.name}</div>
              <div className="text-ak-blue text-xl pt-2">
                {team.stages[team.stages.length - 1].point}
              </div>
            </div>
          </div>
          {team.members.map((member, index) => {
            const player = tournamentData.players?.find(
              (player) => player.name === member,
            );
            return <div key={index} className="relative bg-black-gray flex items-center justify-between gap-4 pl-8 py-2">
              {team.keyMember === member && <span className="absolute h-full left-2 flex items-center">
                <StarIcon className="text-ak-blue" width="1rem" />
              </span>}
              <div className="w-[25%]">{player?.name}</div>
              <div className="w-[20%]">{member === team.keyMember ? '创想家' : '讲述者'}</div>
              <div className="hidden lg:block w-[25%]">
                {player?.games[player.games.length - 1].starterSquad}
              </div>
              <div className="flex justify-center items-center w-[15%] lg:hidden">
                <img
                  src={`/images/squad/${player?.games[player.games.length - 1].starterSquad}.png`}
                  alt="squad"
                  className="h-10 aspect-square object-contain"
                />
              </div>
              <div className="w-[15%]">{player?.games[player.games.length - 1].strategy}</div>
              <div className="w-[15%]">{player?.games[player.games.length - 1].point}</div>
            </div>
          })}
        </div>
      ))}
    </div>
  );
}

export default function TournamentFinalResultWrapper({
  tournamentData,
}: {
  tournamentData: TournamentData;
}) {
  if (new Date().getTime() < tournamentData.stages[tournamentData.stages.length - 1].endTime) return null;

  return (
    <div className="my-16">
      <SectionContainer
        title="比赛结果"
        content={
          tournamentData.type === 'team'
            ? <TournamentFinalResultTeam
                tournamentData={tournamentData}
              />
            : <TournamentFinalResultIndividual
                tournamentData={tournamentData}
              />
        }
      />
    </div>
  )
}
