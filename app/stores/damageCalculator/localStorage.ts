import { VersionLocalStorage } from "~/components/VersionLocalStoarge";
import type { RogueTopic } from "~/types/gameData";

export interface RougeBaseState {
  /** 科技 */
  tech: string;
  /** 难度 */
  difficulty: number;
  /** 区域 */
  zone: string;
  /** 层数选择 */
  layer: string;
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

/** 黑流树海主题状态 */
export interface Rouge6State extends RougeBaseState {
  /** 理想域（解包 weather 模块，难度描述中称「实托邦」） */
  utopias: string[];
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
  charName?: string;
  /** 当前选中主题 */
  topic?: RogueTopic;
  /** 干员状态 */
  charStates: Partial<
    Record<
      string,
      {
        /** 干员名称 */
        name: string;
        /** 精英化阶段 */
        phaseLevel: number;
        /** 等级 */
        frameIndex: number;
        /** 技能 */
        skillKey: string;
        /** 技能等级 */
        skillLevel: number;
        /** 潜能 */
        potential: number;
        /** 模组ID */
        uniEquipId?: string;
        /** 模组等级 */
        uniEquipLevel?: number;
        // ...不同肉鸽主题扩展状态
        /** 是否为伺烛客 rogue_5限定 */
        candleHolder: boolean;
        /** 是否在化境地块上 */
        dygmnyTile: boolean;
      }
    >
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
    /** 黑流树海肉鸽 */
    [RogueTopic.ROGUE_6]: Rouge6State;
  }>;
}

export function createBaseState(): CalculatorLocalState {
  return {
    charName: "",
    topic: undefined,
    charStates: {},
    rougeTopic: {},
  };
}

// v2：新增 Rouge6State（黑流树海理想域）。CalculatorLocalState 结构变更需 bump，
// 版本不一致时 VersionLocalStorage 会清空存储——这是有意的取舍。
export const calculatorStorage = new VersionLocalStorage<CalculatorLocalState>("calculator-local-state", 2);
