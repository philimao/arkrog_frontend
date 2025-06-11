import { styled } from "styled-components";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { StyledTitle } from "../../components/Shared";
import { getPath, imageHost } from "~/utils/tools";

export interface ITopicSpecItem {
  id: string;
  name: string;
  desc: string;
  buffs: { key: string; value: number }[];
  url: string;
  invert: number;
}

const StyledTopicSpecSelector = styled.div<{ $active: boolean }>`
  display: ${(props) => (props.$active ? "block" : "none")};
  position: fixed;
  width: 100vw;
  height: calc(100vh - 5rem);
  left: 0;
  top: 0;
  z-index: 101;
  overflow-x: auto;
  background: rgba(68, 68, 68, 0.85);
  backdrop-filter: blur(10px);
`;

const StyledBackButton = styled.button`
  position: fixed;
  top: 2rem;
  right: 0;
  background: var(--black-gray);
  font-size: 1rem;
  padding: 0.5rem 2rem;
`;

const StyledTopicSpecSelectorInner = styled.div`
  padding: 5rem 8rem 1rem 8rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StyledGridContainer = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$cols || 3}, 1fr);
  gap: 0.5rem;
`;

const StyledGridItem = styled.div<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 3%;
  cursor: pointer;
  background: ${(props) => (props.$selected ? "black" : "rgba(24, 24, 24, 0.70)")};
  border: 1px solid ${(props) => (props.$selected ? "var(--ak-blue)" : "transparent")};
  box-shadow: ${(props) => (props.$selected ? "0 0 4px 0 var(--ak-blue)" : "none")};
`;

const StyledGridItemInner = styled.div`
  height: 100%;
  display: flex;
  gap: 0.5rem;
`;

const StyledGridItemTitle = styled.div`
  display: flex;
  align-items: flex-end;
  & > span:first-child {
    margin-right: 0.5rem;
  }
`;

const StyledFragmentIcon = styled.div<{ $url: string }>`
  width: 4rem;
  background: url(${(props) => props.$url}) no-repeat center center;
  background-size: contain;
  flex-shrink: 0;
