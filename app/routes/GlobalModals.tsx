import ReportModal from "~/modules/RecordDisplay/ReportModal";
import InclusionPrincipleModal from "~/components/Modal/InclusionPrincipleModal";

export default function GlobalModals() {
  return (
    <>
      <ReportModal id="report-modal" />
      <InclusionPrincipleModal id="inclusion-principle" />
    </>
  );
}
