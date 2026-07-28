import type { EnemyData, EnemyInput, RogueKey, StageData, ZoneData, ZoneOfRogue } from "~/types/gameData";
import { parseDefinedData } from "../utils";
import { intToRoman } from "~/utils/tools";
import type { RogueInput } from "~/stores/damageCalculator/calcTypes";

export const enemyTagMap: Record<string, string> = {
  infection: "感染生物",
  collapsal: "坍缩体",
  animated: "化物",
  seamonster: "海怪",
  drone: "无人机",
  machine: "机械",
  origen: "源石造物",
  sarkaz: "萨卡兹",
  mutant: "宿主",
  originiumartscraft: "法术造物",
  wildanimal: "野生动物",
};

export const levelTypeMap: Record<string, string> = {
  NORMAL: "普通",
  ELITE: "精英",
  BOSS: "领袖",
};

/**
 * 解析敌人数据
 * @param enemyData
 * @param stageData 关卡数据（用于获取难度）
 * @param levelData 关卡数据（用于获取符文）
 * @returns
 */
export function parseEnemyData(enemyData: EnemyData): EnemyInput {
  const attributes = enemyData.attributes;
  return {
    id: enemyData.id,
    level: enemyData.level,
    name: parseDefinedData(enemyData.name)!,
    description: parseDefinedData(enemyData.description)!,
    attributes: {
      maxHp: parseDefinedData(attributes.maxHp)!,
      atk: parseDefinedData(attributes.atk)!,
      def: parseDefinedData(attributes.def)!,
      magicResistance: parseDefinedData(attributes.magicResistance)!,
      cost: parseDefinedData(attributes.cost)!,
      blockCnt: parseDefinedData(attributes.blockCnt)!,
      moveSpeed: parseDefinedData(attributes.moveSpeed)!,
      attackSpeed: parseDefinedData(attributes.attackSpeed)!,
      baseAttackTime: parseDefinedData(attributes.baseAttackTime)!,
      respawnTime: parseDefinedData(attributes.respawnTime)!,
      hpRecoveryPerSec: parseDefinedData(attributes.hpRecoveryPerSec)!,
      spRecoveryPerSec: parseDefinedData(attributes.spRecoveryPerSec)!,
      maxDeployCount: parseDefinedData(attributes.maxDeployCount)!,
      massLevel: parseDefinedData(attributes.massLevel)!,
      baseForceLevel: parseDefinedData(attributes.baseForceLevel)!,
      tauntLevel: parseDefinedData(attributes.tauntLevel)!,
      disarmedCombatImmune: parseDefinedData(attributes.disarmedCombatImmune)!,
      fearedImmune: parseDefinedData(attributes.fearedImmune)!,
      epDamageResistance: parseDefinedData(attributes.epDamageResistance)!,
      epResistance: parseDefinedData(attributes.epResistance)!,
      damageHitratePhysical: parseDefinedData(attributes.damageHitratePhysical)!,
      damageHitrateMagical: parseDefinedData(attributes.damageHitrateMagical)!,
      stunImmune: parseDefinedData(attributes.stunImmune)!,
      silenceImmune: parseDefinedData(attributes.silenceImmune)!,
      sleepImmune: parseDefinedData(attributes.sleepImmune)!,
      frozenImmune: parseDefinedData(attributes.frozenImmune)!,
      levitateImmune: parseDefinedData(attributes.levitateImmune)!,
      damageResistance: 0,
    },
    levelType: parseDefinedData(enemyData.levelType)!,
    rangedRadius: parseDefinedData(enemyData.rangeRadius),
    applyWay: parseDefinedData(enemyData.applyWay)!,
    enemyTags: parseDefinedData(enemyData.enemyTags) || [],
  };
}

// 三层boss关数量（异格记为同一个）
const numOfZone3Boss = {
  ro1: 5,
  ro2: 3,
  ro3: 3,
  ro4: 3,
  ro5: 3,
  ro6: 3, // 黑流树海：b_1~b_3
};

