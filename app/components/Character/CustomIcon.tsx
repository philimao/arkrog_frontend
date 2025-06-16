import { getPath, imageHost } from "~/utils/tools";

export default function CustomIcon({
  name,
  size = 75,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const url = encodeURI(imageHost + "thumb/" + getPath(`${name}.png`) + `/${size}px-${name}.png`);
  return <img className={className} src={url} alt="avatar" referrerPolicy="no-referrer" crossOrigin="anonymous" />;
}
