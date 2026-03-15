import { cosHost, getPath, imageHost } from "~/utils/tools";
import type { ImgHTMLAttributes } from "react";
import { styled } from "styled-components";

interface EnemyAvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name: string | null;
  className?: string;
  displayName?: string;
  fontSize?: string;
  parasitized?: boolean;
}

const preset = [
  "木桩",
  "年代之刺",
  "饮泣之刺",
  "“放逐的黑棺”",
  "尊主的残影",
].reduce(
  (acc, name) => {
    acc[name] = cosHost + `/images/rogue_4/${encodeURI(name)}.png`;
    return acc;
  },
  {} as Record<string, string>,
);

Object.assign(
  preset,
  ["“岁躯”", "雕伥"].reduce(
    (acc, name) => {
      acc[name] = cosHost + `/images/rogue_5/${encodeURI(name)}.webp`;
      return acc;
    },
    {} as Record<string, string>,
  ),
);

const StyledEnemyName = styled.div<{ $color: string; $fontSize: string }>`
  padding: 0.1rem 0.15rem;
  font-size: ${({ $fontSize }) => $fontSize};
  background: var(--black-gray);
  text-align: center;
  color: ${({ $color }) => ($color === "red" ? "var(--ak-red)" : "inherit")};
`;

/** 恐卡兹标记 */
const StyledEnemyBadge = styled.div`
  position: absolute;
  top: -0.3rem;
  right: -0.3rem;
  width: 1rem;
  height: 1rem;
  background: url(${cosHost + "/images/rogue_4/恐卡兹标记.webp"}) no-repeat
    center center;
  background-size: contain;
`;

export default function EnemyAvatar({
  name,
  displayName,
  fontSize = "1rem",
  parasitized,
  className = "w-full",
  ...props
}: EnemyAvatarProps) {
  if (!name) return null;

  const url =
    preset[name] || encodeURI(imageHost + getPath(`头像_敌人_${name}.png`));
  return (
    <div className="relative">
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
      {displayName && (
        <StyledEnemyName $color={"inherit"} $fontSize={fontSize}>
          {displayName}
        </StyledEnemyName>
      )}
      {parasitized && <StyledEnemyBadge />}
    </div>
  );
}
