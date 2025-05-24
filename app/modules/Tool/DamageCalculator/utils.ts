import type {
  AttributeModifier,
  BlackboardData,
  CharAttributeExt,
  CharData,
  DefinedData,
  EnemyData,
  EnemyInput,
  LevelData,
  RelicBuff,
  RelicDataExt,
  RelicWrapper,
  RogueKey,
  StageData,
} from "~/types/gameData";

/**
 * 注册的key与中文翻译
 */
export const allowedBlackboardKeyMap: Record<string, string> = {
  atk: "攻击力",
  "multiplier@atk": "局内攻击力", // 几丁质刺刃
  "multiplier@def": "局内防御力", // 佣兵饰物
  "multiplier@max_hp": "局内生命上限", // 佣兵饰物
  "rogue_2_atk_up[king_suit][bonus].atk": "国王套攻击力", // 诸王的冠冕
  "rogue_2_block_cnt[life_point]": "国王套获得1技力间隔",
  "rogue_4_maxhp_up[lordoffiends_suit][bonus].max_hp": "魔王套生命上限", // 魔王的祭器
  def: "防御力",
  max_hp: "生命上限",
  damage_scale: "易伤",
  "damage_scale[phy]": "物理易伤",
  "damage_scale[mag]": "法术易伤",
  "damage_scale[pure]": "真伤易伤",
  "damage_scale[ep]": "元素易伤",
  ep_damage_scale: "_元素损伤",
  "damage_scale[pioneer]": "先锋易伤",
  "damage_scale[warrior]": "近卫易伤",
  "damage_scale[tank]": "重装易伤",
  "damage_scale[support]": "辅助易伤",
  "damage_scale[caster]": "术师易伤",
  "damage_scale[special]": "特种易伤",
  "damage_scale[medic]": "医疗易伤",
  "damage_scale[sniper]": "狙击易伤",
  "damage_scale[sarkaz]": "对萨卡兹易伤", // 文学
  magic_resistance: "法术抗性",
  damage_resistance: "伤害降低",
  "enemy_damage_resistance[inf]": "物理与法术伤害降低",
  sp_recovery_per_sec: "技力回复",
  attack_speed: "攻击速度",
  base_attack_time: "攻击间隔",
  respawn_time: "再部署时间",
  "rogue_2_hit_to_add_sp[sarkaz]": "对萨卡兹造成伤害回复技力", // 讨魔义旗
  "modify_sp[warrior]": "近卫攻击获得技力", // 浴血
  "modify_sp[pioneer]": "先锋初始获得技力",
  "modify_sp[tank]": "重装受击获得技力",
  "modify_sp[born]": "每次再部署获得技力",
  interval: "攻受回技能获得1技力间隔", // interval在sp上面才能被优先选为bb key
  hp_ratio: "当前生命值百分比",
  "modify_sp[attack_or_damage]": "攻受回技能获得1技力间隔", // 浴血
  prob: "概率",
  atk_scale: "伤害倍率",
  range_radius: "伤害范围", // 烟花手
  move_speed: "移动速度",
  ep_damage_resistance: "元素伤害抗性",
  ep_resistance: "损伤抵抗",
  cost: "部署费用",
  hp_recovery_per_sec: "每秒恢复生命",
  sp: "初始技力",
  damage_scale_mag: "法术增伤",
  damage_scale_phy: "物理增伤",
  damage_scale_pure: "真伤增伤",
  enemy_atk_down: "敌人攻击力",
  enemy_def_down: "敌人防御力",
  enemy_max_hp_down: "敌人生命上限",
  enemy_damage_scale_phy: "敌人物理易伤",
  enemy_damage_scale_mag: "敌人法术易伤",
  enemy_damage_scale_pure: "敌人真伤易伤",
  enemy_damage_scale_ep: "敌人元素损伤",
  enemy_damage_resistance_inf: "受到物理与法术减伤",
};

/**
 * buff.key以global开头的，注册的valueStr
 */
