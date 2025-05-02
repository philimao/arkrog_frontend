import { styled } from "styled-components";
import EnemyAvatar from "~/components/Character/Enemy/EnemyAvatar";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { GridContainer } from "~/modules/Tool/components/Shared";
import {
  allowedBlackboardKeyMap,
  camelToSnake,
} from "~/modules/Tool/DamageCalculator/utils";
import { useEffect, useRef, useState } from "react";
import ToolInput from "~/modules/Tool/components/ToolInput";
import type { EnemyDataParsed } from "~/types/gameData";

const StyledEnemyDisplayWrapper = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StyledName = styled.div`
  font-size: 1.5rem;
  color: white;
  font-weight: bold;
`;

const StyledEnemyAvatar = styled(EnemyAvatar)`
  width: 8.3rem;
  height: 8.3rem;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 0 0 0.5rem white;
`;

const StyledControl = styled.div`
  display: flex;
  align-items: end;
`;

const StyledPhase = styled.div`
  display: flex;
  gap: 1rem;
`;

const StyledPhaseItem = styled.button<{ $active: boolean }>`
  color: ${(props) => (props.$active ? "var(--ak-blue)" : "white")};
  font-weight: bold;
`;

const StyledRestore = styled.button`
  margin-left: auto;
  padding: 0 0.5rem;
  background: var(--dark-gray);
  color: white;
  font-size: 0.8rem;
`;

const StyledGridContainer = styled(GridContainer)`
  background: rgba(24, 24, 24, 0.7);
  padding: 1rem;
  margin-bottom: 0;
`;

const StyledInputWrapper = styled.div`
  & > div:first-child {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
    font-weight: bold;
    padding-left: 0.75rem;
    color: var(--light-mid-gray);
  }
  & > div:last-child {
    font-family: "NovecentoWide", sans-serif;
  }
`;

const keys = [
  "maxHp",
  "atk",
  "def",
  "magicResistance",
  "attackSpeed",
  "baseAttackTime",
  "epDamageResistance",
  "epResistance",
];

export default function EnemyDisplay() {
  const { enemyDataParsed, setEnemyDataParsed } = useDamageCalculatorStore();
  const [phase, setPhase] = useState<number>(1);
  const [_enemyDataParsed, _setEnemyDataParsed] = useState(enemyDataParsed);
  const enemyRef = useRef(enemyDataParsed);

  useEffect(() => {
    enemyRef.current = { ...enemyDataParsed };
  }, [enemyDataParsed.name]);

  useEffect(() => {
    _setEnemyDataParsed(enemyDataParsed);
  }, [enemyDataParsed]);

  return (
    <StyledEnemyDisplayWrapper>
      <StyledName>{_enemyDataParsed.name}</StyledName>
      <StyledEnemyAvatar name={_enemyDataParsed.name} />
      <StyledControl>
        <StyledPhase>
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <StyledPhaseItem
                $active={phase === i + 1}
                onClick={() => setPhase(i + 1)}
                key={i}
              >
                {i + 1 + "阶段"}
              </StyledPhaseItem>
            ))}
        </StyledPhase>
        <StyledRestore
          onClick={() =>
            setEnemyDataParsed(enemyRef.current as EnemyDataParsed)
          }
        >
          恢复初始
        </StyledRestore>
      </StyledControl>
      <StyledGridContainer>
        {keys.map((key) => {
          const color =
            key === "maxHp"
              ? "text-ak-blue"
              : key === "atk"
                ? "text-ak-red"
                : "";
          return (
            <StyledInputWrapper key={key}>
              <div>{allowedBlackboardKeyMap[camelToSnake(key)]}</div>
              <ToolInput
                className={"h-8 font-bold text-xl " + color}
                value={_enemyDataParsed.attributes[key as never]}
                setValue={(value: string) => {
                  // TODO parse float
                  const number = parseFloat(value) || 0;
                  const updated = {
                    ..._enemyDataParsed,
                    attributes: {
                      ..._enemyDataParsed.attributes,
                      [key]: number,
                    },
                  };
                  _setEnemyDataParsed(updated);
                }}
                onBlur={() => setEnemyDataParsed(_enemyDataParsed)}
                onEnter={(evt) => {
                  evt.preventDefault();
                  evt.currentTarget.querySelector("input")!.blur();
                }}
              />
            </StyledInputWrapper>
          );
        })}
      </StyledGridContainer>
    </StyledEnemyDisplayWrapper>
  );
}
