import type { RelicBuff } from "~/types/gameData";

import type { WrappedRelicItem } from "~/types/gameData";

/** 提供一个计算公式AST结构树(显性化计算公共部分) */
export type ASTNode = NumericLiteral | ExpressionGroup;

export interface Base {
  /** 节点类型 */
  type: "number" | "expression" | "expression-group";
  /** 节点提示 */
  tooltip: string;
  /** 节点值 */
  value: number;
}

export interface NumericLiteral extends Base {
  type: "number";
  value: number;
}

export interface ExpressionNode extends Base {
  type: "expression";
  operator: "+" | "-" | "*" | "/";
  left: Base;
  right: Base;
}

export interface ExpressionGroup extends Base {
  type: "expression-group";
  operator: "+" | "*";
  children: Base[];
}

export enum Kind {}

export interface ExpressionGroup {
  type: "expression-group";
  operator: "+" | "*";
  children: Base[];
}

export class BaseNode {
  type: "number" | "expression" | "expression-group";
  tooltip: string;

  constructor(type: "number" | "expression" | "expression-group", tooltip: string) {
    this.type = type;
    this.tooltip = tooltip;
  }

  calculate(): number {
    return 0;
  }

  printExpression() {
    return "";
  }

  printDebug() {
    return "";
  }

  structure(): Base {
    return {
      type: this.type,
      tooltip: this.tooltip,
      value: this.calculate(),
    };
  }

  clone(): BaseNode {
    throw new Error("Not implemented");
  }
}

export class NumericLiteralNode extends BaseNode {
  constructor(
    public value: number,
    tooltip: string,
    public source?: {
      relic: WrappedRelicItem;
      buff: RelicBuff;
    },
  ) {
    super("number", tooltip);
  }

  calculate(): number {
    return this.value;
  }

  printExpression(): string {
    return this.value.toString();
  }

  printDebug(): string {
    return this.tooltip;
  }

  structure(): NumericLiteral {
    return {
      type: this.type,
      tooltip: this.tooltip,
      value: this.value,
    } as NumericLiteral;
  }

  /** 深度克隆 */
  clone(): NumericLiteralNode {
    return new NumericLiteralNode(this.value, this.tooltip, this.source);
  }
}

/**
 * 表达式组, 这个组将所有子项都在一个组里面一起计算, (child1 + child2 + child3)
 */
export class ExpressionGroupNode extends BaseNode {
  operator: "-" | "+" | "*" | "max" | "min" | "union";
  children: BaseNode[] = [];

  constructor(operator: "-" | "+" | "*" | "max" | "min" | "union", tooltip: string) {
    super("expression-group", tooltip);
    this.operator = operator;
  }

  addChild(...child: BaseNode[]) {
    this.children.push(...child);
    return this;
  }

  calculate(): number {
    if (this.operator === "-") {
      if (this.children.length === 0) {
        return 0;
      }
      return this.children.reduce((acc, child, index) => {
        if (index === 0) {
          return child.calculate();
        }
        return acc - child.calculate();
      }, 0);
    }
    if (this.operator === "+") {
      return this.children.reduce((acc, child) => {
        return acc + child.calculate();
      }, 0);
    }
    if (this.operator === "*") {
      return this.children.reduce((acc, child) => {
        return acc * child.calculate();
      }, 1);
    }
    if (this.operator === "max") {
      return this.children.reduce((acc, child) => {
        return Math.max(acc, child.calculate());
      }, 0);
    }
    if (this.operator === "min") {
      return this.children.reduce((acc, child) => {
        return Math.min(acc, child.calculate());
      }, Infinity);
    }
    if (this.operator === "union") {
      return (
        1 -
        this.children.reduce((acc, child) => {
          return acc * (1 - child.calculate());
        }, 1)
      );
    }
    console.error("Invalid operator", this.operator);
    return NaN;
  }

  printExpression() {
    // 有效子节点
    const validChildren = this.children.filter((child) => {
      if (this.operator === "-" && child.calculate() === 0) {
        return false;
      }
      if (this.operator === "+" && child.calculate() === 0) {
        return false;
      }
      if (this.operator === "*" && child.calculate() === 1) {
        return false;
      }
      return true;
    });
    const childrenStr = validChildren.map((child) => child.printExpression()).join(` ${this.operator} `);
    if (validChildren.length > 1) {
      if (this.operator === "max") {
        return `max(${validChildren.map((child) => child.printExpression()).join(", ")})`;
      }
      if (this.operator === "min") {
        return `min(${validChildren.map((child) => child.printExpression()).join(", ")})`;
      }
      if (this.operator === "union") {
        return `union(${validChildren.map((child) => child.printExpression()).join(", ")})`;
      }
      return `(${childrenStr})`;
    }
    return childrenStr;
  }

  printDebug() {
    // 有效子节点
    const validChildren = this.children.filter((child) => {
      if (this.operator === "-" && child.calculate() === 0) {
        return false;
      }
      if (this.operator === "+" && child.calculate() === 0) {
        return false;
      }
      if (this.operator === "*" && child.calculate() === 1) {
        return false;
      }
      return true;
    });
    const childrenStr = validChildren.map((child) => child.printDebug()).join(` ${this.operator} `);
    if (validChildren.length > 1) {
      if (this.operator === "max") {
        return `max(${validChildren.map((child) => child.printDebug()).join(", ")})`;
      }
      if (this.operator === "min") {
        return `min(${validChildren.map((child) => child.printDebug()).join(", ")})`;
      }
      if (this.operator === "union") {
        return `union(${validChildren.map((child) => child.printDebug()).join(", ")})`;
      }
      return `(${childrenStr})`;
    }
    return childrenStr;
  }

  toString() {
    return this.printExpression();
  }

  /** 输出结构 */
  structure(): ExpressionGroup {
    return {
      type: this.type,
      operator: this.operator,
      children: this.children.map((child) => child.structure()),
    } as ExpressionGroup;
  }

  /** 深度克隆 */
  clone(): ExpressionGroupNode {
    return new ExpressionGroupNode(this.operator, this.tooltip).addChild(
      ...this.children.map((child) => child.clone()),
    );
  }
}