// 五层boss关数量（异格记为同一个）
const numOfZone5Boss = {
  ro1: 2,
  ro2: 2,
  ro3: 2,
  ro4: 2,
  ro5: 2,
  ro6: 2, // 黑流树海：b_4/b_5
};

// 六七层boss关数量（异格记为同一个）
const numberOfZone67Boss = {
  ro1: 2,
  ro2: 2,
  ro3: 2,
  ro4: 3,
  ro5: 2,
  // 黑流树海：六七层实际只有 b_6（六层），无第七层Boss。
  // 与后端 shared.js 同值双份，且同样是刻意填 2——isBoss 的 `zoneIndex - bossNum === zone3+zone5-6`
  // 判据要求该值把 b_6 落在 zoneIndex 5（第6层）；理由详见无藏模块 version-sensitive-hardcode。
  ro6: 2,
};

const isBase = (args: string[]) => args[1] === "n" || args[1] === "e";

// 判断是否属于当前层
const isLayer = (args: string[], zoneData: ZoneData) => args[2] === zoneData.id.split("_")[1];

// 仅在3~5层出现狭路相逢
const isDuel = (args: string[], i: number) => i > 1 && i < 5 && args[1] === "duel";

// 不期而遇
const isIncident = (args: string[]) => args[1] === "t" || args[2] === "t";

// 诡异行商
const isShop = (args: string[]) => args[1] === "ev";

// 指点迷津 fs为渡劫，dv为分明
const isStashedRecruit = (args: string[]) => args[1] === "fs" || args[1] === "dv";

// 判断是否为boss关
const isBoss = (args: string[], zoneData: ZoneData, zoneIndex: number) => {
  if (args[1] !== "b") return false;
  const bossNum = parseInt(args[2]);
  const zone3BossNum = numOfZone3Boss[args[0] as keyof typeof numOfZone3Boss];
  const zone5BossNum = numOfZone5Boss[args[0] as keyof typeof numOfZone5Boss];
  const zone67BossNum = numberOfZone67Boss[args[0] as keyof typeof numberOfZone67Boss];
  if (zoneIndex === 2 && bossNum <= zone3BossNum) return true;
  if (zoneIndex === 4 && bossNum > zone3BossNum && bossNum <= zone3BossNum + zone5BossNum) return true;
  // 爱国者 bossNum=6 index=5 zone3BossNum=3 zone5BossNum=2
  // 阿米娅 bossNum=8 index=7 zone3BossNum=3 zone5BossNum=2
  if (zoneIndex > 4 && zoneIndex - bossNum === zone3BossNum + zone5BossNum - 6) return true;
  // TODO 水月树洞未处理
  if (zoneIndex > zone3BossNum + zone5BossNum + zone67BossNum) return false;
  return false;
};

/** 用于描述6+层Boss名 */
const suffixBossNames: Record<string, Record<number, string>> = {
  rogue_4: {
    6: "爱国者",
    7: "奎隆",
    8: "魔王阿米娅",
  },
  rogue_5: {
    6: "望",
    7: "后兽",
  },
  rogue_6: {
    6: "症结之核",
  },
};

