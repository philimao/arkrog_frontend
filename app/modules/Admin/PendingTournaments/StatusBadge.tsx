import { styled } from "styled-components";
import type { PendingStatus } from "~/services/adminServices";

const COLOR: Record<PendingStatus, { bg: string; fg: string }> = {
  pending: { bg: "rgba(250, 204, 21, 0.2)", fg: "#facc15" },
  approved: { bg: "rgba(34, 197, 94, 0.2)", fg: "#86efac" },
  rejected: { bg: "rgba(239, 68, 68, 0.2)", fg: "#fca5a5" },
};

export const PENDING_STATUS_LABEL: Record<PendingStatus, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

const StyledChip = styled.span<{ status: PendingStatus }>`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(p) => COLOR[p.status].bg};
  color: ${(p) => COLOR[p.status].fg};
`;

export default function StatusBadge({ status }: { status: PendingStatus }) {
  return <StyledChip status={status}>{PENDING_STATUS_LABEL[status]}</StyledChip>;
}
