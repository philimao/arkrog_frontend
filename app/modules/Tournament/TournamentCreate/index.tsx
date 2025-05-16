import UploadCenterTrigger from "~/components/COS/UploadCenterTrigger";
import TournamentForm from "../components/TournamentForm";
import { StyledDivider } from "../components/Shared";

export default function TournamentCreate() {
  return (
    <div>
      <h1 className="text-[1.5rem] font-bold">新建赛事</h1>
      <StyledDivider />
      <TournamentForm />
      <UploadCenterTrigger />
    </div>
  );
}
