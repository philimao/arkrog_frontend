/**
 * 表达式展示组件
 */
import React, { useState } from "react";
import { Chip, PopoverContent, PopoverTrigger, Popover, Tooltip } from "@heroui/react";
import { ExpressionGroupNode, NumericLiteralNode, BaseNode } from "../DamageCalculator/calculator/ast";
import { mergeClassNameSafe } from "~/utils/tools";

interface ExpressionDisplayProps {
  mode: "out_game" | "in_game" | "skill";
  expression: ExpressionGroupNode;
  className?: string;
}

interface ExpressionItemProps {
  node: BaseNode;
}

// 表达式项组件
const ExpressionItem: React.FC<ExpressionItemProps> = ({ node }) => {
  if (node instanceof NumericLiteralNode) {
    // 数字节点直接显示为 Chip
    return (
      <Tooltip content={node.tooltip}>
        <Chip color="warning" variant="faded" size="sm">
          {node.value}
        </Chip>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={node.tooltip}>
      <Chip color="danger" variant="faded" size="sm">
        错误
      </Chip>
    </Tooltip>
  );
};

export interface ExpressionStructureProps {
  node: BaseNode;
  defaultExpanded?: boolean;
}

// 表达式结构组件(一个递归组件)
const ExpressionStructure: React.FC<ExpressionStructureProps> = ({ node, defaultExpanded }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // 如果不是表达式节点, 直接显示
  if (!(node instanceof ExpressionGroupNode)) {
    return <ExpressionItem node={node} />;
  }

  // 过滤有效的子节点
  const validChildren = node.children.filter((child) => {
    const childValue = child.calculate();
    if (node.operator === "+" && childValue === 0) {
      return false;
    }
    if (node.operator === "*" && childValue === 1) {
      return false;
    }
    return true;
  });

  // 有效子节点不足, 直接显示节点
  if (validChildren.length === 1) {
    return <ExpressionStructure node={validChildren[0]} defaultExpanded={true} />;
  }

  // 没有展开时
  if (!isExpanded) {
    return (
      <Tooltip content={node.tooltip}>
        <Chip color="warning" variant="shadow" size="sm" className="cursor-pointer" onClick={() => setIsExpanded(true)}>
          {Math.round(node.calculate() * 100) / 100}
        </Chip>
      </Tooltip>
    );
  }

  // 如果是max/min/union函数形式
  if (node.operator === "max" || node.operator === "min" || node.operator === "union") {
    return (
      <div className="inline-flex items-center gap-1">
        <span className="text-sm font-mono">{node.operator}(</span>
        {validChildren.map((child, index) => (
          <React.Fragment key={index}>
            <ExpressionItem node={child} />
            {index < validChildren.length - 1 && <span className="text-sm">,</span>}
          </React.Fragment>
        ))}
        <span className="text-sm font-mono">)</span>
      </div>
    );
  }

  // 普通的加法或乘法表达式
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-sm font-mono">(</span>
      {validChildren.map((child, index) => (
        <React.Fragment key={index}>
          <ExpressionStructure node={child} />
          {index < validChildren.length - 1 && <span className="text-sm font-mono mx-1">{node.operator}</span>}
        </React.Fragment>
      ))}
      <span className="text-sm font-mono">)</span>
    </div>
  );
};

// 表达式显示组件
export const ExpressionDisplay: React.FC<ExpressionDisplayProps> = ({ mode, expression, className = "" }) => {
  if (!expression) {
    return null;
  }

  return (
    <div className={mergeClassNameSafe("bg-black-gray px-3 leading-8 h-8 font-bold text-xl", className)}>
      <Popover placement="top">
        <PopoverTrigger>
          <span className="cursor-pointer">
            {mode === "out_game" ? Math.round(expression.calculate()) : Math.round(expression.calculate() * 100) / 100}
          </span>
        </PopoverTrigger>
        <PopoverContent>
          <div className="px-1 py-2">
            <ExpressionStructure node={expression} defaultExpanded={true} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ExpressionDisplay;
