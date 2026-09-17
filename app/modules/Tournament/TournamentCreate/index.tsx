import TournamentForm from "../components/TournamentForm";
import {
  StyledBackButton,
  StyledBackButtonContainer,
  StyledDivider,
} from "../components/Shared";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

export default function TournamentCreate() {
  const navigate = useNavigate();
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 如果有查询参数的赛事名称，说明已经确认过了，直接显示表单
  const urlParams = new URLSearchParams(window.location.search);
  const hasTournamentName = urlParams.has("tournamentName");

  useEffect(() => {
    if (!hasTournamentName) navigate("/tournament", { replace: true });
  }, [hasTournamentName, navigate]);

  if (hasTournamentName) {
    return (
      <div className="relative">
        {!isPreviewMode && (
          <StyledBackButtonContainer>
            <div className="relative">
              <StyledBackButton onClick={() => navigate(-1)}>
                返回
              </StyledBackButton>
              <StyledBackButton
              style={{ top: "6.5rem" }}
              onClick={() =>
                document
                  .getElementById("tournament-generate-modal-trigger")
                  ?.click()
              }
            >
              智能生成
            </StyledBackButton>
          </div>
        </StyledBackButtonContainer>
        )}
        <h1 className="text-[1.5rem] font-bold">新建赛事</h1>
        <StyledDivider />
        <TournamentForm
          previewMode={isPreviewMode}
          onPreviewModeChange={setIsPreviewMode}
        />
      </div>
    );
  }

  return null;
}
