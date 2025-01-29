import { StageTypes } from "~/types/constant";

export default function RecordTypeLabel({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  if (type === "normal") return null;

  return (
    <span
      className={
        "px-4 py-2 " +
        (type === "elite" ? "bg-ak-red " : "bg-ak-purple ") +
        (className ?? "")
      }
    >
      {StageTypes[type]}
    </span>
  );
}
