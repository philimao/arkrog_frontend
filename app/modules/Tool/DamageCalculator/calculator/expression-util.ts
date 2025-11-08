import { type CalculatorInput, type EnemyInput } from "~/types/gameData";
import { BuffContext } from "./buff-context";
import { ExpressionGroupNode, NumericLiteralNode } from "./ast";
import type { CharInput } from "~/stores/damageCalculator/calcTypes";
import { allowedBlackboardKeyMap, snakeToCamel } from "../utils";

const common_out_game_expression = (input: { charInput: CharInput; context: BuffContext }, key: string) => {
  const baseValue = (input.charInput.phase.attributesKeyFrames[input.charInput.frameIndex].data[
    snakeToCamel(key) as never
  ] ?? 0) as number;
  let expression;
  if (input.context.relic_rune_add[key as keyof typeof input.context.relic_rune_add]) {
    expression = new ExpressionGroupNode("*", "局外" + allowedBlackboardKeyMap[key]).addChild(
      new ExpressionGroupNode("+", "局外加成")
        .addChild(new NumericLiteralNode(baseValue, "基础" + allowedBlackboardKeyMap[key]))
        .addChild(...input.context.relic_rune_add[key as keyof typeof input.context.relic_rune_add].children),
    );
  } else {
    expression = new ExpressionGroupNode("*", "局外" + allowedBlackboardKeyMap[key]).addChild(
      new NumericLiteralNode(baseValue, "基础" + allowedBlackboardKeyMap[key]),
    );
  }
  if (input.context.relic_rune_mul[key as keyof typeof input.context.relic_rune_mul]) {
    expression.addChild(input.context.relic_rune_mul[key as keyof typeof input.context.relic_rune_mul]);
  }
  return expression;
};

const common_in_game_expression = (input: { charInput: CharInput; context: BuffContext }, key: string) => {
  let expression = new ExpressionGroupNode("*", "直接加算&直接乘算");
  if (input.context.in_game_buff_add[key as keyof typeof input.context.in_game_buff_add]) {
    // console.log(
    //   "in_game_buff_add",
    //   key,
    //   input.context.in_game_buff_add[key as keyof typeof input.context.in_game_buff_add].calculate(),
    // );
    expression = expression.addChild(
      new ExpressionGroupNode("+", "直接加算")
        .addChild(common_out_game_expression(input, key)) // 没做取整 TODO
        .addChild(input.context.in_game_buff_add[key as keyof typeof input.context.in_game_buff_add]),
    );
  } else {
    expression = expression.addChild(common_out_game_expression(input, key));
  }
  if (input.context.in_game_buff_mul[key as keyof typeof input.context.in_game_buff_mul]) {
    // console.log(
    //   "in_game_buff_mul",
    //   key,
    //   input.context.in_game_buff_mul[key as keyof typeof input.context.in_game_buff_mul].calculate(),
    // );
    expression = expression.addChild(
      input.context.in_game_buff_mul[key as keyof typeof input.context.in_game_buff_mul],
    );
  }
  let expressFinal = new ExpressionGroupNode("*", "最终加算&最终乘算");
  if (input.context.in_game_buff_final_add[key as keyof typeof input.context.in_game_buff_final_add]) {
    // console.log(
    //   "in_game_buff_final_add",
    //   key,
    //   input.context.in_game_buff_final_add[key as keyof typeof input.context.in_game_buff_final_add].calculate(),
    // );
    expressFinal = expressFinal.addChild(
      new ExpressionGroupNode("+", "最终加算")
        .addChild(expression)
        .addChild(input.context.in_game_buff_final_add[key as keyof typeof input.context.in_game_buff_final_add]),
    );
  } else {
    expressFinal = expressFinal.addChild(expression);
  }
  if (input.context.in_game_buff_final_mul[key as keyof typeof input.context.in_game_buff_final_mul]) {
    // console.log(
    //   "in_game_buff_final_mul",
    //   key,
    //   input.context.in_game_buff_final_mul[key as keyof typeof input.context.in_game_buff_final_mul].calculate(),
    // );
    expressFinal = expressFinal.addChild(
      input.context.in_game_buff_final_mul[key as keyof typeof input.context.in_game_buff_final_mul],
    );
  }
  return expressFinal;
};

