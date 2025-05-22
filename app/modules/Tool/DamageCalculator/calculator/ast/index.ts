/** 提供一个计算公式AST结构树(显性化计算公共部分) */
export type ASTNode = NumberNode | ExpressionNode | ExpressionGroupNode;

export interface BaseNode {
  /** 节点类型 */
  type: "number" | "expression" | "expression-group";
  /** 节点提示 */
  tooltip: string;
  /** 节点值 */
  value: number;
}

export interface NumberNode extends BaseNode {
  type: "number";
  value: number;
}

export interface ExpressionNode extends BaseNode {
  type: "expression";
  operator: "+" | "-" | "*" | "/";
  left: BaseNode;
  right: BaseNode;
}

export interface ExpressionGroupNode extends BaseNode {
  type: "expression-group";
  operator: "+" | "*";
  children: BaseNode[];
}

const mock: ASTNode = {
  type: "expression-group",
  operator: "*",
  tooltip: "养成",
  children: [
    {
      type: "expression-group",
      operator: "+",
      tooltip: "养成",
      children: [
        { type: "number", value: 1, tooltip: "等级" },
        { type: "number", value: 2, tooltip: "信赖" },
        { type: "number", value: 2, tooltip: "潜能" },
        { type: "number", value: 2, tooltip: "模组" },
      ],
    } as ExpressionGroupNode,
    {
      type: "expression-group",
      operator: "+",
      tooltip: "局外加成",
      children: [
        { type: "number", value: 1, tooltip: "科技树" },
        { type: "number", value: 2, tooltip: "加攻藏品1" },
        { type: "number", value: 2, tooltip: "加攻藏品2" },
        { type: "number", value: 2, tooltip: "加攻藏品3" },
      ],
    } as ExpressionGroupNode,
  ],
};
