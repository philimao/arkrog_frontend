import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "../../components/ToolSelect";
import type { RogueKey } from "~/types/gameData";
import { styled } from "styled-components";
import { useEffect, useState } from "react";

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
  label: string;
  key: string;
  value: number;
}

/**
 * 敌人特殊词条效果（减伤）
 * @param setIllust 设置敌人效果图
 */
export default function EnemySpecSelector({
  setIllust,
  setEnemySpec,
}: {
  setIllust: (illust: React.ReactNode) => void;
  setEnemySpec: (spec: EnemySpec[]) => void;
}) {
  const { rogueKey, enemyDataParsed } = useDamageCalculatorStore();

  // 可以保证在复制到木桩时，id不变
  const enemyConfig = EnemySpecConfigs[rogueKey]?.[enemyDataParsed.id];

  const showSkzdwx = rogueKey === "rogue_4";
  const [mitigationSkzdwx, setMitigationSkzdwx] = useState<string>("0");

  const [selected, setSelected] = useState<string[]>(() => {
    return (
      enemyConfig?.selects.map((select) => {
        return select.options[0].value.toString();
      }) || []
    );
  });

  useEffect(() => {
    if (enemyConfig) {
      const illust = (
        <div className="mt-4 flex flex-col gap-4">
          {enemyConfig.selects
            .map((select) => {
              return select.img;
            })
            .filter((i) => i)
            .map((img) => (
              <img className="w-full" src={img} alt="illust" key={img} />
            ))}
        </div>
      );
      setIllust(illust);
      const result = enemyConfig.selects.map((select, index) => {
        return select.apply(Number(selected[index]));
      });
      console.log("enemy_spec_result", result);
      setEnemySpec(result);
    } else {
      setIllust(null);
    }
  }, [selected, enemyConfig, setIllust, setEnemySpec]);

  return (
    <StyledEnemySpecSelector>
      <StyledEnemySpecSelectorInner>
        {enemyConfig?.selects.map(
          (
            select: {
              label: string;
              options: { label: string; value: number }[];
              apply: (value: number) => { label: string; key: string; value: number };
            },
            index: number,
          ) => (
            <ToolSelect
              key={select.label}
              array={select.options}
              getKey={(item) => item.value.toString()}
              getValue={(item) => item.label}
              label={select.label}
              selectedKeys={[selected[index]]}
              onChange={(evt) => {
                setSelected((prev: string[]) => {
                  const newSelected = [...prev];
                  newSelected[index] = evt.target.value;
                  return newSelected;
                });
              }}
            />
          ),
        )}
        {showSkzdwx && (
          <ToolSelect
            array={[
              { label: "否", value: 0 },
              { label: "是", value: 0.5 },
            ]}
            getKey={(item) => item.value.toString()}
            getValue={(item) => item.label}
            label="是否位于年代印痕中（最终乘算50减伤）"
            selectedKeys={[mitigationSkzdwx]}
            onChange={(evt) => {
              setMitigationSkzdwx(evt.target.value);
            }}
          />
        )}
      </StyledEnemySpecSelectorInner>
    </StyledEnemySpecSelector>
  );
}

interface EnemySpecConfig {
  id: string;
  name: string;
  selects: {
    label: string;
    options: { label: string; value: number }[];
    apply: (value: number) => { label: string; key: string; value: number };
    img?: string;
  }[];
}

const EnemySpecConfigs: Partial<Record<RogueKey, Record<string, EnemySpecConfig>>> = {
  rogue_4: {
    enemy_2081_skztxs: {
      id: "enemy_2081_skztxs",
      name: "特雷西斯，黑冠尊主",
      selects: [
        {
          label: "根据与特蕾西亚距离获得物法减伤",
          options: [
            { label: "90减伤 距离≤1.0", value: 0.9 },
            { label: "75减伤 距离≤1.5", value: 0.75 },
            { label: "60减伤 距离≤2.5", value: 0.6 },
            { label: "50减伤 距离≤3.5", value: 0.5 },
            { label: "35减伤 距离>3.5", value: 0.35 },
          ],
          apply: (value: number) => {
            return {
              label: "根据与特蕾西亚距离获得物法减伤",
              key: "enemy_damage_resistance",
              value: value,
            };
          },
          img: "https://arkrog-1326514380.cos.ap-beijing.myqcloud.com/images%2Frogue_4%2F%E7%89%B9%E9%9B%B7%E8%A5%BF%E6%96%AF-%E5%87%8F%E4%BC%A4%E7%A4%BA%E6%84%8F%E5%9B%BE.png",
        },
      ],
    },
    enemy_2098_skzftx: {
      id: "enemy_2098_skzftx",
      name: "特雷西斯，黑冠尊主",
      selects: [
        {
          label: "本关固定获得50物法减伤",
          options: [{ label: "50减伤", value: 0.5 }],
          apply: (value: number) => {
            return {
              label: "本关固定获得50物法减伤",
              key: "enemy_damage_resistance",
              value: value,
            };
          },
        },
      ],
    },
  },
};
