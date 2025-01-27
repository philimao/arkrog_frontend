export function SVGIcon({
  name,
  width = "1rem",
  height = "1rem",
  className = "",
}: {
  name: string;
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <svg className={className} style={{ width, height }}>
      <use href={`#${name}`} />
    </svg>
  );
}
