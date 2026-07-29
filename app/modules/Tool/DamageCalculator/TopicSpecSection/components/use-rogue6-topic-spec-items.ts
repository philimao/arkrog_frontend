import type { ITopicSpecConfig, ITopicSpecItem } from "../TopicSpecSelector";
import type { BlackboardData } from "~/types/gameData";
import { getPath, imageHost } from "~/utils/tools";

/**
 * 黑流树海「理想域」（解包数据中的 weather 模块；难度描述里称作「实托邦」，同一机制的两种叫法）。
 *
 * 与界园「岁时」完全同构：同一效果分三级，随保密等级解锁：
 *   N0~N1 不生成 → N2 早期 → N6 中期 → N12 晚期
 * 数据来源：roguelike_topic_table.modules.rogue_6.weather.mainWeatherData（10 种 × 3 级 = 30 条）。
 *
 * ⚠️ blackboard 数值是对照 functionDesc 手工建模的，与 WRATH_CONFIG 同属版本敏感硬编码。
 * 乘区语义（勿写反）：
 *   - 敌人侧 in_game_buff_final_mul 是 "*" 组 → 写**乘数**（1.3 = +30%），
 *     且必须带 `{ key: "key", valueStr: "enemy_*" }` 作为路由标记，
 *     isBuffForEnemy 靠 valueStr 前缀判定敌我（该 valueStr 并非注册键）。
 *   - 干员侧 in_game_buff_mul 是 "+" 组（基数 1）→ 写**增量**（0.2 = +20%）。
 */
export const UTOPIA_LEVELS = ["早期", "中期", "晚期"];

/** 展示顺序，与解包 weather id 序号一致 */
export const UTOPIA_ORDER = [
  "“黑流地脉”",
  "“倾斜沙丘”",
  "“去温栏”",
  "“微型胶囊”",
  "“储藏室”",
  "“易碎同盟”",
  "“停止点”",
  "“希望的沃土”",
  "“弥散虚雾”",
  "“美丽新大地”",
];

