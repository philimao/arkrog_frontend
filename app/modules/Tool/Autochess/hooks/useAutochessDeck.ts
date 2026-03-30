import { useMemo, useState } from "react";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import { countBondStacks } from "../utils/autochess";

const PICK_LIMIT = 9;

export function useAutochessDeck(
  operators: AutochessOperator[],
  bonds: AutochessBond[],
) {
  const [pickOperatorIds, setPickOperatorIds] = useState<string[]>([]);
  const [banOperatorIds, setBanOperatorIds] = useState<string[]>([]);

  const operatorDict = useMemo(() => {
    return operators.reduce(
      (acc, operator) => {
        acc[operator.chessId] = operator;
        return acc;
      },
      {} as Record<string, AutochessOperator>,
    );
  }, [operators]);

  const pickOperators = useMemo(() => {
    return pickOperatorIds
      .map((chessId) => operatorDict[chessId])
      .filter((item): item is AutochessOperator => Boolean(item));
  }, [pickOperatorIds, operatorDict]);

  const banOperators = useMemo(() => {
    return banOperatorIds
      .map((chessId) => operatorDict[chessId])
      .filter((item): item is AutochessOperator => Boolean(item));
  }, [banOperatorIds, operatorDict]);

  const bondCountMap = useMemo(
    () => countBondStacks(pickOperators),
    [pickOperators],
  );

  /**
   * 为盟约列表补齐激活态，避免在渲染层做重复计算。
   * 这里把“数量统计 -> 阈值判断”的逻辑集中到 hook，页面组件只负责展示。
   */
  const bondsWithState = useMemo(() => {
    return bonds.map((bond) => {
      const count = bondCountMap[bond.bondId] || 0;
      return {
        ...bond,
        count,
        enabled: count > 0,
        active: count >= bond.activeCount,
      };
    });
  }, [bondCountMap, bonds]);

  const addToPick = (chessId: string) => {
    setBanOperatorIds((prev) => prev.filter((id) => id !== chessId));
    let added = false;
    setPickOperatorIds((prev) => {
      if (prev.includes(chessId)) return prev;
      added = true;
      return [...prev, chessId];
    });
    return {
      success: added,
      reason: added ? "ok" : "exists",
    };
  };

  const addToBan = (chessId: string) => {
    setPickOperatorIds((prev) => prev.filter((id) => id !== chessId));
    setBanOperatorIds((prev) => {
      if (prev.includes(chessId)) return prev;
      return [...prev, chessId];
    });
  };

  const removeFromPick = (chessId: string) => {
    setPickOperatorIds((prev) => prev.filter((id) => id !== chessId));
  };

  const removeFromBan = (chessId: string) => {
    setBanOperatorIds((prev) => prev.filter((id) => id !== chessId));
  };

  return {
    pickOperatorIds,
    pickOperators,
    banOperatorIds,
    banOperators,
    selectedIds: [...pickOperatorIds, ...banOperatorIds],
    pickLimit: PICK_LIMIT,
    bondsWithState,
    addToPick,
    addToBan,
    removeFromPick,
    removeFromBan,
  };
}
