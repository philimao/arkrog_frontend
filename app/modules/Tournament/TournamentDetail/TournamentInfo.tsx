import type { TournamentData, TournamentGame } from "~/types/tournamentsData";
import { generateDateArray, SectionContainer } from ".";
import React, { useState } from "react";
import { StarIcon } from "~/components/Icons";
import TournamentProgress from "./TournamentProgress";
import { StyledDivider, StyledStageTitleNum } from "../components/Shared";

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
  onSelect
}: {
  items: readonly string[],
  activeIndex: number,
  onSelect: (index: number) => void
}) => (
  <div className="flex gap-4">
    {items.map((item, index) => (
      <button
        key={item}
        className={`${activeIndex === index ? 'text-ak-blue' : 'text-light-gray'}`}
        onClick={() => onSelect(index)}
      >
        {item}
      </button>
    ))}
  </div>
);

const StageHeader = ({
  stageName,
  playerCount,
  isFinal
}: {
  stageName: string,
  playerCount: number,
  isFinal: boolean
}) => (
  <div className="h-8 bg-dark-gray mb-4 inline-flex gap-3 px-4">
    <div className="font-medium text-xl pt-[2px]">{stageName}</div>
    <StyledStageTitleNum
      className={`${isFinal ? "text-ak-red" : "text-ak-blue"}`}
    >
      {playerCount}
    </StyledStageTitleNum>
  </div>
);

const SessionHeader = ({
  sessions
}: {
  sessions: Set<string>
}) => (
  sessions.size > 0 && (
    <tr className="bg-black-gray text-center divide-x divide-mid-gray">
      <td className="opacity-0 w-16 sm:w-32">placeholder</td>
      {Array.from(sessions).map((session, index) => (
        <td key={index} className="text-light-gray py-4">
          {session}
        </td>
      ))}
    </tr>
  )
);

const DateCell = ({
  dateIndex,
  date
}: {
  dateIndex: number,
  date: Date
}) => (
  <td className="text-center w-16 sm:w-32">
    <div className="text-2xl text-white font-medium">
      Day{dateIndex + 1}
    </div>
    <div className="text-sm">{`${date.getMonth() + 1}月${date.getDate()}日`}</div>
  </td>
);

const ScheduleCell = ({
  schedule,
  date,
  session,
  sessionIndex,
  renderPlayer
}: {
  schedule: Map<string, TournamentGame>,
  date: string,
  session?: string,
  sessionIndex?: number,
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode
}) => {
  const sortedSchedule = Array.from(schedule.entries())
    .filter((entry) => new Date(entry[1].date).toDateString() === date)
    .sort((a, b) => a[1].date - b[1].date)
    .filter((entry) => (session ? entry[1].session === session : entry));

  return (
    <td key={sessionIndex} className="text-light-gray py-4 align-top">
      <div className="flex gap-4 px-4 flex-wrap">
        {sortedSchedule.map((entry, index) => (
          <span key={index}>{renderPlayer(entry[0], true)}</span>
        ))}
      </div>
    </td>
  );
};

// Team components
const TeamAvatar = ({
  avatarUrl
}: {
  avatarUrl: string
}) => (
  <div className="flex items-center justify-center">
    <img
      src={avatarUrl}
      alt="team avatar"
      className="h-16 aspect-square object-contain"
    />
  </div>
);

const TeamNameCell = ({
  name,
  id
}: {
  name: string,
  id?: string
}) => (
  <div className="p-4 flex flex-col">
    <p className="text-white text-xl">{name}</p>
    <p className="text-xs">{id}</p>
  </div>
);

const TeamMembersCell = ({
  members,
  leader,
  renderPlayer
}: {
  members: string[],
  leader?: string,
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode
}) => (
  <div className="p-4 flex gap-x-12 gap-y-4 justify-center flex-wrap">
    {members.map((member, index) => (
      <div className="relative" key={index}>
        {leader === member && (
          <StarIcon className="text-ak-blue absolute -left-4 top-6" width="1rem" />
        )}
        {renderPlayer(member, true)}
      </div>
    ))}
  </div>
);

// Main components
export function TournamentSchedule({
  tournamentData,
  renderPlayer,
}: TournamentComponentProps) {
  const players = tournamentData.players;
  if (!players?.length) return <div>暂无赛程</div>;

  return tournamentData.stages?.map((stage, index) => {
    // Prepare data for this stage
    const dates = generateDateArray(stage.startTime, stage.endTime);
    const schedule = new Map<string, TournamentGame>();
    const sessions = new Set<string>();

    players.forEach((player) => {
      const game = player.games.find((game) => game.stage === stage.name);
      if (game) {
        if (game.session) sessions.add(game.session);
        schedule.set(player.mid, game);
      }
    });

    const uniquePlayersCount = schedule.size;
    const isFinal = index === tournamentData.stages.length - 1;

    return (
      <div key={index} className="mb-4">
        <StageHeader
          stageName={stage.name}
          playerCount={uniquePlayersCount}
          isFinal={isFinal}
        />

        <table className="w-full border-collapse table-fixed">
          <tbody className="divide-y divide-mid-gray">
            <SessionHeader sessions={sessions} />

            {dates.map((date, dateIndex) => (
              <tr
                key={dateIndex}
                className="bg-black-gray-70 divide-x divide-mid-gray"
              >
                <DateCell dateIndex={dateIndex} date={date} />

                {sessions.size
                  ? Array.from(sessions)?.map((session, sessionIndex) => (
                      <ScheduleCell
                        key={sessionIndex}
                        schedule={schedule}
                        date={date.toDateString()}
                        session={session}
                        sessionIndex={sessionIndex}
                        renderPlayer={renderPlayer}
                      />
                    ))
                  : (
                    <ScheduleCell
                      schedule={schedule}
                      date={date.toDateString()}
                      renderPlayer={renderPlayer}
                    />
                  )}
              </tr>
            ))}
          </tbody>
        </table>

        {!isFinal && <StyledDivider />}
      </div>
    );
  });
}

export function TournamentTeamInfo({
  tournamentData,
  renderPlayer,
}: TournamentComponentProps) {
  return (
    <table className="w-full border-collapse table-auto divide-y divide-mid-gray">
      <thead className="bg-black-gray">
        <tr className="divide-x divide-mid-gray">
          <td className="p-4 text-center">队徽</td>
          <td className="p-4 text-center">队名</td>
          <td className="p-4 text-center">队员</td>
        </tr>
      </thead>
      <tbody className="bg-black-gray-70 border-collapse divide-y divide-mid-gray">
        {tournamentData.teams?.map((team, index) => (
          <tr key={index} className="divide-x divide-mid-gray">
            <td>
              <TeamAvatar avatarUrl={team.avatar} />
            </td>
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
    tournamentData.type === 'team' ? '参赛队伍' : '参赛选手',
    '比赛进程'
  ] as const;

  const renderContent = () => {
    if (navItem === 0) {
      return tournamentData.type === 'team' ? (
        <TournamentTeamInfo
          tournamentData={tournamentData}
          renderPlayer={renderPlayer}
        />
      ) : (
        <TournamentSchedule
          tournamentData={tournamentData}
          renderPlayer={renderPlayer}
        />
      );
    }

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
