import { useParams } from "react-router";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import React from "react";
import UploadCenterTrigger from "~/components/COS/UploadCenterTrigger";

export default function TournamentEdit() {
  const { tournamentId } = useParams();
  const { tournamentsData } = useTournamentDataStore();
  const tournamentData =
    tournamentsData &&
    tournamentsData.find((tournament) => tournament.id === tournamentId);

  if (!tournamentData) {
    return <div className="text-2xl font-bold">暂未收录此比赛</div>;
  }

  return (
    <div>
      在这里编辑 {tournamentData.name} 的内容
      <UploadCenterTrigger />
    </div>
  );
}
