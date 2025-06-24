import type { TournamentData } from "~/types/tournamentsData";
import TournamentView from "./TournamentView";

export default function TournamentPreview({ formData }: { formData: TournamentData }) {
  return (
    <TournamentView tournamentData={formData} showPreviewBanner={true} />
  );
}
