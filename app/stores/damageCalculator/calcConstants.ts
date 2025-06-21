import type { EnemyData, EnemyInput, RelicWrapper, RogueKey } from "~/types/gameData";
import type { RogueInput } from "./calcTypes";
import type {
  DCalculatorState,
  SlicedCalcEnemyState,
  SlicedCalcGameDataState,
  SlicedCalcCharState,
  SlicedCalcUIState,
  SlicedCalculatorState,
} from "./calcTypes";
import { BuffContext, CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";
import type { EnemySpec } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";

export const dummy: EnemyInput = {
  id: "enemy_000_dummy",
  level: 0,
  name: "木桩",
  description: "木桩敌人，可以随意设置属性，面板不受收藏品影响",
  attributes: {
    maxHp: 0,
    atk: 0,
    def: 0,
    magicResistance: 0,
    blockCnt: 0,
    moveSpeed: 1.0,
    attackSpeed: 100.0,
    baseAttackTime: 1.0,
    epDamageResistance: 0,
    epResistance: 0,
    cost: 5,
    respawnTime: 5,
    hpRecoveryPerSec: 0,
    spRecoveryPerSec: 1,
    maxDeployCount: 1,
    massLevel: 0,
    baseForceLevel: 0,
    tauntLevel: 0,
    damageHitratePhysical: 0,
    damageHitrateMagical: 0,
    stunImmune: false,
    silenceImmune: false,
    sleepImmune: false,
    frozenImmune: false,
    levitateImmune: false,
    disarmedCombatImmune: false,
    fearedImmune: false,
    damageResistance: 0,
  },
  levelType: "NORMAL",
  rangedRadius: 0,
  applyWay: "MELEE",
  enemyTags: [],
};

export const initialCalcGameDataState: SlicedCalcGameDataState = {
  rogueInput: {
    topic: "rogue_4",
    // TODO 预设其他肉鸽的初始值
    rogue_4: {
      zone: "zone_5",
      difficulty: 18,
      thoughtLoad: "NORMAL",
    },
  } as RogueInput,
  topicSpecItems: [],
  stageData: undefined,
  levelData: undefined,
  relicsMap: {} as Record<RogueKey, RelicWrapper[]>,
  selectedIds: [],
};

export const initialCalculatorState: SlicedCalculatorState = {
  relicAnalysisResult: CalculatorHelper.createAdditionContext(),
  globalAnalysisResult: CalculatorHelper.createAdditionContext(),
  calcOutput: CalculatorHelper.createCalculatorOutput(),
};

export const intialCalcCharState: SlicedCalcCharState = {
  activeCharName: "",
  charList: [],
  charsModifier: {},
};

export const initialEnemyState: SlicedCalcEnemyState = {
  enemyBase: dummy,
  enemyInput: dummy,
  enemyData: undefined as unknown as EnemyData,
  enemyContext: undefined as unknown as BuffContext,
  enemySpec: undefined as unknown as EnemySpec,
};

export const initialCalcUIState: SlicedCalcUIState = {
  showRelics: false,
  showTopicSpec: false,
};

export const initialState: DCalculatorState = {
  ...initialCalcGameDataState,
  ...initialCalculatorState,
  ...intialCalcCharState,
  ...initialEnemyState,
  ...initialCalcUIState,
};
