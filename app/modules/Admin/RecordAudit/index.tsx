import { useState } from "react";
import { styled } from "styled-components";
import { toast } from "react-toastify";
import { SearchSelect } from "~/components/SearchSelect";
import AuditLogViewer from "~/components/AuditLog/AuditLogViewer";
import { adminServices, type AdminRecordLite } from "~/services/adminServices";
import { StageTypes } from "~/types/constant";

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

const StyledSearchBar = styled.div`
  max-width: 28rem;
  margin-bottom: 1.5rem;
`;

const StyledAuditPanel = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  padding: 1rem;
`;

const StyledSelectedTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  font-family: "HanSans", sans-serif;
  color: var(--ak-blue);
  margin-bottom: 0.5rem;
`;

/** 记录的一行式摘要：关卡 + 人数 + 类型 + 难度 + 攻略者/提交人 */
function recordLabel(r: AdminRecordLite) {
  const type = StageTypes[r.type] ?? r.type;
  const who = r.raider || r.submitter || "";
  return `${r.stageId}｜${r.teamSize}人${type}｜${r.level}${who ? `｜${who}` : ""}`;
}

export default function RecordAudit() {
  const [items, setItems] = useState<AdminRecordLite[]>([]);
  const [selected, setSelected] = useState<AdminRecordLite | null>(null);

  const handleSearch = async (query: string) => {
    try {
      const response = await adminServices.searchRecords(query);
      setItems(response.data.records);
    } catch (err) {
      toast.error((err as Error).message);
      setItems([]);
    }
  };

  return (
    <StyledPage>
      <StyledHeader>无藏审计</StyledHeader>
      <StyledSearchBar>
        <SearchSelect<AdminRecordLite>
          value={selected}
          onChange={setSelected}
          items={items}
          manualSearch
          onSearch={handleSearch}
          onClearResults={() => setItems([])}
          filterFn={() => true}
          renderItem={(r) => (
            <div>
              <div>{recordLabel(r)}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                {r.date_created ? new Date(r.date_created).toLocaleString("zh-CN") : ""}
                {r.editor ? ` | 最近编辑：${r.editor}` : ""}
              </div>
            </div>
          )}
          renderSelected={(r) => recordLabel(r)}
          getKey={(r) => r._id}
          getSelectedText={(r) => recordLabel(r)}
          placeholder="输入关卡ID/攻略者/提交人/备注关键字后点搜索..."
        />
      </StyledSearchBar>

      {selected && (
        <StyledAuditPanel>
          <StyledSelectedTitle>{recordLabel(selected)}</StyledSelectedTitle>
          <AuditLogViewer resourceType="record" resourceId={selected._id} limit={50} />
        </StyledAuditPanel>
      )}
    </StyledPage>
  );
}
