import { useParams } from "react-router";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { useNavigate } from "react-router";
import { ArrowRightIcon } from "~/components/Icons";
import React, { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { StyledBackButton, StyledBackButtonContainer, StyledEditButton } from "../components/Shared";
import TournamentView from "./TournamentView";

export function SectionContainer({
  title,
  content,
  showArrowButton,
  arrowButtonOnClick,
  navItems,
}: {
  title: string;
  content: React.ReactNode;
  showArrowButton?: boolean;
  arrowButtonOnClick?: () => void;
  navItems?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{title}</div>
          {showArrowButton && (
            <ArrowRightIcon className="w-4 h-4 text-light-gray" role="button" onClick={arrowButtonOnClick} />
          )}
        </div>
        {navItems}
      </div>
      <div className="border-b border-ak-blue my-5 w-full"></div>
      <div className="whitespace-pre-line text-light-gray">{content}</div>
    </div>
  );
}

export default function TournamentDetail() {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  const { tournamentsData, fetchTournamentPlayer } = useTournamentDataStore();
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

  if (isLoading || !tournamentsData) return <Loading />;

  if (!tournamentData) {
    return <div className="text-2xl font-bold">暂未收录此比赛</div>;
  }

  return (
    <TournamentView tournamentData={tournamentData}>
      <StyledBackButtonContainer>
        <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
        <StyledEditButton onClick={() => navigate("edit")}>编辑</StyledEditButton>
      </StyledBackButtonContainer>
    </TournamentView>
  );
}
