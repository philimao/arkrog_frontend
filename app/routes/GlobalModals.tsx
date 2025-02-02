import ReportModal from "~/modules/RecordDisplay/ReportModal";
import InclusionPrincipleModal from "~/components/Modal/InclusionPrincipleModal";
import { ContactUsModal } from "~/components/Modal/ContactUsModal";

export default function GlobalModals() {
  return (
    <>
      <ReportModal id="report-modal" />
      <ContactUsModal id="contact-us" />
      <InclusionPrincipleModal id="inclusion-principle" />
    </>
  );
}
