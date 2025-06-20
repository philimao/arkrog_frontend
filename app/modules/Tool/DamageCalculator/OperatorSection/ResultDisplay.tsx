import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";

const StyledResultDisplay = styled.div`
  background: var(--black-gray);
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 2rem;
`;

const StyledTableContainer = styled.div`
  width: 50%;
  min-width: 0;
  flex-shrink: 1;
`;

const StyledTable = styled.table`
  width: max-content;
  border-collapse: separate;
  border-spacing: 0 1rem;
  font-family: "NovecentoWide", sans-serif;
`;

const StyledTableRow = styled.tr``;

const StyledTableCell = styled.td`
  text-align: left;
  vertical-align: middle;
  padding: 0 0.25rem;
  white-space: nowrap;
  width: 1%;
  max-width: fit-content;
`;

const type = {
  phy: "物理",
  pure: "真实",
  mag: "法术",
  ep: "元素",
};

const map = {
  attack: "普攻",
  skill: "技能",
  cycle: "周期",
};

const StyledNumberContainer = styled.div`
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
  & > label {
    color: var(--light-gray);
  }
  & > div {
    color: var(--ak-blue);
  }
`;

const StyledOperator = styled.div`
  padding: 0 0.5rem;
  line-height: 4rem;
  font-size: 2rem;
  color: var(--light-mid-gray);
`;

const StyledNumberPart = styled(StyledNumberContainer)<{ $type: string }>`
  & > label {
    color: ${(props) =>
      props.$type === "phy"
        ? "var(--ak-red)"
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

  // 定义所有可能的伤害类型顺序
  const damageTypeOrder = ["phy", "mag", "pure", "ep"];

  // 构建表格数据结构 - 每行包含DPS和总伤两列
  const tableRows = Object.keys(calcOutput)
    .filter((key) => key !== "logs")
    .map((key) => {
      const getDamageTypeData = (colKey: string) => {
        const collected = (Object.values(calcOutput[key as never][colKey]) as number[]).reduce((a, b) => a + b, 0);
        const collectedStr = Number.isInteger(collected) ? collected.toString() : collected.toFixed(2);

        // 获取有效的伤害类型数据
        const validDamageTypes = damageTypeOrder.filter(
          (damageType) => ((calcOutput[key as never][colKey][damageType] as number) || 0) > 0,
        );

        return {
          total: collectedStr,
          damageTypes: validDamageTypes.map((damageType) => ({
            type: damageType,
            value: calcOutput[key as never][colKey][damageType] as number,
            valueStr: Number.isInteger(calcOutput[key as never][colKey][damageType] as number)
              ? (calcOutput[key as never][colKey][damageType] as number).toString()
              : (calcOutput[key as never][colKey][damageType] as number).toFixed(2),
          })),
        };
      };

      return {
        attackType: map[key as never],
        dps: getDamageTypeData("dps"),
        totalDamage: getDamageTypeData("total_damage"),
      };
    });

  // 计算最大的伤害类型数量（用于对齐）
  const maxDpsTypes = Math.max(...tableRows.map((row) => row.dps.damageTypes.length));
  const maxTotalTypes = Math.max(...tableRows.map((row) => row.totalDamage.damageTypes.length));

  // 渲染伤害类型单元格的辅助函数
  const renderDamageTypeCells = (damageTypes: Array<{ type: string; valueStr: string }>, maxTypes: number) => {
    const cells = [];

    // 渲染实际的伤害类型
    damageTypes.forEach((damageType, i) => {
      cells.push(
        <StyledTableCell key={damageType.type}>
          <StyledNumberPart $type={damageType.type}>
            <label>{type[damageType.type as never] || damageType.type}</label>
            <div>{damageType.valueStr}</div>
          </StyledNumberPart>
        </StyledTableCell>,
      );

      // 添加加号（除了最后一个）
      if (i < damageTypes.length - 1) {
        cells.push(
          <StyledTableCell key={`plus-${i}`}>
            <StyledOperator>+</StyledOperator>
          </StyledTableCell>,
        );
      }
    });

    // 计算需要填充的空白单元格数量
    const actualCells = damageTypes.length * 2 - 1; // 伤害类型数 * 2 - 1（减去最后一个加号）
    const maxCells = maxTypes * 2 - 1;
    const emptyCells = maxCells - actualCells;

    // 填充空白单元格
    for (let i = 0; i < emptyCells; i++) {
      cells.push(<StyledTableCell key={`empty-${i}`}></StyledTableCell>);
    }

    return cells;
  };

  return (
    <StyledResultDisplay>
      {/* DPS 表格 */}
      <StyledTableContainer>
        <StyledTable>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <StyledTableRow key={rowIndex}>
                <StyledTableCell>
                  <StyledNumberTotal>
                    <label>{row.attackType}DPS</label>
                    <div>{row.dps.total}</div>
                  </StyledNumberTotal>
                </StyledTableCell>

                <StyledTableCell>
                  <StyledOperator>=</StyledOperator>
                </StyledTableCell>

                {renderDamageTypeCells(row.dps.damageTypes, maxDpsTypes)}
              </StyledTableRow>
            ))}
          </tbody>
        </StyledTable>
      </StyledTableContainer>

      {/* 总伤 表格 */}
      <StyledTableContainer>
        <StyledTable>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <StyledTableRow key={rowIndex}>
                <StyledTableCell>
                  <StyledNumberTotal>
                    <label>{row.attackType}总伤</label>
                    <div>{row.totalDamage.total}</div>
                  </StyledNumberTotal>
                </StyledTableCell>

                <StyledTableCell>
                  <StyledOperator>=</StyledOperator>
                </StyledTableCell>

                {renderDamageTypeCells(row.totalDamage.damageTypes, maxTotalTypes)}
              </StyledTableRow>
            ))}
          </tbody>
        </StyledTable>
      </StyledTableContainer>
    </StyledResultDisplay>
  );
}
