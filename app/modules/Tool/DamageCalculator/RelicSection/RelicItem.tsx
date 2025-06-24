import { relicAlterToBasic } from "~/modules/Tool/DamageCalculator/utils";
import { styled } from "styled-components";
import { assetsHost } from "~/utils/tools";
import type { RelicWrapper } from "~/types/gameData";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { useState } from "react";
import { Tooltip } from "@heroui/react";

const StyledRelicItem = styled.div<{
  $editable: boolean;
  $userActive: boolean;
}>`
  position: relative;
  height: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  background: ${(props) => (props.$editable ? "var(--black-gray)" : "transparent")};
  opacity: ${(props) => (props.$userActive ? "1" : "0.3")};
  user-select: none;
  & > div > * {
    pointer-events: ${(props) => (props.$userActive ? "auto" : "none")};
  }
`;

const StyledInner = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 100%;
  width: 200%;
  display: flex;
  justify-content: center;
  pointer-events: none;
`;

const StyledRelicImg = styled.img`
  height: 100%;
  object-fit: contain;
`;

const StyledCloseButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  transform: translate(50%, -50%);
  width: 1rem;
  height: 1rem;
  background: var(--black-gray);
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  font-size: 0.6rem;
  &:hover {
    background: var(--ak-red);
  }
`;

const StyledLayerWrapper = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  height: 1rem;
  width: 2rem;
  font-size: 0.75rem;
  background: var(--black-gray);
  text-align: center;
  & > * {
    width: 100%;
    height: 100%;
    padding: 0 0.25rem;
    text-align: center;
  }
  & > *:focus-visible {
    outline: none;
  }
`;

export default function RelicItem({
  relicWrapper: relicWrapper,
  editable = false,
}: {
  relicWrapper: RelicWrapper;
  editable?: boolean;
}) {
  const { updateRelic, setRelicLayer, toggleRelicSelection } = useDamageCalculatorStore();

  const [layer, setLayer] = useState<string>(relicWrapper.layer.toString());

  return (
    <Tooltip delay={500} closeDelay={150} content={relicWrapper.usage || "无"}>
      <StyledRelicItem
        onClick={() => updateRelic(relicWrapper.id, "userActive", !relicWrapper.userActive)}
        $userActive={relicWrapper.userActive}
        $editable={editable}
      >
        <StyledInner>
          <StyledRelicImg
            draggable={false}
            src={assetsHost + `roguelike_topic_itempic/${relicAlterToBasic(relicWrapper.id)}.png`}
            alt={relicWrapper.name}
          />
        </StyledInner>

        {editable && (
          <StyledCloseButton
            onClick={(evt) => {
              evt.stopPropagation();
              toggleRelicSelection(relicWrapper.id);
            }}
            tabIndex={-1}
          >
            <span>X</span>
          </StyledCloseButton>
        )}
        {relicWrapper.hasLayer && (
          <StyledLayerWrapper>
            <input
              type="text"
              value={layer}
              onChange={(evt) => setLayer(evt.target.value)}
              onClick={(evt) => evt.stopPropagation()}
              onKeyDown={(evt) => evt.key === "Enter" && evt.currentTarget.blur()}
              onBlur={() => {
                setLayer(setRelicLayer(relicWrapper.id, layer));
              }}
            />
          </StyledLayerWrapper>
        )}
      </StyledRelicItem>
    </Tooltip>
  );
}
