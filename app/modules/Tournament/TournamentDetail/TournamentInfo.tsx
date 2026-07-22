/**
 * 赛程信息区域
 */
import type {
  TournamentData,
  TournamentPlayer,
  TournamentTeam,
} from "~/types/tournamentsData";
import { SectionContainer } from ".";
import React, { useState } from "react";
import { StarIcon, TeamIcon } from "~/components/Icons";
import TournamentProgress from "./TournamentProgress";

// Common types
type PlayerRendererProps = {
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
};

type TournamentComponentProps = {
  tournamentData: TournamentData;
} & PlayerRendererProps;

// Helper components
const NavButtons = ({
  items,
  activeIndex,
  onSelect,
}: {
  items: readonly string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) => (
  <div className="flex gap-4">
    {items.map((item, index) => (
      <button
        key={item}
        className={`${activeIndex === index ? "text-ak-blue" : "text-light-gray"}`}
        onClick={() => onSelect(index)}
      >
        {item}
      </button>
    ))}
  </div>
);

// Team components
const TeamAvatar = ({ avatarUrl }: { avatarUrl: string }) => (
  <div className="flex items-center justify-center">
    {avatarUrl ? (
      <img
        src={avatarUrl}
        alt="team avatar"
        className="h-16 aspect-square object-contain"
      />
    ) : <TeamIcon className="w-16 h-16 p-2" />}
  </div>
);

const TeamNameCell = ({ name, id }: { name: string; id?: string }) => (
  <div className="p-4 flex flex-col">
    <p className="text-white text-xl">{name}</p>
    <p className="text-xs">{id}</p>
  </div>
);

const TeamMembersCell = ({
  members,
  leader,
  renderPlayer,
}: {
  members: string[];
  leader?: string;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
}) => (
  <div className="p-4 flex gap-x-12 gap-y-4 justify-center flex-wrap">
    {members.map((member, index) => (
      <div className="relative" key={index}>
        {leader === member && (
          <StarIcon
            className="text-ak-blue absolute -left-4 top-6"
            width="1rem"
          />
        )}
        {renderPlayer(member, true)}
      </div>
    ))}
  </div>
);

// Main components
export function TournamentPlayerInfo({
  tournamentData,
  renderPlayer,
}: TournamentComponentProps) {
  const players = tournamentData.players;
  if (!players?.length) return <div>暂无参赛选手</div>;

  // 直接存储完整选手信息，无赛程的选手也可显示
  const groupSchedule = new Map<
    Omit<TournamentPlayer & { date: number }, "games">,
    string
  >();
  const groups = new Set<string>();
  let groupBy: string = "";

  if (tournamentData.groupBy) {
    tournamentData.players?.forEach((player) => {
      // 在选手信息中寻找自定义的groupBy值
      // groupBy = "server"
      // player.customPlayerValues = {server: "简中服"}
      const groupValue = player.customPlayerValues[tournamentData.groupBy];
      const date = player.games[0]?.date || Infinity;
      const { games, ...partialPlayer } = { ...player, date };
      if (groupValue) {
        groupBy = tournamentData.customPlayerKeys[tournamentData.groupBy];
        groupSchedule.set(partialPlayer, groupValue);
        groups.add(groupValue);
      }
      // 弃用，全局groupBy与赛事阶段groupBy隔离
      // // 在赛事阶段信息中寻找自定义的groupBy值
      // // groupBy = "session"
      // // game.customStageValues = {session: "大粽场"}
      // const game = player.games.find(
      //   (game) => game.stage === tournamentData.stages[0].name,
      // );
      // const stageGroupValue = game?.customStageValues[tournamentData.groupBy];
      // if (stageGroupValue) {
      //   groupBy =
      //     tournamentData.stages[0].customStageKeys[tournamentData.groupBy];
      //   groups.add(stageGroupValue);
      //   groupSchedule.set(player.mid, stageGroupValue);
      // }
      // 定义了groupBy，但在选手中没有值，且先前已有选手有分组，则显示为“未分组”
      if (!groupValue && groupSchedule.size > 0) {
        groupSchedule.set(partialPlayer, "未分组");
        groups.add("未分组");
      }
    });
  }

  return (
    <table className="w-full border-collapse table-fixed">
      <thead className="bg-black-gray">
        <tr className="divide-x divide-mid-gray">
          {!!groups.size && <td className="p-4 text-center w-40">{groupBy}</td>}
          <td className="p-4 text-center">选手</td>
        </tr>
      </thead>
      <tbody className="divide-y divide-mid-gray">
        {groups.size ? (
          Array.from(groups).map((group, groupIndex) => (
            <tr
              key={groupIndex}
              className="bg-black-gray-70 divide-x divide-mid-gray"
            >
              <td className="text-center text-light-gray py-4">{group}</td>
              <td className="text-light-gray py-4 align-top">
                <div className="flex gap-4 px-4 flex-wrap w-fit max-w-[600px] m-auto">
                  {Array.from(groupSchedule.entries())
                    .filter((entry) => entry[1] === group)
                    .sort((a, b) => a[0].date - b[0].date)
                    .map((entry, idx) => (
                      <span key={idx}>{renderPlayer(entry[0].mid, true)}</span>
                    ))}
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr className="bg-black-gray-70 divide-x divide-mid-gray">
            <td className="text-light-gray py-4 align-top">
              <div className="flex gap-4 px-4 flex-wrap w-fit max-w-[600px] m-auto">
                {players
                  .sort(
                    (a, b) =>
                      (a.games[0]?.date || Infinity) -
                      (b.games[0]?.date || Infinity),
                  )
                  .map((player, idx) => (
                    <span key={idx}>{renderPlayer(player.mid, true)}</span>
                  ))}
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function TournamentTeamInfo({
  tournamentData,
  renderPlayer,
}: TournamentComponentProps) {
  const teams = tournamentData.teams;
  if (!teams?.length) return <div>暂无参赛队伍</div>;

  const hasAvatar = teams.some((team) => team.avatar);

  return (
    <table className="w-full border-collapse table-auto divide-y divide-mid-gray">
      <thead className="bg-black-gray">
        <tr className="divide-x divide-mid-gray">
          {hasAvatar && <td className="p-4 text-center">队徽</td>}
          <td className="p-4 text-center">队名</td>
          <td className="p-4 text-center">队员</td>
        </tr>
      </thead>
      <tbody className="bg-black-gray-70 border-collapse divide-y divide-mid-gray">
        {teams?.map((team, index) => (
          <tr key={index} className="divide-x divide-mid-gray">
            {hasAvatar && (
              <td>
                <TeamAvatar avatarUrl={team.avatar} />
              </td>
            )}
            <td>
              <TeamNameCell name={team.name} id={team.id} />
            </td>
            <td>
              <TeamMembersCell
                members={team.members}
                leader={team.leader}
                renderPlayer={renderPlayer}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TournamentInfoWrapper({
  tournamentData,
  renderPlayer,
}: TournamentComponentProps) {
  const [navItem, setNavItem] = useState(0);

  const navItems = [
    tournamentData.type === "team" ? "参赛队伍" : "参赛选手",
    "比赛进程",
  ] as const;

  const renderContent = () => {
    if (navItem === 0) {
      return tournamentData.type === "team" ? (
        <TournamentTeamInfo
          tournamentData={tournamentData}
          renderPlayer={renderPlayer}
        />
      ) : (
        <TournamentPlayerInfo
          tournamentData={tournamentData}
          renderPlayer={renderPlayer}
        />
      );
    }

    if (!tournamentData.players) return <div>暂无比赛进程</div>;

    return (
      <TournamentProgress
        tournamentData={tournamentData}
        renderPlayer={renderPlayer}
      />
    );
  };

  return (
    <div className="my-16">
      <SectionContainer
        title="赛程信息"
        content={renderContent()}
        navItems={
          <NavButtons
            items={navItems}
            activeIndex={navItem}
            onSelect={setNavItem}
          />
        }
      />
    </div>
  );
}
