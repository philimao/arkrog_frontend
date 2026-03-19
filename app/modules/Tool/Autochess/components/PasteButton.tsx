import { useId } from "react";
import { styled } from "styled-components";

const HALFTONE_SIZE = 3;

/** 网点背景：使用 CSS radial-gradient 实现 */
const halftoneBg = `
  background-image: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.12) 1px,
    transparent 1px
  );
  background-size: ${HALFTONE_SIZE}px ${HALFTONE_SIZE}px;
`;

const PasteButtonWrapper = styled.div`
  position: relative;
  cursor: pointer;
`;

const LOGO_PATH = "/images/logo/logo.png";

const PasteButtonBase = styled.button<{ $active?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0.25rem 1rem;
  background: ${(p) => (p.$active ? "#00bfa5" : "#00a090")};
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 4px;
  cursor: pointer;
  transition:
    background 0.2s,
    filter 0.2s;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    ${halftoneBg}
    pointer-events: none;
  }

  &:hover {
    filter: brightness(1.08);
  }
`;

/** 选中时半圈住按钮的白色弧圈 */
const SelectionRing = styled.div<{ $active?: boolean }>`
  position: absolute;
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%);
  overflow: hidden;
  width: 120%;
  height: 32px;
  opacity: ${(p) => (p.$active ? 1 : 0)};
  pointer-events: none;
  transition: opacity 0.2s;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const ButtonText = styled.span`
  padding-left: 4rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  letter-spacing: 0.02em;
  position: relative;
  z-index: 1;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 100%;
  opacity: 0.5;
  overflow: hidden;
  background: url(${LOGO_PATH}) no-repeat 0 0 / 100% auto;
`;

/** 简化的白色半圆弧，选中时显示 */
function SelectionRingSvg() {
  return (
    <svg viewBox="0 0 480 480">
      <g>
        <polygon
          points="402.025296,103.2911376 373.67088,81.0126624 348.354432,67.8481008 288.60760799999997,47.5949376 217.72152,50.6329104 162.0253248,59.7468336 98.2278528,81.0126624 65.822784,97.215192 58.7341776,106.32912 64.8101232,110.37974399999999 135.6962016,80.00000159999999 198.481008,67.8481008 184.3037952,82.0253136 177.21519360000002,81.0126624 175.189872,83.0379744 179.2405152,86.075952 176.2025376,88.1012688 173.16456,85.0632912 165.063288,90.126576 160.00000319999998,104.30379839999999 155.9493696,100.25316000000001 158.9873472,94.17721440000001 112.4050656,135.6962016 74.9367072,187.3417728 58.7341776,221.77214400000003 49.62025152,257.215176 49.62025152,301.77216 58.7341776,332.151888 81.0126624,367.5949296 116.4556944,393.9240624 146.8354368,405.063288 178.2278544,410.126592 222.78480960000002,410.126592 266.329104,402.025296 310.886064,386.835456 343.291152,370.632912 381.7721568,343.291152 403.03796639999996,322.025328 424.3038096,290.6329248 440.50631999999996,251.139264 446.58227999999997,216.7088544 445.56961920000003,184.3037952 438.481008,156.9620256 418.22784,120.506328 "
          fill="rgba(0,0,0,0)"
        ></polygon>
      </g>
    </svg>
  );
}

const GraphicWrapper = styled.span`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 120%;
  opacity: 0.85;
  pointer-events: none;

  svg {
    height: 100%;
    width: auto;
  }
`;

interface PasteButtonProps {
  active?: boolean;
  onClick?: () => void;
}

export function PasteButton({ active = false, onClick }: PasteButtonProps) {
  const patternId = useId().replace(/:/g, "-");
  const handleClick = () => onClick?.();

  return (
    <PasteButtonWrapper
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <SelectionRing $active={active}>
        <SelectionRingSvg />
      </SelectionRing>
      <PasteButtonBase type="button" $active={active} as="div">
        <IconWrapper></IconWrapper>
        <ButtonText>开始粘贴</ButtonText>
      </PasteButtonBase>
    </PasteButtonWrapper>
  );
}