// 根据主题获取区域配置，以及默认难度层数
export function getNavOfZone(rogueKey: RogueKey, zones: Record<string, ZoneOfRogue>) {
  const zoneOfRogue = zones[rogueKey];

  const baseZones = Object.values(zoneOfRogue)
    // 仅保留普通层
    .filter((zone) => zone.id.split("_")[1].match(/\d/))
    .map((zoneData, i) => {
      // 6+层Boss名
      const suffixBossName = suffixBossNames[rogueKey]?.[i + 1];
      const suffixName = suffixBossName ? " · " + suffixBossName : "";
      const prefixRoman = intToRoman(i + 1) + " ";
      return {
        id: zoneData.id,
        name: prefixRoman + zoneData.name + suffixName,
        filter: (stage: StageData) => {
          const args = stage.id.split("_");
          // 狭路相逢可出现在复数层
          if (isDuel(args, i)) return true;
          // 判断是否为boss关
          if (isBoss(args, zoneData, i)) return true;
          // 判断是否为基础关
          if (!isBase(args)) return false;
          // 判断层数是否正确
          return isLayer(args, zoneData);
        },
        // 7层以上映射到 -1 级难度
        getLayer: () => "layer_" + (i + 1 > 6 ? i : i + 1),
      };
    });

  const otherZones =
    {
      rogue_5: [
        {
          id: "zone_sky_1",
          name: "岁兽残识 · 是非境",
          filter: (stage: StageData) => {
            const args = stage.id.split("_");
            return args[1] === "sv" && args.slice(-1)[0] !== "dlc1";
          },
          // 如果在6层以下保持层数不变
          getLayer: (rogueInput: RogueInput) => {
            const layerNum = Number(rogueInput[rogueInput.topic].layer.split("_")[1]);
            if (layerNum > 5) return "layer_5";
            else return rogueInput[rogueInput.topic].layer;
          },
        },
        {
          id: "zone_sky_2",
          name: "岁兽残识 · 今昔境",
          filter: (stage: StageData) => {
            const args = stage.id.split("_");
            return args[1] === "sv" && args.slice(-1)[0] === "dlc1";
          },
          // 固定为6层
          getLayer: () => "layer_6",
        },
      ],
      rogue_6: [
        {
          id: "zone_portal",
          name: "未萌生的摇篮",
          filter: (stage: StageData) => {
            const args = stage.id.split("_");
            return args[1] === "c";
          },
          // 传送门网格区，可出现在多层：沿用用户当前选择的层数（同"不期而遇"处理）
          getLayer: (rogueInput: RogueInput) => rogueInput[rogueInput.topic].layer,
        },
      ],
    }[rogueKey as string] || [];

  const sharedZones = [
    {
      id: "zone_incident",
      name: "不期而遇",
      filter: (stage: StageData) => {
        const args = stage.id.split("_");
        return isIncident(args);
      },
      getLayer: (rogueInput: RogueInput) => rogueInput[rogueInput.topic].layer,
    },
    {
      id: "zone_shop",
      name: "诡异行商",
      filter: (stage: StageData) => {
        const args = stage.id.split("_");
        return isShop(args);
      },
      // 如果是第一个商店，要求在前三层，默认在一层，如果是第二个商店，要求在四层及以上，默认在四层
      getLayer: (rogueInput: RogueInput, stageId: string) => {
        const layerNum = Number(rogueInput[rogueInput.topic].layer.split("_")[1]);
        if (stageId.match(/_ev_1/) && layerNum > 3) {
          return "layer_1";
        } else if (stageId.match(/_ev_2/) && layerNum < 3) {
          return "layer_4";
        }
      },
    },
    {
      id: "zone_stashed_recruit",
      name: "指点迷津",
      filter: (stage: StageData) => {
        const args = stage.id.split("_");
        return isStashedRecruit(args);
      },
      // 首个关卡为“分明”，默认4层
      getLayer: () => "layer_4",
    },
  ];

  return [...baseZones, ...otherZones, ...sharedZones];
}

// 根据区域和关卡获取默认层数
export const getDefaultLayerForZone = (stageId: string, rogueInput: RogueInput, zones: Record<string, ZoneOfRogue>) => {
  const navOfZone = getNavOfZone(rogueInput.topic, zones);
  const zoneData = navOfZone.find((item) => item.id === rogueInput[rogueInput.topic].zone) || navOfZone[0];
  return zoneData.getLayer(rogueInput, stageId) || "layer_1";
};

