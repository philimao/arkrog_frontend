import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "../../components/ToolSelect";
import { styled } from "styled-components";
import { useEffect, useState } from "react";
import type { EnemyData } from "~/types/gameData";

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
  enemyData,
  setIllust,
}: {
  enemyData: EnemyData;
  setIllust: (illust: React.ReactNode) => void;
}) {
  const { rogueKey, setEnemySpec } = useDamageCalculatorStore();

  // 可以保证在复制到木桩时，id不变
  const [enemyConfig, setEnemyConfig] = useState<EnemySpecConfig>();

  const showSkzdwx = rogueKey === "rogue_4" && enemyData.name.m_value !== "木桩";
  const [mitigationSkzdwx, setMitigationSkzdwx] = useState<string>("0");

  const [selected, setSelected] = useState<string[]>();

  /** 当敌人配置变化时，更新敌人效果图与默认效果 */
  useEffect(() => {
    // 在同一个effect中同步更新enemyConfig与selected，减少下一个useEffect的重复计算
    const enemyConfig = EnemySpecConfigs[enemyData.id];
    setEnemyConfig(enemyConfig);
    if (enemyConfig) {
      //   console.log("加载敌人特殊效果", enemyConfig);
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
      setSelected(enemyConfig.selects.map((select) => select.options[0].value.toString()));
    } else {
      setIllust(null);
      setSelected([]);
    }
  }, [enemyData.id, setIllust]);

  /** 当敌人配置选项变化时，更新敌人效果 */
  useEffect(() => {
    if (!selected) return;
    const result = [];
    if (enemyConfig) {
      result.push(
        ...enemyConfig.selects.map((select, index) => {
          return select.apply(Number(selected[index]));
        }),
      );
    }
    if (mitigationSkzdwx === "0.5") {
      result.push({
        label: "位于年代印痕中（最终乘算50减伤）",
        key: "enemy_damage_resistance",
        value: 0.5,
      });
    }
    setEnemySpec(result);
  }, [enemyConfig, mitigationSkzdwx, selected, setEnemySpec]);

  if (!selected) return null;
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
                setSelected((prev: string[] | undefined) => {
                  if (!prev) return [];
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

const sharedConfigs: Record<string, EnemySpecConfig> = {};
[
  { id: "enemy_1220_dzoms", name: "大君之触" },
  { id: "enemy_1220_dzoms_2", name: "仁慈之触" },
  { id: "enemy_1221_dzomg", name: "大君之赐" },
  { id: "enemy_1221_dzomg_2", name: "慷慨之赐" },
].forEach(({ id, name }) => {
  sharedConfigs[id] = {
    id,
    name,
    selects: [
      {
        label: "重生造物（受到的物理和法术伤害降低90%）",
        options: [{ label: "90%减伤", value: 0.9 }],
        apply: (value: number) => {
          return {
            label: "重生造物（受到的物理和法术伤害降低90%）",
            key: "enemy_damage_resistance",
            value: value,
          };
        },
      },
    ],
  };
});

const EnemySpecConfigs: Record<string, EnemySpecConfig> = {
  // rogue_4 萨卡兹的无终奇语
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
  enemy_2080_skzlwy: {
    id: "enemy_2080_skzlwy",
    name: "弗莱蒙特，诸思之解答",
    selects: [
      {
        label: "根据储存的攻击能量数量获得物法减伤",
        options: [
          { label: "90减伤 3颗球", value: 0.9 },
          { label: "60减伤 2颗球", value: 0.6 },
          { label: "30减伤 1颗球", value: 0.3 },
          { label: "0减伤 无球", value: 0 },
        ],
        apply: (value: number) => {
          return {
            label: "根据储存的攻击能量数量获得物法减伤",
            key: "enemy_damage_resistance",
            value: value,
          };
        },
      },
    ],
  },
  enemy_2082_skzdd: {
    id: "enemy_2082_skzdd",
    name: "博卓卡斯替，圣卫铳骑",
    selects: [
      {
        label: "伤害来源与自身距离≥2.0，获得80物法减伤",
        options: [
          { label: "80减伤", value: 0.8 },
          { label: "无减伤", value: 0 },
        ],
        apply: (value: number) => {
          return {
            label: "伤害来源与自身距离≥2.0，获得80物法减伤",
            key: "enemy_damage_resistance",
            value: value,
          };
        },
      },
    ],
  },
  enemy_2089_skzjkl: {
    id: "enemy_2089_skzjkl",
    name: "奎隆，摩诃萨埵权化",
    selects: [
      {
        label: "场上每存在一个尼卢火，获得20物法减伤",
        options: [
          { label: "无尼卢火", value: 0 },
          { label: "1 尼卢火", value: 1 },
          { label: "2 尼卢火", value: 2 },
          { label: "3 尼卢火", value: 3 },
          { label: "4 尼卢火", value: 4 },
          { label: "5 尼卢火", value: 5 },
        ],
        apply: (value: number) => {
          const baseValue = Math.pow(0.8, value);
          // 保留4位小数
          const percentage = Math.round((1 - baseValue) * 10000) / 10000;
          const finalValue = Math.round(percentage * 100) / 100;
          return {
            label: "场上每存在一个尼卢火，获得20物法减伤",
            key: "enemy_damage_resistance",
            value: finalValue,
          };
        },
      },
    ],
  },
  enemy_2092_skzamy: {
    id: "enemy_2092_skzamy",
    name: "“阿米娅”，炉芯终曲",
    selects: [
      {
        label: "一阶段获得50物法减伤",
        options: [
          { label: "一阶段 50减伤", value: 0.5 },
          { label: "二阶段 无减伤", value: 0 },
        ],
        apply: (value: number) => {
          return {
            label: "一阶段获得50物法减伤",
            key: "enemy_damage_resistance",
            value: value,
          };
        },
      },
    ],
  },
  enemy_2085_skzjxd: {
    id: "enemy_2085_skzjxd",
    name: "圆仔",
    selects: [
      {
        label: "当护盾朝向我方干员时，获得80物法减伤",
        options: [
          { label: "80减伤", value: 0.8 },
          { label: "无减伤", value: 0 },
        ],
        apply: (value: number) => {
          return {
            label: "当护盾朝向我方干员时，获得80物法减伤",
            key: "enemy_damage_resistance",
            value: value,
          };
        },
      },
    ],
  },
  ...sharedConfigs,
};
