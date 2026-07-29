import type { ITopicSpecItem } from "../TopicSpecSelector";
import type { RelicBuff } from "~/types/gameData";
import { getPath, imageHost } from "~/utils/tools";

/**
 * 黑流树海主题特殊效果配置。
 *
 * ── 名词层级（三处叫法不同，勿混）──────────────────────────
 *   理想域       黑流树海中的生物聚落总称，分「崇尚交互的实托邦」与「崇尚内圣的乌托邦」两类
 *   实托邦       解包 modules.rogue_6.weather，10 种 × 3 级；难度面板称「实托邦景象」
 *   乌托邦       解包 details.rogue_6.variationData，9 条，无分级
 *   乌托邦幸福论  prts 上这两套效果的共同条目名，也是图标文件名前缀
 *
 * ⚠️ descs 全部**逐字取自解包 functionDesc / scrapDesc**（仅剥离 <color> 等富文本标记），
 * 不得改写或追加说明；blackboard 数值则是对照该原文手工建模的版本敏感硬编码。
 *
 * 乘区语义（勿写反）：
 *   - 敌人侧 in_game_buff_final_mul 是 "*" 组 → 写**乘数**（1.3 = +30%），
 *     且必须带 `{ key: "key", valueStr: "enemy_*" }` 作为路由标记，
 *     isBuffForEnemy 靠 valueStr 前缀判定敌我（该 valueStr 并非注册键）。
 *   - 干员侧 in_game_buff_mul 是 "+" 组（基数 1）→ 写**增量**（0.2 = +20%）。
 *   - attack_speed 走 relic_rune_add 加算区 → 写字面值（+50 即 50）。
 * values 为空数组表示该条目不进入计算，仅作展示（配合 disabled）。
 */
interface Rogue6SpecConfig {
  id: string;
  name: string;
  /** 图标文件名中的条目名；仅当展示名与之不同（如同一条目拆成多个可选项）时需要指定 */
  iconName?: string;
  /** 各等级效果文案，逐字取自解包原文；无分级的条目只有一项 */
  descs: string[];
  values: RelicBuff[][];
  disabled?: boolean;
}

/** 实托邦等级名，取自解包 levelName */
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

