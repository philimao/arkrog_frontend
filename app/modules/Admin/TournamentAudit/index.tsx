import { useState } from "react";
import { styled } from "styled-components";
import { toast } from "react-toastify";
import { SearchSelect } from "~/components/SearchSelect";
import AuditLogViewer from "~/components/AuditLog/AuditLogViewer";
import {
  adminServices,
  type AdminTournamentLite,
} from "~/services/adminServices";

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

export default function TournamentAudit() {
  const [items, setItems] = useState<AdminTournamentLite[]>([]);
  const [selected, setSelected] = useState<AdminTournamentLite | null>(null);

  const handleSearch = async (query: string) => {
    try {
      const response = await adminServices.searchTournaments(query);
      setItems(response.data.tournaments);
    } catch (err) {
      toast.error((err as Error).message);
      setItems([]);
    }
  };

  return (
    <StyledPage>
      <StyledHeader>赛事审计</StyledHeader>
      <StyledSearchBar>
        <SearchSelect<AdminTournamentLite>
          value={selected}
          onChange={setSelected}
          items={items}
          manualSearch
          onSearch={handleSearch}
          onClearResults={() => setItems([])}
          filterFn={() => true}
          renderItem={(t) => <div>{t.name}</div>}
          renderSelected={(t) => t.name}
          getKey={(t) => t.id}
          getSelectedText={(t) => t.name}
          placeholder="输入赛事名称后点搜索..."
        />
      </StyledSearchBar>

      {selected && (
        <StyledAuditPanel>
          <StyledSelectedTitle>{selected.name}</StyledSelectedTitle>
          <AuditLogViewer
            resourceType="tournament"
            resourceId={selected.id}
            limit={50}
          />
        </StyledAuditPanel>
      )}
    </StyledPage>
  );
}
