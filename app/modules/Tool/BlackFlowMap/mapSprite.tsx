import type { CSSProperties, ReactNode } from "react";
import spriteUrl from "~/assets/map-sprite.webp";
import {
  SPRITE_RECTS,
  SPRITE_SHEET_HEIGHT,
  SPRITE_SHEET_WIDTH,
} from "./mapSprite.generated";

/**
 * 黑流树海节点图标的 sprite 访问层。
 *
 * 起因：2026-08-16 的 CDN 明细里 /images/map/* 是 85,238 次/日、占全站请求数
 * 22.3%——一次页面加载要拉二十几个几 KB 的小图，而 HTTPS 请求数按次计费，是
 * 账单里比流量更贵的一半。合成一张后每次加载只剩 1 个请求，体积还略降
 * （24 张原图合计 269.3K → sprite 233.5K）。
 *
 * sprite 从 app/assets/ 引用而不是放 public/：Vite 会加内容哈希输出到
 * assets-v2/，直接命中 nginx 现有的一年 immutable 规则；放 public/images/
 * 只有 24 小时缓存。
 *
 * 清单里查不到的 id 一律退回单文件路径（原始小图保留未删），新增图标忘了跑
 * tools/build-map-sprite.py 只是多一个请求，不会渲染成白框。
 *
 * 清单记的是每张图各自的矩形而不是统一网格：empty(45x45) 与 cursor_anchor(176x176)
 * 按原尺寸入表，不拉伸到 260——拉伸后再让浏览器缩回 20/40px 渲染实测 RMSE 48.7/33.7
 * （正常图标同法只有 2.1），边缘会发虚。
 */

const rectOf = (id: string) =>
  SPRITE_RECTS[id] as [number, number, number, number] | undefined;

const fallbackSrc = (id: string) => `/images/map/${id}.webp`;

/**
 * 给 HTML 元素用：原来的 `<img src={...} className="w-8 h-8" />` 换成
 * `<div className="w-8 h-8" style={spriteStyle(id)} />`。
 *
 * background-size 取 整图/矩形×100%，background-position 取 x/(整图宽-矩形宽)
 * 的百分比——任意矩形都适用，不要求等宽等高网格。
 */
export function spriteStyle(id: string): CSSProperties {
  const rect = rectOf(id);
  if (!rect) {
    return {
      backgroundImage: `url(${fallbackSrc(id)})`,
      backgroundSize: "100% 100%",
      backgroundRepeat: "no-repeat",
    };
  }
  const [x, y, w, h] = rect;
  return {
    backgroundImage: `url(${spriteUrl})`,
    backgroundSize: `${(SPRITE_SHEET_WIDTH / w) * 100}% ${(SPRITE_SHEET_HEIGHT / h) * 100}%`,
    backgroundPosition: `${(x / (SPRITE_SHEET_WIDTH - w)) * 100}% ${(y / (SPRITE_SHEET_HEIGHT - h)) * 100}%`,
    backgroundRepeat: "no-repeat",
  };
}

type SpriteImageProps = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  children?: ReactNode;
};

/**
 * 给 SVG 用：嵌套一层 `<svg>` 并用 viewBox 把 sprite 裁到目标格子。
 * 嵌套 svg 会建立新的视口，viewBox 把该格子映射满整个视口——这是在 SVG 里
 * 用位图 sprite 的标准做法（`<use>` 只能引用 SVG 符号，位图用不了）。
 *
 * 交互属性挂在外层 `<svg>` 上，命中区域与原来的 `<image>` 一样是整个矩形框。
 */
export function SpriteImage({
  id,
  x,
  y,
  width,
  height,
  className,
  style,
  onClick,
}: SpriteImageProps) {
  const rect = rectOf(id);
  if (!rect) {
    return (
      <image
        href={fallbackSrc(id)}
        x={x}
        y={y}
        width={width}
        height={height}
        className={className}
        style={style}
        onClick={onClick}
      />
    );
  }
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox={rect.join(" ")}
      className={className}
      // overflow:hidden 是 svg 的 UA 默认值，这里显式写死，免得哪天全局 reset
      // 把它改成 visible——那样整张 1300x1300 的 sprite 会糊在地图上
      style={{ overflow: "hidden", ...style }}
      onClick={onClick}
    >
      <image
        href={spriteUrl}
        x={0}
        y={0}
        width={SPRITE_SHEET_WIDTH}
        height={SPRITE_SHEET_HEIGHT}
      />
    </svg>
  );
}
