import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import type { RogueKey, TopicData, Topics } from "~/types/gameData";
import type { TournamentData } from "~/types/tournamentsData";

export default function TournamentsWrapper() {
  if (!import.meta.env.DEV) {
    return <div className="text-2xl font-bold">该页面正在施工中</div>;
  }

  const { topics } = useGameDataStore();
  const { tournamentsData } = useTournamentDataStore();

  if (!topics || !tournamentsData) {
    return <Loading />;
  } else {
    return <RougeSelector topics={topics} tournamentsData={tournamentsData} />;
  }
}

function RougeSelector({
  topics,
  tournamentsData,
}: {
  topics: Topics;
  tournamentsData: TournamentData[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicsData = Object.values(topics);

  const currentTopic: TopicData = useMemo(() => {
    const topicId = searchParams.get("topicId");
    if (topicId && topics[topicId as RogueKey]) {
      return topics[topicId as RogueKey];
    } else {
      return topicsData.slice(-1)[0];
    }
  }, [searchParams, topics]);

  const tournaments = tournamentsData
    .filter((tournament) => tournament.rogue === currentTopic.id)
    .sort((a, b) => b.stages[0].startTime - a.stages[0].startTime);
  const ongoingTournaments = tournaments.filter(
    (tournament) => tournament.ongoing,
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!ongoingTournaments) return;
    const interval = setInterval(() => {
      setActiveIndex(
        (prevIndex) => (prevIndex + 1) % ongoingTournaments.length,
      );
    }, 5000); // 每5秒切换一次比赛

    return () => clearInterval(interval);
  }, [ongoingTournaments]);

  const renderOngoingTournaments = () => {
    return (
      <div className="bg-black-gray w-full mt-4 mb-12 grid grid-cols-1 md:grid-cols-3 p-4">
        <div className="text-4xl font-bold flex items-center justify-center col-span-3 md:col-span-1">
          进行中：
        </div>
        <div className="col-span-2">
          {ongoingTournaments.map((tournament, index) => (
            <div
              key={index}
              className={`p-4 ${index === activeIndex ? "flex" : "hidden"}`}
              role="button"
              onClick={() => navigate(tournament.tournamentId)}
            >
              {/* TODO: replace with images from backend */}
              <div className="w-full max-w-40">
                <div className="w-full aspect-square bg-light-gray rounded-xl" />
              </div>
              <div className="flex flex-col pl-4 gap-1">
                <div className="text-3xl font-bold">
                  {tournament.name}
                  {(tournament.seasons.length > 1 || tournament.season !== 1) &&
                    `#${tournament.season}`}
                </div>
                {
                  <div className="text-xl text-light-mid-gray">
                    {`${new Date(tournament.stages[0].startTime).toLocaleDateString("zh-CN")}
                  -${new Date(tournament.stages[tournament.stages.length - 1].endTime).toLocaleDateString("zh-CN")}`}
                  </div>
                }
                {
                  <div>
                    版本：{currentTopic.name}
                    {tournament.edition}
                  </div>
                }
                {<div>难度：{tournament.level}</div>}
                {<div>主办方：{tournament.organizerName}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTournaments = () => {
    if (!tournaments.length) {
      return (
        <div className="text-white text-2xl">
          该肉鸽暂时没有比赛，或仍未完成相关比赛的收录
        </div>
      );
    }
    const tournamentsByEdition = new Map<string, TournamentData[]>();
    tournaments.map((tournament) => {
      const edition = tournament.edition;
      if (!tournamentsByEdition.has(edition)) {
        tournamentsByEdition.set(edition, []);
      }
      tournamentsByEdition.get(edition)?.push(tournament);
    });
    const editions = Array.from(tournamentsByEdition.keys());

    return (
      <>
        {editions.map((edition) => (
          <div className="mb-16 last-of-type:mb-0" key={edition}>
            <div className="flex items-end">
              <div className="text-white font-bold text-3xl">{edition}</div>
              <div className="text-light-mid-gray text-2xl ml-6">
                {tournamentsByEdition.get(edition)?.length}
              </div>
            </div>
            <div className="w-full border-b-ak-blue border-b-1 my-4 opacity-50" />
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 grow">
              {tournamentsByEdition.get(edition)?.map((tournament) => (
                <div
                  className="flex flex-col items-center"
                  key={tournament.tournamentId}
                >
                  {/* TODO: replace with images from backend */}
                  <div
                    role="button"
                    className="w-full aspect-square bg-light-gray mb-2 rounded-xl relative"
                    onClick={() => {
                      navigate(tournament.tournamentId);
                    }}
                  >
                    {ongoingTournaments.includes(tournament) && (
                      <div className="absolute bg-ak-dark-red top-6 -right-2 px-2 rounded-sm">
                        进行中
                      </div>
                    )}
                  </div>
                  <div className="text-white text-xl">
                    {tournament.name}
                    {(tournament.seasons.length > 1 ||
                      tournament.season !== 1) &&
                      `#${tournament.season}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div>
      {!!ongoingTournaments?.length && renderOngoingTournaments()}
      <div className="flex mb-12">
        {topicsData.reverse().map((topic) => (
          <div
            key={topic.id}
            className={
              "text-center font-bold leading-[2rem] p-1 " +
              `${currentTopic.id === topic.id ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
            }
            role="button"
            onClick={() => {
              searchParams.set("topicId", topic.id);
              setSearchParams(searchParams, {
                preventScrollReset: true,
              });
            }}
            style={{ width: 100 / topicsData.length + "%" }}
          >
            {topic.name}
          </div>
        ))}
      </div>
      {renderTournaments()}
    </div>
  );
}