export const allowedBlackboardValueStrs = [
  // "rogue_3_dmg_penetrate[filter_tag]", // 猎人的洞察
  // "modify_sp[attack_or_damage]", // 利口酒
  // "rogue_2_hit_to_add_sp[tag]", // “讨魔义旗”
  // "rogue_2_attack_speed_up[life_point]", // 国王的新枪
  // "rogue_2_relic_mark[king_suit]", // 国王套
  // "rogue_4_relic_mark[LordOfFiends_suit]", // 魔王套
  // "extra_damage_via_cur_hp_ratio[magic]", // 扣挠手
  // "rogue_4_extra_aoe_damage[hand]", // 烟花手
  // "rogue_2_damage_in_attack_range", // 净尘手
  // "rogue_3_increaseMaxHPWhenHavingShield", // 湖中神盾
  // "modify_sp[attack_or_damage]", // 攻回技能
  // "rogue_1_damage_scale_by_distance", // 狙击镜
  "damage_scale[normal]", // 增伤
  (charData: CharData) => `damage_scale[${charData.profession.toLowerCase()}]`, // 职业队增伤（枯法）
  "modify_sp_recover[normal]", // 技力回复
  (charData: CharData) => `modify_sp_recover[${charData.profession.toLowerCase()}]`,
  "rogue_3_tokenEvolution", // 空羽兽
  "rogue_2_hit_to_add_sp[tag]", //“讨魔义旗”
  "rogue_4_extra_aoe_damage[hand]", // 烟花之手
];

/**
 * 效果施加于敌人的valueStr
 */
export const blackboardValueStrsForEnemy = [
  "defdown[support]", // 枯法
  "rogue_3_relic_book_10", // 久居
];

/**
 * 效果施加于干员的valueStr
 */
export const blackboardValueStrsForChar = [/enemy_damage_scale/];

/**
 * 带有层数效果的valueStr
 */
export const layerValueStrs = [
  "rogue_3_rangedATKUp", // 岩角号
  "rogue_2_atk_up_on_output_damage[stack]", // 轰鸣手
  "rogue_3_relic_book_4", // 裂岩
  "rogue_3_relic_book_7", // 波纹
  "rogue_3_relic_book_10", // 久居
];

/**
 * 局内生效的藏品名
 */
export const inGameRelicNames = [
  "黑色郁金香",
  "绿叶菜罐头",
  "叙拉古人的愤怒",
  "《光耀卡西米尔》",
  "《归来》",
  "湖中神盾",
  "空羽兽",
  "岩角号",
  "荣耀绶带",
  "古乔治营养原浆",
  "支柱-援护",
  "折戟-裂岩",
  "锈刃-遗世独立",
  "掠食之手",
  "久居之手",
  "轰鸣之手",
  "诸王的冠冕",
  "探索者背包",
  "城墙之子",
  "魔王的床榻",
  "未叙魔王残片",
  "魔王的祭器",
  "几丁质刺刃",
];

/**
 * 藏品黑名单（价值低或难以计入）
 */
export const disallowedRelicNames = [
  "黑色郁金香",
  "古堡的子嗣",
  "衣卡兹",
  "文学的开端", // 这次不做
  "Scout的狙击镜",
  "奴隶猎捕器",
];

/**
 * valueStr黑名单（用于判断isBuffActive)
 */
export const disallowedValueStrs = [
  "rogue_4_recover_hp[life_point]", // 国王的延伸回血
];

/**
 * 藏品是否在黑名单内，是否可以生效
 * @param relicDataExt
 */
export function isRelicActive(name: string) {
  return !disallowedRelicNames.includes(name);
}

/**
 * 检查Buff是否对该干员生效
 * 部分藏品与战斗无关，或位于黑名单中
 * @param buff
 * @param charData
 */
export function isBuffActive(buff: RelicBuff, charData?: CharData): boolean {
  if (buff.blackboard.some((bb) => disallowedValueStrs.includes(bb.valueStr!))) return false;
  // 使用buff的外层key判断
  if (["char", "layer_char"].some((prefix) => buff.key.startsWith(prefix))) {
    // layer_char_xxx为可叠层藏品，如米诺斯，金杯
    return true;
  } else if (buff.key.startsWith("global")) {
    // 使用首个bb的valueStr判断
    const valueStr = buff.blackboard[0].valueStr;
    return (
      valueStr?.startsWith("enemy") ||
      !charData ||
      allowedBlackboardValueStrs.some((item) => (typeof item === "function" ? item(charData) : item) === valueStr)
    );
  }
  // 均不匹配，不生效
  else return false;
}

