import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import ToolSelect from "../../components/ToolSelect";
import { styled } from "styled-components";
import { cosHost } from "~/utils/tools";

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
  value: { label: string; key: string; blackboard: { bbKey: string; value: number }[] }[];
}

/**
 * 敌人特殊词条效果（减伤）
 */
export default function EnemySpecSelector() {
  const { rogueInput, enemyData, enemyConfig, enemySpec, updateEnemySpec } = useDamageCalculatorStore();

  // 显示年代印痕选项
  const rogueKey = rogueInput.topic;
  const difficulty = rogueInput[rogueKey].difficulty;
  const isSpecialEnemy = ["trap_760_skztzs", "enemy_2073_skzrck"].includes(enemyData.id);
  const showSkzdwx = rogueKey === "rogue_4" && enemyData.name.m_value !== "木桩" && difficulty >= 14;

  return (
    <StyledEnemySpecSelector>
      <StyledEnemySpecSelectorInner>
        {enemyConfig.selects
          .filter((select) => showSkzdwx || select.label !== Rogue4SkzdwxSelect.label)
          .map((select, index) => {
            // 为年代之刺和饮泣之刺的年代印痕选择器禁用"否"选项
            const isSkzdwxSelect = select.label.includes("年代印痕");
            const disabledKeys = isSpecialEnemy && isSkzdwxSelect ? ["0"] : undefined; // 禁用"否"选项（key为0）

            return (
              <ToolSelect
                key={select.label}
                array={select.options}
                getKey={(item) => item.key.toString()}
                getValue={(item) => item.label}
                label={select.label}
                selectedKeys={[enemySpec.value[index].key]}
                disabledKeys={disabledKeys}
                onChange={(evt) => {
                  const result = select.apply(evt.target.value);
                  updateEnemySpec(index, result);
                }}
              />
            );
          })}
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
    apply: (key: string) => { label: string; key: string; blackboard: { bbKey: string; value: number }[] };
    img?: string;
  }[];
}

export const sharedConfigs: Record<string, EnemySpecConfig> = {};
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
        options: [{ label: "90%减伤", key: 0.9 }],
        apply: (key: string) => {
          return {
            label: "重生造物（受到的物理和法术伤害降低90%）",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
          };
        },
      },
    ],
  };
});

export const Rogue4SkzdwxSelect: EnemySpecConfig["selects"][number] = {
  label: "是否位于年代印痕中（最终乘算50减伤）",
  options: [
    { label: "否", key: 0 },
    { label: "是", key: 0.5 },
  ],
  apply: (key: string) => {
    return {
      label: "是否位于年代印痕中（最终乘算50减伤）",
      key: key,
      blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
    };
  },
};

export const EnemySpecConfigs: Record<string, EnemySpecConfig> = {
  // rogue_5 岁的界园志异
  enemy_2105_dyrnge: {
    id: "enemy_2105_dyrnge",
    name: "似兽",
    selects: [
      {
        label: "是否起飞",
        options: [
          { label: "否", key: 0 },
          { label: "是", key: -1500 },
        ],
        apply: (key: string) => {
          return {
            label: "是否起飞",
            key: key,
            blackboard: [{ bbKey: "in_game_buff_final_add.enemy_def", value: Number(key) }],
          };
        },
      },
    ],
  },
  enemy_2106_dyremy: {
    id: "enemy_2106_dyremy",
    name: "怪葫芦",
    selects: [
      {
        label: "每3源石锭，最大生命值与攻击力+15%",
        options: [
          { label: "无源石锭", key: 0 },
          { label: "3源石锭", key: 3 },
          { label: "6源石锭", key: 6 },
          { label: "9源石锭", key: 9 },
          { label: "12源石锭", key: 12 },
          { label: "15源石锭", key: 15 },
          { label: "18源石锭", key: 18 },
          { label: "21源石锭", key: 21 },
          { label: "24源石锭", key: 1.2 },
          { label: "27源石锭", key: 27 },
          { label: "30源石锭以上", key: 30 },
        ],
        apply: (key: string) => {
          return {
            label: `持有${key}源石锭，自身最大生命值与攻击力各+${Number(key) * 5}%`,
            key: key,
            blackboard: [
              { bbKey: "in_game_buff_final_mul.enemy_max_hp", value: Number(key) * 0.05 + 1 },
              { bbKey: "in_game_buff_final_mul.enemy_atk", value: Number(key) * 0.05 + 1 },
            ],
          };
        },
      },
    ],
  },
  // rogue_4 萨卡兹的无终奇语
  enemy_2081_skztxs: {
    id: "enemy_2081_skztxs",
    name: "特雷西斯，黑冠尊主",
    selects: [
      {
        label: "根据与特蕾西亚距离获得物法减伤",
        options: [
          { label: "90减伤 距离≤1.0", key: 0.9 },
          { label: "75减伤 距离≤1.5", key: 0.75 },
          { label: "60减伤 距离≤2.5", key: 0.6 },
          { label: "50减伤 距离≤3.5", key: 0.5 },
          { label: "35减伤 距离>3.5", key: 0.35 },
        ],
        apply: (key: string) => {
          return {
            label: "根据与特蕾西亚距离获得物法减伤",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
          };
        },
        img:
          cosHost +
          "/images%2Frogue_4%2F%E7%89%B9%E9%9B%B7%E8%A5%BF%E6%96%AF-%E5%87%8F%E4%BC%A4%E7%A4%BA%E6%84%8F%E5%9B%BE.png",
      },
    ],
  },
  enemy_2098_skzftx: {
    id: "enemy_2098_skzftx",
    name: "特雷西斯，黑冠尊主",
    selects: [
      {
        label: "本关固定获得50物法减伤",
        options: [{ label: "50减伤", key: 0.5 }],
        apply: (key: string) => {
          return {
            label: "本关固定获得50物法减伤",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
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
          { label: "90减伤 3颗球", key: 0.9 },
          { label: "60减伤 2颗球", key: 0.6 },
          { label: "30减伤 1颗球", key: 0.3 },
          { label: "0减伤 无球", key: 0 },
        ],
        apply: (key: string) => {
          return {
            label: "根据储存的攻击能量数量获得物法减伤",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
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
          { label: "80减伤", key: 0.8 },
          { label: "无减伤", key: 0 },
        ],
        apply: (key: string) => {
          return {
            label: "伤害来源与自身距离≥2.0，获得80物法减伤",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
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
          { label: "无尼卢火", key: 0 },
          { label: "1 尼卢火", key: 1 },
          { label: "2 尼卢火", key: 2 },
          { label: "3 尼卢火", key: 3 },
          { label: "4 尼卢火", key: 4 },
          { label: "5 尼卢火", key: 5 },
        ],
        apply: (key: string) => {
          const baseValue = Math.pow(0.8, Number(key));
          // 保留4位小数
          const percentage = Math.round((1 - baseValue) * 10000) / 10000;
          const finalValue = Math.round(percentage * 100) / 100;
          return {
            label: "场上每存在一个尼卢火，获得20物法减伤",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: finalValue }],
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
          { label: "一阶段 50减伤", key: 0.5 },
          { label: "二阶段 无减伤", key: 0 },
        ],
        apply: (key: string) => {
          return {
            label: "一阶段获得50物法减伤",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
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
          { label: "80减伤", key: 0.8 },
          { label: "无减伤", key: 0 },
        ],
        apply: (key: string) => {
          return {
            label: "当护盾朝向我方干员时，获得80物法减伤",
            key: key,
            blackboard: [{ bbKey: "enemy_damage_resistance", value: Number(key) }],
          };
        },
      },
    ],
  },
  ...sharedConfigs,
};
