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

  @media (max-width: 768px) {
    position: relative;
    transform: none;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    margin-bottom: 1rem;

    & > * {
      position: relative !important;
      top: unset !important;
    }
  }
`;

export const StyledBackButton = styled.button`
  position: absolute;
  right: 0;
  top: 3.5rem;
  width: 8rem;
  height: 2.5rem;
  background: var(--black-gray);
`;

export const StyledEditButton = styled.button`
  position: absolute;
  right: 0;
  top: 6.5rem;
  width: 8rem;
  height: 2.5rem;
  background: var(--black-gray);
`;

export const StyledTournamentGroupList = styled.div`
  position: absolute;
  right: 0;
  top: 10rem;
  width: 12rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--light-gray);

  & > div {
    padding: 0.25rem 1rem;
    background: var(--black-gray);
    margin-bottom: 0.5rem;
  }
`;

export const StyledStageTitleNum = styled.div`
  font-size: 3rem;
  font-family: "Novecento", sans-serif;
  transform: translateY(-1.25rem);
`;
