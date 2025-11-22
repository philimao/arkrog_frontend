import { useEffect, useRef } from "react";

export default function useImageLazyLoad(onIntersect: () => void) {
  const targetRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
          observer.unobserve(entry.target); // 加载后取消观察
        }
      },
      { rootMargin: "20px" },
    );

    if (targetRef.current) observer.observe(targetRef.current);

    return () => {
      if (targetRef.current) observer.disconnect();
    };
  }, []);

  return targetRef;
}
