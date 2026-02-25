import React, { useEffect, useState } from "react";
import { useAppDataStore } from "~/stores/appDataStore";
import { styled } from "styled-components";
import { useNavigate } from "react-router";

const StyledCarousel = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  & > div {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.5s ease-in-out;
    opacity: 0;
  }

  & > div.active {
    opacity: 1;
  }
`;

const StyledDots = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
  width: 100%;

  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.7);
    }

    &.active {
      background-color: rgba(255, 255, 255, 1);
    }
  }
`;

export default function Banner() {
  const { banners } = useAppDataStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const startAutoRotation = React.useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const newInterval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        if (!banners) return prevIndex;
        return (prevIndex + 1) % banners.length;
      });
    }, 5000); // 每5秒切换一次图片
    intervalRef.current = newInterval;
  }, [banners]);

  useEffect(() => {
    if (!banners) return;
    startAutoRotation();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners, startAutoRotation]);

  return (
    <div className="mb-10 w-full relative">
      {banners && banners.length > 0 && (
        <>
          <a
            href={banners[activeIndex].target || "#"}
            onClick={(evt) => {
              // 如果不是指向外部链接
              if (!banners[activeIndex].target?.startsWith("https")) {
                evt.preventDefault();
                // 如果非空字符串，指向某页面
                if (banners[activeIndex].target) {
                  navigate(banners[activeIndex].target);
                }
              }
            }}
            className={banners[activeIndex].target ? "cursor-pointer" : "cursor-default"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="aspect-banner relative">
              <StyledCarousel>
                {banners.map((banner, index) => (
                  <div
                    key={index}
                    className={`absolute top-0 left-0 w-full aspect-banner transition-opacity ${
                      index === activeIndex ? "active" : ""
                    }`}
                  >
                    <img src={banner.src} alt="banner" />
                  </div>
                ))}
              </StyledCarousel>
            </div>
          </a>
          <StyledDots>
            {banners.map((_, index) => (
              <div
                key={index}
                className={`dot ${index === activeIndex ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(index);
                  startAutoRotation();
                }}
              />
            ))}
          </StyledDots>
        </>
      )}
    </div>
  );
}
