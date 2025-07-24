import { useMemo, useEffect } from "react";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { RogueTopic, type CalculatorInput } from "~/types/gameData";
import { calculator } from "./calculator";
// import { printRelicsInfo } from "./debug/print-relics-info";
import { CalculatorHelper } from "./helper";
import { ExpressionUtil } from "./expression-util";
import { calculatorStorage, createBaseState } from "~/stores/damageCalculator/localStorage";
import { useShallow } from "zustand/react/shallow";
let localStateInited = false;

export default function CalcCenter() {
  const {
    stageId,
    charData,
    charInput,
    rogue4_inspiration_spec_items,
    rogue4_disaster_spec_items,
    rogue5_wrath_spec_items,
    rogue5_copper_spec_items,
    stageData,
    rogueInput,
    enemyBase,
    enemyData,
    levelData,
    enemySpec,
    globalAnalysisResult,
    setRogueKey,
    setRelicAnalysisResult,
    setCalcOutput,
    setGlobalAnalysisResult,
    setEnemyExpression,
  } = useDamageCalculatorStore();
  const selectedIds = useDamageCalculatorStore(useShallow((state) => state.rogueInput[state.rogueInput.topic].relics));
  const relicWrappers = useDamageCalculatorStore((state) => state.relicWrapperMap[state.rogueInput.topic]);
  const relicData = useDamageCalculatorStore((state) => state.relicDataMap[state.rogueInput.topic]);

  /** 选择的藏品 */
  const selectedRelics = useMemo(() => {
    return selectedIds
      .map((id) => relicWrappers[id])
      .filter((r) => r?.userActive)
      .map((relicWrapper) => ({
        ...relicData[relicWrapper.id],
        ...relicWrapper,
      }));
  }, [relicData, relicWrappers, selectedIds]);

  /** 主题加成列表 */
  const topicSpecItems = useMemo(() => {
    if (rogueInput.topic === RogueTopic.ROGUE_5) {
      const wraths = rogueInput.rogue_5.wraths.map((id) => rogue5_wrath_spec_items.find((item) => item.id === id)!);
      const coppers = rogueInput.rogue_5.coppers.map((id) => rogue5_copper_spec_items.find((item) => item.id === id)!);
      return [...wraths, ...coppers].filter((item) => item.userActive);
    }
    if (rogueInput.topic === RogueTopic.ROGUE_4) {
      const inspiration = rogue4_inspiration_spec_items.find((item) => item.id === rogueInput.rogue_4.inspiration);
      const disaster = rogue4_disaster_spec_items.find((item) => item.id === rogueInput.rogue_4.disaster);
      return [inspiration, disaster].filter((item) => item?.userActive);
    }
    return [];
  }, [
    rogue4_disaster_spec_items,
    rogue4_inspiration_spec_items,
    rogue5_copper_spec_items,
    rogue5_wrath_spec_items,
    rogueInput,
  ]);

  /** 计算全局Buff上下文 */
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
      { topicSpecItems: topicSpecItems, enemyData: enemyData, charData, charInput, stageData },
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
      { topicSpecItems: topicSpecItems, enemyData: enemyData, charData, charInput, stageData },
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

  /** 计算器核心计算 */
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
    // printRelicsInfo({
    //   charInput: {
    //     ...charInput,
    //     // 局外面板
    //     attribute: CalculatorHelper.calculateOutsidePanel({ charInput: charInput, context: buffContext }),
    //   },
    //   enemyInput: enemyInput,
    //   charData: charData, // 干员解包原始数据
    //   enemyData: enemyData, // 敌人解包原始数据
    //   relics: selectedRelics, // 有效藏品列表
    //   rogueInput,
    //   buffContext,
    // });
    // 计算结果
    setCalcOutput(calcResult);
  }, [charData, charInput, enemyData, enemyInput, globalAnalysisResult, rogueInput, selectedRelics, setCalcOutput]);

  /** 保存状态到本地 */
  useEffect(() => {
    if (!localStateInited) return;
    console.log("setRogueTopic", rogueInput);
    const localState = calculatorStorage.read() || createBaseState();
    localState.topic = rogueInput.topic as RogueTopic;
    // 保存萨卡兹肉鸽主题状态
    if (localState.topic === RogueTopic.ROGUE_4) {
      localState.rougeTopic[RogueTopic.ROGUE_4] = {
        tech: rogueInput[localState.topic].tech,
        difficulty: rogueInput[localState.topic].difficulty,
        zone: rogueInput[localState.topic].zone,
        stage: stageId,
        enemyName: enemyBase.id,
        relics: selectedIds,
        thoughtLoad: rogueInput[localState.topic].thoughtLoad,
        inspiration: rogueInput[localState.topic].inspiration,
        disaster: rogueInput[localState.topic].disaster,
      };
    }
    // 保存界园肉鸽主题状态
    if (localState.topic === RogueTopic.ROGUE_5) {
      localState.rougeTopic[RogueTopic.ROGUE_5] = {
        tech: rogueInput[localState.topic].tech,
        difficulty: rogueInput[localState.topic].difficulty,
        zone: rogueInput[localState.topic].zone,
        stage: stageId,
        enemyName: enemyBase.id,
        relics: selectedIds,
        wraths: rogueInput[localState.topic].wraths,
        coppers: rogueInput[localState.topic].coppers,
      };
    }
    calculatorStorage.write(localState);
  }, [charInput, enemyBase, rogueInput, stageId, selectedIds]);

  /** 初始化从本地恢复状态 */
  useEffect(() => {
    if (localStateInited) return;
    localStateInited = true;
    const localState = calculatorStorage.read();
    // 如果本地有保存的主题，则设置为当前主题
    if (localState && localState.topic) {
      setRogueKey(localState.topic);
    }
  }, []);

  return null;
}
