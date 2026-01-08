import React, { useEffect, useRef, useState } from "react";
import type {
  TournamentData,
  TournamentGame,
  TournamentStage,
} from "~/types/tournamentsData";
import { styled } from "styled-components";
import { ArrowLeftIcon, ArrowRightIcon } from "~/components/Icons";
import { generateDateArray } from "~/utils/date";

// Styled components
const StyledNav = styled.nav`
  position: relative;
  text-align: center;

  &:not(:last-child)::after {
    width: 100%;
    content: "";
    position: absolute;
    right: -1px;
    top: 5px;
    bottom: 5px;
    border-right: 1px solid var(--light-mid-gray);
    pointer-events: none;
    z-index: 1;
  }
`;

// Helper components
const DateNavigation = ({
  dates,
  activeIndex,
  setActiveIndex,
}: {
  dates: Date[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const moved = useRef(false);

  const DRAG_THRESHOLD = 5; // px

  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    moved.current = false;

    startX.current = e.pageX;
    scrollLeft.current = containerRef.current.scrollLeft;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const walk = e.pageX - startX.current;

    if (Math.abs(walk) > DRAG_THRESHOLD) {
      moved.current = true;
      containerRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const onMouseUp = () => {
    isDragging.current = false;

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    // If user dragged, prevent button click
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onClickCapture={onClickCapture}
      className="bg-black-gray flex hide-scroll overflow-scroll mb-4 mt-8 sm:mt-4 gap-[1px] select-none"
    >
      {dates.map((date, index) => (
        <StyledNav
          key={index}
          className={
            "flex justify-center items-center gap-x-2 p-1 flex-wrap " +
            `${activeIndex === index && "bg-ak-blue"}`
          }
          role="button"
          onClick={() => setActiveIndex(index)}
          style={{
            minWidth: `calc(${Math.max(100 / dates.length, 18)}% - 1px)`,
          }}
        >
          <div
            className={`font-bold ${activeIndex === index ? "text-black" : "text-white"}`}
          >
            Day{index + 1}
          </div>
          <div
            className={`${activeIndex === index ? "text-black" : "text-light-mid-gray"}`}
          >{`${date.getMonth() + 1}月${date.getDate()}日`}</div>
        </StyledNav>
      ))}
    </div>
  );
};

const StageNavigation = ({
  currentStageIndex,
  setCurrentStageIndex,
  stages,
}: {
  currentStageIndex: number;
  setCurrentStageIndex: (index: number) => void;
  stages: TournamentStage[];
}) => (
  <>
    {currentStageIndex > 0 && (
      <div
        className="flex items-center justify-end gap-2 text-ak-blue absolute top-4 -left-[88px] w-20 border-none"
        role="button"
        onClick={() => setCurrentStageIndex(currentStageIndex - 1)}
      >
        {stages[currentStageIndex - 1].name}
        <ArrowLeftIcon />
      </div>
    )}
    {currentStageIndex < stages.length - 1 && (
      <div
        className="flex items-center justify-start gap-2 text-ak-blue absolute top-4 left-full ml-2 w-20 border-none"
        role="button"
        onClick={() => setCurrentStageIndex(currentStageIndex + 1)}
      >
        <ArrowRightIcon />
        {stages[currentStageIndex + 1].name}
      </div>
    )}
  </>
);

const TableHeader = ({
  stageName,
  group,
}: {
  stageName: string;
  group?: string;
}) => (
  <thead>
    <tr>
      <td
        className="text-center bg-black-gray text-light-gray py-4"
        colSpan={7}
      >
        {stageName}
        {group}
      </td>
    </tr>
  </thead>
);

const EmptySchedule = ({ isTeam }: { isTeam: boolean }) =>
  isTeam ? (
    <td className="text-center p-2 text-xl">暂无赛事</td>
  ) : (
    <tbody>
      <tr>
        <td className="text-center p-2 text-xl">暂无赛事</td>
      </tr>
    </tbody>
  );

const SquadDisplay = ({
  squadName,
  showIcon = false,
}: {
  squadName: string;
  showIcon?: boolean;
}) =>
  showIcon ? (
    <div className="flex flex-col justify-center items-center text-center">
      <p>{squadName}</p>
    </div>
  ) : (
    <div className="flex justify-center items-center">
      <img
        src={`/images/squad/${squadName}.png`}
        alt="squad"
        className="h-10 aspect-square object-contain"
      />
    </div>
  );

const TimeDisplay = ({ date }: { date: number }) => (
  <div className="flex justify-center items-center p-2">
    {new Date(date).toLocaleTimeString("zh-CN").slice(0, -3)}
  </div>
);

const PointDisplay = ({ point }: { point?: number }) => (
  <div className="flex flex-col justify-center items-center px-2">
    <p className="text-ak-blue text-xl">{point}</p>
  </div>
);

// Individual schedule row component
const IndividualScheduleRow = ({
  entry,
  renderPlayer,
  tournamentData,
  currentStage,
}: {
  entry: [string, TournamentGame];
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
  tournamentData: TournamentData;
  currentStage: TournamentStage;
}) => {
  const player = tournamentData.players?.find(
    (player) => player.mid === entry[0],
  );

  return (
    <tr className="divide-x divide-mid-gray table-auto">
      {player && Object.keys(player.customPlayerValues).length > 0 && (
        <td>
          <div className="flex flex-col justify-center items-center text-center px-2">
            {Object.keys(player.customPlayerValues).map((key) => (
              <p key={key}>{player.customPlayerValues[key]}</p>
            ))}
          </div>
        </td>
      )}
      {/* Player - Desktop */}
      <td className="hidden md:table-cell p-4">
        <div className="flex items-center">{renderPlayer(entry[0])}</div>
      </td>
      {/* Player - Mobile */}
      <td className="table-cell md:hidden py-4">
        <div className="flex justify-center items-center">
          {renderPlayer(entry[0], true)}
        </div>
      </td>
      {/* Squad */}
      {entry[1].starterSquad && (
        <>
          <td className="hidden md:table-cell px-4">
            <SquadDisplay squadName={entry[1].starterSquad} showIcon />
          </td>
          <td className="table-cell p-4 md:hidden">
            <SquadDisplay squadName={entry[1].starterSquad} />
          </td>
        </>
      )}
      {/* Ending */}
      {entry[1].ending && (
        <td className="hidden sm:table-cell p-4">
          <div className="flex justify-center items-center text-center">
            {entry[1].ending}
          </div>
        </td>
      )}
      {/* Points */}
      {entry[1].point && (
        <td>
          <div className="flex flex-col justify-center items-center text-center">
            {currentStage.groupBy &&
              entry[1].customStageValues[currentStage.groupBy] && (
                <p>{entry[1].customStageValues[currentStage.groupBy]}</p>
              )}
            <PointDisplay point={entry[1].point} />
          </div>
        </td>
      )}
      {/* Time */}
      <td>
        <TimeDisplay date={entry[1].date} />
      </td>
    </tr>
  );
};

// Team schedule row component
const TeamScheduleRow = ({
  entry,
  renderPlayer,
  tournamentData,
  currentStage,
}: {
  entry: [string, TournamentGame];
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
  tournamentData: TournamentData;
  currentStage: TournamentStage;
}) => {
  const team = tournamentData.teams?.find((team) =>
    team.members.includes(entry[0]),
  );

  return (
    <tr className="divide-x divide-mid-gray">
      {/* Team Avatar */}
      <td>
        <div className="flex justify-center items-center min-w-20">
          <img
            src={team?.avatar}
            className="h-16 w-16 aspect-square"
            alt="avatar"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>
      </td>
      {/* Player */}
      <td className="hidden lg:table-cell p-4 max-w-60">
        <div className="flex items-center">{renderPlayer(entry[0])}</div>
      </td>
      <td className="table-cell lg:hidden p-4">
        <div className="flex justify-center items-center">
          {renderPlayer(entry[0], true)}
        </div>
      </td>
      {/* Squad & OP */}
      <td className="hidden md:table-cell p-2 w-48">
        <div className="flex flex-col justify-center items-center text-center gap-1">
          <p>{entry[1].starterSquad}</p>
          <p>{entry[1].starterOp}</p>
        </div>
      </td>
      <td className="table-cell p-4 md:hidden">
        <div className="flex flex-col justify-center items-center gap-2 text-center">
          <img
            src={`/images/squad/${entry[1].starterSquad}.png`}
            alt="squad"
            className="h-10 aspect-square object-contain"
          />
          <p>{entry[1].starterOp}</p>
        </div>
      </td>
      {/* custom fields */}
      {currentStage.groupBy &&
        entry[1].customStageValues[currentStage.groupBy] && (
          <td className="hidden sm:table-cell p-2 min-w-16">
            <div className="flex justify-center items-center text-center">
              {entry[1].customStageValues[currentStage.groupBy]}
            </div>
          </td>
        )}
      {/* Ending */}
      <td className="hidden sm:table-cell p-2">
        <div className="flex justify-center items-center text-center">
          {entry[1].ending}
        </div>
      </td>
      {/* Role & Points */}
      <td>
        <div className="flex flex-col justify-center items-center p-2 text-center min-w-16">
          <p>
            {entry[0] === team?.keyMember
              ? tournamentData.keyMemberAlias
              : tournamentData.memberAlias}
          </p>
          <p className="text-ak-blue text-xl">{entry[1].point}</p>
        </div>
      </td>
      {/* Time */}
      <td>
        <TimeDisplay date={entry[1].date} />
      </td>
    </tr>
  );
};

// Schedule table components
const IndividualScheduleTable = ({
  schedule,
  currentStage,
  renderPlayer,
  tournamentData,
}: {
  schedule: Map<string, TournamentGame>;
  currentStage: TournamentStage;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
  tournamentData: TournamentData;
}) => {
  const sortedSchedule = Array.from(schedule.entries()).sort(
    (a, b) => a[1].date - b[1].date,
  );

  if (sortedSchedule.length === 0) {
    return <EmptySchedule isTeam={false} />;
  }

  return (
    <tbody className="divide-y divide-mid-gray">
      {sortedSchedule.map((entry, index) => (
        <IndividualScheduleRow
          key={index}
          entry={entry}
          renderPlayer={renderPlayer}
          tournamentData={tournamentData}
          currentStage={currentStage}
        />
      ))}
    </tbody>
  );
};

const TeamScheduleTable = ({
  schedule,
  currentStage,
  renderPlayer,
  tournamentData,
}: {
  schedule: Map<string, TournamentGame>;
  currentStage: TournamentStage;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
  tournamentData: TournamentData;
}) => {
  const sortedSchedule = Array.from(schedule.entries()).sort(
    (a, b) => a[1].date - b[1].date,
  );

  if (sortedSchedule.length === 0) {
    return <EmptySchedule isTeam={true} />;
  }

  return (
    <tbody className="divide-y divide-mid-gray">
      {sortedSchedule.map((entry, index) => (
        <TeamScheduleRow
          key={index}
          entry={entry}
          renderPlayer={renderPlayer}
          tournamentData={tournamentData}
          currentStage={currentStage}
        />
      ))}
    </tbody>
  );
};

// Main component
export default function TournamentProgress({
  tournamentData,
  renderPlayer,
}: {
  tournamentData: TournamentData;
  renderPlayer: (playerMid: string, column?: boolean) => React.ReactNode;
}) {
  if (
    !tournamentData.stages ||
    tournamentData.stages.length === 0 ||
    !tournamentData.players ||
    tournamentData.players.length === 0
  ) {
    return <div>暂无比赛进程</div>;
  }

  const players = tournamentData.players;

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const isTeam = tournamentData.type === "team";
  const currentStage = tournamentData.stages[currentStageIndex];
  const dates = generateDateArray(currentStage.startTime, currentStage.endTime);

  const schedule = new Map<string, TournamentGame>();

  players.forEach((player) => {
    const game = player.games.find(
      (game) =>
        game.stage === currentStage.name &&
        new Date(game.date).toLocaleDateString("zh-CN") ===
          new Date(dates[activeIndex]).toLocaleDateString("zh-CN"),
    );

    if (game) {
      if (isTeam) schedule.set(player.name, game);
      else schedule.set(player.mid, game);
    }
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [currentStageIndex]);

  // Schedule table component
  const ScheduleTable = () => (
    <table className="w-full bg-black-gray-70 align-top divide-y divide-mid-gray">
      <TableHeader stageName={currentStage.name} />
      {isTeam ? (
        <TeamScheduleTable
          schedule={schedule}
          currentStage={currentStage}
          renderPlayer={renderPlayer}
          tournamentData={tournamentData}
        />
      ) : (
        <IndividualScheduleTable
          schedule={schedule}
          currentStage={currentStage}
          renderPlayer={renderPlayer}
          tournamentData={tournamentData}
        />
      )}
    </table>
  );

  return (
    <>
      <div>
        <DateNavigation
          dates={dates}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
      </div>
      <div className="relative w-full flex flex-col divide-y divide-mid-gray">
        <StageNavigation
          currentStageIndex={currentStageIndex}
          setCurrentStageIndex={setCurrentStageIndex}
          stages={tournamentData.stages}
        />
        <ScheduleTable />
      </div>
    </>
  );
}
