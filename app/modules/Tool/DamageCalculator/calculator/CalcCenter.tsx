import { useMemo, useEffect } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import type { RelicWrapper, CalculatorInput } from "~/types/gameData";
import { calculator } from "./calculator";
import { printRelicsInfo } from "./debug/print-relics-info";
import { CalculatorHelper } from "./helper";
import { ExpressionUtil } from "./expression-util";

export default function CalcCenter() {
  const {
    charData,
    charInput,
    topicSpecItems,
    stageData,
    rogueInput,
    enemyBase,
    enemyData,
    levelData,
    selectedIds,
    relicsMap,
    enemySpec,
    relicList,
    globalAnalysisResult,
    setRelicAnalysisResult,
    setCalcOutput,
    setGlobalAnalysisResult,
    setEnemyExpression,
  } = useDamageCalculatorStore();

  const rogueKey = rogueInput.topic;

  /** 选择的藏品 */
  const selectedRelics = useMemo(() => {
    return selectedIds
      .map((id) => relicsMap[rogueKey]?.find((relic) => relic.id === id))
      .filter((r) => r?.userActive)
      .map((r) => ({
        relicData: relicList.find((relic) => relic.id === r?.id),
        ...r,
      })) as RelicWrapper[];
  }, [relicList, relicsMap, rogueKey, selectedIds]);

  useEffect(() => {
    let buffContext;
    // 干员养成加成
    if (charInput) {
      buffContext = CalculatorHelper.analyzeChar({
        charInput,
        charData: charData,
      });
    }
    // 藏品加成
    buffContext = CalculatorHelper.analyzeRelics(
      {
        charInput: charInput,
        charData,
        relics: selectedRelics,
        enemyData: enemyData,
        stageData,
      },
      buffContext,
    );
    // 肉鸽难度加成
    buffContext = CalculatorHelper.analyzeRogueDifficulty({ rogueInput, enemyData }, buffContext);
    // 肉鸽主题加成（年代、灵感、密文板）
    buffContext = CalculatorHelper.analyzeTopicSpec(
      { topicSpecItems: topicSpecItems, enemyData: enemyData },
      buffContext,
    );
    // 敌人特殊配置加成
    buffContext = CalculatorHelper.analyzeEnemySpec({ enemySpec, enemyData, stageData, levelData }, buffContext);
    setGlobalAnalysisResult(buffContext);
  }, [
    charData,
    charInput,
    enemyData,
    enemySpec,
    levelData,
    rogueInput,
    selectedRelics,
    setGlobalAnalysisResult,
    stageData,
    topicSpecItems,
  ]);

  /** 用于展示Buff一览的加成, 区别在于不包含干员养成加成 */
  useEffect(() => {
    let buffPanelContext = CalculatorHelper.analyzeRelics({
      charInput: charInput,
      charData,
      relics: selectedRelics,
      enemyData: enemyData,
      stageData,
    });
    buffPanelContext = CalculatorHelper.analyzeRogueDifficulty({ rogueInput, enemyData }, buffPanelContext);
    buffPanelContext = CalculatorHelper.analyzeTopicSpec(
      { topicSpecItems: topicSpecItems, enemyData: enemyData },
      buffPanelContext,
    );
    buffPanelContext = CalculatorHelper.analyzeEnemySpec({ enemySpec }, buffPanelContext);

    setRelicAnalysisResult(buffPanelContext);
  }, [
    charData,
    charInput,
    enemyData,
    enemySpec,
    rogueInput,
    selectedRelics,
    setRelicAnalysisResult,
    stageData,
    topicSpecItems,
  ]);

  /** 当敌人数据或buff上下文变化时，计算敌人属性表达式 */
  useEffect(() => {
    if (!globalAnalysisResult) return;
    let expression;
    if (enemyBase.name === "木桩") {
      expression = {};
    } else {
      expression = {
        maxHp: ExpressionUtil.enemy_final_max_hp({ enemyBase, context: globalAnalysisResult }),
        atk: ExpressionUtil.enemy_final_atk({ enemyBase, context: globalAnalysisResult }),
        def: ExpressionUtil.enemy_final_def({ enemyBase, context: globalAnalysisResult }),
        magicResistance: ExpressionUtil.enemy_final_magic_resistance({ enemyBase, context: globalAnalysisResult }),
        epResistance: ExpressionUtil.enemy_final_ep_resistance({ enemyBase, context: globalAnalysisResult }),
        epDamageResistance: ExpressionUtil.enemy_final_ep_damage_resistance({
          enemyBase,
          context: globalAnalysisResult,
        }),
        damageResistance: ExpressionUtil.enemy_final_physical_magic_resistance({
          enemyBase,
          context: globalAnalysisResult,
        }),
      };
    }
    setEnemyExpression(expression);
  }, [enemyBase, globalAnalysisResult, setEnemyExpression]);

  /** 计算敌人属性，仅在当前计算组件中计算与使用，不储存到store中 */
  const enemyInput = useMemo(() => {
    if (!globalAnalysisResult) return;
    return CalculatorHelper.calculateEnemyAttr({
      enemyBase,
      context: globalAnalysisResult,
    });
  }, [enemyBase, globalAnalysisResult]);

  useEffect(() => {
    if (!charInput || !globalAnalysisResult || !enemyInput) return;
    const buffContext = globalAnalysisResult;
    const input: CalculatorInput = {
      charInput: {
        ...charInput,
        // 局外面板
        attribute: CalculatorHelper.calculateOutsidePanel({ charInput: charInput, context: buffContext }),
      },
      enemyInput,
      charData: charData, // 干员解包原始数据
      enemyData: enemyData, // 敌人解包原始数据
      relics: selectedRelics, // 有效藏品列表
      rogueInput,
      buffContext,
    };
    const calcResult = calculator(input);
    // 标准打印
    CalculatorHelper.print(input, calcResult);
    printRelicsInfo({
      charInput: {
        ...charInput,
        // 局外面板
        attribute: CalculatorHelper.calculateOutsidePanel({ charInput: charInput, context: buffContext }),
      },
      enemyInput: enemyInput,
      charData: charData, // 干员解包原始数据
      enemyData: enemyData, // 敌人解包原始数据
      relics: relicsMap[rogueKey].map((r) => ({
        ...r,
        relicData: relicList.find((relic) => relic.id === r?.id)!,
      })), // 有效藏品列表
      rogueInput,
      buffContext,
    });
    // 计算结果
    setCalcOutput(calcResult);
  }, [
    charData,
    charInput,
    enemyData,
    enemyInput,
    globalAnalysisResult,
    relicList,
    relicsMap,
    rogueInput,
    rogueKey,
    selectedRelics,
    setCalcOutput,
  ]);

  return null;
}
