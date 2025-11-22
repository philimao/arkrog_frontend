import { StyledTitle } from "~/modules/Tool/components/Shared";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { getPath, imageHost } from "~/utils/tools";
import {
  StyledGridItemIcon,
  StyledGridContainer,
  StyledGridItem,
  StyledGridItemInner,
  StyledGridItemTitle,
  type ITopicSpecItem,
  type ITopicSpecConfig,
} from "../TopicSpecSelector";
import type { BlackboardData } from "~/types/gameData";
import { LazyImage } from "~/components/LazyImage";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";

export default function Rogue4Selector() {
  const {
    rogueInput,
    rogue4_disaster_spec_items,
    rogue4_inspiration_spec_items,
    setRogue4Inspiration,
    setRogue4Disaster,
    setRogue4InspirationSpecItems,
    setRogue4DisasterSpecItems,
  } = useDamageCalculatorStore(
    useShallow((state) => ({
      rogueInput: state.rogueInput,
      rogue4_disaster_spec_items: state.rogue4_disaster_spec_items,
      rogue4_inspiration_spec_items: state.rogue4_inspiration_spec_items,
      setRogue4Inspiration: state.setRogue4Inspiration,
      setRogue4Disaster: state.setRogue4Disaster,
      setRogue4DisasterSpecItems: state.setRogue4DisasterSpecItems,
      setRogue4InspirationSpecItems: state.setRogue4InspirationSpecItems,
    })),
  );

  /** 难度 */
  const difficulty = rogueInput[rogueInput.topic].difficulty;
  /** 年代等级 */
  const disasterLevel = difficulty < 6 ? 0 : difficulty < 13 ? 1 : 2;
  /** 年代等级字符串 */
  const levelStr = levels[disasterLevel];

  /** 灵感板子 */
  useEffect(() => {
    setRogue4InspirationSpecItems(() => {
      const specItems: ITopicSpecItem[] = Object.values(fragments).map((fragment) => {
        const url = imageHost + getPath(`思绪_${fragment.name}.png`);
        const description = fragment.functionDesc({} as never);
        return {
          ...fragment,
          buffs: fragment.values[0],
          description,
          layer: 1,
          url,
          invert: 0,
          userActive: true,
          rows: 2,
        };
      });
      return specItems;
    });
  }, [setRogue4InspirationSpecItems]);

  /** 年代 */
  useEffect(() => {
    /** 难度 */
    const difficulty = rogueInput.rogue_4.difficulty;
    /** 年代等级 */
    const disasterLevel = difficulty < 6 ? 0 : difficulty < 13 ? 1 : 2;
    const specItems: ITopicSpecItem[] = Object.values(disasters).map((disaster) => {
      const buffs = disaster.values?.[disasterLevel] ?? [];
      const flatBuffs = buffs.map((buff) => buff.blackboard).flat();
      const disasterIndex = Array.from(disaster.id).pop();
      const url = imageHost + getPath(`集成战略_5_年代_${disasterIndex}.png`);
      const description = disaster.functionDesc(flatBuffs);
      return {
        ...disaster,
        description,
        buffs,
        layer: 1,
        url,
        invert: 1,
        userActive: true,
        rows: 2,
      };
    });
    setRogue4DisasterSpecItems(() => specItems);
  }, [setRogue4DisasterSpecItems, rogueInput.rogue_4.difficulty]);

  return (
    <>
      <StyledTitle>选择灵感</StyledTitle>
      <StyledGridContainer $cols={5}>
        {rogue4_inspiration_spec_items.map((fragment) => {
          return (
            <StyledGridItem
              key={fragment.id}
              $selected={rogueInput.rogue_4.inspiration === fragment.id}
              onClick={() =>
                setRogue4Inspiration(rogueInput.rogue_4.inspiration === fragment.id ? undefined : fragment.id)
              }
            >
              <StyledGridItemInner>
                <StyledGridItemIcon>
                  <LazyImage src={fragment.url} alt={fragment.name} />
                </StyledGridItemIcon>
                <div className="flex flex-col gap-0.5 justify-center">
                  <StyledGridItemTitle>
                    <span>{fragment.name}</span>
                  </StyledGridItemTitle>
                  <div className="text-tiny">{fragment.description}</div>
                </div>
              </StyledGridItemInner>
            </StyledGridItem>
          );
        })}
      </StyledGridContainer>
      <StyledTitle>选择年代</StyledTitle>
      <StyledGridContainer>
        {rogue4_disaster_spec_items.map((disaster) => {
          return (
            <StyledGridItem
              key={disaster.id}
              $selected={rogueInput.rogue_4.disaster === disaster.id}
              onClick={() => setRogue4Disaster(rogueInput.rogue_4.disaster === disaster.id ? undefined : disaster.id)}
            >
              <StyledGridItemInner>
                <StyledGridItemIcon $invert={1}>
                  <LazyImage src={disaster.url} alt={disaster.name} />
                </StyledGridItemIcon>
                <div className="flex flex-col gap-0.5 justify-center">
                  <StyledGridItemTitle>
                    <span>{disaster.name}</span>
                    <span className="text-small">{levelStr}</span>
                  </StyledGridItemTitle>
                  <div className="text-tiny">{disaster.description}</div>
                </div>
              </StyledGridItemInner>
            </StyledGridItem>
          );
        })}
      </StyledGridContainer>
    </>
  );
}

