import { getPath, imageHost } from "~/utils/tools";

export default function OperatorAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const url = encodeURI(imageHost + getPath(`头像_${name}.png`));
  return (
    <img
      className={className}
      src={url}
      alt="avatar"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
}
