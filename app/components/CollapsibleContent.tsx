import React, { useEffect, useRef, useState } from "react";

/**
 * 限高折叠容器：内容超过 maxHeightVh 时收起后半部分并渐变隐藏，
 * 右下角提供"展开全部/收起内容"切换；内容不超高时不显示任何控件
 */
export default function CollapsibleContent({
  maxHeightVh = 30,
  children,
}: {
  /** 收起状态的最大高度，单位 vh */
  maxHeightVh?: number;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const check = () =>
      setOverflowing(
        content.offsetHeight > (window.innerHeight * maxHeightVh) / 100 + 1,
      );
    check();
    // Markdown 内图片加载、窗口缩放都会改变内容高度
    const observer = new ResizeObserver(check);
    observer.observe(content);
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [maxHeightVh]);

  const collapsed = overflowing && !expanded;

  return (
    <div className="relative">
      <div
        className="overflow-hidden"
        style={{ maxHeight: collapsed ? `${maxHeightVh}vh` : undefined }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {collapsed && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--black-gray))",
            }}
          />
          <div
            className="absolute bottom-2 right-4 z-10 text-ak-blue text-sm cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            展开全部
          </div>
        </>
      )}
      {overflowing && expanded && (
        <div className="flex justify-end pr-4 pt-2">
          <span
            className="text-ak-blue text-sm cursor-pointer"
            onClick={() => setExpanded(false)}
          >
            收起内容
          </span>
        </div>
      )}
    </div>
  );
}
