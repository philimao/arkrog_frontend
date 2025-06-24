import type { RelicDataExt } from "~/types/gameData";
import { ExpressionGroupNode, NumericLiteralNode } from "./ast";

/** 藏品分析结果 */
export interface IBuffContext {
  /** 不生效的藏品 */
  invalidRelics: RelicDataExt[];
  stage_rune_mul: {
    /** 敌人攻击力改变来源 */
    enemy_atk: ExpressionGroupNode;
    /** 敌人防御力减少来源 */
    enemy_def: ExpressionGroupNode;
    /** 敌人最大生命值减少来源 */
    enemy_max_hp: ExpressionGroupNode;
  };
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
    /** 敌人攻击力改变来源 */
    enemy_atk: ExpressionGroupNode;
    /** 敌人防御力减少来源 */
    enemy_def: ExpressionGroupNode;
    /** 敌人最大生命值减少来源 */
    enemy_max_hp: ExpressionGroupNode;
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
    /** 敌人法术抗性 */
    enemy_magic_resistance: ExpressionGroupNode;
  };
  /** 局内Buff 直接乘算 */
  in_game_buff_mul: {
    /** 攻击力 */
    atk: ExpressionGroupNode;
    /** 最大生命值 */
    max_hp: ExpressionGroupNode;
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
    /** 敌人法术抗性来源 */
    enemy_magic_resistance: ExpressionGroupNode;
    /** 敌人元素损伤抗性 */
    enemy_ep_resistance: ExpressionGroupNode;
    /** 敌人元素伤害抗性 */
    enemy_ep_damage_resistance: ExpressionGroupNode;
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
  invalidRelics: RelicDataExt[] = [];
  stage_rune_mul: IBuffContext["stage_rune_mul"] = {
    enemy_atk: new ExpressionGroupNode("*", "关卡加成").addChild(new NumericLiteralNode(1, "基数")),
    enemy_def: new ExpressionGroupNode("*", "关卡加成").addChild(new NumericLiteralNode(1, "基数")),
    enemy_max_hp: new ExpressionGroupNode("*", "关卡加成").addChild(new NumericLiteralNode(1, "基数")),
  };
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
    enemy_atk: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_def: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_max_hp: new ExpressionGroupNode("+", "局外乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_damage_resistance: new ExpressionGroupNode("max", "局外最大值").addChild(new NumericLiteralNode(0, "基数")),
  };
  in_game_buff_add: IBuffContext["in_game_buff_add"] = {
    atk: new ExpressionGroupNode("+", "局内直接加算"),
    attack_speed: new ExpressionGroupNode("+", "局内直接加算"),
    sp_recovery_per_sec: new ExpressionGroupNode("+", "局内直接加算"),
    enemy_magic_resistance: new ExpressionGroupNode("+", "局内直接加算").addChild(new NumericLiteralNode(0, "基数")),
  };
  in_game_buff_mul: IBuffContext["in_game_buff_mul"] = {
    atk: new ExpressionGroupNode("+", "局内直接乘算").addChild(new NumericLiteralNode(1, "基数")),
    max_hp: new ExpressionGroupNode("+", "局内直接乘算").addChild(new NumericLiteralNode(1, "基数")),
  };
  in_game_buff_final_add: IBuffContext["in_game_buff_final_add"] = {
    atk: new ExpressionGroupNode("+", "局内最终加算"),
  };
  in_game_buff_final_mul: IBuffContext["in_game_buff_final_mul"] = {
    atk: new ExpressionGroupNode("+", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_atk: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_def: new ExpressionGroupNode("+", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_max_hp: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_magic_resistance: new ExpressionGroupNode("+", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_ep_resistance: new ExpressionGroupNode("*", "局内最终乘算").addChild(new NumericLiteralNode(1, "基数")),
    enemy_ep_damage_resistance: new ExpressionGroupNode("*", "局内最终乘算").addChild(
      new NumericLiteralNode(1, "基数"),
    ),
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

    // 深度克隆 invalidRelics 数组
    clone.invalidRelics = [...this.invalidRelics];

    // 深度克隆 stage_rune_mul
    clone.stage_rune_mul = {
      enemy_atk: this.stage_rune_mul.enemy_atk.clone(),
      enemy_def: this.stage_rune_mul.enemy_def.clone(),
      enemy_max_hp: this.stage_rune_mul.enemy_max_hp.clone(),
    };

    // 深度克隆 relic_rune_add
    clone.relic_rune_add = {
      max_hp: this.relic_rune_add.max_hp.clone(),
      atk: this.relic_rune_add.atk.clone(),
      attack_speed: this.relic_rune_add.attack_speed.clone(),
      def: this.relic_rune_add.def.clone(),
      cost: this.relic_rune_add.cost.clone(),
      hp_recovery_per_sec: this.relic_rune_add.hp_recovery_per_sec.clone(),
      respawn_time: this.relic_rune_add.respawn_time.clone(),
    };

    // 深度克隆 relic_rune_mul
    clone.relic_rune_mul = {
      atk: this.relic_rune_mul.atk.clone(),
      def: this.relic_rune_mul.def.clone(),
      max_hp: this.relic_rune_mul.max_hp.clone(),
      respawn_time: this.relic_rune_mul.respawn_time.clone(),
      enemy_atk: this.relic_rune_mul.enemy_atk.clone(),
      enemy_def: this.relic_rune_mul.enemy_def.clone(),
      enemy_max_hp: this.relic_rune_mul.enemy_max_hp.clone(),
      enemy_damage_resistance: this.relic_rune_mul.enemy_damage_resistance.clone(),
    };

    // 深度克隆 in_game_buff_add
    clone.in_game_buff_add = {
      atk: this.in_game_buff_add.atk.clone(),
      attack_speed: this.in_game_buff_add.attack_speed.clone(),
      sp_recovery_per_sec: this.in_game_buff_add.sp_recovery_per_sec.clone(),
      enemy_magic_resistance: this.in_game_buff_add.enemy_magic_resistance.clone(),
    };

    // 深度克隆 in_game_buff_mul
    clone.in_game_buff_mul = {
      atk: this.in_game_buff_mul.atk.clone(),
      max_hp: this.in_game_buff_mul.max_hp.clone(),
    };

    // 深度克隆 in_game_buff_final_add
    clone.in_game_buff_final_add = {
      atk: this.in_game_buff_final_add.atk.clone(),
    };

    // 深度克隆 in_game_buff_final_mul
    clone.in_game_buff_final_mul = {
      atk: this.in_game_buff_final_mul.atk.clone(),
      enemy_atk: this.in_game_buff_final_mul.enemy_atk.clone(),
      enemy_def: this.in_game_buff_final_mul.enemy_def.clone(),
      enemy_max_hp: this.in_game_buff_final_mul.enemy_max_hp.clone(),
      enemy_magic_resistance: this.in_game_buff_final_mul.enemy_magic_resistance.clone(),
      enemy_ep_resistance: this.in_game_buff_final_mul.enemy_ep_resistance.clone(),
      enemy_ep_damage_resistance: this.in_game_buff_final_mul.enemy_ep_damage_resistance.clone(),
      enemy_damage_scale_phy: this.in_game_buff_final_mul.enemy_damage_scale_phy.clone(),
      enemy_damage_scale_mag: this.in_game_buff_final_mul.enemy_damage_scale_mag.clone(),
      enemy_damage_scale_pure: this.in_game_buff_final_mul.enemy_damage_scale_pure.clone(),
      enemy_damage_scale_ep: this.in_game_buff_final_mul.enemy_damage_scale_ep.clone(),
      enemy_damage_resistance: this.in_game_buff_final_mul.enemy_damage_resistance.clone(),
    };

    // 深度克隆 global_buff_stack
    clone.global_buff_stack = {
      damage_scale: this.global_buff_stack.damage_scale.clone(),
      damage_scale_mag: this.global_buff_stack.damage_scale_mag.clone(),
      damage_scale_pure: this.global_buff_stack.damage_scale_pure.clone(),
      damage_scale_phy: this.global_buff_stack.damage_scale_phy.clone(),
    };

    return clone;
  }
}