/**
 * 通用敌方属性计算
 * @param input 敌方基础数据和上下文
 * @param key 属性键名，例如 max_hp
 * @returns 敌方属性表达式
 */
const common_enemy_expression = (input: { enemyBase: EnemyInput; context: BuffContext }, key: string) => {
  const baseValue = (input.enemyBase.attributes[snakeToCamel(key) as never] ?? 0) as number;
  const buffKey = "enemy_" + key;
  let expression;
  if (input.context.stage_rune_mul[buffKey as keyof typeof input.context.stage_rune_mul]) {
    expression = new ExpressionGroupNode("*", "本关" + allowedBlackboardKeyMap[key]).addChild(
      new ExpressionGroupNode("+", "本关加成")
        .addChild(new NumericLiteralNode(baseValue, "基础" + allowedBlackboardKeyMap[key]))
        .addChild(...input.context.stage_rune_mul[buffKey as keyof typeof input.context.stage_rune_mul].children),
    );
  } else {
    expression = new ExpressionGroupNode("*", "本关" + allowedBlackboardKeyMap[key]).addChild(
      new NumericLiteralNode(baseValue, "基础" + allowedBlackboardKeyMap[key]),
    );
  }
  if (input.context.relic_rune_add[buffKey as keyof typeof input.context.relic_rune_add]) {
    expression = new ExpressionGroupNode("*", "局外" + allowedBlackboardKeyMap[key]).addChild(
      new ExpressionGroupNode("+", "局外加成")
        .addChild(new NumericLiteralNode(baseValue, "基础" + allowedBlackboardKeyMap[key]))
        .addChild(...input.context.relic_rune_add[key as keyof typeof input.context.relic_rune_add].children),
    );
  } else {
    expression = new ExpressionGroupNode("*", "局外" + allowedBlackboardKeyMap[key]).addChild(
      new NumericLiteralNode(baseValue, "基础" + allowedBlackboardKeyMap[key]),
    );
  }
  if (input.context.relic_rune_mul[buffKey as keyof typeof input.context.relic_rune_mul]) {
    expression.addChild(input.context.relic_rune_mul[buffKey as keyof typeof input.context.relic_rune_mul]);
  }

  const outGameExpression = expression;

  // TODO 敌方天赋、技能可能导致局内属性变化
  expression = new ExpressionGroupNode("*", "直接加算&直接乘算");

  if (input.context.in_game_buff_add[buffKey as keyof typeof input.context.in_game_buff_add]) {
    expression = expression.addChild(
      new ExpressionGroupNode("+", "直接加算")
        .addChild(outGameExpression) // 没做取整 TODO
        .addChild(input.context.in_game_buff_add[buffKey as keyof typeof input.context.in_game_buff_add]),
    );
  } else {
    expression = expression.addChild(outGameExpression);
  }

  if (input.context.in_game_buff_mul[buffKey as keyof typeof input.context.in_game_buff_mul]) {
    expression = expression.addChild(
      input.context.in_game_buff_mul[buffKey as keyof typeof input.context.in_game_buff_mul],
    );
  }
  let expressFinal = new ExpressionGroupNode("*", "最终加算&最终乘算");
  if (input.context.in_game_buff_final_add[buffKey as keyof typeof input.context.in_game_buff_final_add]) {
    expressFinal = expressFinal.addChild(
      new ExpressionGroupNode("+", "最终加算")
        .addChild(expression)
        .addChild(input.context.in_game_buff_final_add[buffKey as keyof typeof input.context.in_game_buff_final_add]),
    );
  } else {
    expressFinal = expressFinal.addChild(expression);
  }
  if (input.context.in_game_buff_final_mul[buffKey as keyof typeof input.context.in_game_buff_final_mul]) {
    expressFinal = expressFinal.addChild(
      input.context.in_game_buff_final_mul[buffKey as keyof typeof input.context.in_game_buff_final_mul],
    );
  }
  return expressFinal;
};

