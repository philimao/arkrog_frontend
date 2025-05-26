import type { RelicBuff } from "~/types/gameData";
import type { RelicWrapper } from "~/types/gameData";
import { ExpressionGroupNode, NumericLiteralNode } from "./ast";

/** 藏品分析结果 */
export interface IBuffContext {
  /** 不生效的藏品 */
  invalidRelics: RelicWrapper[];
  /** 藏品分类 */
  categories: {
    /** 藏品rune 加算 */
    relic_rune_add: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 藏品rune 乘算 */
    relic_rune_mul: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 直接加算 */
    global_buff_add: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 直接乘算 */
    global_buff_mul: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 最终加算 */
    global_buff_final_add: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 最终乘算 */
    global_buff_final_mul: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 全局Buff 堆叠 */
    global_buff_stack: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
    /** 战斗无关 */
    other: Array<{ buff: RelicBuff; relic: RelicWrapper }>;
  };
  /** 藏品rune 局外加算 */
  relic_rune_add: {
    /** 最大生命值 */
    max_hp: number;
    /** 攻击力 */
    atk: number;
    /** 攻击速度 */
    attack_speed: number;
    /** 防御力 */
    def: number;
    /** 部署费用 */
    cost: number;
    /** 每秒生命回复 */
    hp_recovery_per_sec: number;
    /** 最大生命值来源 */
    max_hp_source: ExpressionGroupNode;
    /** 攻击力来源 */
    atk_source: ExpressionGroupNode;
    /** 攻击速度来源 */
    attack_speed_source: Array<{ name: string; value: number; usage: string; buff?: RelicBuff; relic?: RelicWrapper }>;
    /** 防御力来源 */
    def_source: Array<{ name: string; value: number; usage: string; buff?: RelicBuff; relic?: RelicWrapper }>;
    /** 部署费用来源 */
    cost_source: Array<{ name: string; value: number; usage: string; buff?: RelicBuff; relic?: RelicWrapper }>;
    /** 每秒生命回复来源 */
    hp_recovery_per_sec_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
  };
  /** 藏品rune 局外乘算 */
  relic_rune_mul: {
    /** 攻击力(百分比) */
    atk: number;
    /** 防御力(百分比) */
    def: number;
    /** 最大生命值(百分比) */
    max_hp: number;
    /** 攻击力来源 */
    atk_source: ExpressionGroupNode;
    /** 防御力来源 */
    def_source: Array<{ name: string; value: number; usage: string; buff?: RelicBuff; relic?: RelicWrapper }>;
    /** 最大生命值来源 */
    max_hp_source: ExpressionGroupNode;
  };
  /** 局内Buff 直接加算 */
  in_game_buff_add: {
    /** 攻击力 */
    atk: number;
    /** 攻击速度 */
    attack_speed: number;
    /** 每秒技力回复 */
    sp_recovery_per_sec: number;
    /** 攻击力来源 */
    atk_source: ExpressionGroupNode;
    /** 攻击速度来源 */
    attack_speed_source: Array<{ name: string; value: number; usage: string; buff: RelicBuff; relic: RelicWrapper }>;
    /** 每秒技力回复来源 */
    sp_recovery_per_sec_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
  };
  /** 局内Buff 直接乘算 */
  in_game_buff_mul: {
    /** 攻击力 */
    atk: number;
    /** 攻击力来源 */
    atk_source: ExpressionGroupNode;
  };
  /** 局内Buff 最终加算 */
  in_game_buff_final_add: {
    /** 攻击力 */
    atk: number;
    /** 攻击力来源 */
    atk_source: ExpressionGroupNode;
  };
  /** 局内Buff 最终乘算 */
  in_game_buff_final_mul: {
    /** 攻击力 */
    atk: number;
    /** 敌人攻击力减少 */
    enemy_atk_down: number;
    /** 敌人防御力减少 */
    enemy_def_down: number;
    /** 敌人最大生命值减少 */
    enemy_max_hp_down: number;
    /** 敌人物理易伤 */
    enemy_damage_scale_phy: number;
    /** 敌人法术易伤 */
    enemy_damage_scale_mag: number;
    /** 敌人真实易伤 */
    enemy_damage_scale_pure: number;
    /** 敌人元素损伤 */
    enemy_damage_scale_ep: number;
    /** 敌人物理与法术减伤 */
    enemy_damage_resistance_inf: number;
    /** 攻击力来源 */
    atk_source: ExpressionGroupNode;
    /** 敌人攻击力减少来源 */
    enemy_atk_down_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 敌人防御力减少来源 */
    enemy_def_down_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 敌人最大生命值减少来源 */
    enemy_max_hp_down_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 敌人物理易伤来源 */
    enemy_damage_scale_phy_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 敌人法术易伤来源 */
    enemy_damage_scale_mag_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 敌人真实易伤来源 */
    enemy_damage_scale_pure_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 敌人元素损伤来源 */
    enemy_damage_scale_ep_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 敌人减伤来源 */
    enemy_damage_resistance_inf_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
  };
  /** 全局Buff 堆叠 */
  global_buff_stack: {
    /** 通用增伤 */
    damage_scale: number;
    /** 物理增伤 */
    damage_scale_phy: number;
    /** 法术增伤 */
    damage_scale_mag: number;
    /** 真实增伤 */
    damage_scale_pure: number;
    /** 物理增伤来源 */
    damage_scale_phy_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 法术增伤来源 */
    damage_scale_mag_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
    /** 真实增伤来源 */
    damage_scale_pure_source: Array<{
      name: string;
      value: number;
      usage: string;
      buff?: RelicBuff;
      relic?: RelicWrapper;
    }>;
  };
}

