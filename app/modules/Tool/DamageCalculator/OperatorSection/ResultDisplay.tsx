import { styled } from "styled-components";

const StyledResultDisplay = styled.div`
  background: var(--black-gray);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const d = {
  atk: 999, // 面板攻击力
  dps: {
    phy: 114514,
    pure: 114514,
  }, // dps
  total_damage: {
    phy: 1919810,
    pure: 1919810,
  },
};

const type = {
  phy: "物理",
  pure: "真实",
};

const result = {
  auto: d, // 普攻
  skill: d, // 技能
  cycle: d, // 周期
};

const map = {
  auto: "普通",
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
  return (
    <StyledResultDisplay>
      {Object.keys(result).map((key) => (
        <StyledResultRow key={key}>
          {["dps", "total_damage"].map((colKey) => (
            <StyledResultColumn key={colKey}>
              <StyledNumberTotal>
                <label>{map[key] + (colKey === "dps" ? "DPS" : "总伤")}</label>
                <div>
                  {Object.values(result[key][colKey]).reduce((a, b) => a + b)}
                </div>
              </StyledNumberTotal>
              <StyledOperator>=</StyledOperator>
              {Object.keys(result[key][colKey]).map((damageType, i, array) => (
                <>
                  <StyledNumberPart $type={damageType} key={i}>
                    <label>{type[damageType]}</label>
                    <div>{result[key][colKey][damageType]}</div>
                  </StyledNumberPart>
                  {i < array.length - 1 && (
                    <StyledOperator key={"add" + i}>+</StyledOperator>
                  )}
                </>
              ))}
            </StyledResultColumn>
          ))}
        </StyledResultRow>
      ))}
    </StyledResultDisplay>
  );
}