/** 实托邦（modules.rogue_6.weather.mainWeatherData，10 种 × 3 级） */
export const UTOPIA_CONFIG: Record<string, Rogue6SpecConfig> = {
  rogue_6_weather_1: {
    id: "rogue_6_weather_1",
    name: "“黑流地脉”",
    descs: [
      "关卡中出现额外的猎犬proto，敌方攻击+10%，生命+10%",
      "关卡中出现额外的猎犬proto，敌方攻击+20%，生命+20%",
      "关卡中出现更多额外的猎犬proto，敌方攻击+30%，生命+30%",
    ],
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
  rogue_6_weather_2: {
    id: "rogue_6_weather_2",
    name: "“倾斜沙丘”",
    descs: [
      "场上出现随机方向的沙尘暴，部署方向与沙尘暴方向不同的干员攻击力降低20%，干员可以为其他干员挡住沙尘暴，敌方移速-15%",
      "场上出现随机方向的沙尘暴，部署方向与沙尘暴方向不同的干员攻击力降低35%，干员可以为其他干员挡住沙尘暴，敌方移速-15%",
      "场上出现随机方向的沙尘暴，部署方向与沙尘暴方向不同的干员攻击力降低50%，干员可以为其他干员挡住沙尘暴，敌方移速-15%",
    ],
    // 仅在干员处于不利方向时成立，由用户按实际情况勾选
    values: [
      [{ key: "", blackboard: [{ key: "atk", value: -0.2, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "atk", value: -0.35, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "atk", value: -0.5, valueStr: null }] }],
    ],
  },
  rogue_6_weather_3: {
    id: "rogue_6_weather_3",
    name: "“去温栏”",
    descs: [
      "我方单位部署时冻结5秒，每60秒为全体单位施加15秒寒冷",
      "我方单位部署时冻结10秒，每45秒为全体单位施加15秒寒冷",
      "我方单位部署时冻结15秒，每30秒为全体单位施加15秒寒冷",
    ],
    values: [[], [], []],
    disabled: true,
  },
  rogue_6_weather_4: {
    id: "rogue_6_weather_4",
    name: "“微型胶囊”",
    descs: ["我方单位受到的物理伤害提高25%", "我方单位受到的物理伤害提高40%", "我方单位受到的物理伤害提高70%"],
    values: [[], [], []],
    disabled: true,
  },
  rogue_6_weather_5: {
    id: "rogue_6_weather_5",
    name: "“储藏室”",
    descs: [
      "零件售出价值-10%，诡意行商和秘境行商内商品栏位-1",
      "零件售出价值-30%，诡意行商和秘境行商内商品栏位-2",
      "零件售出价值-50%，诡意行商和秘境行商内商品栏位-3",
    ],
    values: [[], [], []],
    disabled: true,
  },
  rogue_6_weather_6: {
    id: "rogue_6_weather_6",
    name: "“易碎同盟”",
    descs: [
      "我方单位部署后损失30%生命值（每个单位退场前只会生效一次）",
      "我方单位部署后损失50%生命值（每个单位退场前只会生效一次）",
      "我方单位部署后损失70%生命值（每个单位退场前只会生效一次）",
    ],
    values: [[], [], []],
    disabled: true,
  },
  rogue_6_weather_7: {
    id: "rogue_6_weather_7",
    name: "“停止点”",
    descs: ["费用自然回复效率-20%", "费用自然回复效率-25%", "费用自然回复效率-40%"],
    values: [[], [], []],
    disabled: true,
  },
  rogue_6_weather_8: {
    id: "rogue_6_weather_8",
    name: "“希望的沃土”",
    descs: [
      "我方单位攻击+10%，生命+10%，战斗胜利后获得随机零件",
      "我方单位攻击+15%，生命+20%，战斗胜利后获得随机零件",
      "我方单位攻击+20%，生命+30%，战斗胜利后获得随机零件",
    ],
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
  rogue_6_weather_9: {
    id: "rogue_6_weather_9",
    name: "“弥散虚雾”",
    descs: ["无法揭示已连通的节点信息", "无法揭示已连通的节点信息", "无法揭示已连通的节点信息"],
    values: [[], [], []],
    disabled: true,
  },
  rogue_6_weather_10: {
    id: "rogue_6_weather_10",
    name: "“美丽新大地”",
    descs: ["战场上我方形象不再可见", "战场上我方形象不再可见", "战场上我方形象不再可见"],
    values: [[], [], []],
    disabled: true,
  },
};

/** 乌托邦（details.rogue_6.variationData，9 条，type 分 BAT/MAP/RES） */
export const VARIATION_CONFIG: Record<string, Rogue6SpecConfig> = {
  rogue_6_variation_1: {
    id: "rogue_6_variation_1",
    name: "“巨人摇篮”",
    // 解包与 prts 均未给出具体百分比，无法建模
    descs: ["我方攻击力提升，但对较远的敌人造成的伤害降低"],
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_2: {
    id: "rogue_6_variation_2",
    name: "“迪斯科狂热”",
    descs: ["我方干员技力需求降低，技能结束后向周围随机移动"],
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_3: {
    id: "rogue_6_variation_3",
    name: "“已知浩劫”",
    descs: ["敌人和我方每秒损失生命"],
    values: [[]],
    disabled: true,
  },
  // 一个条目含两种互斥状态，单个开关无法表达，故拆成两项分别可选（勿同时勾选）
  rogue_6_variation_4_up: {
    id: "rogue_6_variation_4_up",
    name: "“孤立石林”（攻速+30）",
    iconName: "“孤立石林”",
    descs: ["我方攻击范围内存在我方干员时攻速+30，否则攻速-50（本条目按存在我方干员计算）"],
    values: [[{ key: "", blackboard: [{ key: "attack_speed", value: 30, valueStr: null }] }]],
  },
  rogue_6_variation_4_down: {
    id: "rogue_6_variation_4_down",
    name: "“孤立石林”（攻速-50）",
    iconName: "“孤立石林”",
    descs: ["我方攻击范围内存在我方干员时攻速+30，否则攻速-50（本条目按不存在我方干员计算）"],
    values: [[{ key: "", blackboard: [{ key: "attack_speed", value: -50, valueStr: null }] }]],
  },
  rogue_6_variation_5: {
    id: "rogue_6_variation_5",
    name: "“全知者盲区”",
    descs: ["每次移动后，刷新其余未经过节点"],
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_6: {
    id: "rogue_6_variation_6",
    name: "“未亡者遗怨”",
    descs: ["生成更多“居民”的恶意"],
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_7: {
    id: "rogue_6_variation_7",
    name: "“源石之城”",
    descs: ["完成节点后获得源石锭，敌方属性随源石锭数量提升"],
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_8: {
    id: "rogue_6_variation_8",
    name: "“消耗螺旋”",
    descs: ["每名干员仅可在一场狭路相逢中出战"],
    values: [[]],
    disabled: true,
  },
  rogue_6_variation_9: {
    id: "rogue_6_variation_9",
    name: "“换心联结”",
    descs: ["每完成一个失与得节点，获得5源石锭"],
    values: [[]],
    disabled: true,
  },
};

/**
 * 零件（modules.rogue_6.scrap.passiveScrapData）。
 * 全部零件分自然物 / 加工品 / 概念体三类，此处只收录进入伤害计算的两个概念体。
 */
export const SCRAP_CONFIG: Record<string, Rogue6SpecConfig> = {
  rogue_6_scrap_P_01: {
    id: "rogue_6_scrap_P_01",
    name: "白模鸟",
    descs: ["装载加工品移动至作战节点时，本次战斗我方单位攻击速度+50，战斗后获得1个随机收藏品（可激活1次）"],
    values: [[{ key: "", blackboard: [{ key: "attack_speed", value: 50, valueStr: null }] }]],
  },
  rogue_6_scrap_P_04: {
    id: "rogue_6_scrap_P_04",
    name: "涂装黎博利",
    descs: ["装载加工品移动至作战节点时，本次战斗我方单位攻击速度+35"],
    values: [[{ key: "", blackboard: [{ key: "attack_speed", value: 35, valueStr: null }] }]],
  },
};

/** 图标 URL；实托邦与乌托邦共用「乌托邦幸福论」前缀，零件用「零件」前缀（均按 media.prts.wiki 的 MD5 目录校验） */
function specItemUrl(prefix: string, name: string): string {
  return imageHost + getPath(`沉沦者的黑流树海_${prefix}_${name}.png`);
}

function toSpecItem(cfg: Rogue6SpecConfig, level: number, prefix: string): ITopicSpecItem {
  return {
    ...cfg,
    description: cfg.descs[level],
    url: specItemUrl(prefix, cfg.iconName ?? cfg.name),
    userActive: true,
    invert: 0,
    buffs: cfg.values[level],
    rows: 1,
    layer: 1,
    disabled: cfg.disabled,
  };
}

/**
 * 保密等级 → 实托邦等级下标。
 * 依据游戏内难度面板「实托邦景象」列：N0/N1 无 → N2 早期 → N6 中期 → N12 晚期。
 * 返回 -1 表示该难度下不生成实托邦。
 */
export function getUtopiaLevel(difficulty: number): number {
  if (difficulty < 2) return -1;
  if (difficulty < 6) return 0;
  if (difficulty < 12) return 1;
  return 2;
}

/** 获取实托邦 */
export function getRogue6Utopias(difficulty: number): ITopicSpecItem[] {
  const level = getUtopiaLevel(difficulty);
  if (level < 0) return [];
  return Object.values(UTOPIA_CONFIG)
    .sort((a, b) => UTOPIA_ORDER.indexOf(a.name) - UTOPIA_ORDER.indexOf(b.name))
    .map((ut) => toSpecItem(ut, level, "乌托邦幸福论"));
}

/** 获取乌托邦（无分级） */
export function getRogue6Variations(): ITopicSpecItem[] {
  return Object.values(VARIATION_CONFIG).map((va) => toSpecItem(va, 0, "乌托邦幸福论"));
}

/** 获取零件（无分级） */
export function getRogue6Scraps(): ITopicSpecItem[] {
  return Object.values(SCRAP_CONFIG).map((sc) => toSpecItem(sc, 0, "零件"));
}
