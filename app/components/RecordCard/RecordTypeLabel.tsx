import { StageTypes } from "~/types/constant";
import { styled } from "styled-components";

const StyledTypeLabel = styled.span<{ color: string }>`
  padding: 0.25rem 2rem;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0) 5%,
    var(${(props) => props.color}),
    rgba(0, 0, 0, 0) 95%
  );
`;

export default function RecordTypeLabel({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  if (type === "normal") return null;

  return (
    <StyledTypeLabel
      className={"px-4 py-2 " + (className ?? "")}
      color={type === "elite" ? "--ak-red" : "--ak-purple"}
    >
      {StageTypes[type]}
    </StyledTypeLabel>
  );
}