/**
 * 检查Blackboard是否对该干员生效
 * @param buff
 * @param charData
 */
export function isBlackboardActive(buff: RelicBuff, charData?: CharData): boolean {
  // 空羽兽 key=char & valueStr=token 为召唤物效果
  if (
    buff.key.startsWith("char") &&
    buff.blackboard.find(
      (bb) => bb.key === "selector.profession" && (bb.valueStr === "token" || bb.valueStr === "trap"), // 必须是8大职业
    )
  )
    return false;

  if (!charData) {
    return getActiveBlackboard(buff).length !== 0;
  }

  let bbSelector;
  // 职业选择 warrior | pioneer | tank | support | caster | special | medic | sniper
  if ((bbSelector = buff.blackboard.find((bb) => bb.key === "selector.profession"))) {
    // 职业筛选为token且拥有召唤物，或职业筛选通过 空羽兽
    if (
      bbSelector.valueStr === "token"
        ? !charData.displayTokenDict
        : !bbSelector.valueStr?.includes(charData.profession.toLowerCase())
    )
      return false;
  }
  // 子职业选择
  if ((bbSelector = buff.blackboard.find((bb) => bb.key === "selector.sub_profession"))) {
    if (charData.subProfessionId !== bbSelector.valueStr) return false;
  }
  // 部署位置选择 melee | ranged
  if ((bbSelector = buff.blackboard.find((bb) => bb.key === "selector.buildable"))) {
    if (charData.position.toLowerCase() !== bbSelector.valueStr) return false;
  }
  // 是否有key在白名单中
  return !buff.blackboard.every((bb) => !allowedBlackboardKeyMap[bb.key]);
}

/**
 * buff对干员或敌人生效
 * @param buff
 */
export function isBuffForChar(buff: RelicBuff) {
  if (["char", "layer_char"].some((prefix) => buff.key.startsWith(prefix))) {
    // 部分干员能力对敌人生效
    return !blackboardValueStrsForEnemy.includes(buff.blackboard[0].valueStr!);
  } else if (buff.key.startsWith("global")) {
    const valueStr = buff.blackboard[0].valueStr!;
    return (
      blackboardValueStrsForChar.some((item) => (item instanceof RegExp ? item.test(valueStr) : item === valueStr)) ||
      !buff.blackboard[0].valueStr?.startsWith("enemy")
    );
  } else {
    console.log(buff);
    throw new Error("buff not active");
  }
}

/**
 * 用于替换bb.key
 */
const regexpBlackboardValueStrs = [
  /damage_scale\[(.+)]/, // 文学开端
  /rogue_2_hit_to_add_sp\[(.+)]/, // “讨魔义旗”
  /enemy_damage_resistance\[(.+)]/, // 终结的XX
  /modify_sp\[(.+)]/, // 浴血
  /rogue_2_block_cnt\[(.+)]/, // 国王的延伸
];

/**
 * 计算生成有效blackboard
 * @param buff
 */
export function getActiveBlackboard(buff: RelicBuff): BlackboardData[] {
  let bbKey, bbKeyToReplace, replaceStr; // 选择生效的key
  for (const bb of buff.blackboard) {
    // 增伤类型设置 phy | mag | pure | ep | tag(特殊，需多轮)
    {
      // rogue_4_damage_scale[tag] -> damage_scale[tag] -> damage_scale[sarkaz]
      const re = regexpBlackboardValueStrs.find((re) => bb.valueStr?.match(re));
      if (re) {
        [bbKeyToReplace, replaceStr] = bb.valueStr!.match(re)!;
        bbKey = bbKeyToReplace;
      }
      if (bbKeyToReplace && bb.key === replaceStr) {
        bbKey = bbKeyToReplace.replace(replaceStr, bb.valueStr!);
      }
    }
  }
  if (bbKey) {
    const allowedKey = Object.keys(allowedBlackboardKeyMap).find((key) => buff.blackboard.find((bb) => bb.key === key));
    if (allowedKey) {
      const allowed = buff.blackboard.find((bb) => bb.key === allowedKey);
      return [
        {
          key: bbKey,
          value: allowed!.value,
          valueStr: null,
        },
      ];
    } else {
      console.log(buff);
      console.log("bb key", bbKey);
      throw new Error("no key allowed");
    }
  } else {
    return buff.blackboard.filter((bb) => allowedBlackboardKeyMap[bb.key]);
  }
}

