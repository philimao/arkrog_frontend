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

export default function Banner() {
  const { banners } = useAppDataStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!banners) return;
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // 每5秒切换一次图片

    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="mb-10 w-full relative aspect-banner">
      {banners && (
        <a
          href={banners[activeIndex].target || "#"}
          onClick={(evt) => {
            // 如果不是指向外部链接
            if (!banners?.[activeIndex].target.startsWith("https")) {
              evt.preventDefault();
              // 如果非空字符串，指向某页面
              if (banners[activeIndex].target) {
                navigate(banners[activeIndex].target);
              }
            }
          }}
          className={
            banners[activeIndex].target ? "cursor-auto" : "cursor-default"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          <StyledCarousel>
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`absolute top-0 left-0 w-full aspect-banner transition-opacity ${
                  index === activeIndex ? "active" : ""
                }`}
              >
                <img
                  src={import.meta.env.VITE_API_BASE_URL + banner.src}
                  alt="banner"
                />
              </div>
            ))}
          </StyledCarousel>
        </a>
      )}
    </div>
  );
}
