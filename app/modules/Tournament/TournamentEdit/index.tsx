import TournamentPreview from "../TournamentDetail/TournamentPreview";
import { toast } from "react-toastify";
import { Button, ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import ModalTemplate from "~/components/Modal";
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
import DraftConfirmModal from "../components/DraftConfirmModal";
import {
  discardTournamentDraft,
  readTournamentDraftBase,
  tournamentSnapshot,
  readTournamentDraft,
} from "../components/tournamentDraft";

const StyledPendingBanner = styled.div`
  background: var(--warning-yellow);
  color: var(--dark-gray);
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
`;

const StyledRejectedBanner = styled.div`
  background: var(--ak-dark-red);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
`;

export default function TournamentEdit() {
  const { tournamentId } = useParams();
  return <TournamentEditPage key={tournamentId} />;
}

function TournamentEditPage() {
  const { tournamentId } = useParams();
  const { userInfo } = useUserInfoStore();
  const { tournamentsData } = useTournamentDataStore();
  const baseTournamentData =
    tournamentsData &&
    tournamentsData.find((tournament) => tournament.id === tournamentId);
  const navigate = useNavigate();
  // Keep the original draft for comparison even after saving a new draft.
  const [retainedDraft, setRetainedDraft] = useState(() => readTournamentDraft(tournamentId));
  const [draftChoice, setDraftChoice] = useState<boolean | null>(() =>
    retainedDraft ? null : false,
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [checkingDraft, setCheckingDraft] = useState(false);
  const [staleDraft, setStaleDraft] = useState(false);
  const [viewDraft, setViewDraft] = useState(false);
  const [publishedVersion, setPublishedVersion] = useState<TournamentData | null>(null);
  const [usingPublishedVersion, setUsingPublishedVersion] = useState(false);

  const chooseDraft = async (restore: boolean) => {
    if (!tournamentId || checkingDraft) return;
    setCheckingDraft(true);
    try {
      const res = await tournamentServices.getEditView(tournamentId);
      if (!res.data.success || !res.data.tournament) throw new Error("Missing edit view");
      setEditView({ tournament: res.data.tournament, meta: res.data.pendingMeta });
      if (restore && (!readTournamentDraftBase(tournamentId) ||
        readTournamentDraftBase(tournamentId) !== tournamentSnapshot(res.data.tournament))) {
        setStaleDraft(true);
        return;
      }
      if (!restore && !staleDraft) {
        if (!discardTournamentDraft(tournamentId)) return;
        setRetainedDraft(null);
      }
      setDraftChoice(restore);
    } catch {
      toast.error("无法获取赛事最新版本，请稍后重试。草稿已保留。");
    } finally {
      setCheckingDraft(false);
    }
  };

  type EditView = {
    tournament: TournamentData | null;
    meta: PendingMeta | null;
  };
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

  useEffect(() => {
    let cancelled = false;
    setPublishedVersion(null);
    if (pendingMeta?.status === "rejected" && tournamentId) {
      tournamentServices.getTournamentList(true).then(res => {
        if (!cancelled) setPublishedVersion(res.data.find(item => item.id === tournamentId) ?? null);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [pendingMeta?.status, tournamentId]);

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
          onClick={() => {
            if (isPreviewMode) {
              setIsPreviewMode(false);
              window.scrollTo({ top: 0 });
            } else navigate(`/tournament/${tournamentId}`);
          }}
        >
          {isPreviewMode ? "返回编辑" : "取消"}
        </StyledBackButton>
        {!editLock.isLoading &&
          !isLoading &&
          !!tournamentData &&
          editLock.lockStatus.canEdit && (
            <StyledBackButton
              type="button"
              disabled={draftChoice === null}
              style={{ top: "6.5rem" }}
              onClick={() =>
                document
                  .getElementById("tournament-save-draft-trigger")
                  ?.click()
              }
            >
              保存草稿
            </StyledBackButton>
          )}
        {!isPreviewMode && (
          <StyledBackButton
            style={{ top: "9.5rem" }}
            onClick={() =>
              document
                .getElementById("tournament-generate-modal-trigger")
                ?.click()
            }
          >
            智能生成
          </StyledBackButton>
        )}
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

  // 只有通过编辑锁检查后，才允许恢复草稿或编辑表单。
  if (!editLock.lockStatus.canEdit) {
    return (
      <div className="relative">
        {backButton}
        <div className="text-2xl font-bold text-red-600">
          {editLock.lockStatus.isLocked
            ? `该赛事正在被 ${editLock.lockStatus.lockedBy || "其他用户"} 编辑，请稍后再试`
            : "未能取得赛事编辑权限，请刷新页面后重试"}
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
          <div className="mt-1 text-white">
            {usingPublishedVersion
              ? "当前使用的是已发布版本，您可在此基础上修改后重新提交。"
              : draftChoice === true
              ? "本地草稿基于上次被拒的版本，您可继续修改后重新提交。"
              : "当前展示的是上次被拒的版本，您可在此基础上修改后重新提交。"}
          </div>
          {publishedVersion && !usingPublishedVersion && draftChoice !== null && !isPreviewMode && (
            <button type="button" className="my-2 bg-transparent p-0 text-sm text-white underline underline-offset-4 cursor-pointer" onClick={() =>
              document.getElementById("tournament-restore-published-trigger")?.click()
            }>使用已通过的版本</button>
          )}
        </StyledRejectedBanner>
      )}
      {pendingMeta?.status === "pending" && (
        <StyledPendingBanner>
          ⏳ 该赛事有修改正在等待审核（提交人：{pendingMeta.submitterUsername}
          ，提交时间：{formatDateTime(pendingMeta.submittedAt)}）。
          {draftChoice === true
            ? "本地草稿基于待审核版本，您可继续修改后提交。"
            : "当前显示的是待审核版本，您可在此版本基础上修改后提交。"}
        </StyledPendingBanner>
      )}
      {draftChoice === true && (
        <div className="text-sm text-ak-blue mb-3">已读取本地草稿，表格已载入草稿内容。</div>
      )}
      {draftChoice === false && retainedDraft && (
        <Button onPress={() => setViewDraft(true)} className="bg-mid-dark-gray">查看保留的草稿</Button>
      )}
      <StyledDivider />
      {draftChoice !== null && (
        <TournamentForm
          key={tournamentId}
          tournamentData={tournamentData}
          edit
          restoreDraft={draftChoice === true}
          canRestorePublished={!!publishedVersion && pendingMeta?.status === "rejected" && !usingPublishedVersion}
          onRestorePublished={() => {
            setUsingPublishedVersion(true);
            setDraftChoice(false);
          }}
          previewMode={isPreviewMode}
          onPreviewModeChange={setIsPreviewMode}
        />
      )}
      <DraftConfirmModal
        isOpen={
          !editLock.isModalOpen &&
          draftChoice === null &&
          !!retainedDraft
        }
        isStale={staleDraft}
        isLoading={checkingDraft}
        onConfirm={() => void chooseDraft(true)}
        onDecline={() => void chooseDraft(false)}
        onViewDraft={() => setViewDraft(true)}
        onClose={() => navigate(`/tournament/${tournamentId}`)}
      />

      <ModalTemplate size="5xl" modalControl={{ isOpen: viewDraft, onClose: () => setViewDraft(false) }}>
        <ModalHeader>旧草稿（仅供对照）</ModalHeader>
        <ModalBody>
          {viewDraft && retainedDraft && <TournamentPreview formData={retainedDraft} />}
        </ModalBody>
        <ModalFooter><Button onPress={() => setViewDraft(false)}>关闭</Button></ModalFooter>
      </ModalTemplate>

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
        onCancelEdit={async () => {
          await editLock.handleCancelEdit();
          navigate(`/tournament/${tournamentId}`);
        }}
      />
    </div>
  );
}
