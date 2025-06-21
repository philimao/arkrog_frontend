/**
 * 表达式展示组件
 */
import React, { useState } from "react";
import { Chip, PopoverContent, PopoverTrigger, Popover, Tooltip } from "@heroui/react";
import { ExpressionGroupNode, NumericLiteralNode, BaseNode } from "../DamageCalculator/calculator/ast";
import { mergeClassNameSafe } from "~/utils/tools";

interface ExpressionDisplayProps {
  expression: ExpressionGroupNode;
  className?: string;
}

interface ExpressionItemProps {
  node: BaseNode;
  onExpand?: (node: ExpressionGroupNode) => void;
  isExpanded?: (node: ExpressionGroupNode) => boolean;
}

// 表达式项组件
const ExpressionItem: React.FC<ExpressionItemProps> = ({ node, onExpand, isExpanded }) => {
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

  if (node instanceof ExpressionGroupNode) {
    const value = node.calculate();

    // 根据注意事项3的要求，过滤不需要显示的项
    if (node.operator === "*" && value === 1) {
      return null;
    }
    if (node.operator === "+" && value === 0) {
      return null;
    }
    if (node.operator === "max" && node.children.length === 1) {
      // 如果是max但只有一个子项，直接显示子项
      return <ExpressionItem node={node.children[0]} onExpand={onExpand} isExpanded={isExpanded} />;
    }

    // 如果已展开，显示完整的表达式结构
    if (isExpanded?.(node)) {
      return <ExpressionStructure node={node} onExpand={onExpand} isExpanded={isExpanded} />;
    }

    // 未展开时显示为可点击的 Chip
    return (
      <Tooltip content={node.tooltip}>
        <Chip color="warning" variant="faded" size="sm" className="cursor-pointer" onClick={() => onExpand?.(node)}>
          {value}
        </Chip>
      </Tooltip>
    );
  }

  return null;
};

// 表达式结构组件
const ExpressionStructure: React.FC<{
  node: ExpressionGroupNode;
  onExpand?: (node: ExpressionGroupNode) => void;
  isExpanded?: (node: ExpressionGroupNode) => boolean;
}> = ({ node, onExpand, isExpanded }) => {
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

  if (validChildren.length === 1) {
    return <ExpressionItem node={validChildren[0]} onExpand={onExpand} isExpanded={isExpanded} />;
  }

  // 如果是max/min/union函数形式
  if (node.operator === "max" || node.operator === "min" || node.operator === "union") {
    return (
      <div className="inline-flex items-center gap-1">
        <span className="text-sm font-mono">{node.operator}(</span>
        {validChildren.map((child, index) => (
          <React.Fragment key={index}>
            <ExpressionItem node={child} onExpand={onExpand} isExpanded={isExpanded} />
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
          <ExpressionItem node={child} onExpand={onExpand} isExpanded={isExpanded} />
          {index < validChildren.length - 1 && <span className="text-sm font-mono mx-1">{node.operator}</span>}
        </React.Fragment>
      ))}
      <span className="text-sm font-mono">)</span>
    </div>
  );
};

// 主组件
export const ExpressionDisplay: React.FC<ExpressionDisplayProps> = ({ expression, className = "" }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<ExpressionGroupNode>>(new Set());

  const handleExpand = (node: ExpressionGroupNode) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(node)) {
        newSet.delete(node);
      } else {
        newSet.add(node);
      }
      return newSet;
    });
  };

  const isNodeExpanded = (node: ExpressionGroupNode) => {
    // return expandedNodes.has(node);
    return true;
  };

  if (!expression) {
    return null;
  }

  return (
    <div className={mergeClassNameSafe("bg-black-gray px-3 leading-8 h-8 font-bold text-xl", className)}>
      <Popover placement="top">
        <PopoverTrigger>
          <span className="cursor-pointer">{Math.round(expression.calculate() * 100) / 100}</span>
        </PopoverTrigger>
        <PopoverContent>
          <div className="px-1 py-2">
            <ExpressionStructure node={expression} onExpand={handleExpand} isExpanded={isNodeExpanded} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ExpressionDisplay;
