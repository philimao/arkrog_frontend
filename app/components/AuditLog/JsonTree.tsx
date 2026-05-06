import { useState, type ReactNode } from "react";

interface JsonTreeProps {
  data: unknown;
  level?: number;
  initialExpanded?: boolean;
}

const INDENT = 14;

const StyledKey = ({ children }: { children: ReactNode }) => (
  <span className="text-ak-blue">{children}</span>
);
const StyledIndex = ({ children }: { children: ReactNode }) => (
  <span className="text-white/40">{children}</span>
);
const StyledString = ({ children }: { children: ReactNode }) => (
  <span className="text-green-300">"{children}"</span>
);
const StyledNumber = ({ children }: { children: ReactNode }) => (
  <span className="text-yellow-300">{children}</span>
);
const StyledBool = ({ children }: { children: ReactNode }) => (
  <span className="text-orange-300">{children}</span>
);
const StyledNull = ({ children }: { children: ReactNode }) => (
  <span className="text-white/40 italic">{children}</span>
);
const Bracket = ({ children }: { children: ReactNode }) => (
  <span className="text-white/60">{children}</span>
);

function previewSummary(data: unknown): string {
  if (Array.isArray(data)) return `Array(${data.length})`;
  if (data && typeof data === "object") {
    const keys = Object.keys(data as Record<string, unknown>);
    return `Object(${keys.length})`;
  }
  return "";
}

export default function JsonTree({
  data,
  level = 0,
  initialExpanded,
}: JsonTreeProps) {
  const isContainer =
    data !== null && typeof data === "object";
  const [expanded, setExpanded] = useState(
    initialExpanded ?? level < 1,
  );

  if (data === null) return <StyledNull>null</StyledNull>;
  if (data === undefined) return <StyledNull>undefined</StyledNull>;

  if (typeof data === "string") {
    return <StyledString>{data}</StyledString>;
  }
  if (typeof data === "number" || typeof data === "bigint") {
    return <StyledNumber>{String(data)}</StyledNumber>;
  }
  if (typeof data === "boolean") {
    return <StyledBool>{String(data)}</StyledBool>;
  }

  if (!isContainer) {
    return <span>{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <Bracket>[]</Bracket>;
    return (
      <span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer hover:text-white text-white/70"
        >
          {expanded ? "▼" : "▶"} <Bracket>[</Bracket>
          {!expanded && (
            <span className="text-white/50">
              {" "}
              {previewSummary(data)}{" "}
            </span>
          )}
          {!expanded && <Bracket>]</Bracket>}
        </button>
        {expanded && (
          <div style={{ paddingLeft: INDENT }}>
            {data.map((item, i) => (
              <div key={i}>
                <StyledIndex>{i}:</StyledIndex>{" "}
                <JsonTree data={item} level={level + 1} />
              </div>
            ))}
            <Bracket>]</Bracket>
          </div>
        )}
      </span>
    );
  }

  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) return <Bracket>{"{}"}</Bracket>;
  return (
    <span>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer hover:text-white text-white/70"
      >
        {expanded ? "▼" : "▶"} <Bracket>{"{"}</Bracket>
        {!expanded && (
          <span className="text-white/50"> {previewSummary(data)} </span>
        )}
        {!expanded && <Bracket>{"}"}</Bracket>}
      </button>
      {expanded && (
        <div style={{ paddingLeft: INDENT }}>
          {entries.map(([key, value]) => (
            <div key={key}>
              <StyledKey>{key}:</StyledKey>{" "}
              <JsonTree data={value} level={level + 1} />
            </div>
          ))}
          <Bracket>{"}"}</Bracket>
        </div>
      )}
    </span>
  );
}
