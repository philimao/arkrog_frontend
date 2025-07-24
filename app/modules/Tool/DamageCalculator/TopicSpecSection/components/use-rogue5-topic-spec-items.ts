import type { ITopicSpecConfig, ITopicSpecItem } from "../TopicSpecSelector";
import type { BlackboardData, RelicDataExt, RelicWrapper } from "~/types/gameData";
import { getPath, imageHost } from "~/utils/tools";
import { wrapRelicData } from "~/stores/damageCalculator/calcUtils/relicUtils";
import { applyAnyRelics } from "../../calculator/debug/print-relics-info";
import type { ExpressionGroupNode } from "../../calculator/ast";

/** 岁时天象 */
export const WRATH_LEVELS = ["朦胧", "真切", "入髓"];

/** 地支顺序 */
export const WRATH_ORDER = [
  "子武",
  "丑谋",
  "寅诗",
  "卯律",
  "辰■",
  "巳农",
  "午商",
  "未建",
  "申铸",
  "酉疗",
  "戌绘",
  "亥食",
];

/** 秉烛岁谱 */
export const WRATH_CONFIG: Record<string, ITopicSpecConfig> = {
  rogue_5_wrath_1: {
    id: "rogue_5_wrath_1",
    name: "戌绘",
    functionDesc: (blackboard: BlackboardData[]) =>
      `随机${blackboard.find((item) => item.key === "profession_count")?.value}个职业的干员首次部署后立即受到便符附着（近卫/辅助/特种/狙击/术师/先锋）`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "profession_count", value: 1, valueStr: null },
            { key: "selector.profession", value: 0, valueStr: "warrior|support|special|sniper|caster|pioneer" },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "profession_count", value: 2, valueStr: null },
            { key: "selector.profession", value: 0, valueStr: "warrior|support|special|sniper|caster|pioneer" },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "profession_count", value: 3, valueStr: null },
            { key: "selector.profession", value: 0, valueStr: "warrior|support|special|sniper|caster|pioneer" },
          ],
        },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_2: {
    id: "rogue_5_wrath_2",
    name: "巳农",
    functionDesc: (blackboard: BlackboardData[]) =>
      `干员部署费用+${blackboard.find((item) => item.key === "cost")?.value}`,
    values: [
      [{ key: "char_attribute_add", blackboard: [{ key: "cost", value: 2, valueStr: null }] }],
      [{ key: "char_attribute_add", blackboard: [{ key: "cost", value: 3, valueStr: null }] }],
      [{ key: "char_attribute_add", blackboard: [{ key: "cost", value: 4, valueStr: null }] }],
    ],
    disabled: false,
  },
  rogue_5_wrath_3: {
    id: "rogue_5_wrath_3",
    name: "午商",
    functionDesc: (blackboard: BlackboardData[]) =>
      `诡意行商商品售价提升${blackboard.find((item) => item.key === "price_normal")?.value}%，较为稀有的商品售价提升${blackboard.find((item) => item.key === "price_rare")?.value}%`,
    values: [
      [
        { key: "", blackboard: [{ key: "price_normal", value: 0, valueStr: null }] },
        { key: "", blackboard: [{ key: "price_rare", value: 25, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "price_normal", value: 25, valueStr: null }] },
        { key: "", blackboard: [{ key: "price_rare", value: 25, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "price_normal", value: 25, valueStr: null }] },
        { key: "", blackboard: [{ key: "price_rare", value: 50, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_4: {
    id: "rogue_5_wrath_4",
    name: "丑谋",
    functionDesc: (blackboard: BlackboardData[]) =>
      `每进入一个非战斗节点，有${blackboard.find((item) => item.key === "probability")?.value}%${blackboard.find((item) => item.key === "target")?.valueStr}`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "target", value: 0, valueStr: "目标生命值" }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "target", value: 0, valueStr: "希望、目标生命值" }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 20, valueStr: null }] },
        { key: "", blackboard: [{ key: "target", value: 0, valueStr: "希望、目标生命值" }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_5: {
    id: "rogue_5_wrath_5",
    name: "未建",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有我方干员部署时，流失${blackboard.find((item) => item.key === "sp_loss")?.value}%最大技力值`,
    values: [
      [{ key: "", blackboard: [{ key: "sp_loss", value: 10, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_loss", value: 20, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_loss", value: 30, valueStr: null }] }],
    ],
    disabled: true,
  },
  rogue_5_wrath_6: {
    id: "rogue_5_wrath_6",
    name: "子武",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有我方干员部署时，有${blackboard.find((item) => item.key === "probability")?.value}%概率最大生命值-${blackboard.find((item) => item.key === "max_hp_loss")?.value}%`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "max_hp_loss", value: 20, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "max_hp_loss", value: 30, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 15, valueStr: null }] },
        { key: "", blackboard: [{ key: "max_hp_loss", value: 40, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_7: {
    id: "rogue_5_wrath_7",
    name: "寅诗",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有敌人对非秉烛状态干员造成${blackboard.find((item) => item.key === "extra_damage")?.value}%额外伤害`,
    values: [
      [{ key: "", blackboard: [{ key: "enemy_damage_", value: 10, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "extra_damage", value: 15, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "extra_damage", value: 25, valueStr: null }] }],
    ],
    disabled: true,
  },
  rogue_5_wrath_8: {
    id: "rogue_5_wrath_8",
    name: "申铸",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有【化物】敌人生命值、攻击力+${Math.round(((blackboard.find((item) => item.key === "atk")?.value || 1) - 1) * 100)}%`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "atk", value: 1.1, valueStr: null },
            { key: "max_hp", value: 1.1, valueStr: null },
          ],
        },
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "max_hp", value: 1.1, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "atk", value: 1.2, valueStr: null },
          ],
        },
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "max_hp", value: 1.2, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "atk", value: 1.3, valueStr: null },
          ],
        },
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "max_hp", value: 1.3, valueStr: null },
          ],
        },
      ],
    ],
    disabled: false,
  },
  rogue_5_wrath_9: {
    id: "rogue_5_wrath_9",
    name: "卯律",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有我方单位造成伤害后有${blackboard.find((item) => item.key === "probability")?.value}%概率晕眩${blackboard.find((item) => item.key === "stun_duration")?.value}秒`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 0.5, valueStr: null }] },
        { key: "", blackboard: [{ key: "stun_duration", value: 0.5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "stun_duration", value: 0.5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "stun_duration", value: 1, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_10: {
    id: "rogue_5_wrath_10",
    name: "酉疗",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有敌方受到伤害后有${blackboard.find((item) => item.key === "probability")?.value}%概率【沉睡】${blackboard.find((item) => item.key === "sleep_duration")?.value}秒`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "sleep_duration", value: 5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "sleep_duration", value: 5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "sleep_duration", value: 5, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_11: {
    id: "rogue_5_wrath_11",
    name: "辰■",
    functionDesc: () => `所有干员形象不可见`,
    values: [[], [], []],
    disabled: true,
  },
  rogue_5_wrath_12: {
    id: "rogue_5_wrath_12",
    name: "亥食",
    functionDesc: (blackboard: BlackboardData[]) =>
      `场上每有一个岁阵营干员，所有岁阵营干员每${blackboard.find((item) => item.key === "sp_regen_interval")?.value}秒回复一点技力`,
    values: [
      [{ key: "", blackboard: [{ key: "sp_regen_interval", value: 4, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_regen_interval", value: 3, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_regen_interval", value: 2, valueStr: null }] }],
    ],
    disabled: true,
  },
};

