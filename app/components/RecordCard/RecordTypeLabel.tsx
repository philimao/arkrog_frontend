import { StageTypes } from "~/types/constant";
import { styled } from "styled-components";

const StyledTypeLabel = styled.span<{ color: string }>`
  padding: 0.25rem 1.25rem;
  @media (min-width: 640px) {
    padding: 0.25rem 1.5rem;
  }
  @media (min-width: 1024px) {
    padding: 0.25rem 2rem;
  }
  background: linear-gradient(90deg, rgba(0, 0, 0, 0) 5%, var(${(props) => props.color}), rgba(0, 0, 0, 0) 95%);
`;

export default function RecordTypeLabel({ type, className }: { type: string; className?: string }) {
  if (type === "normal") return null;

  return (
    <StyledTypeLabel
      className={"py-2 text-xs sm:text-sm lg:text-lg " + (className ?? "")}
      color={type === "elite" ? "--ak-red" : "--ak-purple"}
    >
      {StageTypes[type]}
    </StyledTypeLabel>
  );
}
