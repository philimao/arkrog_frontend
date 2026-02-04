import {
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type RefObject,
} from "react";

interface UseSmartAutoScrollOptions {
  /**
   * 是否启用自动滚动
   * 默认 true
   */
  enabled?: boolean;
  /**
   * 距离底部多少像素以内视为“在底部”
   * 默认 16
   */
  bottomThreshold?: number;
}

interface UseSmartAutoScrollReturn<T extends HTMLElement> {
  /**
   * 需要绑定到可滚动容器上的 ref
   */
  containerRef: RefObject<T | null>;
  /**
   * 当前是否处于自动滚动状态
   */
  isAutoScrolling: boolean;
  /**
   * 手动暂停自动滚动
   */
  pauseAutoScroll: () => void;
  /**
   * 手动恢复自动滚动
   */
  resumeAutoScroll: () => void;
}

/**
 * 智能自动滚动：
 * - 当新内容追加时，如果用户当前在底部附近，则自动滚动到底部
 * - 如果用户手动向上滚动，则暂停自动滚动
 * - 当用户再次手动滚动到底部时，恢复自动滚动
 *
 * @param deps 当这些依赖变化（例如内容追加）时，如果处于自动滚动状态则滚动到底部
 * @param options 可选配置
 */
export function useSmartAutoScroll<T extends HTMLElement>(
  deps: DependencyList,
  options: UseSmartAutoScrollOptions = {},
): UseSmartAutoScrollReturn<T> {
  const containerRef = useRef<T | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const lastScrollTopRef = useRef(0);

  const { enabled = true, bottomThreshold = 16 } = options;

  // 监听用户滚动行为，决定是否自动滚动
  useEffect(() => {
    if (!enabled) return;

    const el = containerRef.current;
    if (!el) return;

    lastScrollTopRef.current = el.scrollTop;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
      const atBottom = distanceToBottom <= bottomThreshold;
      const lastScrollTop = lastScrollTopRef.current;
      const isScrollingUp = scrollTop < lastScrollTop;
      lastScrollTopRef.current = scrollTop;

      // 向上滚动：立即关闭自动滚动
      if (isScrollingUp) {
        if (isAutoScrolling) {
          setIsAutoScrolling(false);
        }
        return;
      }

      // 只有在真正滚到最底部附近时才重新打开自动滚动
      if (atBottom && !isAutoScrolling) {
        setIsAutoScrolling(true);
      }
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
    // 必须依赖 deps：条件渲染的容器（如 thinkingContent 有内容时才挂载的 pre）在首次出现时 ref 才有值，effect 需在 deps 变化时重跑才能挂上监听
  }, [enabled, bottomThreshold, isAutoScrolling, ...deps]);

  // 当内容发生变化且处于自动滚动状态时，滚动到底部
  useEffect(() => {
    if (!enabled || !isAutoScrolling) return;

    const el = containerRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [enabled, isAutoScrolling, ...deps]);

  return {
    containerRef,
    isAutoScrolling,
    pauseAutoScroll: () => setIsAutoScrolling(false),
    resumeAutoScroll: () => setIsAutoScrolling(true),
  };
}
