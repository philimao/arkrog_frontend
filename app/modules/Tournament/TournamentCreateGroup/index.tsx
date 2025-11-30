import TournamentGroupForm from "./TournamentGroupForm";
import {
  StyledBackButton,
  StyledBackButtonContainer,
  StyledDivider,
} from "../components/Shared";
import { useNavigate } from "react-router";

export default function TournamentCreateGroup() {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <StyledBackButtonContainer>
        <div className="relative">
          <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
        </div>
      </StyledBackButtonContainer>
      <h1 className="text-[1.5rem] font-bold">新建赛事集</h1>
      <StyledDivider />
      <TournamentGroupForm />
    </div>
  );
}
