import { Tooltip } from "@heroui/react";
import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { RogueTopic } from "~/types/gameData";
import { cosHost } from "~/utils/tools";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { ITopicSpecItem } from "./TopicSpecSelector";

const triggerConfigs: Record<RogueTopic, { text: string; background: string }> = {
  [RogueTopic.ROGUE_1]: {
    text: "剧目",
    background: "",
  },
  [RogueTopic.ROGUE_2]: {
    text: "灯火",
    background: "",
  },
  [RogueTopic.ROGUE_3]: {
    text: "",
    background: "",
  },
  [RogueTopic.ROGUE_4]: {
    text: "灵感&年代",
    background: "/images%2Frogue_4%2F%E7%81%B5%E6%84%9F%E5%B9%B4%E4%BB%A3.png",
  },
  [RogueTopic.ROGUE_5]: {
    text: "通宝&岁时",
    background: "/images%2Frogue_5%2F%E9%80%9A%E5%AE%9D%E5%B2%81%E6%97%B6.png",
  },
  [RogueTopic.ROGUE_6]: {
    text: "零件&理想域",
    background: "/images/rogue_6/%E9%9B%B6%E4%BB%B6%E7%90%86%E6%83%B3%E5%9F%9F.png",
  },
};

const StyledTopicSpecContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StyledSpecTrigger = styled.div`
  height: 4rem;
  display: flex;
  gap: 1rem;
  color: var(--light-gray);
  user-select: none;
  cursor: pointer;
  & > div {
    text-align: center;
  }
`;

const StyledTopicSpecTriggerInfo = styled.div<{ $background: string }>`
  background: #333333 url("${({ $background }) => cosHost + $background}") no-repeat center center / contain;
  aspect-ratio: 4/3;
  font-family: "NovecentoWide", sans-serif;
`;

const StyledTopicSpecTriggerInfoInner = styled.div`
  padding-top: 2.25rem;
  font-size: 0.9rem;
`;

export const StyledTopicSpecNode = styled.div<{ $url: string; $invert: number; $userActive: boolean; $rows: number }>`
  width: 4rem;
  height: ${(props) => props.$rows * 2}rem;
  background: url(${(props) => props.$url}) no-repeat center center;
  background-size: contain;
  filter: invert(${(props) => props.$invert});
  opacity: ${(props) => (props.$userActive ? "1" : "0.3")};
  user-select: none;
  cursor: pointer;
  grid-row: span ${(props) => props.$rows};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledTopicSpecNodeWrapper = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: 2rem 2rem;
  grid-auto-columns: 4rem;
  height: 4rem;
  gap: 0 0.5rem;
`;

