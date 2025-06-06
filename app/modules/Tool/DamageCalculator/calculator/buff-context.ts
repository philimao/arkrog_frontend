import type { RelicBuff } from "~/types/gameData";
import type { RelicWrapper } from "~/types/gameData";
import { ExpressionGroupNode, NumericLiteralNode } from "./ast";

/** 藏品分析结果 */
export interface IBuffContext {
  /** 不生效的藏品 */
  invalidRelics: RelicWrapper[];
  /** 藏品rune 局外加算 */
  relic_rune_add: {
    /** 防御力 */
    def: number;
    /** 部署费用 */
    cost: number;
    /** 每秒生命回复 */
    hp_recovery_per_sec: number;
    /** 最大生命值 */
    max_hp: ExpressionGroupNode;
    /** 攻击力 */
    atk: ExpressionGroupNode;
    /** 攻击速度 */
    attack_speed: ExpressionGroupNode;
    /** 防御力来源 */
    def_source: ExpressionGroupNode;
    /** 部署费用来源 */
    cost_source: ExpressionGroupNode;
    /** 每秒生命回复来源 */
    hp_recovery_per_sec_source: ExpressionGroupNode;
  };
  /** 藏品rune 局外乘算 */
  relic_rune_mul: {
    /** 防御力(百分比) */
    def: number;
    /** 最大生命值(百分比) */
    max_hp: number;
    /** 攻击力(百分比) */
    atk: ExpressionGroupNode;
    /** 防御力来源 */
    def_source: ExpressionGroupNode;
    /** 最大生命值来源 */
    max_hp_source: ExpressionGroupNode;
  };
  /** 局内Buff 直接加算 */
  in_game_buff_add: {
    /** 攻击力 */
    atk: number;
    /** 每秒技力回复 */
    sp_recovery_per_sec: number;
    /** 攻击力来源 */
    atk_source: ExpressionGroupNode;
    /** 攻击速度 */
    attack_speed: ExpressionGroupNode;
    /** 每秒技力回复来源 */
    sp_recovery_per_sec_source: ExpressionGroupNode;
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
    /** 敌人攻击力增加 */
    enemy_atk_up: number;
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
    enemy_atk_down_source: ExpressionGroupNode;
    /** 敌人攻击力增加来源 */
    enemy_atk_up_source: ExpressionGroupNode;
    /** 敌人防御力减少来源 */
    enemy_def_down_source: ExpressionGroupNode;
    /** 敌人最大生命值减少来源 */
    enemy_max_hp_down_source: ExpressionGroupNode;
    /** 敌人物理易伤来源 */
    enemy_damage_scale_phy_source: ExpressionGroupNode;
    /** 敌人法术易伤来源 */
    enemy_damage_scale_mag_source: ExpressionGroupNode;
    /** 敌人真实易伤来源 */
    enemy_damage_scale_pure_source: ExpressionGroupNode;
    /** 敌人元素损伤来源 */
    enemy_damage_scale_ep_source: ExpressionGroupNode;
    /** 敌人减伤来源 */
    enemy_damage_resistance_inf_source: ExpressionGroupNode;
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
    damage_scale_phy_source: ExpressionGroupNode;
    /** 法术增伤来源 */
    damage_scale_mag_source: ExpressionGroupNode;
    /** 真实增伤来源 */
    damage_scale_pure_source: ExpressionGroupNode;
  };
}