/**
 * 公式工具
 * 通过ExpressionGroupNode类构建结构化的表达式树，即用嵌套的树对象来存储算式表达式。
 * ExpressionGroupNode可以用来计算结果值，并交给Display组件来进行渲染表达式
 * 该文件也统一管理干员所有基础属性计算方式
 */
export class ExpressionUtil {
  constructor(
    public input: CalculatorInput,
    public context: BuffContext,
  ) {}

  /** 最大生命值 - 局外 干员最大生命值 */
  static operator_out_game_max_hp(input: { charInput: CharInput; context: BuffContext }) {
    // // 获取精英化等级属性
    // const attribute = input.charInput.phase?.attributesKeyFrames[input.charInput.frameIndex].data; // TODO 去掉?
    // const baseMaxHp = attribute?.maxHp ?? 0;

    // return new ExpressionGroupNode("*", "局外最大生命值")
    //   .addChild(
    //     new ExpressionGroupNode("+", "局外加成")
    //       .addChild(new NumericLiteralNode(baseMaxHp, "基础最大生命值"))
    //       .addChild(...input.context.relic_rune_add.max_hp.children),
    //   )
    //   .addChild(input.context.relic_rune_mul.max_hp);

    return common_out_game_expression(input, "max_hp");
  }

  /** 最大生命值 - 局内 干员最大生命值 */
  static operator_in_game_max_hp(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "max_hp");
  }

  /** 最大生命值 - 技能 干员最大生命值 */
  static operator_skill_max_hp(input: { charInput: CharInput; context: BuffContext }) {
    // 与上面的区别应该在context
    return common_in_game_expression(input, "max_hp");
  }

  /** 攻击力 - 局外 干员攻击力 */
  static operator_out_game_atk(input: { charInput: CharInput; context: BuffContext }) {
    return common_out_game_expression(input, "atk");
  }

  /** 攻击力 - 局内 干员攻击力 */
  static operator_in_game_atk(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "atk");
  }

  /** 防御力 - 局外 干员防御力 */
  static operator_out_game_def(input: { charInput: CharInput; context: BuffContext }) {
    return common_out_game_expression(input, "def");
  }

  /** 防御力 - 局内 干员防御力 */
  static operator_in_game_def(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "def");
  }

  /** 法术抗性 - 局外 干员法术抗性 */
  static operator_out_game_magic_resistance(input: { charInput: CharInput; context: BuffContext }) {
    return common_out_game_expression(input, "magic_resistance");
  }

  /** 法术抗性 - 局内 干员法术抗性 */
  static operator_in_game_magic_resistance(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "magic_resistance");
  }

  /** 部署费用 - 局外 干员部署费用 */
  static operator_out_game_cost(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "cost");
  }

  /** 阻挡数 - 局内 干员阻挡数 */
  static operator_in_game_block_cnt(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "block_cnt");
  }

  /** 攻击速度 - 局外 干员攻击速度 */
  static operator_out_game_attack_speed(input: { charInput: CharInput; context: BuffContext }) {
    return common_out_game_expression(input, "attack_speed");
  }

  /** 攻击速度 - 局内 干员攻击速度 */
  static operator_in_game_attack_speed(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "attack_speed");
  }

  /** 攻击间隔 - 局外 干员攻击间隔 */
  static operator_out_game_base_attack_time(input: { charInput: CharInput; context: BuffContext }) {
    return common_out_game_expression(input, "base_attack_time");
  }

  /** 攻击间隔 - 局内 干员攻击间隔 */
  static operator_in_game_base_attack_time(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "base_attack_time");
  }

  /** 再部署 - 局外 干员再部署 */
  static operator_out_game_respawn_time(input: { charInput: CharInput; context: BuffContext }) {
    return common_out_game_expression(input, "respawn_time");
  }

  /** 再部署 - 局内 干员再部署 */
  static operator_in_game_respawn_time(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "respawn_time");
  }

  /** 每秒生命回复 - 局外 干员每秒生命回复 */
  static operator_out_game_hp_recovery_per_sec(input: { charInput: CharInput; context: BuffContext }) {
    const attribute = input.charInput.phase?.attributesKeyFrames[input.charInput.frameIndex].data; // TODO 去掉?
    const baseHpRecoveryPerSec = attribute?.hpRecoveryPerSec ?? 0;

    return new ExpressionGroupNode("+", "每秒生命回复")
      .addChild(new NumericLiteralNode(baseHpRecoveryPerSec, "基础每秒生命回复"))
      .addChild(...input.context.relic_rune_add.hp_recovery_per_sec.children);
  }

  /** 每秒技力回复 - 局外 干员每秒技力回复 */
  static operator_out_game_sp_recovery_per_sec(input: { charInput: CharInput; context: BuffContext }) {
    const attribute = input.charInput.phase?.attributesKeyFrames[input.charInput.frameIndex].data; // TODO 去掉?
    const baseSpRecoveryPerSec = attribute?.spRecoveryPerSec ?? 0;

    return new ExpressionGroupNode("+", "每秒技力回复").addChild(
      new NumericLiteralNode(baseSpRecoveryPerSec, "基础每秒技力回复"),
    );
  }

  /** 伤害倍率 - 局外 干员伤害倍率 */
  static operator_out_game_damage_scale(input: { charInput: CharInput; context: BuffContext }) {
    return common_out_game_expression(input, "damage_scale");
  }

  /** 伤害倍率 - 局内 干员伤害倍率 */
  static operator_in_game_damage_scale(input: { charInput: CharInput; context: BuffContext }) {
    return common_in_game_expression(input, "damage_scale");
  }

  /** 敌人最终攻击力 */
  static enemy_final_atk(input: { enemyBase: EnemyInput; context: BuffContext }) {
    // (基础属性 * 关卡rune) * (藏品rune + 藏品rune) * 最终乘算 * 最终乘算
    return common_enemy_expression(input, "atk");
  }

  /** 敌人最终防御力 */
  static enemy_final_def(input: { enemyBase: EnemyInput; context: BuffContext }) {
    return common_enemy_expression(input, "def");
  }

  /** 敌人最终生命值 */
  static enemy_final_max_hp(input: { enemyBase: EnemyInput; context: BuffContext }) {
    return common_enemy_expression(input, "max_hp");
  }

  /** 敌人最终法术抗性 */
  static enemy_final_magic_resistance(input: { enemyBase: EnemyInput; context: BuffContext }) {
    return common_enemy_expression(input, "magic_resistance");
  }

  /** 敌人最终元素损伤抗性 */
  static enemy_final_ep_resistance(input: { enemyBase: EnemyInput; context: BuffContext }) {
    const expression = new ExpressionGroupNode("*", "敌人元素损伤抗性");
    expression.addChild(new NumericLiteralNode(input.enemyBase.attributes.epResistance, "基础"));
    return expression;
  }

  /** 敌人最终元素伤害抗性 */
  static enemy_final_ep_damage_resistance(input: { enemyBase: EnemyInput; context: BuffContext }) {
    const expression = new ExpressionGroupNode("*", "敌人元素伤害抗性");
    expression.addChild(new NumericLiteralNode(input.enemyBase.attributes.epDamageResistance, "基础"));
    return expression;
  }

  /** 敌人物理法术减伤 */
  static enemy_final_physical_magic_resistance(input: { enemyBase: EnemyInput; context: BuffContext }) {
    const expression = new ExpressionGroupNode("-", "敌人物理法术减伤");

    // 关卡rune
    expression
      .addChild(new NumericLiteralNode(1, "基数"))
      .addChild(
        new ExpressionGroupNode("*", "减伤计算")
          .addChild(
            new ExpressionGroupNode("-", "局外减伤")
              .addChild(new NumericLiteralNode(1, "基数"))
              .addChild(input.context.relic_rune_mul.enemy_damage_resistance),
          )
          .addChild(
            new ExpressionGroupNode("-", "局内减伤")
              .addChild(new NumericLiteralNode(1, "基数"))
              .addChild(input.context.in_game_buff_final_mul.enemy_damage_resistance),
          ),
      );

    return expression;
  }
}
