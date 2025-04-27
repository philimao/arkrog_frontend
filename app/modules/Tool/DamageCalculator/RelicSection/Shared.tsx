import { styled } from "styled-components";

export const StyledRelicCount = styled.div`
  width: 4.5rem;
  height: 4rem;
  background: #333333 url(/images/tool/calculator/footer_panel_relic.png)
    no-repeat center top / contain;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
`;

export const StyledRelicCountInner = styled.div`
  text-align: center;
  font-family: "Novecento", sans-serif;
`;

export const StyledClearRelicsButton = styled.button`
  color: white;
  background: var(--ak-dark-red);
  font-weight: bold;
  width: 4rem;
  height: 2rem;
`;