export class BuffContext implements IBuffContext {
  invalidRelics: RelicWrapper[] = [];
  relic_rune_add: IBuffContext["relic_rune_add"] = {
    max_hp: new ExpressionGroupNode("+", "局外加算"),
    atk: new ExpressionGroupNode("+", "局外加算"),
    attack_speed: new ExpressionGroupNode("+", "局外加算"),
    def: 0,
    def_source: new ExpressionGroupNode("+", "局外加算"),
    cost: 0,
    cost_source: new ExpressionGroupNode("+", "局外加算"),
    hp_recovery_per_sec: 0,
    hp_recovery_per_sec_source: new ExpressionGroupNode("+", "局外加算"),
  };
  relic_rune_mul: IBuffContext["relic_rune_mul"] = {
    def: 1,
    max_hp: 1,
    atk: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    def_source: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    max_hp_source: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
  };
  in_game_buff_add: IBuffContext["in_game_buff_add"] = {
    atk: 0,
    atk_source: new ExpressionGroupNode("+", "局内直接加算"),
    attack_speed: new ExpressionGroupNode("+", "局内直接加算"),
    sp_recovery_per_sec: 0,
    sp_recovery_per_sec_source: new ExpressionGroupNode("+", "局内直接加算"),
  };
  in_game_buff_mul: IBuffContext["in_game_buff_mul"] = {
    atk: 1,
    atk_source: new ExpressionGroupNode("+", "局内直接乘算").addChild(new NumericLiteralNode(1, "基数")),
  };
  in_game_buff_final_add: IBuffContext["in_game_buff_final_add"] = {
    atk: 0,
    atk_source: new ExpressionGroupNode("+", "局内最终加算"),
  };
  in_game_buff_final_mul: IBuffContext["in_game_buff_final_mul"] = {
    atk: 1,
    atk_source: new ExpressionGroupNode("+", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_atk_down: 1,
    enemy_atk_down_source: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_atk_up: 1,
    enemy_atk_up_source: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_def_down: 1,
    enemy_def_down_source: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_scale_phy: 1,
    enemy_damage_scale_phy_source: new ExpressionGroupNode("+", "局内最终乘算").addChild(
      new NumericLiteralNode(1, "基数"),
    ),
    enemy_damage_scale_mag: 1,
    enemy_damage_scale_mag_source: new ExpressionGroupNode("+", "局内最终乘算").addChild(
      new NumericLiteralNode(1, "基数"),
    ),
    enemy_damage_scale_pure: 1,
    enemy_damage_scale_pure_source: new ExpressionGroupNode("+", "局内最终乘算").addChild(
      new NumericLiteralNode(1, "基数"),
    ),
    enemy_damage_scale_ep: 1,
    enemy_damage_scale_ep_source: new ExpressionGroupNode("*", "局内最终乘算").addChild(
      new NumericLiteralNode(1, "基数"),
    ),
    enemy_max_hp_down: 1,
    enemy_max_hp_down_source: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_resistance_inf: 1,
    enemy_damage_resistance_inf_source: new ExpressionGroupNode("*", "局内最终乘算").addChild(
      new NumericLiteralNode(1, "基数"),
    ),
  };
  global_buff_stack: IBuffContext["global_buff_stack"] = {
    damage_scale: 1,
    damage_scale_phy: 1,
    damage_scale_mag: 1,
    damage_scale_pure: 1,
    damage_scale_mag_source: new ExpressionGroupNode("*", "堆叠").addChild(new NumericLiteralNode(1, "基数")),
    damage_scale_pure_source: new ExpressionGroupNode("*", "堆叠").addChild(new NumericLiteralNode(1, "基数")),
    damage_scale_phy_source: new ExpressionGroupNode("*", "堆叠").addChild(new NumericLiteralNode(1, "基数")),
  };
  constructor() {}

  /** 敌人攻击力减少 最终乘区 */
  mut_in_game_buff_final_mul_enemy_atk_down(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.in_game_buff_final_mul.enemy_atk_down *= value;
    this.in_game_buff_final_mul.enemy_atk_down_source.addChild(new NumericLiteralNode(value, relic.name));
  }

  /** 敌人攻击力增加 最终乘区 */
  mut_in_game_buff_final_mul_enemy_atk_up(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.in_game_buff_final_mul.enemy_atk_up *= value;
    this.in_game_buff_final_mul.enemy_atk_up_source.addChild(new NumericLiteralNode(value, relic.name));
  }

  /** 敌人防御力减少 最终乘区 */
  mul_in_game_buff_final_mul_enemy_def_down(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.in_game_buff_final_mul.enemy_def_down *= value;
    this.in_game_buff_final_mul.enemy_def_down_source.addChild(new NumericLiteralNode(value, relic.name));
  }

  /** 敌人最大生命值减少 最终乘区 */
  mul_in_game_buff_final_mul_enemy_max_hp_down(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.in_game_buff_final_mul.enemy_max_hp_down *= value;
    this.in_game_buff_final_mul.enemy_max_hp_down_source.addChild(new NumericLiteralNode(value, relic.name));
  }

  /** 法术增伤 堆叠 */
  stack_global_buff_stack_damage_scale_mag(value: number, buff: RelicBuff, relic: RelicWrapper) {
    this.global_buff_stack.damage_scale_mag *= value;
    this.global_buff_stack.damage_scale_mag_source.addChild(new NumericLiteralNode(value, relic.name));
  }

  /** 克隆 */
  clone() {
    const clone = new BuffContext();
    clone.invalidRelics = this.invalidRelics;
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
