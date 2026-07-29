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
import { getRogue6Utopias, getUtopiaLevel, UTOPIA_LEVELS } from "./use-rogue6-topic-spec-items";

/**
 * 黑流树海主题特殊效果选择器。
 * 当前仅含「理想域」；「零件」需要后端先把 scrap 相关表纳入 API 下发（见 known-issues）。
 */
export default memo(function Rogue6Selector() {
  const { rogueInput, rogue6_utopia_spec_items, setRogue6Utopias, setRogue6UtopiaSpecItems } =
    useDamageCalculatorStore(
      useShallow((state) => ({
        rogueInput: state.rogueInput,
        rogue6_utopia_spec_items: state.rogue6_utopia_spec_items,
        setRogue6Utopias: state.setRogue6Utopias,
        setRogue6UtopiaSpecItems: state.setRogue6UtopiaSpecItems,
      })),
    );

  const difficulty = rogueInput.rogue_6.difficulty;

  // 难度变化会改变理想域等级，需重新物化条目
  useEffect(() => {
    const utopiaList = getRogue6Utopias(difficulty);
    setRogue6UtopiaSpecItems(() => utopiaList);
  }, [difficulty, setRogue6UtopiaSpecItems]);

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
    </>
  );
});
