import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { styled } from "styled-components";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import TournamentForm from "../components/TournamentForm";
import {
  StyledBackButton,
  StyledBackButtonContainer,
  StyledDivider,
} from "../components/Shared";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useEditLock } from "~/hooks/useEditLock";
import EditLockConfirmModal from "~/components/EditLock/EditLockConfirmModal";
import TournamentPermission from "../TournamentPermission";
import {
  tournamentServices,
  type PendingMeta,
} from "~/services/tournamentServices";
import type { TournamentData } from "~/types/tournamentsData";
import { formatDateTime } from "~/utils/date";

const StyledPendingBanner = styled.div`
  background: rgba(250, 204, 21, 0.15);
  border: 1px solid rgba(250, 204, 21, 0.5);
  color: #facc15;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
`;

const StyledRejectedBanner = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
`;

export default function TournamentEdit() {
  const { tournamentId } = useParams();
  const { userInfo } = useUserInfoStore();
  const { tournamentsData } = useTournamentDataStore();
  const baseTournamentData =
    tournamentsData &&
    tournamentsData.find((tournament) => tournament.id === tournamentId);
  const navigate = useNavigate();

  type EditView = { tournament: TournamentData | null; meta: PendingMeta | null };
  const [editView, setEditView] = useState<EditView | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    if (!tournamentId) return;
    tournamentServices
      .getEditView(tournamentId)
      .then((res) => {
        if (cancelled) return;
        setEditView({
          tournament: res.data.tournament,
          meta: res.data.pendingMeta,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // 接口失败时回退到 store 数据，保证页面仍能加载
        setEditView({ tournament: null, meta: null });
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  const isLoading = editView === "loading";
  const pendingMeta = isLoading ? null : editView.meta;
  const tournamentData = isLoading
    ? baseTournamentData
    : (editView.tournament ?? baseTournamentData);

  const editLock = useEditLock({
    resourceType: "tournament",
    resourceId: tournamentId || "",
    username: userInfo?.username || "",
    enabled: !!(tournamentId && userInfo?.username),
  });

  const backButton = (
    <StyledBackButtonContainer>
      <div className="relative test">
        <StyledBackButton
          onClick={() => navigate(`/tournament/${tournamentId}`)}
        >
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
  );

  if (editLock.isLoading || isLoading) {
    return (
      <div className="relative">
        {backButton}
        <div className="text-2xl font-bold">加载中...</div>
      </div>
    );
  }

  // 赛事不存在
  if (!tournamentData) {
    return (
      <div className="relative">
        {backButton}
        <div className="text-2xl font-bold">暂未收录此比赛</div>
      </div>
    );
  }

  // 被其他用户锁定
  if (editLock.lockStatus.isLocked && !editLock.lockStatus.canEdit) {
    return (
      <div className="relative">
        {backButton}
        <div className="text-2xl font-bold text-red-600">
          该赛事正在被 {editLock.lockStatus.lockedBy} 编辑，请稍后再试
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {backButton}
      <h1 className="text-[1.5rem] font-bold">编辑{tournamentData.name}</h1>
      {editLock.lockStatus.canEdit && (
        <div className="text-sm text-green-600 mb-2">当前由您锁定编辑中</div>
      )}
      {pendingMeta?.status === "rejected" && (
        <StyledRejectedBanner>
          ✗ 上次提交未通过审核（审核人：
          {pendingMeta.reviewerUsername || "—"}，审核时间：
          {pendingMeta.reviewedAt ? formatDateTime(pendingMeta.reviewedAt) : "—"}）
          <div className="mt-1">
            审核意见：{pendingMeta.reviewNote || "（未提供）"}
          </div>
          <div className="mt-1 text-white/60">
            当前展示的是上次被拒的版本，您可在此基础上修改后重新提交。
          </div>
        </StyledRejectedBanner>
      )}
      {pendingMeta?.status === "pending" && (
        <StyledPendingBanner>
          ⏳ 该赛事有修改正在等待审核（提交人：{pendingMeta.submitterUsername}
          ，提交时间：{formatDateTime(pendingMeta.submittedAt)}）。当前显示的是待审核版本，您的修改将在此基础上叠加。
        </StyledPendingBanner>
      )}
      <StyledDivider />
      <TournamentForm tournamentData={tournamentData} edit />

      {/* 赛事授权 */}
      {userInfo?.level! > 3 && (
        <TournamentPermission tournamentData={tournamentData} />
      )}

      {/* 编辑确认弹窗 */}
      <EditLockConfirmModal
        isOpen={editLock.isModalOpen}
        message={editLock.confirmMessage}
        resourceType="赛事"
        onConfirmContinue={editLock.handleConfirmContinue}
        onCancelEdit={editLock.handleCancelEdit}
      />
    </div>
  );
}
