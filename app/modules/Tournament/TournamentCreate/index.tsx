import TournamentForm from "../components/TournamentForm";
import { StyledBackButton, StyledBackButtonContainer, StyledDivider } from "../components/Shared";
import { useNavigate } from "react-router";

export default function TournamentCreate() {
  const navigate = useNavigate();

  return (
    <div className="container relative">
      <StyledBackButtonContainer>
        <div className="relative">
          <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
        </div>
      </StyledBackButtonContainer>
      <h1 className="text-[1.5rem] font-bold">新建赛事</h1>
      <StyledDivider />
      <TournamentForm />
    </div>
  );
}
