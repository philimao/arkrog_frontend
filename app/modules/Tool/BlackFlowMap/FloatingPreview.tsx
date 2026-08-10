import { useRef } from "react";

const DEFAULT_WIDTH = 480;
const MIN_WIDTH = 160;
const MIN_HEIGHT = 120;
const MARGIN = 8;
const MINIMIZED_SIZE = 40;
const MINIMIZED_BOTTOM = "4rem";

export interface FloatingPreviewPos {
  x: number;
  y: number;
}

export interface FloatingPreviewSize {
  width: number;
  height: number;
}

/**
 * 主预览区完全滚出可视范围时，在页面上浮一个小窗继续展示截图——可拖动、可缩放、
 * 可最小化成右下角的小图标。主预览只要有一部分重新进入可视范围，这个浮窗就该
 * 整个消失。
 */
export function FloatingPreview({
  previewUrl,
  minimized,
  onMinimizedChange,
  pos,
  onPosChange,
  size,
  onSizeChange,
}: {
  previewUrl: string;
  minimized: boolean;
  onMinimizedChange: (minimized: boolean) => void;
  pos: FloatingPreviewPos | null;
  onPosChange: (pos: FloatingPreviewPos) => void;
  size: FloatingPreviewSize | null;
  onSizeChange: (size: FloatingPreviewSize) => void;
}) {
  // 还没摆放过（这张截图刚出现，pos/size 都是 null）时先给个占位默认值，图片
  // 一加载完就在 handleImageLoad 里按长宽比重新算一遍并居中，这样一开始就贴合
  // 图片，不会露出周围的背景色；只算这一次，算完写回外层，之后就是外层的持久值
  const effectivePos: FloatingPreviewPos = pos ?? {
    x: Math.max(MARGIN, (window.innerWidth - DEFAULT_WIDTH) / 2),
    y: Math.max(MARGIN, (window.innerHeight - DEFAULT_WIDTH * 0.75) / 2),
  };
  const effectiveSize: FloatingPreviewSize = size ?? {
    width: DEFAULT_WIDTH,
    height: DEFAULT_WIDTH * 0.75,
  };

  const dragOrigin = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeOrigin = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // pos 非 null 说明这张截图已经摆放过（可能是用户拖过/缩放过，也可能是之前
    // 已经自动定位过），不管哪种都不该再被这次 onLoad 覆盖
    if (pos !== null) return;
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const aspect = img.naturalWidth / img.naturalHeight;
    const maxWidth = window.innerWidth - MARGIN * 2;
    const maxHeight = window.innerHeight - MARGIN * 2;
    let width = Math.min(DEFAULT_WIDTH, maxWidth);
    let height = width / aspect;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspect;
    }
    onSizeChange({ width, height });
    onPosChange({
      x: Math.max(MARGIN, (window.innerWidth - width) / 2),
      y: Math.max(MARGIN, (window.innerHeight - height) / 2),
    });
  };

  const handleDragPointerMove = (e: PointerEvent) => {
    const origin = dragOrigin.current;
    if (!origin) return;
    const dx = e.clientX - origin.startX;
    const dy = e.clientY - origin.startY;
    onPosChange({
      x: Math.min(
        Math.max(0, origin.origX + dx),
        window.innerWidth - MIN_WIDTH,
      ),
      y: Math.min(
        Math.max(0, origin.origY + dy),
        window.innerHeight - MIN_HEIGHT,
      ),
    });
  };

  const handleDragPointerUp = () => {
    dragOrigin.current = null;
    window.removeEventListener("pointermove", handleDragPointerMove);
    window.removeEventListener("pointerup", handleDragPointerUp);
  };

  const handleDragPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragOrigin.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: effectivePos.x,
      origY: effectivePos.y,
    };
    window.addEventListener("pointermove", handleDragPointerMove);
    window.addEventListener("pointerup", handleDragPointerUp);
  };

  const handleResizePointerMove = (e: PointerEvent) => {
    const origin = resizeOrigin.current;
    if (!origin) return;
    const dx = e.clientX - origin.startX;
    const dy = e.clientY - origin.startY;
    onSizeChange({
      width: Math.max(
        MIN_WIDTH,
        Math.min(origin.origW + dx, window.innerWidth - effectivePos.x - MARGIN),
      ),
      height: Math.max(
        MIN_HEIGHT,
        Math.min(
          origin.origH + dy,
          window.innerHeight - effectivePos.y - MARGIN,
        ),
      ),
    });
  };

  const handleResizePointerUp = () => {
    resizeOrigin.current = null;
    window.removeEventListener("pointermove", handleResizePointerMove);
    window.removeEventListener("pointerup", handleResizePointerUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeOrigin.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: effectiveSize.width,
      origH: effectiveSize.height,
    };
    window.addEventListener("pointermove", handleResizePointerMove);
    window.addEventListener("pointerup", handleResizePointerUp);
  };

  if (minimized) {
    return (
      <button
        type="button"
        className="fixed right-3 z-50 border-2 border-ak-deep-blue bg-black-gray overflow-hidden shadow-lg"
        style={{
          bottom: MINIMIZED_BOTTOM,
          width: MINIMIZED_SIZE,
          height: MINIMIZED_SIZE,
        }}
        onClick={() => onMinimizedChange(false)}
        aria-label="展开截图预览"
      >
        <img
          src={previewUrl}
          alt="截图预览"
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  return (
    <div
      className="fixed z-50 flex flex-col border-2 border-ak-deep-blue bg-black-gray shadow-xl"
      style={{
        left: effectivePos.x,
        top: effectivePos.y,
        width: effectiveSize.width,
        height: effectiveSize.height,
      }}
    >
      <div
        className="relative flex items-center justify-center px-6 py-1 bg-ak-deep-blue cursor-move touch-none select-none"
        onPointerDown={handleDragPointerDown}
      >
        <span className="text-xs text-white">可以任意拖动和缩放图片</span>
        <button
          type="button"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-white text-sm leading-none px-1"
          onClick={() => onMinimizedChange(true)}
          aria-label="最小化"
        >
          —
        </button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <img
          src={previewUrl}
          alt="截图预览"
          onLoad={handleImageLoad}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div
        className="absolute right-0 bottom-0 w-4 h-4 bg-ak-deep-blue cursor-nwse-resize touch-none"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        onPointerDown={handleResizePointerDown}
      />
    </div>
  );
}