export class BuffContext implements IBuffContext {
  invalidRelics: RelicWrapper[] = [];
  categories: IBuffContext["categories"] = {
    relic_rune_add: [],
    relic_rune_mul: [],
    global_buff_add: [],
    global_buff_mul: [],
    global_buff_final_add: [],
    global_buff_final_mul: [],
    global_buff_stack: [],
    other: [],
  };
  relic_rune_add: IBuffContext["relic_rune_add"] = {
    max_hp: 0,
    max_hp_source: new ExpressionGroupNode("+", "局外直接加成"),
    atk: 0,
    atk_source: new ExpressionGroupNode("+", "局外直接加成"),
    attack_speed: 0,
    attack_speed_source: [],
    def: 0,
    def_source: [],
    cost: 0,
    cost_source: [],
    hp_recovery_per_sec: 0,
    hp_recovery_per_sec_source: [],
  };
  relic_rune_mul: IBuffContext["relic_rune_mul"] = {
    atk: 1,
    def: 1,
    max_hp: 1,
    atk_source: new ExpressionGroupNode("+", "局外乘算加成").addChild(new NumericLiteralNode(1, "基数")),
    def_source: [],
    max_hp_source: new ExpressionGroupNode("+", "局外乘算加成").addChild(new NumericLiteralNode(1, "基数")),
  };
  in_game_buff_add: IBuffContext["in_game_buff_add"] = {
    atk: 0,
    atk_source: new ExpressionGroupNode("+", "局内直接加成"),
    attack_speed: 0,
    attack_speed_source: [],
    sp_recovery_per_sec: 0,
    sp_recovery_per_sec_source: [],
  };
  in_game_buff_mul: IBuffContext["in_game_buff_mul"] = {
    atk: 1,
    atk_source: new ExpressionGroupNode("+", "局内直接加成").addChild(new NumericLiteralNode(1, "基数")),
  };
  in_game_buff_final_add: IBuffContext["in_game_buff_final_add"] = {
    atk: 0,
    atk_source: new ExpressionGroupNode("+", "局内最终加成"),
  };
  in_game_buff_final_mul: IBuffContext["in_game_buff_final_mul"] = {
    atk: 1,
    atk_source: new ExpressionGroupNode("+", "局内最终加成").addChild(new NumericLiteralNode(1, "基数")),
    enemy_atk_down: 1,
    enemy_atk_down_source: [],
    enemy_def_down: 1,
    enemy_def_down_source: [],
    enemy_damage_scale_phy: 1,
    enemy_damage_scale_phy_source: [],
    enemy_damage_scale_mag: 1,
    enemy_damage_scale_mag_source: [],
    enemy_damage_scale_pure: 1,
    enemy_damage_scale_pure_source: [],
    enemy_damage_scale_ep: 1,
    enemy_damage_scale_ep_source: [],
    enemy_max_hp_down: 1,
    enemy_max_hp_down_source: [],
    enemy_damage_resistance_inf: 1,
    enemy_damage_resistance_inf_source: [],
  };
  global_buff_stack: IBuffContext["global_buff_stack"] = {
    damage_scale: 1,
    damage_scale_phy: 1,
    damage_scale_mag: 1,
    damage_scale_mag_source: [],
    damage_scale_pure: 1,
    damage_scale_pure_source: [],
    damage_scale_phy_source: [],
  };
  constructor() {}

  /** 敌人攻击力减少 最终乘区 */
  mut_in_game_buff_final_mul_enemy_atk_down(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.in_game_buff_final_mul.enemy_atk_down *= value;
    this.in_game_buff_final_mul.enemy_atk_down_source.push({
      name: relic.name,
      value,
      usage: relic.usage,
      buff,
      relic,
    });
  }

  /** 敌人防御力减少 最终乘区 */
  mul_in_game_buff_final_mul_enemy_def_down(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.in_game_buff_final_mul.enemy_def_down *= value;
    this.in_game_buff_final_mul.enemy_def_down_source.push({
      name: relic.name,
      value,
      usage: relic.usage,
      buff,
      relic,
    });
  }

  /** 敌人最大生命值减少 最终乘区 */
  mul_in_game_buff_final_mul_enemy_max_hp_down(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.in_game_buff_final_mul.enemy_max_hp_down *= value;
    this.in_game_buff_final_mul.enemy_max_hp_down_source.push({
      name: relic.name,
      value,
      usage: relic.usage,
      buff,
      relic,
    });
  }

  /** 法术增伤 堆叠 */
  stack_global_buff_stack_damage_scale_mag(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.global_buff_stack.damage_scale_mag *= value;
    this.global_buff_stack.damage_scale_mag_source.push({
      name: relic.name,
      value,
      usage: relic.usage,
      buff,
      relic,
    });
  }

  /** 克隆 */
  clone() {
    const clone = new BuffContext();
    clone.invalidRelics = this.invalidRelics;
    clone.categories = this.categories;
    clone.relic_rune_add = { ...this.relic_rune_add };
    clone.relic_rune_mul = { ...this.relic_rune_mul };
    clone.in_game_buff_add = { ...this.in_game_buff_add };
    clone.in_game_buff_mul = { ...this.in_game_buff_mul };
    clone.in_game_buff_final_add = { ...this.in_game_buff_final_add };
    clone.in_game_buff_final_mul = { ...this.in_game_buff_final_mul };
    clone.global_buff_stack = { ...this.global_buff_stack };
    return clone;
  }
}
