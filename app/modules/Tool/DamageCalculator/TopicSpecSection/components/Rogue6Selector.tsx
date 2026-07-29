import { memo, useEffect } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { useShallow } from "zustand/react/shallow";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import { LazyImage } from "~/components/LazyImage";
import {
  StyledGridContainer,
  StyledGridItem,
  StyledGridItemIcon,
  StyledGridItemInner,
  StyledGridItemTitle,
} from "../TopicSpecSelector";
import {
  getRogue6Scraps,
  getRogue6Utopias,
  getRogue6Variations,
  getUtopiaLevel,
  UTOPIA_LEVELS,
} from "./use-rogue6-topic-spec-items";

/**
 * 黑流树海主题特殊效果选择器：实托邦 + 乌托邦（同属「理想域」两类聚落）+ 零件。
 * 实托邦与乌托邦共用 rogueInput.rogue_6.utopias 与同一份 spec items，按 id 前缀分组渲染。
 */
export default memo(function Rogue6Selector() {
  const {
    rogueInput,
    rogue6_utopia_spec_items,
    rogue6_scrap_spec_items,
    setRogue6Utopias,
    setRogue6UtopiaSpecItems,
    setRogue6Scraps,
    setRogue6ScrapSpecItems,
  } = useDamageCalculatorStore(
    useShallow((state) => ({
      rogueInput: state.rogueInput,
      rogue6_utopia_spec_items: state.rogue6_utopia_spec_items,
      rogue6_scrap_spec_items: state.rogue6_scrap_spec_items,
      setRogue6Utopias: state.setRogue6Utopias,
      setRogue6UtopiaSpecItems: state.setRogue6UtopiaSpecItems,
      setRogue6Scraps: state.setRogue6Scraps,
      setRogue6ScrapSpecItems: state.setRogue6ScrapSpecItems,
    })),
  );

  const difficulty = rogueInput.rogue_6.difficulty;

  // 难度变化会改变实托邦等级，需重新物化；乌托邦无分级但同存一份列表
  useEffect(() => {
    setRogue6UtopiaSpecItems(() => [...getRogue6Utopias(difficulty), ...getRogue6Variations()]);
  }, [difficulty, setRogue6UtopiaSpecItems]);

  // 零件不随难度变化，仅需物化一次
  useEffect(() => {
    setRogue6ScrapSpecItems(() => getRogue6Scraps());
  }, [setRogue6ScrapSpecItems]);

  const level = getUtopiaLevel(difficulty);
  const levelStr = level < 0 ? "" : UTOPIA_LEVELS[level];
  const weatherItems = rogue6_utopia_spec_items.filter((item) => item.id.startsWith("rogue_6_weather_"));
  const variationItems = rogue6_utopia_spec_items.filter((item) => item.id.startsWith("rogue_6_variation_"));

  return (
    <>
      <StyledTitle>实托邦</StyledTitle>
      {level < 0 ? (
        <div className="text-tiny">保密等级 2 起才会生成实托邦。</div>
      ) : (
        <StyledGridContainer $cols={4}>
          {weatherItems.map((ut) => (
            <StyledGridItem
              key={ut.id}
              $selected={rogueInput.rogue_6.utopias.includes(ut.id)}
              onClick={() => setRogue6Utopias(ut.id)}
              $disabled={ut.disabled}
            >
              <StyledGridItemInner>
                <StyledGridItemIcon>
                  <LazyImage src={ut.url} alt={ut.name} />
                </StyledGridItemIcon>
                <div className="flex flex-col gap-0.5 justify-center">
                  <StyledGridItemTitle>
                    <span>{ut.name}</span>
                    <span>{levelStr}</span>
                  </StyledGridItemTitle>
                  <div className="text-tiny">{ut.description}</div>
                </div>
              </StyledGridItemInner>
            </StyledGridItem>
          ))}
        </StyledGridContainer>
      )}
      <StyledTitle>乌托邦</StyledTitle>
      <StyledGridContainer $cols={4}>
        {variationItems.map((va) => (
          <StyledGridItem
            key={va.id}
            $selected={rogueInput.rogue_6.utopias.includes(va.id)}
            onClick={() => setRogue6Utopias(va.id)}
            $disabled={va.disabled}
          >
            <StyledGridItemInner>
              <StyledGridItemIcon>
                <LazyImage src={va.url} alt={va.name} />
              </StyledGridItemIcon>
              <div className="flex flex-col gap-0.5 justify-center">
                <StyledGridItemTitle>
                  <span>{va.name}</span>
                </StyledGridItemTitle>
                <div className="text-tiny">{va.description}</div>
              </div>
            </StyledGridItemInner>
          </StyledGridItem>
        ))}
      </StyledGridContainer>
      <StyledTitle>零件</StyledTitle>
      <StyledGridContainer $cols={4}>
        {rogue6_scrap_spec_items.map((sc) => (
          <StyledGridItem
            key={sc.id}
            $selected={rogueInput.rogue_6.scraps.includes(sc.id)}
            onClick={() => setRogue6Scraps(sc.id)}
            $disabled={sc.disabled}
          >
            <StyledGridItemInner>
              <StyledGridItemIcon>
                <LazyImage src={sc.url} alt={sc.name} />
              </StyledGridItemIcon>
              <div className="flex flex-col gap-0.5 justify-center">
                <StyledGridItemTitle>
                  <span>{sc.name}</span>
                </StyledGridItemTitle>
                <div className="text-tiny">{sc.description}</div>
              </div>
            </StyledGridItemInner>
          </StyledGridItem>
        ))}
      </StyledGridContainer>
    </>
  );
});