export default memo(function TopicSpecTrigger() {
  const {
    rogueInput,
    toggleShowTopicSpec,
    rogue4_inspiration_spec_items,
    rogue5_wrath_spec_items,
    rogue5_copper_spec_items,
    rogue4_disaster_spec_items,
    setRogue4InspirationSpecItems,
    setRogue5WrathSpecItems,
    setRogue5CopperSpecItems,
    setRogue4DisasterSpecItems,
    rogue6_utopia_spec_items,
    setRogue6UtopiaSpecItems,
    rogue6_scrap_spec_items,
    setRogue6ScrapSpecItems,
  } = useDamageCalculatorStore(
    useShallow((state) => ({
      rogueInput: state.rogueInput,
      rogue4_inspiration_spec_items: state.rogue4_inspiration_spec_items,
      rogue5_wrath_spec_items: state.rogue5_wrath_spec_items,
      rogue5_copper_spec_items: state.rogue5_copper_spec_items,
      rogue4_disaster_spec_items: state.rogue4_disaster_spec_items,
      setRogue4InspirationSpecItems: state.setRogue4InspirationSpecItems,
      setRogue5WrathSpecItems: state.setRogue5WrathSpecItems,
      setRogue5CopperSpecItems: state.setRogue5CopperSpecItems,
      setRogue4DisasterSpecItems: state.setRogue4DisasterSpecItems,
      rogue6_utopia_spec_items: state.rogue6_utopia_spec_items,
      setRogue6UtopiaSpecItems: state.setRogue6UtopiaSpecItems,
      rogue6_scrap_spec_items: state.rogue6_scrap_spec_items,
      setRogue6ScrapSpecItems: state.setRogue6ScrapSpecItems,
      toggleShowTopicSpec: state.toggleShowTopicSpec,
    })),
  );

  const allowedRogueKeys = [RogueTopic.ROGUE_4, RogueTopic.ROGUE_5, RogueTopic.ROGUE_6];

  /** 主题切换激活状态 */
  function toggleTopicSpecUserActive(
    item: ITopicSpecItem,
    callback: (callback: (wraths: ITopicSpecItem[]) => ITopicSpecItem[]) => void,
  ) {
    callback((state) => {
      const updated = state.find((find) => find.id === item.id);
      if (updated) {
        updated.userActive = !updated.userActive;
      }
      return state;
    });
  }

  if (allowedRogueKeys.includes(rogueInput.topic)) {
    return (
      <StyledTopicSpecContainer>
        <StyledSpecTrigger onClick={toggleShowTopicSpec}>
          <StyledTopicSpecTriggerInfo $background={triggerConfigs[rogueInput.topic].background}>
            <StyledTopicSpecTriggerInfoInner>{triggerConfigs[rogueInput.topic].text}</StyledTopicSpecTriggerInfoInner>
          </StyledTopicSpecTriggerInfo>
        </StyledSpecTrigger>
        <StyledTopicSpecNodeWrapper>
          {/* 灵感 */}
          {rogueInput.topic === RogueTopic.ROGUE_4 && (
            <TopicSpecTriggerNode
              items={rogue4_inspiration_spec_items.filter((item) => item.id === rogueInput.rogue_4.inspiration)}
              onClick={(item) => toggleTopicSpecUserActive(item, setRogue4InspirationSpecItems)}
            />
          )}
          {/* 年代 */}
          {rogueInput.topic === RogueTopic.ROGUE_4 && (
            <TopicSpecTriggerNode
              items={rogue4_disaster_spec_items.filter((item) => item.id === rogueInput.rogue_4.disaster)}
              onClick={(item) => toggleTopicSpecUserActive(item, setRogue4DisasterSpecItems)}
            />
          )}
          {/* 岁时 */}
          {rogueInput.topic === RogueTopic.ROGUE_5 && (
            <TopicSpecTriggerNode
              items={rogue5_wrath_spec_items.filter((item) => rogueInput.rogue_5.wraths.includes(item.id))}
              onClick={(item) => toggleTopicSpecUserActive(item, setRogue5WrathSpecItems)}
            />
          )}
          {/* 理想域 */}
          {rogueInput.topic === RogueTopic.ROGUE_6 && (
            <TopicSpecTriggerNode
              items={rogue6_utopia_spec_items.filter((item) => rogueInput.rogue_6.utopias.includes(item.id))}
              onClick={(item) => toggleTopicSpecUserActive(item, setRogue6UtopiaSpecItems)}
            />
          )}
          {/* 零件 */}
          {rogueInput.topic === RogueTopic.ROGUE_6 && (
            <TopicSpecTriggerNode
              items={rogue6_scrap_spec_items.filter((item) => rogueInput.rogue_6.scraps.includes(item.id))}
              onClick={(item) => toggleTopicSpecUserActive(item, setRogue6ScrapSpecItems)}
            />
          )}
          {/* 通宝 */}
          {rogueInput.topic === RogueTopic.ROGUE_5 && (
            <TopicSpecTriggerNode
              items={rogue5_copper_spec_items.filter((item) => rogueInput.rogue_5.coppers.includes(item.id))}
              onClick={(item) => toggleTopicSpecUserActive(item, setRogue5CopperSpecItems)}
            />
          )}
        </StyledTopicSpecNodeWrapper>
      </StyledTopicSpecContainer>
    );
  }
  return null;
});

/** 主题加成 */
export function TopicSpecTriggerNode({
  items,
  onClick,
}: {
  items: ITopicSpecItem[];
  onClick: (item: ITopicSpecItem) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <Tooltip
          key={item.id}
          closeDelay={300}
          content={
            <div className="px-1 py-2">
              <div className="font-bold">{item.name}</div>
              <div className="text-small">{item.description}</div>
            </div>
          }
        >
          <StyledTopicSpecNode
            onClick={() => onClick(item)}
            $url={item.url}
            $invert={item.invert}
            $userActive={item.userActive}
            $rows={item.rows}
          >
            {item.url === "#" && <div className="text-tiny font-bold">{item.name}</div>}
          </StyledTopicSpecNode>
        </Tooltip>
      ))}
    </>
  );
}
