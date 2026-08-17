import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { styled } from "styled-components";
import Loading from "~/components/Loading";
import TournamentView from "~/modules/Tournament/TournamentDetail/TournamentView";
import DeltaView from "~/components/AuditLog/DeltaView";
import {
  getTournamentPreview,
  type PreviewError,
  type TournamentPreviewResponse,
} from "~/services/previewServices";
import { useGameDataStore } from "~/stores/gameDataStore";
import { formatDateTime } from "~/utils/date";

type FetchState =
  | { kind: "loading" }
  | { kind: "ok"; data: TournamentPreviewResponse }
  | { kind: "err"; err: PreviewError };

const StyledBanner = styled.div<{ status: "pending" | "rejected" }>`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  padding: 0.625rem 1rem;
  font-family: "HanSans", sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
  letter-spacing: 0.02em;
  background: ${(p) => (p.status === "pending" ? "#facc15" : "#ef4444")};
  color: ${(p) => (p.status === "pending" ? "#1a1a1a" : "white")};
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
`;

const StyledBannerSub = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.125rem;
  opacity: 0.8;
`;

const StyledContainer = styled.div`
  min-height: 100vh;
  overflow: hidden;
  background-image: url("/images/bg/01.webp"), url("/images/bg/02.png");
  background-size:
    100% auto,
    100% auto;
  background-position: top, top;
  background-repeat: no-repeat, repeat-y;
  background-color: black;
  color: white;
  display: flex;
  flex-direction: column;
`;

const StyledBody = styled.div`
  padding: 1.5rem 1rem;
  max-width: 1280px;
  margin: 0 auto;
`;

const StyledFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 2rem;
`;

const StyledFallbackTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`;

const StyledChangesSection = styled.section`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
`;

const StyledChangesTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: "HanSans", sans-serif;
  color: white;
  margin-bottom: 0.25rem;
`;

const StyledChangesHint = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 0.75rem;
`;

export default function TournamentPreview() {
  const { token } = useParams();
  const { topics, fetchGameDataBasic } = useGameDataStore();
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  // 预览页是独立路由，不经过 RootLayout 的预加载，要自己确保 gameData 就绪
  useEffect(() => {
    if (!topics) {
      fetchGameDataBasic();
    }
  }, [topics, fetchGameDataBasic]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState({
        kind: "err",
        err: { status: "not_found", message: "链接无效", httpStatus: 404 },
      });
      return;
    }
    setState({ kind: "loading" });
    getTournamentPreview(token).then((res) => {
      if (cancelled) return;
      if ("status" in res && (res.status === "pending" || res.status === "rejected")) {
        setState({ kind: "ok", data: res as TournamentPreviewResponse });
      } else {
        setState({ kind: "err", err: res as PreviewError });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <StyledContainer>
        <Loading />
      </StyledContainer>
    );
  }

  if (state.kind === "err") {
    const isApproved = state.err.status === "approved";
    return (
      <StyledContainer>
        <StyledFallback>
          <StyledFallbackTitle>
            {isApproved ? "审核已完成，链接已失效" : "链接无效"}
          </StyledFallbackTitle>
          <div>{state.err.message}</div>
        </StyledFallback>
      </StyledContainer>
    );
  }

  const { data } = state;

  return (
    <StyledContainer>
      {data.status === "pending" && (
        <StyledBanner status="pending">
          审核中 ⚠ 该页仅用于内部审核，未对外发布
          <StyledBannerSub>
            提交人：{data.submitterUsername} · 提交时间：
            {formatDateTime(data.submittedAt)}
          </StyledBannerSub>
        </StyledBanner>
      )}
      {data.status === "rejected" && (
        <StyledBanner status="rejected">
          已拒绝 ✗ 该版本未通过审核
          <StyledBannerSub>
            提交人：{data.submitterUsername}
            {data.reviewerUsername
              ? ` · 审核人：${data.reviewerUsername}`
              : ""}
            {data.reviewNote ? ` · 拒绝原因：${data.reviewNote}` : ""}
          </StyledBannerSub>
        </StyledBanner>
      )}

      <StyledBody>
        {topics ? (
          <TournamentView tournamentData={data.tournament} />
        ) : (
          <Loading />
        )}

        <StyledChangesSection>
          <StyledChangesTitle>本次提交的变更</StyledChangesTitle>
          <StyledChangesHint>当前发布版本 → 提交版本</StyledChangesHint>
          <DeltaView
            delta={data.delta}
            emptyText="未检测到字段变更（可能是新建赛事的首次提交）"
          />
        </StyledChangesSection>
      </StyledBody>
    </StyledContainer>
  );
}
