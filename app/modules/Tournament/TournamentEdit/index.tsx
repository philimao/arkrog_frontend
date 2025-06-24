import { useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import TournamentForm from "../components/TournamentForm";
import { StyledBackButton, StyledBackButtonContainer, StyledDivider } from "../components/Shared";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useEditLock } from "~/hooks/useEditLock";
import EditLockConfirmModal from "~/components/EditLock/EditLockConfirmModal";

export default function TournamentEdit() {
  const { tournamentId } = useParams();
  const { userInfo } = useUserInfoStore();
  const { tournamentsData, fetchTournamentPlayer } = useTournamentDataStore();
  const tournamentData = tournamentsData && tournamentsData.find((tournament) => tournament.id === tournamentId);
  const navigate = useNavigate();

  // 稳定的回调函数
  const onLockSuccess = useCallback(() => {
    console.log("Tournament locked successfully");
  }, []);

  const onLockFailed = useCallback((reason: string) => {
    console.warn("Failed to lock tournament:", reason);
  }, []);

  const onUnlocked = useCallback(() => {
    console.log("Tournament unlocked");
  }, []);

  // 使用通用编辑锁定Hook
  const editLock = useEditLock({
    resourceType: "tournament",
    resourceId: tournamentId || "",
    username: userInfo?.username || "",
    enabled: !!(tournamentId && userInfo?.username),
    onLockSuccess,
    onLockFailed,
    onUnlocked,
  });

  // 加载选手数据
  useEffect(() => {
    const loadPlayers = async () => {
      if (tournamentId && tournamentData && !tournamentData.players && editLock.lockStatus.canEdit) {
        await fetchTournamentPlayer(tournamentId);
      }
    };
    loadPlayers();
  }, [tournamentsData, tournamentId, fetchTournamentPlayer, tournamentData, editLock.lockStatus.canEdit]);

  // 加载中状态
  if (editLock.isLoading) {
    return (
      <div className="relative">
        <StyledBackButtonContainer>
          <div className="relative">
            <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
          </div>
        </StyledBackButtonContainer>
        <div className="text-2xl font-bold">加载中...</div>
      </div>
    );
  }

  // 赛事不存在
  if (!tournamentData) {
    return (
      <div className="relative">
        <StyledBackButtonContainer>
          <div className="relative">
            <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
          </div>
        </StyledBackButtonContainer>
        <div className="text-2xl font-bold">暂未收录此比赛</div>
      </div>
    );
  }

  // 被其他用户锁定
  if (editLock.lockStatus.isLocked && !editLock.lockStatus.canEdit) {
    return (
      <div className="relative">
        <StyledBackButtonContainer>
          <div className="relative">
            <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
          </div>
        </StyledBackButtonContainer>
        <div className="text-2xl font-bold text-red-600">
          该赛事正在被 {editLock.lockStatus.lockedBy} 编辑，请稍后再试
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <StyledBackButtonContainer>
        <div className="relative">
          <StyledBackButton onClick={() => navigate(-1)}>返回</StyledBackButton>
        </div>
      </StyledBackButtonContainer>
      <h1 className="text-[1.5rem] font-bold">编辑{tournamentData.name}</h1>
      {editLock.lockStatus.canEdit && <div className="text-sm text-green-600 mb-2">当前由您锁定编辑中</div>}
      <StyledDivider />
      <TournamentForm tournamentData={tournamentData} edit />

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
