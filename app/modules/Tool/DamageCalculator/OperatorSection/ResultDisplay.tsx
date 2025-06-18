import { Fragment } from "react/jsx-runtime";
import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";

const StyledResultDisplay = styled.div`
  background: var(--black-gray);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const type = {
  phy: "物理",
  pure: "真实",
  mag: "法术",
};

const map = {
  attack: "普攻",
  skill: "技能",
  cycle: "周期",
};

const StyledResultRow = styled.div`
  display: flex;
  font-family: "NovecentoWide", sans-serif;
`;

const StyledResultColumn = styled.div`
  flex: 1 1;
  display: flex;
`;

const StyledNumberContainer = styled.div`
  margin-right: 0.5rem;
  height: 4rem;
  & > * {
    font-size: 0.9rem;
    line-height: 2rem;
  }
  & > label {
    font-weight: bold;
  }
  & > div {
    font-size: 1.8rem;
  }
`;

const StyledNumberTotal = styled(StyledNumberContainer)`
  position: relative;
  & > label {
    color: var(--light-gray);
  }
  & > div {
    color: var(--ak-blue);
  }
`;

const StyledOperator = styled.div`
  margin: 0 1rem;
  line-height: 4rem;
  font-size: 2rem;
  color: var(--light-mid-gray);
`;

const StyledNumberPart = styled(StyledNumberContainer)<{ $type: string }>`
  & > label {
    color: ${(props) =>
      props.$type === "phy"
        ? "var(--ak-dark-red)"
        : props.$type === "mag"
          ? "var(--ak-purple)"
          : props.$type === "pure"
            ? "#FADD00"
            : "green"};
  }
  & > div {
    color: white;
    font-family: "NovecentoWide", sans-serif;
  }
`;

export function ResultDisplay() {
  const calcOutput = useDamageCalculatorStore((state) => state.calcOutput);
  return (
    <StyledResultDisplay>
      {Object.keys(calcOutput).map((key) => {
        if (key === "logs") return null;
        return (
          <StyledResultRow key={key}>
            {["dps", "total_damage"].map((colKey) => {
              const collected = (Object.values(calcOutput[key as never][colKey]) as number[]).reduce(
                (a, b) => a + b,
                0,
              );
              const collectedStr = Number.isInteger(collected) ? collected.toString() : collected.toFixed(2);
              return (
                <StyledResultColumn key={colKey}>
                  <StyledNumberTotal>
                    <label>{map[key as never] + (colKey === "dps" ? "DPS" : "总伤")}</label>
                    <div>{collectedStr}</div>
                  </StyledNumberTotal>
                  <StyledOperator>=</StyledOperator>
                  {Object.keys(calcOutput[key as never][colKey])
                    .filter((damageType) => calcOutput[key as never][colKey][damageType])
                    .map((damageType, i, array) => {
                      const num = calcOutput[key as never][colKey][damageType] as number;
                      const numStr = Number.isInteger(num) ? num.toString() : num.toFixed(2);
                      return (
                        <Fragment key={damageType}>
                          <StyledNumberPart $type={damageType} key={i}>
                            <label>{type[damageType as never] || damageType}</label>
                            <div>{numStr}</div>
                          </StyledNumberPart>
                          {i < array.length - 1 && <StyledOperator key={"add" + i}>+</StyledOperator>}
                        </Fragment>
                      );
                    })}
                </StyledResultColumn>
              );
            })}
          </StyledResultRow>
        );
      })}
    </StyledResultDisplay>
  );
}