export const UTOPIA_CONFIG: Record<string, ITopicSpecConfig> = {
  /** 敌方攻击/生命提升——唯一直接改敌人面板的理想域 */
  rogue_6_weather_1: {
    id: "rogue_6_weather_1",
    name: "“黑流地脉”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `关卡中出现额外的猎犬proto，敌方攻击+${Math.round(((blackboard.find((item) => item.key === "atk")?.value || 1) - 1) * 100)}%，生命+${Math.round(((blackboard.find((item) => item.key === "max_hp")?.value || 1) - 1) * 100)}%`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "atk", value: 1.1, valueStr: null },
            { key: "max_hp", value: 1.1, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "atk", value: 1.2, valueStr: null },
            { key: "max_hp", value: 1.2, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "atk", value: 1.3, valueStr: null },
            { key: "max_hp", value: 1.3, valueStr: null },
          ],
        },
      ],
    ],
  },
  /** 干员攻击下降，但仅在「部署方向与沙尘暴方向不同」时成立——由用户自行判断是否勾选 */
  rogue_6_weather_2: {
    id: "rogue_6_weather_2",
    name: "“倾斜沙丘”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `场上出现随机方向的沙尘暴，部署方向与沙尘暴方向不同的干员攻击力降低${Math.round(Math.abs(blackboard.find((item) => item.key === "atk")?.value || 0) * 100)}%（勾选表示该干员处于不利方向），敌方移速-15%`,
    values: [
      [{ key: "", blackboard: [{ key: "atk", value: -0.2, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "atk", value: -0.35, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "atk", value: -0.5, valueStr: null }] }],
    ],
  },
  /** 控制类，不改面板 */
  rogue_6_weather_3: {
    id: "rogue_6_weather_3",
    name: "“去温栏”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `我方单位部署时冻结${blackboard.find((item) => item.key === "freeze_duration")?.value}秒，每${blackboard.find((item) => item.key === "cold_interval")?.value}秒为全体单位施加15秒寒冷`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "freeze_duration", value: 5, valueStr: null },
            { key: "cold_interval", value: 60, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "freeze_duration", value: 10, valueStr: null },
            { key: "cold_interval", value: 45, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "freeze_duration", value: 15, valueStr: null },
            { key: "cold_interval", value: 30, valueStr: null },
          ],
        },
      ],
    ],
    disabled: true,
  },
  /** 我方承伤，与输出计算无关 */
  rogue_6_weather_4: {
    id: "rogue_6_weather_4",
    name: "“微型胶囊”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `我方单位受到的物理伤害提高${Math.round((blackboard.find((item) => item.key === "phys_damage_taken")?.value || 0) * 100)}%`,
    values: [
      [{ key: "", blackboard: [{ key: "phys_damage_taken", value: 0.25, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "phys_damage_taken", value: 0.4, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "phys_damage_taken", value: 0.7, valueStr: null }] }],
    ],
    disabled: true,
  },
  /** 经济类 */
  rogue_6_weather_5: {
    id: "rogue_6_weather_5",
    name: "“储藏室”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `零件售出价值-${Math.round((blackboard.find((item) => item.key === "scrap_price_down")?.value || 0) * 100)}%，诡意行商和秘境行商内商品栏位-${blackboard.find((item) => item.key === "shop_slot_down")?.value}`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "scrap_price_down", value: 0.1, valueStr: null },
            { key: "shop_slot_down", value: 1, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "scrap_price_down", value: 0.3, valueStr: null },
            { key: "shop_slot_down", value: 2, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "scrap_price_down", value: 0.5, valueStr: null },
            { key: "shop_slot_down", value: 3, valueStr: null },
          ],
        },
      ],
    ],
    disabled: true,
  },
  /** 一次性扣血事件，不改面板 */
  rogue_6_weather_6: {
    id: "rogue_6_weather_6",
    name: "“易碎同盟”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `我方单位部署后损失${Math.round((blackboard.find((item) => item.key === "hp_loss")?.value || 0) * 100)}%生命值（每个单位退场前只会生效一次）`,
    values: [
      [{ key: "", blackboard: [{ key: "hp_loss", value: 0.3, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "hp_loss", value: 0.5, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "hp_loss", value: 0.7, valueStr: null }] }],
    ],
    disabled: true,
  },
  /** 费用回复，不改面板 */
  rogue_6_weather_7: {
    id: "rogue_6_weather_7",
    name: "“停止点”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `费用自然回复效率-${Math.round((blackboard.find((item) => item.key === "cost_regen_down")?.value || 0) * 100)}%`,
    values: [
      [{ key: "", blackboard: [{ key: "cost_regen_down", value: 0.2, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "cost_regen_down", value: 0.25, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "cost_regen_down", value: 0.4, valueStr: null }] }],
    ],
    disabled: true,
  },
  /** 唯一增益型，直接提升干员攻击与生命 */
  rogue_6_weather_8: {
    id: "rogue_6_weather_8",
    name: "“希望的沃土”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `我方单位攻击+${Math.round((blackboard.find((item) => item.key === "atk")?.value || 0) * 100)}%，生命+${Math.round((blackboard.find((item) => item.key === "max_hp")?.value || 0) * 100)}%，战斗胜利后获得随机零件`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "atk", value: 0.1, valueStr: null },
            { key: "max_hp", value: 0.1, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "atk", value: 0.15, valueStr: null },
            { key: "max_hp", value: 0.2, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "atk", value: 0.2, valueStr: null },
            { key: "max_hp", value: 0.3, valueStr: null },
          ],
        },
      ],
    ],
  },
  /** 信息类 */
  rogue_6_weather_9: {
    id: "rogue_6_weather_9",
    name: "“弥散虚雾”",
    functionDesc: () => "无法揭示已连通的节点信息",
    values: [[], [], []],
    disabled: true,
  },
  /** 视觉类 */
  rogue_6_weather_10: {
    id: "rogue_6_weather_10",
    name: "“美丽新大地”",
    functionDesc: () => "战场上我方形象不再可见",
    values: [[], [], []],
    disabled: true,
  },
};

/**
 * 保密等级 → 理想域等级下标。
 * 依据游戏内难度面板「实托邦景象」列：N0/N1 无 → N2 早期 → N6 中期 → N12 晚期。
 * 返回 -1 表示该难度下不生成理想域。
 */
export function getUtopiaLevel(difficulty: number): number {
  if (difficulty < 2) return -1;
  if (difficulty < 6) return 0;
  if (difficulty < 12) return 1;
  return 2;
}

/** 获取黑流树海理想域 */
export function getRogue6Utopias(difficulty: number): ITopicSpecItem[] {
  const level = getUtopiaLevel(difficulty);
  // N0/N1 不生成理想域
  if (level < 0) return [];
  return Object.values(UTOPIA_CONFIG)
    .sort((a, b) => UTOPIA_ORDER.indexOf(a.name) - UTOPIA_ORDER.indexOf(b.name))
    .map((ut) => {
      const buffs = ut.values[level];
      const desc = ut.functionDesc(buffs.map((buff) => buff.blackboard).flat());
      // TODO(素材): prts.wiki 的理想域图标命名待核实，暂沿用岁时的路径模式并去掉中文引号
      const url = imageHost + getPath(`集成战略_7_理想域_${ut.name.replace(/[“”]/g, "")}.png`);
      return {
        ...ut,
        description: desc,
        url,
        userActive: true,
        invert: 0,
        buffs,
        rows: 1,
        layer: 1,
        disabled: ut.disabled,
      };
    });
}
