import type { RelicWrapper } from "~/types/gameData";
import { ExpressionGroupNode, NumericLiteralNode } from "./ast";

/** 藏品分析结果 */
export interface IBuffContext {
  /** 不生效的藏品 */
  invalidRelics: RelicWrapper[];
  /** 干员养成、藏品rune 局外加算 */
  relic_rune_add: {
    /** 最大生命值 */
    max_hp: ExpressionGroupNode;
    /** 攻击力 */
    atk: ExpressionGroupNode;
    /** 攻击速度 */
    attack_speed: ExpressionGroupNode;
    /** 防御力 */
    def: ExpressionGroupNode;
    /** 部署费用 */
    cost: ExpressionGroupNode;
    /** 每秒生命回复 */
    hp_recovery_per_sec: ExpressionGroupNode;
    /** 再部署时间 */
    respawn_time: ExpressionGroupNode;
  };
  /** 藏品rune 局外乘算 */
  relic_rune_mul: {
    /** 攻击力(百分比) */
    atk: ExpressionGroupNode;
    /** 防御力(百分比) */
    def: ExpressionGroupNode;
    /** 最大生命值(百分比) */
    max_hp: ExpressionGroupNode;
    /** 敌人局外减伤（难度加成，5结局蛋） */
    enemy_damage_resistance: ExpressionGroupNode;
    /** 再部署时间 */
    respawn_time: ExpressionGroupNode;
  };
  /** 局内Buff 直接加算 */
  in_game_buff_add: {
    /** 攻击力 */
    atk: ExpressionGroupNode;
    /** 攻击速度 */
    attack_speed: ExpressionGroupNode;
    /** 每秒技力回复 */
    sp_recovery_per_sec: ExpressionGroupNode;
  };
  /** 局内Buff 直接乘算 */
  in_game_buff_mul: {
    /** 攻击力来源 */
    atk: ExpressionGroupNode;
  };
  /** 局内Buff 最终加算 */
  in_game_buff_final_add: {
    /** 攻击力来源 */
    atk: ExpressionGroupNode;
  };
  /** 局内Buff 最终乘算 */
  in_game_buff_final_mul: {
    /** 攻击力来源 */
    atk: ExpressionGroupNode;
    /** 敌人攻击力改变来源 */
    enemy_atk: ExpressionGroupNode;
    /** 敌人防御力减少来源 */
    enemy_def: ExpressionGroupNode;
    /** 敌人最大生命值减少来源 */
    enemy_max_hp: ExpressionGroupNode;
    /** 敌人物理易伤来源 */
    enemy_damage_scale_phy: ExpressionGroupNode;
    /** 敌人法术易伤来源 */
    enemy_damage_scale_mag: ExpressionGroupNode;
    /** 敌人真实易伤来源 */
    enemy_damage_scale_pure: ExpressionGroupNode;
    /** 敌人元素损伤来源 */
    enemy_damage_scale_ep: ExpressionGroupNode;
    /** 敌人局内减伤（大特、年代） */
    enemy_damage_resistance: ExpressionGroupNode;
  };
  /** 全局Buff 堆叠 */
  global_buff_stack: {
    /** 通用增伤 */
    damage_scale: ExpressionGroupNode;
    /** 物理增伤来源 */
    damage_scale_phy: ExpressionGroupNode;
    /** 法术增伤来源 */
    damage_scale_mag: ExpressionGroupNode;
    /** 真实增伤来源 */
    damage_scale_pure: ExpressionGroupNode;
  };
}

export class BuffContext implements IBuffContext {
  invalidRelics: RelicWrapper[] = [];
  relic_rune_add: IBuffContext["relic_rune_add"] = {
    max_hp: new ExpressionGroupNode("+", "局外加算"),
    atk: new ExpressionGroupNode("+", "局外加算"),
    attack_speed: new ExpressionGroupNode("+", "局外加算"),
    def: new ExpressionGroupNode("+", "局外加算"),
    cost: new ExpressionGroupNode("+", "局外加算"),
    hp_recovery_per_sec: new ExpressionGroupNode("+", "局外加算"),
    respawn_time: new ExpressionGroupNode("+", "局外加算"),
  };
  relic_rune_mul: IBuffContext["relic_rune_mul"] = {
    atk: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    def: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    max_hp: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    respawn_time: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_resistance: new ExpressionGroupNode("max", "局外最大值").addChild(new NumericLiteralNode(0, "基数")),
  };
  in_game_buff_add: IBuffContext["in_game_buff_add"] = {
    atk: new ExpressionGroupNode("+", "局内直接加算"),
    attack_speed: new ExpressionGroupNode("+", "局内直接加算"),
    sp_recovery_per_sec: new ExpressionGroupNode("+", "局内直接加算"),
  };
  in_game_buff_mul: IBuffContext["in_game_buff_mul"] = {
    atk: new ExpressionGroupNode("+", "局内直接乘算").addChild(new NumericLiteralNode(1, "基数")),
  };
  in_game_buff_final_add: IBuffContext["in_game_buff_final_add"] = {
    atk: new ExpressionGroupNode("+", "局内最终加算"),
  };
  in_game_buff_final_mul: IBuffContext["in_game_buff_final_mul"] = {
    atk: new ExpressionGroupNode("+", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_atk: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_def: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_max_hp: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_scale_phy: new ExpressionGroupNode("+", "敌人物理易伤").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_scale_mag: new ExpressionGroupNode("+", "敌人法术易伤").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_scale_pure: new ExpressionGroupNode("+", "敌人真伤易伤").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_scale_ep: new ExpressionGroupNode("*", "敌人元素损伤").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_resistance: new ExpressionGroupNode("union", "局内取并集乘算").addChild(
      new NumericLiteralNode(0, "基数"),
    ),
  };
  global_buff_stack: IBuffContext["global_buff_stack"] = {
    damage_scale: new ExpressionGroupNode("*", "堆叠").addChild(new NumericLiteralNode(1, "基数")),
    damage_scale_mag: new ExpressionGroupNode("*", "堆叠").addChild(new NumericLiteralNode(1, "基数")),
    damage_scale_pure: new ExpressionGroupNode("*", "堆叠").addChild(new NumericLiteralNode(1, "基数")),
    damage_scale_phy: new ExpressionGroupNode("*", "堆叠").addChild(new NumericLiteralNode(1, "基数")),
  };
  constructor() {}

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