/**
 * 应用藏品效果
 * @param buff
 * @param result
 */
export function applyBlackboard(buff: RelicBuff, result: Record<string, number>) {
  const activeBlackboard = getActiveBlackboard(buff);
  if (activeBlackboard.length) {
    activeBlackboard.forEach((bb) => {
      const bbKey = bb.key.split(/[.@]/).slice(-1)[0];
      result[bbKey] = (result[bbKey] || 0) + bb.value;
    });
  } else {
    console.log(buff);
    throw new Error("active blackboard not found");
  }
}

/** 应用黑板数组(来自模组) */
export function applyBlackboardData(bb: BlackboardData, result: CharAttributeExt) {
  switch (bb.key) {
    case "damageScale": {
      result.damageScale += bb.value - 1;
      break;
    }
    case "max_hp": {
      result.maxHp += bb.value;
      break;
    }
    case "atk": {
      result.atk += bb.value;
      break;
    }
  }
}

/**
 * 应用潜能效果
 * @param mod
 * @param result
 */
export function applyAttrModifiers(mod: AttributeModifier, result: CharAttributeExt) {
  switch (mod.attributeType) {
    case "COST": {
      result.cost += mod.value;
      break;
    }
    case "MAX_HP": {
      result.maxHp += mod.value;
      break;
    }
    case "ATK": {
      result.atk += mod.value;
      break;
    }
    case "DEF": {
      result.def += mod.value;
      break;
    }
    case "ATTACK_SPEED": {
      result.attackSpeed += mod.value;
      break;
    }
    case "MAGIC_RESISTANCE": {
      result.magicResistance += mod.value;
      break;
    }
    case "RESPAWN_TIME": {
      result.respawnTime += mod.value;
      break;
    }
  }
}

/**
 * 计算藏品相关属性
 * @param relicDataExt
 * @param charData
 */
export function wrapRelicData(relicDataExt: RelicDataExt, charData?: CharData): RelicWrapper {
  // console.log(relicDataExt.name);
  const buffs = relicDataExt.buffs.map((buff) => {
    const isActive =
      isRelicActive(relicDataExt.name) && isBuffActive(buff, charData) && isBlackboardActive(buff, charData);
    const charResult = {};
    const enemyResult = {};
    if (isActive) {
      const result = isBuffForChar(buff) ? charResult : enemyResult;
      applyBlackboard(buff, result);
    }
    return {
      key: buff.key,
      isActive,
      charResult,
      enemyResult,
    };
  });
  const hasLayer = relicDataExt.buffs.some(
    (buff) =>
      buff.key.startsWith("layer_char") ||
      buff.key.startsWith("char_squad") ||
      buff.blackboard.some((bb) => layerValueStrs.includes(bb.valueStr!)),
  );

  return {
    id: relicDataExt.id,
    name: relicDataExt.name,
    value: relicDataExt.value,
    usage: relicDataExt.usage,
    show: relicDataExt.show,
    isActive: buffs.some((b) => b.isActive),
    userActive: true,
    isFavorite: false,
    hasLayer: hasLayer,
    layer: relicDataExt.layer || 1,
    buffs: buffs,
  };
}

/**
 * 根据藏品选择情况计算最终藏品加成结果
 * @param outBuff
 * @param relicWrappers
 * @param selectedRelicIds
 */
