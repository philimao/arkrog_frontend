import { useParams } from "react-router";
import { _post } from "~/utils/tools";
import { useGameDataStore } from "~/stores/gameDataStore";
import Loading from "~/components/Loading";
import type { RogueKey } from "~/types/gameData";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { styled } from "styled-components";
import { useNavigate } from "react-router";
import { openModal } from "~/utils/dom";
import TournamentProgress from "./TournamentProgress";
import TournamentSchedule from "./TournamentSchedule";
import TournamentRanking from "./TournamentRanking";
import { ArrowRightIcon, BilibiliIcon } from "~/components/Icons";
import { useEffect, useState } from "react";

export const StyledDivider = styled.div`
  border-bottom: var(--ak-blue) 1px solid;
  margin: 1.25rem 0;
  width: 100%;
`

const StyledBackButtonContainer = styled.div`
  position: absolute;
  width: 100vw;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
`;

const StyledBackButton = styled.button`
  position: absolute;
  right: 0;
  top: 3.5rem;
  padding: 0.5rem 2rem;
  background: var(--black-gray);
`;

export const StyledStageTitleNum = styled.div`
  font-size: 3rem;
  font-family: "Novecento", sans-serif;
  transform: translateY(-1.25rem);
`;

const StyledFinalResultAvatar = styled.div`
  background: linear-gradient(to top right, transparent 0%, transparent 80%, var(--ak-blue) 80%,var(--ak-blue) 100%);
`

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
`

function SectionContainer({
  title,
  content,
  showArrowButton,
  buttonOnClick,
}: {
  title: string,
  content: React.ReactNode,
  showArrowButton?: boolean,
  buttonOnClick?: () => void
}) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold">{title}</div>
        {showArrowButton &&
          <ArrowRightIcon className="w-4 h-4 text-light-gray" role="button" onClick={buttonOnClick} />
        }
      </div>
      <StyledDivider />
      <div className="whitespace-pre-line text-light-gray">
        {content}
      </div>
    </div>
  )
}

export function generateDateArray(startMs: number, endMs: number): Date[] {
  const dates: Date[] = [];
  const startDate = new Date(startMs);
  const endDate = new Date(endMs);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export default function TournamentDetail() {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  const { tournamentsData, fetchTournamentPlayer } = useTournamentDataStore();
  const { topics } = useGameDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const tournamentData = tournamentsData && tournamentsData.find((tournament) => tournament.id === tournamentId);

  useEffect(() => {
    const loadPlayers = async () => {
      if (tournamentId && tournamentData && !tournamentData.players) {
        setIsLoading(true);
        try {
          await fetchTournamentPlayer(tournamentId);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPlayers();
  }, [tournamentsData, tournamentId, fetchTournamentPlayer]);

  if (isLoading || !topics || !tournamentsData) return <Loading />;

  if (!tournamentData) {
    return <div className="text-2xl font-bold">暂未收录此比赛</div>
  }

  const topicData = topics[tournamentData.rogue as RogueKey];

  const renderHeader = () => {
    return (
      <div className="flex gap-4 my-4">
        <div className="w-full max-w-40">
          {/* TODO: replace with tournament avatar */}
          <div className="w-full aspect-square bg-light-gray rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <div className="text-4xl lg:text-6xl font-bold">{tournamentData.name}{tournamentData.season && `#${tournamentData.season}`}</div>
            <div className="flex items-center gap-6">
              {tournamentData.ongoing && <div className="bg-ak-dark-red px-2 rounded-sm">进行中</div>}
              <a href={tournamentData.playBack} target="_blank" rel="noopener noreferrer">
                <BilibiliIcon
                  className="w-6 h-6 hover:text-ak-blue me-1"
                  style={{ color: "#FB7299" }}
                  role="button"
                />
              </a>
            </div>
          </div>
          <div className="text-ak-blue">{topicData.name + ' // ' + tournamentData.edition + ' // ' + tournamentData.level}</div>
          {tournamentData.labels &&
            <div className="flex gap-2 flex-wrap">
              {tournamentData.labels.map((label, index) =>
                <div key={index} className="bg-black-gray-70 px-2 rounded-sm">{label}</div>)
              }
            </div>
          }
        </div>
      </div>
    )
  }

  const renderPlayer = (playerId: string, column?: boolean) => {
    const player = tournamentData.players?.find((player) => player.id === playerId);
    return <>
      {player &&
        <div className={`flex items-center ${column ? "flex-col w-16 gap-1" : "gap-3"}`}>
          {/* TODO: replace with player's avatar */}
          <div className="w-16 h-16 aspect-square bg-light-gray" />
          <div className={`text-white ${column && "text-sm text-center"}`}>{player.name}</div>
        </div>
      }
    </>
  }

  const renderFinalResults = () => {
    const rankMap: { [key: number]: string } = {
      1: '冠军',
      2: '亚军',
      3: '季军',
    };
    const topThree = tournamentData.players
      ?.filter((player) => player.finalRank && 0 < player.finalRank && player.finalRank <= 3)
      .sort((a, b) => (a.finalRank && b.finalRank) ? a.finalRank - b.finalRank : 0);

    if (!topThree?.length) return <>暂无比赛结果</>

    return (
      <div className="grid sm:grid-cols-3 gap-8">
        {topThree?.map((player, index) => (
          <div key={index} className="flex flex-col bg-black-gray-70 p-4 gap-4">
            <div className="flex justify-between relative">
              <div className="text-ak-blue font-bold text-xl">{rankMap[index+1]}</div>
              <StyledFinalResultRank>NO.{index+1}</StyledFinalResultRank>
            </div>
            <div className="flex flex-row sm:flex-col lg:flex-row gap-4">
              {/* TODO: replace with player's avatar */}
              <StyledFinalResultAvatar className="min-w-20 pt-1 pr-1">
                <div className="aspect-square bg-light-gray" />
              </StyledFinalResultAvatar>
              <div className="flex justify-between w-full">
                <div className="flex flex-col">
                  <div className="text-white text-3xl">{player.name}</div>
                  <div className="text-ak-blue text-xl pt-2">{player.games[player.games.length - 1].point}</div>
                </div>
                <img
                  src={`/images/squad/${player.games[player.games.length - 1].starterSquad}.png`}
                  alt="squad"
                  className="h-14 aspect-square object-contain self-end opacity-30"
                />
              </div>
            </div>
            <div className="bg-black-gray text-center p-2">
              {player.games[player.games.length - 1].ending}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <StyledBackButtonContainer>
        <div className="relative">
          <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
        </div>
      </StyledBackButtonContainer>
      {renderHeader()}
      <div className="my-16">
        <SectionContainer
          title="比赛规则"
          content={tournamentData.rule}
          showArrowButton
          buttonOnClick={() => openModal("tournament-rules")}
        />
      </div>

      <div className="my-16 grid sm:grid-cols-3 gap-8">
        <SectionContainer title="主办方" content={tournamentData.organizerName} />
        <SectionContainer title="观赛直播间" content={tournamentData.room} />
        <SectionContainer title="比赛时间" content={<>
          {tournamentData.stages.map((stage, index) =>
            <div key={index} className="flex gap-2">
              <div>{stage.name}</div>
              <div>{`${new Date(stage.startTime).getMonth()+1}月${new Date(stage.startTime).getDate()}日 - ${new Date(stage.endTime).getMonth()+1}月${new Date(stage.endTime).getDate()}日`}</div>
            </div>
          )}
        </>} />
      </div>

      <div className="my-16">
        {tournamentData.ongoing
          ? <SectionContainer title="比赛进程" content={<TournamentProgress tournamentData={tournamentData} renderPlayer={renderPlayer} />} />
          : <SectionContainer title="比赛结果" content={renderFinalResults()} />
        }
      </div>

      <div className="my-16">
        <SectionContainer title="参赛选手&赛程" content={<TournamentSchedule tournamentData={tournamentData} renderPlayer={renderPlayer} />} />
      </div>

      <div>
        <SectionContainer title="排名情况" content={<TournamentRanking tournamentData={tournamentData} />} />
      </div>
    </div>
  );
}
