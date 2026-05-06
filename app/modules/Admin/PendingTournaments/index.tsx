import { useEffect, useState } from "react";
import { Link } from "react-router";
import { styled } from "styled-components";
import { toast } from "react-toastify";
import {
  adminServices,
  type PendingStatus,
  type PendingTournamentListItem,
} from "~/services/adminServices";
import { formatDateTime } from "~/utils/date";
import StatusBadge from "./StatusBadge";

const StyledPage = styled.div`
  padding: 1rem 1.5rem;
`;

const StyledHeader = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: "HanSans", sans-serif;
  color: white;
  margin-bottom: 0.75rem;
`;

const StyledFilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const StyledFilterButton = styled.button<{ active: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: ${(p) => (p.active ? "var(--ak-blue)" : "transparent")};
  color: ${(p) => (p.active ? "black" : "white")};
  font-size: 0.875rem;
  cursor: pointer;
  &:hover {
    border-color: var(--ak-blue);
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: white;
  font-size: 0.875rem;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
`;

const StyledTd = styled.td`
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const StyledRow = styled.tr`
  transition: background 0.15s;
  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

type FilterValue = PendingStatus | "all";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "all", label: "全部" },
];

export default function PendingTournamentsList() {
  const [status, setStatus] = useState<FilterValue>("pending");
  const [items, setItems] = useState<PendingTournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminServices
      .listPendingTournaments({ status, limit: 100 })
      .then((res) => {
        if (!cancelled) setItems(res.data.items);
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
  }, [status]);

  return (
    <StyledPage>
      <StyledHeader>待审核赛事</StyledHeader>
      <StyledFilterBar>
        {FILTERS.map((f) => (
          <StyledFilterButton
            key={f.value}
            active={status === f.value}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </StyledFilterButton>
        ))}
      </StyledFilterBar>

      {loading ? (
        <div className="text-white/60 text-sm">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-white/60 text-sm">没有匹配的记录</div>
      ) : (
        <StyledTable>
          <thead>
            <tr>
              <StyledTh>赛事名</StyledTh>
              <StyledTh>提交人</StyledTh>
              <StyledTh>提交时间</StyledTh>
              <StyledTh>状态</StyledTh>
              <StyledTh>审核人</StyledTh>
              <StyledTh>操作</StyledTh>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <StyledRow key={item.id}>
                <StyledTd>{item.tournamentName || item.tournamentId}</StyledTd>
                <StyledTd>{item.submitterUsername}</StyledTd>
                <StyledTd>{formatDateTime(item.submittedAt)}</StyledTd>
                <StyledTd>
                  <StatusBadge status={item.status} />
                </StyledTd>
                <StyledTd>{item.reviewerUsername || "—"}</StyledTd>
                <StyledTd>
                  <Link
                    to={`/admin/pending-tournaments/${item.id}`}
                    className="text-ak-blue hover:underline"
                  >
                    查看
                  </Link>
                </StyledTd>
              </StyledRow>
            ))}
          </tbody>
        </StyledTable>
      )}
    </StyledPage>
  );
}