/** 获取界园天象 */
export function getRogue5Wraths(difficulty: number): ITopicSpecItem[] {
  /** 岁时天象等级 */
  const level = difficulty < 6 ? 0 : difficulty < 13 ? 1 : 2;
  return Object.values(WRATH_CONFIG)
    .sort((a, b) => WRATH_ORDER.indexOf(a.name) - WRATH_ORDER.indexOf(b.name))
    .map((wr) => {
      const buffs = wr.values[level];
      const desc = wr.functionDesc(buffs.map((buff) => buff.blackboard).flat());
      const url = imageHost + getPath(`集成战略_6_岁时_${wr.name}.png`);
      return {
        ...wr,
        description: desc,
        url,
        userActive: true,
        invert: 0,
        buffs,
        rows: 1,
        layer: 1,
        disabled: wr.disabled,
      };
    });
}

/** 获取通宝 */
export function getRogue5Coppers(coppers: RelicDataExt[]): Array<RelicWrapper & RelicDataExt> {
  const result = coppers.map((copper) => wrapRelicData(copper));
  const copperList = result.map((copperWrapper) => ({
    ...copperWrapper,
    ...coppers.find((copper) => copper.id === copperWrapper.id)!,
  }));
  /**
   * 应用所有通宝buff，标注无效的通宝
   * 注意，部分通宝会有多个互相冲突的buff同时生效，因此不能用于展示该通宝的具体效果
   */
  const context = applyAnyRelics(copperList);
  const validCopperList: string[] = [];
  Object.values(context).forEach((value: string[] | Record<string, ExpressionGroupNode>) => {
    if (Array.isArray(value)) return;
    Object.values(value).forEach((node: ExpressionGroupNode) =>
      node.children.forEach((child) => validCopperList.push(child.tooltip)),
    );
  });
  copperList.forEach((copper) => {
    if (!validCopperList.includes(copper.name)) {
      copper.disabled = true;
    }
  });
  return copperList;
}
