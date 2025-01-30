import React, { useEffect, useState } from "react";
import { useAppDataStore } from "~/stores/appDataStore";
import { styled } from "styled-components";

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

export default function Banner() {
  const { banners } = useAppDataStore();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!banners) return;
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // 每3秒切换一次图片

    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="mb-10 w-full relative aspect-banner">
      <StyledCarousel>
        {banners &&
          banners.map((banner, index) => (
            <div
              key={banner}
              className={`absolute top-0 left-0 w-full aspect-banner transition-opacity ${
                index === activeIndex ? "active" : ""
              }`}
            >
              <img
                src={import.meta.env.VITE_API_BASE_URL + banner}
                alt="banner"
              />
            </div>
          ))}
      </StyledCarousel>
    </div>
  );
}
