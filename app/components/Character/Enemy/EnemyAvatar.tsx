import { getPath, imageHost } from "~/utils/tools";
import type { ImgHTMLAttributes } from "react";

interface EnemyAvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  className?: string;
}

export default function EnemyAvatar({
  name,
  className = "w-full",
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
      onError={(evt) => {
        (evt.target as HTMLImageElement).onerror = null;
        (evt.target as HTMLImageElement).src =
          "https://media.prts.wiki/thumb/f/fb/%E6%97%A0%E5%9B%BE%E7%89%87%E5%8D%A0%E4%BD%8D%E7%AC%A6.png/75px-%E6%97%A0%E5%9B%BE%E7%89%87%E5%8D%A0%E4%BD%8D%E7%AC%A6.png";
      }}
      {...props}
    />
  );
}
