import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import type { RogueKey, TopicData } from "~/types/gameData";
import type { TournamentData } from "~/types/tournamentsData";
import {
  StyledBackButton,
  StyledBackButtonContainer,
} from "./components/Shared";
import { useUserInfoStore } from "~/stores/userInfoStore";
import BilibiliUser from "~/components/BilibiliUser";

export default function TournamentsWrapper() {
  const { topics } = useGameDataStore();
  // 游戏数据
  const { fetchGameDataBasic } = useGameDataStore();
  // 赛事数据
  const { tournamentsData, initTournamentData } = useTournamentDataStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const run = async () => {
      // 用户身份由 RootLayout 在挂载时统一拉取（它会 await 完再渲染子路由），
      // 这里再调一次只会多打一次 /user/id
      await Promise.all([fetchGameDataBasic(), initTournamentData()]);
      setLoaded(true);
    };
    void run();
    return () => {
      setLoaded(false);
    };
  }, [fetchGameDataBasic, initTournamentData]);

  if (!loaded || !topics || !tournamentsData) {
    return <Loading />;
  } else {
    return <RougeSelector topics={topics} tournamentsData={tournamentsData} />;
  }
}

function RougeSelector({
  topics,
  tournamentsData,
}: {
  topics: Record<RogueKey, TopicData>;
  tournamentsData: TournamentData[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicsData = Object.values(topics);
  const { userInfo } = useUserInfoStore();
  const editable = userInfo?.level && userInfo.level > 3;

  const currentTopic: TopicData = useMemo(() => {
    const topicId = searchParams.get("topicId");
    if (topicId && topics[topicId as RogueKey]) {
      return topics[topicId as RogueKey];
    } else {
      return topicsData.slice(-1)[0];
    }
  }, [searchParams, topics]);

  // 当前主题的赛事
  const tournaments = tournamentsData
    .filter((tournament) => tournament.rogue === currentTopic.id)
    .sort((a, b) => b.stages[0]?.startTime - a.stages[0]?.startTime);
  // 展示所有当前比赛，不分主题
  const ongoingTournaments = tournamentsData
    .sort((a, b) => b.stages[0]?.startTime - a.stages[0]?.startTime)
    .filter((tournament) => tournament.ongoing);
  // 轮播实现
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
      <div className="bg-black-gray w-full mb-12 grid grid-cols-1 md:grid-cols-3 p-4">
        <div className="text-4xl font-bold flex items-center justify-center col-span-3 md:col-span-1">
          进行中：
        </div>
        <div className="col-span-2">
          {ongoingTournaments.map((tournament, index) => (
            <div
              key={index}
              className={`p-4 ${index === activeIndex ? "flex" : "hidden"}`}
              role="button"
              onClick={() => navigate(tournament.id)}
            >
              <div className="w-full max-w-32 sm:max-w-40 shrink-0">
                {tournament.avatar ? (
                  <img
                    src={tournament.avatar}
                    className="aspect-square"
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="bg-black-gray text-light-mid-gray text-base sm:text-2xl flex items-center justify-center aspect-square text-center p-2 sm:p-4">
                    {tournament.name}
                  </div>
                )}
              </div>
              <div className="flex flex-col pl-4 gap-1 min-w-0">
                <div className="text-xl sm:text-3xl font-bold">
                  {tournament.name}
                </div>
                {
                  <div className="text-sm sm:text-xl text-light-mid-gray">
                    {`${new Date(tournament.stages[0].startTime).toLocaleDateString("zh-CN")}
                  -${new Date(tournament.stages[tournament.stages.length - 1].endTime).toLocaleDateString("zh-CN")}`}
                  </div>
                }
                {
                  <div className="text-sm sm:text-base min-h-6 sm:min-h-7 leading-6 sm:leading-7">
                    版本：{topics[tournament.rogue as RogueKey].name}
                    {tournament.edition}
                  </div>
                }
                {
                  <div className="text-sm sm:text-base min-h-6 sm:min-h-7 leading-6 sm:leading-7">
                    难度：{tournament.level}
                  </div>
                }
                {
                  <div className="text-sm sm:text-base flex items-center min-h-6 sm:min-h-7 flex-wrap">
                    <div>主办：</div>
                    <div className="flex flex-wrap gap-2">
                      {tournament.organizers?.map((organizer, index) => (
                        <BilibiliUser
                          key={organizer.mid}
                          mid={organizer.mid}
                          name={organizer.name}
                          face={organizer.avatar}
                          size={6}
                        />
                      ))}
                    </div>
                  </div>
                }
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
    tournaments
      .sort(
        (a, b) =>
          new Date(b.stages[0]?.startTime || 0).getTime() -
          new Date(a.stages[0]?.startTime || 0).getTime(),
      )
      .map((tournament) => {
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
                  className="flex flex-col items-center gap-2"
                  key={tournament.id}
                >
                  <div
                    role="button"
                    className="w-full aspect-square relative"
                    onClick={() => {
                      navigate(tournament.id);
                    }}
                  >
                    {tournament.avatar ? (
                      <img
                        src={tournament.avatar}
                        className="w-full rounded-xl aspect-square bg-black-gray"
                        alt="avatar"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full rounded-xl aspect-square bg-black-gray text-light-mid-gray text-2xl flex items-center justify-center text-center p-4">
                        {tournament.name}
                      </div>
                    )}
                    {ongoingTournaments.includes(tournament) && (
                      <div className="absolute bg-ak-dark-red top-6 -right-2 px-2 rounded-sm">
                        进行中
                      </div>
                    )}
                  </div>
                  <div className="text-white text-xl">{tournament.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="relative">
      {!!ongoingTournaments?.length && renderOngoingTournaments()}
      {!!editable && (
        <StyledBackButtonContainer>
          <StyledBackButton onClick={() => navigate("create")}>
            新建赛事
          </StyledBackButton>
          <StyledBackButton
            onClick={() => navigate("create-group")}
            style={{ top: "6.5rem" }}
          >
            新建赛事集
          </StyledBackButton>
        </StyledBackButtonContainer>
      )}
      <div className="mb-12 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
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
          >
            {topic.name}
          </div>
        ))}
      </div>
      <div style={{ margin: "-2rem 0 2rem" }}>
        （当前仍在数据对接中，希望收录比赛请加入影语集反馈群 909687635
        并联系管理员）
      </div>
      {renderTournaments()}
    </div>
  );
}
