import { useEffect } from "react";
import { useParams } from "react-router";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import UploadCenterTrigger from "~/components/COS/UploadCenterTrigger";
import TournamentForm from "../components/TournamentForm";
import { StyledDivider } from "../components/Shared";

export default function TournamentEdit() {
  const { tournamentId } = useParams();
  const { tournamentsData, fetchTournamentPlayer } = useTournamentDataStore();
  const tournamentData = tournamentsData && tournamentsData.find((tournament) => tournament.id === tournamentId);
  useEffect(() => {
    const loadPlayers = async () => {
      if (tournamentId && tournamentData && !tournamentData.players) {
        await fetchTournamentPlayer(tournamentId);
      }
    };
    loadPlayers();
  }, [tournamentsData, tournamentId, fetchTournamentPlayer]);

  if (!tournamentData) {
    return <div className="text-2xl font-bold">暂未收录此比赛</div>;
  }

  return (
    <div className="container">
      <h1 className="text-[1.5rem] font-bold">编辑{tournamentData.name}</h1>
      <StyledDivider />
      <TournamentForm tournamentData={tournamentData} edit />
      <div className="mt-6">
        <UploadCenterTrigger />
      </div>
    </div>
  );
}