export function finalizeRelicResults(outBuff: number, relicWrappers: RelicWrapper[], selectedRelicIds: string[]) {
  const charResult: Record<string, number> = {};
  const inGameResult: Record<string, number> = {};
  const enemyResult: Record<string, number> = {};
  // 局外加成
  if (outBuff > 1) {
    charResult["max_hp"] = outBuff;
    charResult["atk"] = outBuff;
    charResult["def"] = outBuff;
  }
  const run = (relicWrapper: RelicWrapper, buffResult: Record<string, number>, result: Record<string, number>) => {
    for (const key in buffResult) {
      // 物理易伤、法术易伤、真伤易伤：多个buff效果取合, 但需要减去1
      if (["damage_scale[phy]", "damage_scale[mag]", "damage_scale[pure]"].includes(key)) {
        result[key] = (result[key] || 1) + (buffResult[key] - 1);
        continue;
      }
      // 元素易伤: 多个buff效果相乘
      if (key === "damage_scale[ep]") {
        if (result[key]) {
          result[key] *= buffResult[key];
        } else {
          result[key] = buffResult[key];
        }
        continue;
      }
      // 其他buff效果取合
      result[key] = (result[key] || 0) + (relicWrapper.layer || 1) * buffResult[key];
    }
  };
  relicWrappers
    // 用户选择的藏品
    .filter(
      (relicWrapper) => selectedRelicIds.includes(relicWrapper.id) && relicWrapper.isActive && relicWrapper.userActive,
    )
    .forEach((relicWrapper) => {
      relicWrapper.buffs
        // 能对当前干员生效的藏品
        .filter((buff) => buff.isActive)
        .forEach((buff) => {
          if (inGameRelicNames.includes(relicWrapper.name)) {
            // 局内生效
            run(relicWrapper, buff.charResult, inGameResult);
          } else {
            run(relicWrapper, buff.charResult, charResult);
          }
          run(relicWrapper, buff.enemyResult, enemyResult);
        });
    });
  return { charResult, inGameResult, enemyResult };
}

export function getEnemyParsedAttributes(enemyData: EnemyInput): Record<string, number | string | boolean> {
  const attributes: Record<string, number | string | boolean> = {};
  Object.keys(enemyData.attributes).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    attributes[key] = enemyData.attributes[key];
  });
  return attributes;
}

export const outBuffMap: Partial<Record<RogueKey, string[]>> = {
  rogue_1: ["1"],
  rogue_2: ["1", "1.2"],
  rogue_3: ["1", "1.23"],
  rogue_4: ["1", "1.2", "1.3"],
};

export const professions = [
  "VANGUARD",
  "SNIPER",
  "CASTER",
  "MEDIC",
  "GUARD",
  "DEFENDER",
  "SPECIALIST",
  "SUPPORTER",
  "WARRIOR",
];

export function parseDefinedData<T>(definedData: DefinedData<T>): T {
  return definedData.m_value;
}

export function parseEnemyData(enemyData: EnemyData, stageData: StageData, levelData: LevelData): EnemyInput {
  const stageDifficulty = stageData.difficulty;
  const runes = levelData.runes;
  const rune = runes.find(
    (rune) =>
      rune.key === "enemy_attribute_mul" && (rune.difficultyMask === stageDifficulty || rune.difficultyMask === "ALL"),
  )?.blackboard;
  const atk_mul = rune?.find((bb) => bb.key === "atk")?.value || 1;
  const def_mul = rune?.find((bb) => bb.key === "def")?.value || 1;
  const hp_mul = rune?.find((bb) => bb.key === "max_hp")?.value || 1;

  const attributes = enemyData.attributes;
  return {
    id: enemyData.id,
    level: enemyData.level,
    name: parseDefinedData(enemyData.name),
    description: parseDefinedData(enemyData.description),
    attributes: {
      maxHp: parseDefinedData(attributes.maxHp) * hp_mul,
      atk: parseDefinedData(attributes.atk) * atk_mul,
      def: parseDefinedData(attributes.def) * def_mul,
      magicResistance: parseDefinedData(attributes.magicResistance),
      blockCnt: parseDefinedData(attributes.blockCnt),
      moveSpeed: parseDefinedData(attributes.moveSpeed),
      attackSpeed: parseDefinedData(attributes.attackSpeed),
      baseAttackTime: parseDefinedData(attributes.baseAttackTime),
      epDamageResistance: parseDefinedData(attributes.epDamageResistance),
      epResistance: parseDefinedData(attributes.epResistance),
    },
    levelType: parseDefinedData(enemyData.levelType),
    rangedRadius: enemyData.rangedRadius ? parseDefinedData(enemyData.rangedRadius) : 0,
  };
}

export function snakeToCamel(str: string) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToSnake(str: string) {
  return str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

export function relicAlterToBasic(str: string) {
  return str.split("_").slice(0, 5).join("_");
}
