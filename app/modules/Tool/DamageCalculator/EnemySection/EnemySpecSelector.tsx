import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "../../components/ToolSelect";
import { styled } from "styled-components";
import { Rogue4SkzdwxSelect } from "./enemySpecConfigs";

const StyledEnemySpecSelector = styled.div`
  height: 100%;
`;

const StyledEnemySpecSelectorInner = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
  height: 100%;
`;

export interface EnemySpec {
  id: string;
  value: { label: string; bbKey: string; key: string; value: number }[];
}

/**
 * 敌人特殊词条效果（减伤）
 */
export default function EnemySpecSelector() {
  const { rogueInput, enemyData, enemyConfig, enemySpec, updateEnemySpec } = useDamageCalculatorStore();

  // 显示年代印痕选项
  const rogueKey = rogueInput.topic;
  const difficulty = rogueInput[rogueKey].difficulty;
  const showSkzdwx = rogueKey === "rogue_4" && enemyData.name.m_value !== "木桩" && difficulty >= 14;

  return (
    <StyledEnemySpecSelector>
      <StyledEnemySpecSelectorInner>
        {enemyConfig.selects
          .filter((select) => showSkzdwx || select.label !== Rogue4SkzdwxSelect.label)
          .map((select, index) => (
            <ToolSelect
              key={select.label}
              array={select.options}
              getKey={(item) => item.key.toString()}
              getValue={(item) => item.label}
              label={select.label}
              selectedKeys={[enemySpec.value[index].key]}
              onChange={(evt) => {
                const result = select.apply(evt.target.value);
                updateEnemySpec(index, result);
              }}
            />
          ))}
      </StyledEnemySpecSelectorInner>
    </StyledEnemySpecSelector>
  );
}

export interface EnemySpecConfig {
  id: string;
  name: string;
  selects: {
    label: string;
    options: { label: string; key: number }[];
    apply: (key: string) => { label: string; bbKey: string; key: string; value: number };
    img?: string;
  }[];
}
