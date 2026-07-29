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
import { getRogue6Scraps, getRogue6Utopias, getUtopiaLevel, UTOPIA_LEVELS } from "./use-rogue6-topic-spec-items";

/**
 * 黑流树海主题特殊效果选择器：理想域 + 零件。
 * 零件只收录影响战斗数值的两个概念体，其余为移动/估价类，见 use-rogue6-topic-spec-items。
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

  // 难度变化会改变理想域等级，需重新物化条目
  useEffect(() => {
    const utopiaList = getRogue6Utopias(difficulty);
    setRogue6UtopiaSpecItems(() => utopiaList);
  }, [difficulty, setRogue6UtopiaSpecItems]);

  // 零件不随难度变化，仅需物化一次
  useEffect(() => {
    setRogue6ScrapSpecItems(() => getRogue6Scraps());
  }, [setRogue6ScrapSpecItems]);

  const level = getUtopiaLevel(difficulty);
  const levelStr = level < 0 ? "" : UTOPIA_LEVELS[level];

  return (
    <>
      <StyledTitle>理想域</StyledTitle>
      {level < 0 ? (
        <div className="text-tiny">保密等级 2 起才会生成理想域。</div>
      ) : (
        <StyledGridContainer $cols={4}>
          {rogue6_utopia_spec_items.map((ut) => (
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
      <StyledTitle>零件</StyledTitle>
      <div className="text-tiny">仅列出影响战斗数值的零件，其余为移动、估价等非面板效果。</div>
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
