import type { ITopicSpecConfig, ITopicSpecItem } from "../TopicSpecSelector";
import type { BlackboardData } from "~/types/gameData";
import { getPath, imageHost } from "~/utils/tools";

/**
 * 黑流树海「理想域」（解包数据中的 weather 模块）。
 *
 * ── 名词层级（三处叫法不同，勿混）──────────────────────────
 *   理想域       黑流树海中的生物聚落总称，分「崇尚交互的实托邦」与「崇尚内圣的乌托邦」两类（prts 主题贴士）
 *   实托邦       难度面板中的用词：「实托邦景象」列、「实托邦·方针」
 *   乌托邦幸福论  prts 上这组效果的条目名，也是图片文件名前缀
 * 本文件对外统一用「理想域」。
 *
 * 与界园「岁时」完全同构：同一效果分三级，随保密等级解锁：
 *   N0~N1 不生成 → N2 早期 → N6 中期 → N12 晚期
 * 数据来源：roguelike_topic_table.modules.rogue_6.weather.mainWeatherData（10 种 × 3 级 = 30 条），
 * 全部 30 个数值已与 prts「黑流数据库」页面逐条核对一致。
 *
 * 未建模：subWeatherData 的 4 个「实托邦·方针」（改良/修正/激进/增益）——
 * 效果均为途经节点时的源石锭/护盾/生命/估价增减，不进入伤害计算。
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
 * 乌托邦（解包 details.rogue_6.variationData，9 条）。
 * 与实托邦并列，同属「理想域」下的两类聚落；无等级分级，一场探索中固定生效。
 *
 * `type` 字段区分用途：BAT=战斗、MAP=地图、RES=资源。仅 BAT 类可能进入伤害计算，
 * 但其中三项要么解包与 prts 都未给出数值（巨人摇篮），要么非面板效果
 * （已知浩劫为每秒真伤、迪斯科狂热为技力需求），故实际建模的只有「孤立石林」。
 */
