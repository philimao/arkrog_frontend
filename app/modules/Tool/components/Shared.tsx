import { styled } from "styled-components";
import type {
  Dispatch,
  HTMLAttributes,
  ReactNode,
  SetStateAction,
} from "react";

const StyledTitleWrapper = styled.div`
  height: 3rem;
  font-weight: bold;
  font-size: 1.5rem;
  padding-bottom: 0.25rem;
  margin-bottom: 1rem;
  border-bottom: var(--ak-blue) 1px solid;
  display: flex;
`;

const StyledTitleText = styled.span`
  display: flex;
  align-self: end;
`;

const StyledModeSelector = styled.div`
  margin-left: auto;
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  cursor: pointer;
`;

const StyledModeOption = styled.span<{ $active: boolean }>`
  color: ${(props) => (props.$active ? "var(--ak-blue)" : "white")};
  display: flex;
  align-self: end;
`;

export function StyledTitle({
  children,
  modes,
  activeMode,
  setActiveMode,
}: {
  children: ReactNode;
  modes?: string[];
  activeMode?: string;
  setActiveMode?: Dispatch<SetStateAction<string>>;
}) {
  return (
    <StyledTitleWrapper>
      <StyledTitleText>{children}</StyledTitleText>
      {modes && activeMode && setActiveMode && (
        <StyledModeSelector>
          {modes.map((mode) => (
            <StyledModeOption
              key={mode}
              $active={activeMode === mode}
              onClick={() => setActiveMode(mode)}
            >
              {mode}
            </StyledModeOption>
          ))}
        </StyledModeSelector>
      )}
    </StyledTitleWrapper>
  );
}

const StyledGridContainer = styled.div<{ $width: string }>`
  display: grid;
  gap: 0.25rem 1rem;
  grid-template-columns: repeat(auto-fit, ${(props) => props.$width});
  margin-bottom: 1rem;
`;

export function GridContainer({
  width = "15rem",
  ...props
}: { width?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <StyledGridContainer $width={width} {...props}>
      {props.children}
    </StyledGridContainer>
  );
}
