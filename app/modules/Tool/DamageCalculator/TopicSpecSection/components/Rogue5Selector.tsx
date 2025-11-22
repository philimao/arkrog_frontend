import { memo, useEffect, useRef, useState } from "react";
import { useGameDataStore } from "~/stores/gameDataStore";
import {
  StyledGridContainer,
  StyledGridItem,
  StyledGridItemIcon,
  StyledGridItemInner,
  StyledGridItemTitle,
} from "../TopicSpecSelector";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import { assetsHost } from "~/utils/tools";
import { BuffContext } from "../../calculator";
import type { ExpressionGroupNode } from "../../calculator/ast";
import { styled } from "styled-components";
import { allowedBlackboardKeyMap } from "../../utils";
import { LazyImage } from "~/components/LazyImage";
import { getRogue5Coppers, getRogue5Wraths, WRATH_LEVELS } from "./use-rogue5-topic-spec-items";
import { useShallow } from "zustand/react/shallow";

export default memo(function Rogue5Selector() {
  console.count("Rogue5Selector");
  const { items, relics } = useGameDataStore(useShallow((state) => ({ items: state.items, relics: state.relics })));
  const {
    rogueInput,
    rogue5_wrath_spec_items,
    rogue5_copper_spec_items,
    setRogue5Wraths,
    setRogue5Coppers,
    setRogue5WrathSpecItems,
    setRogue5CopperSpecItems,
  } = useDamageCalculatorStore(
    useShallow((state) => ({
      rogueInput: state.rogueInput,
      setRogue5Wraths: state.setRogue5Wraths,
      setRogue5Coppers: state.setRogue5Coppers,
      rogue5_wrath_spec_items: state.rogue5_wrath_spec_items,
      rogue5_copper_spec_items: state.rogue5_copper_spec_items,
      setRogue5WrathSpecItems: state.setRogue5WrathSpecItems,
      setRogue5CopperSpecItems: state.setRogue5CopperSpecItems,
    })),
  );
  /** 岁时天象 */
  useEffect(() => {
    const wrathList = getRogue5Wraths(rogueInput.rogue_5.difficulty);
    setRogue5WrathSpecItems(() => wrathList);
  }, [rogueInput.rogue_5.difficulty, setRogue5WrathSpecItems]);
  /** 通宝 */
  useEffect(() => {
    const coppers = Object.values(relics.rogue_5)
      .filter((relic) => relic.id.includes("copper"))
      .map((relic) => ({
        ...items.rogue_5[relic.id],
        ...relic,
      }));
    const copperList = getRogue5Coppers(coppers);

    const specItems = copperList.map((copperWrapper) => {
      const url =
        assetsHost + `roguelike_topic_itempic/${copperWrapper.id.replace("_buff", "").replace(/_[abcd]$/, "")}.png`;
      return {
        ...copperWrapper,
        description: copperWrapper.usage,
        url,
        userActive: true,
        invert: 0,
        buffs: copperWrapper.buffs,
        rows: 2,
      };
    });
    setRogue5CopperSpecItems(() => specItems);
  }, [items.rogue_5, relics.rogue_5, setRogue5CopperSpecItems]);

  const anyRelicContext = useRef<BuffContext>({} as BuffContext);

  /** 难度 */
  const difficulty = rogueInput[rogueInput.topic].difficulty;
  /** 岁时天象等级 */
  const level = difficulty < 6 ? 0 : difficulty < 13 ? 1 : 2;
  /** 岁时天象 */
  const levelStr = WRATH_LEVELS[level];

  return (
    <>
      <StyledTitle>岁时</StyledTitle>
      <StyledGridContainer $cols={4}>
        {rogue5_wrath_spec_items.map((wr) => {
          return (
            <StyledGridItem
              key={wr.id}
              $selected={rogueInput.rogue_5.wraths.includes(wr.id)}
              onClick={() => setRogue5Wraths(wr.id)}
              $disabled={wr.disabled}
            >
              <StyledGridItemInner>
                <StyledGridItemIcon>
                  <LazyImage src={wr.url} alt={wr.name} />
                </StyledGridItemIcon>
                <div className="flex flex-col gap-0.5 justify-center">
                  <StyledGridItemTitle>
                    <span>{wr.name}</span>
                    <span>{levelStr}</span>
                  </StyledGridItemTitle>
                  <div className="text-tiny">{wr.description}</div>
                </div>
              </StyledGridItemInner>
            </StyledGridItem>
          );
        })}
      </StyledGridContainer>
      {["厉", "花", "衡"].map((type) => (
        <div key={type}>
          <StyledTitle>{type + "钱"}</StyledTitle>
          <StyledGridContainer $cols={4}>
            {rogue5_copper_spec_items
              .filter((copperWrapper) => copperWrapper.name.startsWith(type))
              .map((copperWrapper) => {
                const buffStrs: string[] = [];
                const showBuffs = false;
                if (import.meta.env.DEV && showBuffs) {
                  const parse = (buffKey: string, key: string, value: number) =>
                    `${buffKey.startsWith("in_game") ? "局内" : ""}${allowedBlackboardKeyMap[key] || key}: ${buffKey.endsWith("_add") ? value : Math.round(value * 100) + "%"}`;
                  Object.entries(anyRelicContext.current!).forEach(([buffKey, buffValue]) => {
                    if (Array.isArray(buffValue)) return;
                    Object.entries(buffValue).forEach(([key, value]) => {
                      const node = value as ExpressionGroupNode;
                      for (const child of node.children) {
                        if (child.tooltip === copperWrapper.name) {
                          // 此处计算的是child的计算结果，因此不含基数
                          const effectiveValue = child.calculate();
                          if (!effectiveValue) return;
                          buffStrs.push(parse(buffKey, key, effectiveValue));
                        }
                      }
                    });
                  });
                }
                return (
                  <StyledGridItem
                    key={copperWrapper.id}
                    $selected={rogueInput.rogue_5.coppers.includes(copperWrapper.id)}
                    onClick={() => setRogue5Coppers(copperWrapper.id)}
                    $disabled={copperWrapper.disabled}
                  >
                    <StyledGridItemInner>
                      <StyledGridItemIcon>
                        <LazyImage src={copperWrapper.url} alt={copperWrapper.name} />
                      </StyledGridItemIcon>
                      <div className="flex flex-col gap-0.5 justify-center">
                        <StyledGridItemTitle>
                          <span>{copperWrapper.name}</span>
                        </StyledGridItemTitle>
                        <div className="text-tiny">{copperWrapper.usage}</div>
                        {buffStrs.length > 0 && (
                          <div
                            className="text-tiny mt-2 pt-2 whitespace-pre-wrap"
                            style={{ borderTop: "1px solid var(--ak-blue)" }}
                          >
                            {buffStrs.join("\n")}
                          </div>
                        )}
                      </div>
                      {copperWrapper.hasLayer && (
                        <LayerInput
                          updateLayer={(layer: number) => {
                            setRogue5CopperSpecItems((items) => {
                              const index = items.findIndex((item) => item.id === copperWrapper.id);
                              if (index > -1) items[index].layer = layer;
                              return items;
                            });
                            // 如何与topicSpecItems同步？ TODO
                            // setCoppersWrapper(() => {
                            //   const updated = [...coppersWrapper];
                            //   const index = updated.findIndex((copper) => copper.id === copperWrapper.id);
                            //   if (index > -1) updated[index].layer = layer;
                            //   return updated;
                            // });
                            // setTopicSpecItems((nodes) => {
                            //   let index;
                            //   if ((index = nodes.findIndex((node) => node.id === copperWrapper.id)) === -1)
                            //     return nodes;
                            //   const updated = [...nodes];
                            //   updated[index].layer = layer;
                            //   return updated;
                            // });
                          }}
                        />
                      )}
                    </StyledGridItemInner>
                  </StyledGridItem>
                );
              })}
          </StyledGridContainer>
        </div>
      ))}
    </>
  );
});

const StyledLayerWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  position: absolute;
  right: 0;
  top: 0;
  height: 1rem;
  font-size: 0.8rem;
  background: var(--black-gray);
  text-align: center;
  align-items: center;
  color: var(--ak-blue);
  font-weight: bold;
  & > input {
    width: 2rem;
    height: 100%;
    padding: 0 0.25rem;
    text-align: center;
  }
  & > input:focus-visible {
    outline: none;
  }
`;

function LayerInput({ updateLayer }: { updateLayer: (layer: number) => void }) {
  const [layer, setLayer] = useState("1");
  return (
    <StyledLayerWrapper>
      <span>共计投出</span>
      <input
        type="text"
        value={layer}
        onChange={(evt) => setLayer(evt.target.value)}
        onClick={(evt) => evt.stopPropagation()}
        onKeyDown={(evt) => evt.key === "Enter" && evt.currentTarget.blur()}
        onBlur={() => {
          const layerNum = Number(layer) || 1;
          setLayer(String(layerNum));
          updateLayer(layerNum);
        }}
      />
    </StyledLayerWrapper>
  );
}