`;

export default function TopicSpecSelector() {
  const { difficulty, showTopicSpec, toggleShowTopicSpec, topicSpecItems, setTopicSpecItems } =
    useDamageCalculatorStore();

  const disasterLevel = difficulty < 6 ? 0 : difficulty < 13 ? 1 : 2;
  const levelStr = levels[disasterLevel];

  return (
    <StyledTopicSpecSelector $active={showTopicSpec}>
      <StyledBackButton onClick={toggleShowTopicSpec}>返回</StyledBackButton>
      <StyledTopicSpecSelectorInner>
        <StyledTitle>选择灵感</StyledTitle>
        <StyledGridContainer $cols={5}>
          {Object.values(fragments).map((fragment) => {
            const url = imageHost + getPath(`思绪_${fragment.name}.png`);
            const onClick = () => {
              setTopicSpecItems((nodes) => {
                const updated = [...nodes];
                if (updated[0]?.id === fragment.id) delete updated[0];
                else
                  updated[0] = {
                    ...fragment,
                    url,
                    invert: 0,
                  };
                return updated;
              });
            };
            return (
              <StyledGridItem key={fragment.id} $selected={topicSpecItems[0]?.id === fragment.id} onClick={onClick}>
                <StyledGridItemInner>
                  <StyledFragmentIcon $url={url} />
                  <div className="flex flex-col gap-0.5 justify-center">
                    <StyledGridItemTitle>
                      <span>{fragment.name}</span>
                    </StyledGridItemTitle>
                    <div className="text-tiny">{fragment.desc}</div>
                  </div>
                </StyledGridItemInner>
              </StyledGridItem>
            );
          })}
        </StyledGridContainer>
        <StyledTitle>选择年代</StyledTitle>
        <StyledGridContainer>
          {Object.values(disasters).map((disaster) => {
            const buffs = disaster.values[disasterLevel];
            const arg = {} as Record<string, number>;
            buffs?.forEach((buff) => {
              arg[buff.key] = buff.value;
            });
            const disasterIndex = Array.from(disaster.id).pop();
            const url = imageHost + getPath(`集成战略_5_年代_${disasterIndex}.png`);
            const desc = disaster.functionDesc(arg as never);
            const onClick = () => {
              setTopicSpecItems((nodes) => {
                const updated = [...nodes];
                if (updated[1]?.id === disaster.id) delete updated[1];
                else {
                  updated[1] = {
                    ...disaster,
                    desc,
                    buffs,
                    url,
                    invert: 1,
                  };
                }
                return updated;
              });
            };
            return (
              <StyledGridItem key={disaster.id} $selected={disaster.id === topicSpecItems[1]?.id} onClick={onClick}>
                <StyledGridItemTitle>
                  <span>{disaster.name}</span>
                  <span className="text-small">{levelStr}</span>
                </StyledGridItemTitle>
                <div className="text-tiny">{desc}</div>
              </StyledGridItem>
            );
          })}
        </StyledGridContainer>
      </StyledTopicSpecSelectorInner>
    </StyledTopicSpecSelector>
  );
}

const levels = ["成型期", "扩张期", "鼎盛期"];

const disasters = {
  rogue_4_disaster_1: {
    id: "rogue_4_disaster_1",
    name: "天灾年代",
    functionDesc: ({ enemy_max_hp }: { enemy_max_hp: number }) =>
      `出现额外的<年代之刺>，<年代之刺>与<饮泣之刺>的最大生命值提升${enemy_max_hp * 100}%`,
    values: [
      [{ key: "enemy_max_hp", value: 1 }],
      [{ key: "enemy_max_hp", value: 1.5 }],
      [{ key: "enemy_max_hp", value: 2 }],
    ],
  },
  rogue_4_disaster_2: {
    id: "rogue_4_disaster_2",
    name: "魔王年代",
    functionDesc: ({ enemy_atk }: { enemy_atk: number }) =>
      `【萨卡兹】敌人的攻击力提升${enemy_atk * 100}%，处于年代印痕中的干员无法主动撤退`,
    values: [
      [{ key: "enemy_atk", value: 0.2 }],
      [{ key: "enemy_atk", value: 0.35 }],
      [{ key: "enemy_atk", value: 0.5 }],
    ],
  },
  rogue_4_disaster_3: {
    id: "rogue_4_disaster_3",
    name: "苦难年代",
    functionDesc: ({ damage }: { damage: number }) =>
      `所有我方单位部署时损失当前生命值的${damage}%（每个单位退场前只会生效一次）`,
    values: [[{ key: "damage", value: 0.25 }], [{ key: "damage", value: 0.5 }], [{ key: "damage", value: 0.7 }]],
  },
  rogue_4_disaster_4: {
    id: "rogue_4_disaster_4",
    name: "金融年代",
    functionDesc: ({ price, dp }: { price: number; dp: number }) =>
      `诡意行商中的物品将涨价${price}%出售，所有友方单位部署费用+${dp}`,
    values: [
      [
        { key: "price", value: 50 },
        { key: "dp", value: 2 },
      ],
      [
        { key: "price", value: 50 },
        { key: "dp", value: 3 },
      ],
      [
        { key: "price", value: 100 },
        { key: "dp", value: 5 },
      ],
    ],
  },
  rogue_4_disaster_5: {
    id: "rogue_4_disaster_5",
    name: "奇观年代",
    functionDesc: ({ load, enemy_max_hp }: { load: number; enemy_max_hp: number }) =>
      `构想的负荷+${load}，所有敌人生命值+${enemy_max_hp * 100}%`,
    values: [
      [
        { key: "load", value: 1 },
        { key: "enemy_max_hp", value: 0.2 },
      ],
      [
        { key: "load", value: 2 },
        { key: "enemy_max_hp", value: 0.3 },
      ],
      [
        { key: "load", value: 3 },
        { key: "enemy_max_hp", value: 0.5 },
      ],
    ],
  },
  rogue_4_disaster_6: {
    id: "rogue_4_disaster_6",
    name: "拥挤年代",
    functionDesc: ({ deploy }: { deploy: number }) => `可部署人数-${deploy}`,
    values: [[{ key: "deploy", value: 1 }], [{ key: "deploy", value: 2 }], [{ key: "deploy", value: 3 }]],
  },
  rogue_4_disaster_7: {
    id: "rogue_4_disaster_7",
    name: "哲学年代",
    functionDesc: () => `去伪存真出现杂念横生的概率提升，并有概率无法解读`,
    values: [],
  },
  rogue_4_disaster_8: {
    id: "rogue_4_disaster_8",
    name: "繁荣年代",
    functionDesc: ({ max_hp }: { max_hp: number }) =>
      `战场的宝箱出现概率大幅提升，我方单位最大生命值提升${max_hp * 100}%`,
    values: [[{ key: "max_hp", value: 0.2 }], [{ key: "max_hp", value: 0.3 }], [{ key: "max_hp", value: 0.5 }]],
  },
  rogue_4_disaster_9: {
    id: "rogue_4_disaster_9",
    name: "悖论",
    functionDesc: () => `战场上我方单位的形象不再可见`,
    values: [],
  },
};

const fragments = {
  rogue_4_fragment_F_02: {
    id: "rogue_4_fragment_F_02",
    name: "火海",
    desc: "使用后，下次战斗所有我方单位攻击速度+35",
    value: 6,
    buffs: [{ key: "attack_speed", value: 35 }],
  },
  rogue_4_fragment_F_04: {
    id: "rogue_4_fragment_F_04",
    name: "背誓",
    desc: "使用后，下次战斗所有近战干员受到伤害后，攻击速度+50，持续5秒",
    value: 6,
    buffs: [{ key: "attack_speed", value: 50 }],
  },
  rogue_4_fragment_F_10: {
    id: "rogue_4_fragment_F_10",
    name: "取食",
    desc: "使用后下次战斗所有我方单位最大生命值+15%",
    value: 3,
    buffs: [{ key: "max_hp", value: 0.15 }],
  },
  rogue_4_fragment_F_11: {
    id: "rogue_4_fragment_F_11",
    name: "垦荒",
    desc: "使用后下次战斗所有我方单位最大生命值+30%",
    value: 3,
    buffs: [{ key: "max_hp", value: 0.3 }],
  },
  rogue_4_fragment_F_12: {
    id: "rogue_4_fragment_F_12",
    name: "抢夺",
    desc: "使用后下次战斗所有我方单位攻击力+10%",
    value: 3,
    buffs: [{ key: "atk", value: 0.1 }],
  },
  rogue_4_fragment_F_13: {
    id: "rogue_4_fragment_F_13",
    name: "侵略",
    desc: "使用后下次战斗所有我方单位攻击力+20%",
    value: 3,
    buffs: [{ key: "atk", value: 0.2 }],
  },
  rogue_4_fragment_F_14: {
    id: "rogue_4_fragment_F_14",
    name: "兴亡",
    desc: "使用后下次战斗所有我方单位攻击力+30%，最大生命值+50%",
    value: 3,
    buffs: [
      { key: "atk", value: 0.3 },
      { key: "max_hp", value: 0.5 },
    ],
  },
  rogue_4_fragment_F_19: {
    id: "rogue_4_fragment_F_19",
    name: "异族",
    desc: "使用后下次战斗所有我方单位攻击速度+15",
    value: 3,
    buffs: [{ key: "attack_speed", value: 15 }],
  },
  rogue_4_fragment_F_20: {
    id: "rogue_4_fragment_F_20",
    name: "驱城",
    desc: "使用后下次战斗所有我方单位再部署时间-20%",
    value: 3,
    buffs: [{ key: "respawn_time", value: -0.2 }],
  },
  rogue_4_fragment_F_21: {
    id: "rogue_4_fragment_F_21",
    name: "佣兵",
    desc: "使用后下次战斗中所有我方单位费用-2",
    value: 3,
    buffs: [{ key: "deploy_cost", value: -2 }],
  },
  rogue_4_fragment_F_22: {
    id: "rogue_4_fragment_F_22",
    name: "内战",
    desc: "使用后下次战斗中所有我方单位费用-3",
    value: 3,
    buffs: [{ key: "deploy_cost", value: -3 }],
  },
  rogue_4_fragment_F_23: {
    id: "rogue_4_fragment_F_23",
    name: "休息",
    desc: "使用后下次战斗所有友方单位部署后自身每秒回复2%最大生命值，持续20秒",
    value: 3,
    buffs: [{ key: "heal", value: 2 }],
  },
  rogue_4_fragment_F_24: {
    id: "rogue_4_fragment_F_24",
    name: "安眠",
    desc: "使用后下次战斗所有友方单位部署后自身每秒回复5%最大生命值，持续20秒",
    value: 3,
    buffs: [{ key: "heal", value: 5 }],
  },
  rogue_4_fragment_F_25: {
    id: "rogue_4_fragment_F_25",
    name: "爆破",
    desc: "使用后下次战斗<年代之刺>的最大生命值-50%",
    value: 2,
    buffs: [{ key: "enemy_max_hp", value: -0.5 }],
  },
  rogue_4_fragment_F_26: {
    id: "rogue_4_fragment_F_26",
    name: "死斗",
    desc: "使用后下次战斗随机三名干员攻击速度+100，防御力+50%，法抗+25",
    value: 2,
    buffs: [
      { key: "attack_speed", value: 100 },
      { key: "def", value: 0.5 },
      { key: "magical_resistance", value: 25 },
    ],
  },
};
