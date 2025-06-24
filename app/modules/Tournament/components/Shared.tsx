import { styled } from "styled-components";

export const StyledDivider = styled.div`
  border-bottom: var(--ak-blue) 1px solid;
  margin: 1.25rem 0;
  width: 100%;
`;

export const StyledBackButtonContainer = styled.div`
  position: absolute;
  width: 100vw;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
`;

export const StyledBackButton = styled.button`
  position: absolute;
  right: 0;
  top: 3.5rem;
  padding: 0.5rem 2rem;
  background: var(--black-gray);
`;

export const StyledEditButton = styled.button`
  position: absolute;
  right: 0;
  top: 6.5rem;
  padding: 0.5rem 2rem;
  background: var(--black-gray);
`;

export const StyledStageTitleNum = styled.div`
  font-size: 3rem;
  font-family: "Novecento", sans-serif;
  transform: translateY(-1.25rem);
`;
