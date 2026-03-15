import { createElement, type ReactNode } from "react";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";

/** 盟约描述中 <@namespace.tag> 到 Tailwind 类名的映射 */
const BOND_DESC_TAG_CLASSES: Record<string, string> = {
  "autochess.gray": "text-light-mid-gray",
  "autochess.dgreen": "text-emerald-400",
  "ba.vup": "text-ak-red",
  "ba.vdown": "text-ak-blue",
  "ba.acrem": "text-light-mid-gray",
};

/** 将字符串中的换行符（含字面量 \n）转为 React 节点（文本 + <br />） */
function pushWithLineBreaks(
  str: string,
  result: ReactNode[],
  keyPrefix: string
): void {
  const normalized = str.replace(/\\n/g, "\n");
  const parts = normalized.split("\n");
  parts.forEach((part, i) => {
    if (i > 0) result.push(createElement("br", { key: `${keyPrefix}-br-${i}` }));
    if (part) result.push(part);
  });
}

/**
 * 解析盟约描述中的 <@namespace.tag>content</> 标签为 React 节点。
 * 支持字面量 \\n 和实际换行符，均会渲染为换行。
 */
export function parseBondDesc(text: string): ReactNode[] {
  if (!text) return [];
  const result: ReactNode[] = [];
  let remaining = text.replace(/\\n/g, "\n");
  const tagRe = /<@([^>]+)>/;

  while (remaining.length > 0) {
    const openMatch = remaining.match(tagRe);
    if (!openMatch) {
      pushWithLineBreaks(remaining, result, "tail");
      break;
    }
    const openIndex = remaining.indexOf(openMatch[0]);
    const beforeTag = remaining.slice(0, openIndex);
    if (beforeTag) pushWithLineBreaks(beforeTag, result, `pre-${openIndex}`);

    const tagName = openMatch[1];
    const afterOpen = remaining.slice(openIndex + openMatch[0].length);
    const closeIndex = afterOpen.indexOf("</>");
    if (closeIndex === -1) {
      pushWithLineBreaks(remaining.slice(openIndex), result, "unclosed");
      break;
    }
    const content = afterOpen.slice(0, closeIndex);
    remaining = afterOpen.slice(closeIndex + 3);

    const className = BOND_DESC_TAG_CLASSES[tagName] ?? "text-light-mid-gray";
    const contentWithBreaks = content.split("\n").flatMap((part, i) =>
      i > 0 ? [createElement("br", { key: `cbr-${i}` }), part] : [part]
    );
    result.push(
      createElement(
        "span",
        { key: `${tagName}-${result.length}`, className },
        ...contentWithBreaks,
      ),
    );
  }
  return result;
}

/**
 * 统计已选干员在每个盟约上的层数。
 * 同一干员不会重复计入（通过上层 BP 池去重保证）。
 */
export function countBondStacks(operators: AutochessOperator[]) {
  const counter: Record<string, number> = {};
  operators.forEach((operator) => {
    operator.bondIds.forEach((bondId) => {
      counter[bondId] = (counter[bondId] || 0) + 1;
    });
  });
  return counter;
}

export function getBondActiveMethodLabel(bond: AutochessBond) {
  return bond.activeCondition === "BOARD_AND_DECK" ? "编队生效" : "在场生效";
}
