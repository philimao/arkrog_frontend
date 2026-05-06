import TournamentPreview from "~/modules/Preview/TournamentPreview";

// 公开访问，无 RootLayout / TopNav / PageNav，避免审核员被引向其他页
export default function PreviewTournamentLayout() {
  return <TournamentPreview />;
}
