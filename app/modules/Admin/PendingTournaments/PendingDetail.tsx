import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { styled } from "styled-components";
import { Button, Textarea } from "@heroui/react";
import { toast } from "react-toastify";
import {
  adminServices,
  type PendingTournamentDetail,
} from "~/services/adminServices";
import DeltaView from "~/components/AuditLog/DeltaView";
import { formatDateTime } from "~/utils/date";
import StatusBadge from "./StatusBadge";

const StyledPage = styled.div`
  padding: 1rem 1.5rem;
  color: white;
`;

const StyledHeader = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: "HanSans", sans-serif;
  color: white;
  margin-bottom: 0.75rem;
`;

const StyledMetaCard = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const StyledMetaRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  &:last-child {
    margin-bottom: 0;
  }
`;

const StyledMetaLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  min-width: 5rem;
`;

const StyledActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const StyledUrlBox = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.25rem;
  padding: 0.375rem 0.5rem;
`;

const StyledUrlInput = styled.input`
  flex: 1;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  border: none;
  outline: none;
  user-select: all;
`;

const StyledChangesPanel = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const StyledReviewBox = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  padding: 1rem;
`;

export default function PendingDetail() {
  const { pendingId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PendingTournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!pendingId) return;
    setLoading(true);
    adminServices
      .getPendingTournament(pendingId)
      .then((res) => {
        if (!cancelled) setData(res.data.pending);
      })
      .catch((err) => {
        toast.error((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pendingId]);

  const previewUrl = data
    ? `${window.location.origin}/preview/tournament/${data.previewToken}`
    : "";

  async function handleApprove() {
    if (!data) return;
    setSubmitting(true);
    try {
      await adminServices.approvePendingTournament(data.id, note);
      toast.success("审核通过");
      navigate("/admin/pending-tournaments");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!data) return;
    if (!note.trim()) {
      toast.error("请填写拒绝原因");
      return;
    }
    setSubmitting(true);
    try {
      await adminServices.rejectPendingTournament(data.id, note);
      toast.success("已拒绝");
      navigate("/admin/pending-tournaments");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function selectUrlInput() {
    const el = document.getElementById(
      "preview-url-input",
    ) as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }

  function copyPreviewUrl() {
    if (!previewUrl) return;

    const showManualHint = () => {
      selectUrlInput();
      toast.info("复制失败：链接已选中，请按 Ctrl+C 手动复制");
    };

    const fallbackCopy = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = previewUrl;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) toast.success("链接已复制");
        else showManualHint();
      } catch {
        showManualHint();
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(previewUrl)
        .then(() => toast.success("链接已复制"))
        .catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  if (loading) {
    return <StyledPage>加载中...</StyledPage>;
  }
  if (!data) {
    return <StyledPage>记录不存在</StyledPage>;
  }

  const isPending = data.status === "pending";

  return (
    <StyledPage>
      <StyledHeader>
        审核详情 — {data.tournamentName || data.tournamentId}
      </StyledHeader>

      <StyledMetaCard>
        <StyledMetaRow>
          <StyledMetaLabel>状态：</StyledMetaLabel>
          <StatusBadge status={data.status} />
        </StyledMetaRow>
        <StyledMetaRow>
          <StyledMetaLabel>提交人：</StyledMetaLabel>
          <span>{data.submitterUsername}</span>
        </StyledMetaRow>
        <StyledMetaRow>
          <StyledMetaLabel>提交时间：</StyledMetaLabel>
          <span>{formatDateTime(data.submittedAt)}</span>
        </StyledMetaRow>
        {data.reviewerUsername && (
          <>
            <StyledMetaRow>
              <StyledMetaLabel>审核人：</StyledMetaLabel>
              <span>{data.reviewerUsername}</span>
            </StyledMetaRow>
            <StyledMetaRow>
              <StyledMetaLabel>审核时间：</StyledMetaLabel>
              <span>{formatDateTime(data.reviewedAt)}</span>
            </StyledMetaRow>
            {data.reviewNote && (
              <StyledMetaRow>
                <StyledMetaLabel>备注：</StyledMetaLabel>
                <span>{data.reviewNote}</span>
              </StyledMetaRow>
            )}
          </>
        )}
      </StyledMetaCard>

      <StyledActions>
        <Button
          color="primary"
          variant="flat"
          onPress={() => window.open(previewUrl, "_blank")}
        >
          📋 打开审核预览页
        </Button>
        <Button variant="flat" onPress={copyPreviewUrl}>
          复制链接
        </Button>
      </StyledActions>
      <StyledUrlBox>
        <StyledUrlInput
          id="preview-url-input"
          readOnly
          value={previewUrl}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
        />
      </StyledUrlBox>

      <StyledChangesPanel>
        <div className="text-sm text-white/80 mb-2">
          变更内容 — 当前发布版本 → 提交版本
        </div>
        <DeltaView
          delta={data.delta}
          emptyText="未检测到字段变更"
        />
      </StyledChangesPanel>

      <StyledReviewBox>
        <div className="text-sm text-white/80 mb-2">审核意见</div>
        <Textarea
          value={note}
          onValueChange={setNote}
          placeholder={
            isPending
              ? "请填写审核备注（拒绝时必填）"
              : "本条审核已完成"
          }
          isDisabled={!isPending}
          minRows={2}
          className="mb-3"
        />
        <div className="flex gap-2">
          <Button
            color="success"
            onPress={handleApprove}
            isDisabled={!isPending || submitting}
          >
            ✓ 通过
          </Button>
          <Button
            color="danger"
            variant="flat"
            onPress={handleReject}
            isDisabled={!isPending || submitting}
          >
            ✗ 拒绝
          </Button>
        </div>
      </StyledReviewBox>
    </StyledPage>
  );
}
