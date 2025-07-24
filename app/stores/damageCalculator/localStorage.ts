import { VersionLocalStorage } from "~/components/VersionLocalStoarge";
import type { RogueTopic } from "~/types/gameData";

export interface RougeBaseState {
  /** 科技 */
  tech: string;
  /** 难度 */
  difficulty: number;
  /** 层数 */
  zone: string;
  /** 关卡 */
  stage: string;
  /** 敌人 */
  enemyName: string;
  /** 藏品 */
  relics: string[];
}

/** 萨卡兹主题状态 */
export interface Rouge4State extends RougeBaseState {
  /** 思维负荷状态 */
  thoughtLoad: "NORMAL" | "CONFUSION" | "STAGNATION";
  /** 当前生效灵感 */
  inspiration?: string;
  /** 年代 */
  disaster?: string;
}

/** 界园主题状态 */
export interface Rouge5State extends RougeBaseState {
  /** 岁时 */
  wraths: string[];
  /** 通宝 */
  coppers: string[];
}

/**
 * 计算器本地状态
 * 将存储计算器相关的输入数据，恢复到上次计算状态，避免重复输入
 */
interface CalculatorLocalState {
  /** 当前选中干员 */
  charName: string;
  /** 当前选中主题 */
  topic?: RogueTopic;
  /** 干员状态 */
  charInput: Record<
    string,
    {
      /** 干员名称 */
      name: string;
      /** 精英化阶段 */
      phase: string;
      /** 等级 */
      phaseLevel: number;
      /** 模组 */
      uniEquipName: string;
      /** 模组等级 */
      uniEquipLevel: number;
      /** 潜能 */
      potential: number;
      /** 技能 */
      skillKey: string;
      /** 技能等级 */
      skillLevel: number;

      // ...不同肉鸽主题扩展状态
      /** 是否是伺烛客 */
      isCandle: boolean;
    }
  >;
  /** 主题状态 */
  rougeTopic: Partial<{
    /** 傀影肉鸽 */
    [RogueTopic.ROGUE_1]: RougeBaseState;
    /** 水月肉鸽 */
    [RogueTopic.ROGUE_2]: RougeBaseState;
    /** 萨米肉鸽 */
    [RogueTopic.ROGUE_3]: RougeBaseState;
    /** 萨卡兹肉鸽 */
    [RogueTopic.ROGUE_4]: Rouge4State;
    /** 界园肉鸽 */
    [RogueTopic.ROGUE_5]: Rouge5State;
  }>;
}

export function createBaseState(): CalculatorLocalState {
  return {
    charName: "",
    topic: undefined,
    charInput: {},
    rougeTopic: {},
  };
}

export const calculatorStorage = new VersionLocalStorage<CalculatorLocalState>("calculator-local-state", 0);