/** 年代等级 */
const levels = ["成型期", "扩张期", "鼎盛期"];

/** 年代效果 */
const disasters: Record<string, ITopicSpecConfig> = {
  rogue_4_disaster_1: {
    id: "rogue_4_disaster_1",
    name: "天灾年代",
    functionDesc: (blackboard: BlackboardData[]) =>
      `出现额外的<年代之刺>，<年代之刺>与<饮泣之刺>的最大生命值提升${(blackboard.find((item) => item.key === "max_hp")?.value ?? 1) * 100}%`,
    values: [
      [
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "rune_mul_enemy_max_hp" },
            { key: "max_hp", value: 1, valueStr: null },
            { key: "selector.enemy", value: 0, valueStr: "trap_760_skztzs|enemy_2073_skzrck" },
          ],
        },
      ],
      [
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "rune_mul_enemy_max_hp" },
            { key: "max_hp", value: 1.5, valueStr: null },
            { key: "selector.enemy", value: 0, valueStr: "trap_760_skztzs|enemy_2073_skzrck" },
          ],
        },
      ],
      [
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "rune_mul_enemy_max_hp" },
            { key: "max_hp", value: 2, valueStr: null },
            { key: "selector.enemy", value: 0, valueStr: "trap_760_skztzs|enemy_2073_skzrck" },
          ],
        },
      ],
    ],
  },
  rogue_4_disaster_2: {
    id: "rogue_4_disaster_2",
    name: "魔王年代",
    functionDesc: (blackboard: BlackboardData[]) =>
      `【萨卡兹】敌人的攻击力提升${((blackboard.find((item) => item.key === "atk")?.value ?? 1) - 1) * 100}%，处于年代印痕中的干员无法主动撤退`,
    values: [
      [
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "sarkaz" },
            { key: "atk", value: 1.2, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "sarkaz" },
            { key: "atk", value: 1.35, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "sarkaz" },
            { key: "atk", value: 1.5, valueStr: null },
          ],
        },
      ],
    ],
  },
  rogue_4_disaster_3: {
    id: "rogue_4_disaster_3",
    name: "苦难年代",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有我方单位部署时损失当前生命值的${(blackboard.find((item) => item.key === "max_hp_loss")?.value ?? 0) * 100}%（每个单位退场前只会生效一次）`,
    values: [
      [
        {
          key: "char_attribute_mul",
          blackboard: [{ key: "max_hp_loss", value: 0.25, valueStr: null }],
        },
      ],
      [
        {
          key: "char_attribute_mul",
          blackboard: [{ key: "max_hp_loss", value: 0.5, valueStr: null }],
        },
      ],
      [
        {
          key: "char_attribute_mul",
          blackboard: [{ key: "max_hp_loss", value: 0.7, valueStr: null }],
        },
      ],
    ],
    disabled: true,
  },
  rogue_4_disaster_4: {
    id: "rogue_4_disaster_4",
    name: "金融年代",
    functionDesc: (blackboard: BlackboardData[]) =>
      `诡意行商中的物品将涨价${blackboard.find((item) => item.key === "price")?.value ?? 0}%出售，所有友方单位部署费用+${blackboard.find((item) => item.key === "cost")?.value ?? 0}`,
    values: [
      [
        { key: "global_buff_normal", blackboard: [{ key: "price", value: 50, valueStr: null }] },
        { key: "char_attribute_add", blackboard: [{ key: "cost", value: 2, valueStr: null }] },
      ],
      [
        { key: "global_buff_normal", blackboard: [{ key: "price", value: 50, valueStr: null }] },
        { key: "char_attribute_add", blackboard: [{ key: "cost", value: 3, valueStr: null }] },
      ],
      [
        { key: "global_buff_normal", blackboard: [{ key: "price", value: 100, valueStr: null }] },
        { key: "char_attribute_add", blackboard: [{ key: "cost", value: 5, valueStr: null }] },
      ],
    ],
  },
  rogue_4_disaster_5: {
    id: "rogue_4_disaster_5",
    name: "奇观年代",
    functionDesc: (blackboard: BlackboardData[]) =>
      `构想的负荷+${blackboard.find((item) => item.key === "load")?.value ?? 0}，所有敌人生命值+${((blackboard.find((item) => item.key === "max_hp")?.value ?? 1) - 1) * 100}%`,
    values: [
      [
        { key: "global_buff_normal", blackboard: [{ key: "load", value: 1, valueStr: null }] },
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "max_hp", value: 1.2, valueStr: null },
          ],
        },
      ],
      [
        { key: "global_buff_normal", blackboard: [{ key: "load", value: 2, valueStr: null }] },
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "max_hp", value: 1.3, valueStr: null },
          ],
        },
      ],
      [
        { key: "global_buff_normal", blackboard: [{ key: "load", value: 3, valueStr: null }] },
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "max_hp", value: 1.5, valueStr: null },
          ],
        },
      ],
    ],
  },
  rogue_4_disaster_6: {
    id: "rogue_4_disaster_6",
    name: "拥挤年代",
    functionDesc: (blackboard: BlackboardData[]) =>
      `可部署人数-${blackboard.find((item) => item.key === "deploy")?.value ?? 0}`,
    values: [
      [{ key: "global_buff_normal", blackboard: [{ key: "deploy", value: 1, valueStr: null }] }],
      [{ key: "global_buff_normal", blackboard: [{ key: "deploy", value: 2, valueStr: null }] }],
      [{ key: "global_buff_normal", blackboard: [{ key: "deploy", value: 3, valueStr: null }] }],
    ],
    disabled: true,
  },
  rogue_4_disaster_7: {
    id: "rogue_4_disaster_7",
    name: "哲学年代",
    functionDesc: () => `去伪存真出现杂念横生的概率提升，并有概率无法解读`,
    values: [],
    disabled: true,
  },
  rogue_4_disaster_8: {
    id: "rogue_4_disaster_8",
    name: "繁荣年代",
    functionDesc: (blackboard: BlackboardData[]) =>
      `战场的宝箱出现概率大幅提升，我方单位最大生命值提升${(blackboard.find((item) => item.key === "max_hp")?.value ?? 0) * 100}%`,
    values: [
      [{ key: "char_attribute_mul", blackboard: [{ key: "max_hp", value: 0.2, valueStr: null }] }],
      [{ key: "char_attribute_mul", blackboard: [{ key: "max_hp", value: 0.3, valueStr: null }] }],
      [{ key: "char_attribute_mul", blackboard: [{ key: "max_hp", value: 0.5, valueStr: null }] }],
    ],
  },
  rogue_4_disaster_9: {
    id: "rogue_4_disaster_9",
    name: "悖论",
    functionDesc: () => `战场上我方单位的形象不再可见`,
    values: [],
    disabled: true,
  },
};

/** 思绪：灵感 */
const fragments: Record<string, ITopicSpecConfig> = {
  rogue_4_fragment_F_02: {
    id: "rogue_4_fragment_F_02",
    name: "火海",
    functionDesc: () => "使用后，下次战斗所有我方单位攻击速度+35",
    values: [[{ key: "char_attribute_add", blackboard: [{ key: "attack_speed", value: 35, valueStr: null }] }]],
  },
  rogue_4_fragment_F_04: {
    id: "rogue_4_fragment_F_04",
    name: "背誓",
    functionDesc: () => "使用后，下次战斗所有近战干员受到伤害后，攻击速度+50，持续5秒",
    values: [[{ key: "char_attribute_add", blackboard: [{ key: "attack_speed", value: 50, valueStr: null }] }]],
  },
  rogue_4_fragment_F_10: {
    id: "rogue_4_fragment_F_10",
    name: "取食",
    functionDesc: () => "使用后下次战斗所有我方单位最大生命值+15%",
    values: [[{ key: "char_attribute_mul", blackboard: [{ key: "max_hp", value: 0.15, valueStr: null }] }]],
  },
  rogue_4_fragment_F_11: {
    id: "rogue_4_fragment_F_11",
    name: "垦荒",
    functionDesc: () => "使用后下次战斗所有我方单位最大生命值+30%",
    values: [[{ key: "char_attribute_mul", blackboard: [{ key: "max_hp", value: 0.3, valueStr: null }] }]],
  },
  rogue_4_fragment_F_12: {
    id: "rogue_4_fragment_F_12",
    name: "抢夺",
    functionDesc: () => "使用后下次战斗所有我方单位攻击力+10%",
    values: [[{ key: "char_attribute_mul", blackboard: [{ key: "atk", value: 0.1, valueStr: null }] }]],
  },
  rogue_4_fragment_F_13: {
    id: "rogue_4_fragment_F_13",
    name: "侵略",
    functionDesc: () => "使用后下次战斗所有我方单位攻击力+20%",
    values: [[{ key: "char_attribute_mul", blackboard: [{ key: "atk", value: 0.2, valueStr: null }] }]],
  },
  rogue_4_fragment_F_14: {
    id: "rogue_4_fragment_F_14",
    name: "兴亡",
    functionDesc: () => "使用后下次战斗所有我方单位攻击力+30%，最大生命值+50%",
    values: [
      [
        {
          key: "char_attribute_mul",
          blackboard: [
            { key: "atk", value: 0.3, valueStr: null },
            { key: "max_hp", value: 0.5, valueStr: null },
          ],
        },
      ],
    ],
  },
  rogue_4_fragment_F_19: {
    id: "rogue_4_fragment_F_19",
    name: "异族",
    functionDesc: () => "使用后下次战斗所有我方单位攻击速度+15",
    values: [[{ key: "char_attribute_add", blackboard: [{ key: "attack_speed", value: 15, valueStr: null }] }]],
  },
  rogue_4_fragment_F_20: {
    id: "rogue_4_fragment_F_20",
    name: "驱城",
    functionDesc: () => "使用后下次战斗所有我方单位再部署时间-20%",
    values: [[{ key: "char_attribute_mul", blackboard: [{ key: "respawn_time", value: -0.2, valueStr: null }] }]],
  },
  rogue_4_fragment_F_21: {
    id: "rogue_4_fragment_F_21",
    name: "佣兵",
    functionDesc: () => "使用后下次战斗中所有我方单位费用-2",
    values: [[{ key: "char_attribute_add", blackboard: [{ key: "deploy_cost", value: -2, valueStr: null }] }]],
  },
  rogue_4_fragment_F_22: {
    id: "rogue_4_fragment_F_22",
    name: "内战",
    functionDesc: () => "使用后下次战斗中所有我方单位费用-3",
    values: [[{ key: "char_attribute_add", blackboard: [{ key: "cost", value: -3, valueStr: null }] }]],
  },
  rogue_4_fragment_F_23: {
    id: "rogue_4_fragment_F_23",
    name: "休息",
    functionDesc: () => "使用后下次战斗所有友方单位部署后自身每秒回复2%最大生命值，持续20秒",
    values: [
      [
        {
          key: "char_attribute_add",
          blackboard: [{ key: "hp_recovery_per_sec_by_max_hp_ratio", value: 0.02, valueStr: null }],
        },
      ],
    ],
  },
  rogue_4_fragment_F_24: {
    id: "rogue_4_fragment_F_24",
    name: "安眠",
    functionDesc: () => "使用后下次战斗所有友方单位部署后自身每秒回复5%最大生命值，持续20秒",
    values: [
      [
        {
          key: "char_attribute_add",
          blackboard: [{ key: "hp_recovery_per_sec_by_max_hp_ratio", value: 0.05, valueStr: null }],
        },
      ],
    ],
  },
  rogue_4_fragment_F_25: {
    id: "rogue_4_fragment_F_25",
    name: "爆破",
    functionDesc: () => "使用后下次战斗<年代之刺>的最大生命值-50%",
    values: [
      [
        {
          key: "global_buff_normal",
          blackboard: [
            { key: "key", value: 0, valueStr: "rune_mul_enemy_max_hp" },
            { key: "max_hp", value: -0.5, valueStr: null },
            { key: "selector.enemy", value: 0, valueStr: "trap_760_skztzs" },
          ],
        },
      ],
    ],
  },
  rogue_4_fragment_F_26: {
    id: "rogue_4_fragment_F_26",
    name: "死斗",
    functionDesc: () => "使用后下次战斗随机三名干员攻击速度+100，防御力+50%，法抗+25",
    values: [
      [
        {
          key: "char_attribute_add",
          blackboard: [
            { key: "attack_speed", value: 100, valueStr: null },
            { key: "magic_resistance", value: 25, valueStr: null },
          ],
        },
        {
          key: "char_attribute_mul",
          blackboard: [{ key: "def", value: 0.5, valueStr: null }],
        },
      ],
    ],
  },
};