// 根据关卡设置默认层数
export const getDefaultLayerForStage = (stageId: string, rogueInput: RogueInput): string => {
  const topic = rogueInput.topic;
  if (topic === "rogue_4") {
    if (stageId === "ro4_ev_1") return "layer_1"; // 物权纠纷 → 第一层
    if (stageId === "ro4_ev_2") return "layer_4"; // 叙事要约 → 第四层
    // 萨卡兹主题不期而遇关卡特定层数设置
    if (stageId === "ro4_e_t_2") return "layer_5"; // 紧急信号灯 → 第五层
    if (stageId === "ro4_t_1") return "layer_1"; // 失败的试胆 → 第一层
    if (stageId === "ro4_t_2") return "layer_2"; // 普通信号灯 → 第二层
    if (stageId === "ro4_t_3") return "layer_3"; // 劫虚济实 → 第三层
    if (stageId === "ro4_t_4") return "layer_6"; // 鸭速公路 → 第六层
    if (stageId === "ro4_t_5") return "layer_4"; // 战场侧面 → 第四层
    if (stageId === "ro4_t_6") return "layer_4"; // 继承 → 第四层
    if (stageId === "ro4_t_7") return "layer_4"; // 时光凯旋 → 第四层
    if (stageId === "ro4_t_8") return "layer_5"; // 玩具的报复 → 第五层
  } else if (topic === "rogue_5") {
    if (stageId === "ro5_ev_1") return "layer_1"; // 神游天外 → 第一层
    if (stageId === "ro5_ev_2") return "layer_4"; // 作壁上观 → 第四层
    // 界园主题不期而遇关卡特定层数设置
    if (stageId === "ro5_t_1") return "layer_1"; // 源源不断 → 第一层
    if (stageId === "ro5_t_2") return "layer_3"; // 闪闪发光 → 第三层
    if (stageId === "ro5_t_3") return "layer_3"; // 循循善诱 → 第三层
    if (stageId === "ro5_t_4") return "layer_6"; // 易易鸭鸭 → 第六层
    if (stageId === "ro5_t_5") return "layer_6"; // 劫罚 → 第六层
    if (stageId === "ro5_t_6") return "layer_5"; // 生百相 → 第五层
    if (stageId === "ro5_t_7") return "layer_3"; // 硕果累累 → 第三层
    if (stageId === "ro5_t_8") return "layer_3"; // 以逸待劳 → 第三层
    if (stageId === "ro5_t_9_a") return "layer_4"; // 喜从驮来 → 第四层
    if (stageId === "ro5_t_9_b") return "layer_4"; // 硅基伥的宴席 → 第四层
    if (stageId === "ro5_t_9_c") return "layer_4"; // 彻底失控 → 第四层
    if (stageId === "ro5_t_10") return "layer_3"; // 为崖作伥 → 第三层
    // 界园主题指点迷津关卡特定层数设置
    if (stageId === "ro5_dv_5") return "layer_5"; // 分明 → 第五层
    if (stageId === "ro5_fs_1") return "layer_5"; // 谤天 → 第五层
    if (stageId === "ro5_fs_1_b") return "layer_5"; // 谤天(紧急) → 第五层
    if (stageId === "ro5_fs_2") return "layer_5"; // 迎雷 → 第五层
    if (stageId === "ro5_fs_2_b") return "layer_5"; // 迎雷(紧急) → 第五层
    if (stageId === "ro5_fs_3") return "layer_5"; // 蔑震 → 第五层
    if (stageId === "ro5_fs_3_b") return "layer_5"; // 蔑震(紧急) → 第五层
    if (stageId === "ro5_fs_4") return "layer_5"; // 赴陨 → 第五层
    if (stageId === "ro5_fs_4_b") return "layer_5"; // 赴陨(紧急) → 第五层
    if (stageId === "ro5_fs_5") return "layer_5"; // 斥洪 → 第五层
    if (stageId === "ro5_fs_5_b") return "layer_5"; // 斥洪(紧急) → 第五层
  }
  return rogueInput[topic].layer; // 保持当前层数
};
