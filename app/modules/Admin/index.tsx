import { styled } from "styled-components";

const StyledHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  font-family: "HanSans", sans-serif;
`;

export default function AdminIndex() {
  return <StyledHint>请从左侧选择管理项</StyledHint>;
}