export const VARIATION_CONFIG: Record<string, ITopicSpecConfig> = {
  rogue_6_variation_1: {
    id: "rogue_6_variation_1",
    name: "“巨人摇篮”",
    // ⚠️ 解包 functionDesc 与 prts 均只给定性描述，未给出提升/降低的具体百分比
    functionDesc: () => "我方攻击力提升，但对较远的敌人造成的伤害降低（未公布具体数值，暂不计入计算）",
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_2: {
    id: "rogue_6_variation_2",
    name: "“迪斯科狂热”",
    functionDesc: () => "我方干员技力需求-40%，技能结束后向周围随机移动（技力需求不进入面板计算）",
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_3: {
    id: "rogue_6_variation_3",
    name: "“已知浩劫”",
    functionDesc: () => "所有单位每秒受到其最大生命值3%的真实伤害（持续伤害，非面板加成）",
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_4: {
    id: "rogue_6_variation_4",
    name: "“孤立石林”",
    functionDesc: (blackboard: BlackboardData[]) =>
      `我方攻击范围内存在我方干员时攻速+${blackboard.find((item) => item.key === "attack_speed")?.value}（勾选按此计算），否则攻速-50`,
    values: [[{ key: "", blackboard: [{ key: "attack_speed", value: 30, valueStr: null }] }]],
  },
  rogue_6_variation_5: {
    id: "rogue_6_variation_5",
    name: "“全知者盲区”",
    functionDesc: () => "每次移动后，刷新其余未经过节点",
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_6: {
    id: "rogue_6_variation_6",
    name: "“未亡者遗怨”",
    functionDesc: () => "生成更多“居民”的恶意",
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_7: {
    id: "rogue_6_variation_7",
    name: "“源石之城”",
    functionDesc: () => "完成节点后获得源石锭，敌方属性随源石锭数量提升（提升量随局内进度变化，无法静态建模）",
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_8: {
    id: "rogue_6_variation_8",
    name: "“消耗螺旋”",
    functionDesc: () => "每名干员仅可在一场狭路相逢中出战",
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_9: {
    id: "rogue_6_variation_9",
    name: "“换心联结”",
    functionDesc: () => "每完成一个失与得节点，获得5源石锭",
    values: [[]],
    disabled: true,
  },
};

/** 获取乌托邦（无难度分级） */
export function getRogue6Variations(): ITopicSpecItem[] {
  return Object.values(VARIATION_CONFIG).map((va) => {
    const buffs = va.values[0];
    return {
      ...va,
      description: va.functionDesc(buffs.map((buff) => buff.blackboard).flat()),
      // 与实托邦共用「乌托邦幸福论」前缀（已按 /d/d8/ 巨人摇篮、/6/6c/ 孤立石林 校验）
      url: imageHost + getPath(`沉沦者的黑流树海_乌托邦幸福论_${va.name}.png`),
      userActive: true,
      invert: 0,
      buffs,
      rows: 1,
      layer: 1,
      disabled: va.disabled,
    };
  });
}

/**
 * 零件（引擎配件）中**影响战斗数值**的条目。
 *
 * 全部零件分自然物 / 加工品 / 概念体三类共数十项，但绝大多数只作用于移动、估价、
 * 护盾等非面板效果；经 prts「引擎配件目录」核对，进入伤害计算的只有下面两个概念体，
 * 故此处硬编码而非走 API——解包侧 scrap 相关表（scrapItemToType 等）目前也不在下发范围内。
 *
 * 两者均为「装载加工品移动至作战节点时，本次战斗生效」，勾选即代表本场战斗已触发。
 * attack_speed 走 relic_rune_add 加算区，写字面值（+50 即 50）。
 */
export const SCRAP_CONFIG: Record<string, ITopicSpecConfig> = {
  rogue_6_scrap_baimoniao: {
    id: "rogue_6_scrap_baimoniao",
    name: "白模鸟",
    functionDesc: (blackboard: BlackboardData[]) =>
      `装载加工品移动至作战节点时，本次战斗我方单位攻击速度+${blackboard.find((item) => item.key === "attack_speed")?.value}，战斗后获得1个随机收藏品`,
    values: [[{ key: "", blackboard: [{ key: "attack_speed", value: 50, valueStr: null }] }]],
  },
  rogue_6_scrap_tuzhuangliboli: {
    id: "rogue_6_scrap_tuzhuangliboli",
    name: "涂装黎博利",
    functionDesc: (blackboard: BlackboardData[]) =>
      `装载加工品移动至作战节点时，本次战斗我方单位攻击速度+${blackboard.find((item) => item.key === "attack_speed")?.value}`,
    values: [[{ key: "", blackboard: [{ key: "attack_speed", value: 35, valueStr: null }] }]],
  },
};

/** 获取零件（仅影响战斗数值的条目，无难度分级） */
export function getRogue6Scraps(): ITopicSpecItem[] {
  return Object.values(SCRAP_CONFIG).map((sc) => {
    const buffs = sc.values[0];
    const desc = sc.functionDesc(buffs.map((buff) => buff.blackboard).flat());
    // 零件图标前缀是「零件」而非页面标题的「引擎配件」（已按 /1/1e/ 白模鸟 校验）
    const url = imageHost + getPath(`沉沦者的黑流树海_零件_${sc.name}.png`);
    return {
      ...sc,
      description: desc,
      url,
      userActive: true,
      invert: 0,
      buffs,
      rows: 1,
      layer: 1,
    };
  });
}

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
      // prts.wiki 命名为「沉沦者的黑流树海_乌托邦幸福论_{名称}.png」，名称含中文引号，勿去除
      // （已按 media.prts.wiki 实际 URL 的 MD5 目录校验：“黑流地脉” → /9/99/）
      const url = imageHost + getPath(`沉沦者的黑流树海_乌托邦幸福论_${ut.name}.png`);
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
