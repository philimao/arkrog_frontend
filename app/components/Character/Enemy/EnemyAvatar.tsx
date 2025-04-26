import { getPath, imageHost } from "~/utils/tools";
import type { ImgHTMLAttributes } from "react";

interface EnemyAvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  className?: string;
}

export default function EnemyAvatar({
  name,
  className = "",
  ...props
}: EnemyAvatarProps) {
  const url = encodeURI(imageHost + getPath(`头像_敌人_${name}.png`));
  return (
    <img
      className={className}
      src={url}
      alt="avatar"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      {...props}
    />
  );
}
