import { type CalculatorInput } from "~/types/gameData";
import { BuffContext } from "./buff-context";
import { ExpressionGroupNode, NumericLiteralNode } from "./ast";

/**
 * 公式工具
 */
export class ExpressionUtil {
  constructor(
    public input: CalculatorInput,
    public context: BuffContext,
  ) {}

  /** 干员局内攻击力 */
  operator_in_game_atk() {
    // 获取精英化等级属性
    const { context, input } = this;
    const attribute = input.charInput.phase?.attributesKeyFrames[input.charInput.level].data; // TODO 去掉?
    const baseAtk = attribute?.atk ?? 0;

    const outAtkExpression = new ExpressionGroupNode("*", "局外攻击力")
      .addChild(
        new ExpressionGroupNode("+", "局外加成")
          .addChild(new NumericLiteralNode(baseAtk, "基础攻击力"))
          .addChild(...context.relic_rune_add.atk.children),
      )
      .addChild(context.relic_rune_mul.atk);

    const atk = new ExpressionGroupNode("*", "直接乘算")
      .addChild(
        new ExpressionGroupNode("+", "直接加算")
          .addChild(outAtkExpression)
          .addChild(...context.in_game_buff_add.atk.children),
      )
      .addChild(context.in_game_buff_mul.atk);

    return new ExpressionGroupNode("*", "最终乘算")
      .addChild(
        new ExpressionGroupNode("+", "最终加算").addChild(atk).addChild(...context.in_game_buff_final_add.atk.children),
      )
      .addChild(...context.in_game_buff_final_mul.atk.children);
  }

  /** 敌人局内防御力 */
  enemy_in_game_def() {
    return new ExpressionGroupNode("*", "最终乘算")
      .addChild(new NumericLiteralNode(this.input.enemyInput.attributes.def, "局外防御力"))
      .addChild(...this.context.in_game_buff_final_mul.enemy_def_down.children);
  }

  /** 敌人法术抗性 */
  // enemy_in_game_magic_resistance() {
  //   return new ExpressionGroupNode("*", "最终乘算")
  //     .addChild(new NumericLiteralNode(this.input.enemyInput.attributes.def, "局外防御力"))
  //     .addChild(...this.context.in_game_buff_final_mul.enemy_def_down_source.children);
  // }
}
