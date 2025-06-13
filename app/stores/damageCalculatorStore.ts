import { create } from "zustand/index";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import type {
  CharData,
  EnemyData,
  EnemyInput,
  RogueKey,
  RelicWrapper,
  CalculatorOutput,
  RogueInput,
  StageData,
  LevelData,
} from "~/types/gameData";
import type { BuffContext } from "~/modules/Tool/DamageCalculator/calculator";
import type { ITopicSpecItem } from "~/modules/Tool/DamageCalculator/TopicSpecSection/TopicSpecSelector";
import type { EnemySpec } from "~/modules/Tool/DamageCalculator/EnemySection/EnemySpecSelector";

interface AttributeModifier {
  atkBase: number;
  atkPercent: number;
  atkFinal: number;
}

interface DamageCalculatorStore {
  /** 肉鸽主题 */
  rogueKey: RogueKey;
  /** 肉鸽难度 */
  rogueInput: RogueInput;
  /** 肉鸽难度 */
  difficulty: number;
  /** 干员列表 */
  charList: CharData[];
  /** 当前选中的角色 */
  activeCharName: string;
  /** 仅有藏品的加成上下文 */
  relicAnalysisResult?: BuffContext;
  /** 是否显示藏品选择器页面 */
  showRelics: boolean;
  /** 是否显示肉鸽主题特殊效果选择器页面 */
  showTopicSpec: boolean;
  /** 肉鸽主题特殊效果列表 */
  topicSpecItems: ITopicSpecItem[];
  /** 预处理后的藏品列表 */
  relicsMap: Record<RogueKey, RelicWrapper[]>;
  /** 干员属性额外修改 */
  charsModifier: Record<string, AttributeModifier>;
  /** 选择的藏品ID */
  selectedIds: string[];
  /** 敌人解包数据 */
  enemyData: EnemyData;
  /** 敌人解包数据解析后的数据 */
  enemyDataParsed: EnemyInput;
  /** 敌人特殊配置数据 */
  enemySpec: EnemySpec[];
  /** 简略关卡数据 */
  stageData?: StageData;
  /** 关卡详细解包数据 */
  levelData?: LevelData;
  /** 计算结果 */
  calcOutput: CalculatorOutput;
}

interface DamageCalculatorAction {
  setRogueKey: (key: RogueKey) => void;
  setRogueInput: (rogueInput: RogueInput) => void;
  setRogueDifficulty: (difficulty: number) => void;
  setRogueZone: (zone: string) => void;
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) => void;
  setRougeTech: (tech: string) => void;
  addCharData: () => void;
  setCharData: (charData: CharData, i: number) => void;
  removeCharData: (i: number) => void;
  setActiveCharName: (charName: string) => void;
  setRelicAnalysisResult: (relicAnalysisResult: BuffContext) => void;
  setRelicWrapper: (rogueKey: RogueKey, relics: RelicWrapper[]) => void;
  toggleShowRelics: () => void;
  toggleShowTopicSpec: () => void;
  setTopicSpecItems: (callback: (items: ITopicSpecItem[]) => ITopicSpecItem[]) => void;
  setRelicLayer: (id: string, layer: string) => string;
  updateRelic: (id: string, key: string, value: number | string | boolean) => void;
  updateRelics: (ids: string[], key: string, value: number | string | boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleRelicSelection: (id: string) => void;
  setEnemyData: (enemyData: EnemyData) => void;
  setEnemyDataParsed: (enemyDataParsed: EnemyInput) => void;
  setEnemySpec: (enemySpec: EnemySpec[]) => void;
  setCharsModifier: (charName: string, modifier: AttributeModifier) => void;
  setStageData: (stageData: StageData) => void;
  setLevelData: (levelData: LevelData) => void;
  setCalcOutput: (output: CalculatorOutput) => void;
}

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
  },
  levelType: "NORMAL",
  rangedRadius: 0,
};

export const useDamageCalculatorStore = create<DamageCalculatorStore & DamageCalculatorAction>()(
  devtools(
    immer((set) => ({
      rogueKey: "rogue_4" as RogueKey,
      setRogueKey: (rogueKey) => set((state) => ({ ...state, rogueKey }), undefined, "setRogueKey"),
      rogueInput: {
        topic: "rogue_4",
        rogue_4: {
          // zone: "zone_7",
          zone: "zone_5",
          difficulty: 18,
          thoughtLoad: "NORMAL",
        },
      } as RogueInput,
      setRogueInput: (rogueInput: RogueInput) => set((state) => ({ ...state, rogueInput }), undefined, "setRogueInput"),
      difficulty: 18,
      setRogueDifficulty: (difficulty) => {
        return set(
          (state) => {
            state.difficulty = difficulty;
            state.rogueInput[state.rogueInput.topic].difficulty = difficulty;
          },
          undefined,
          "setRogueDifficulty",
        );
      },
      setRogueZone: (zone) =>
        set(
          (state) => {
            state.rogueInput[state.rogueInput.topic].zone = zone;
          },
          undefined,
          "setRogueZone",
        ),
      setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) =>
        set(
          (state) => {
            state.rogueInput.rogue_4.thoughtLoad = thoughtLoad;
          },
          undefined,
          "setRogueThoughtLoad",
        ),
      setRougeTech: (tech) =>
        set(
          (state) => {
            state.rogueInput.rogue_4.tech = tech;
          },
          undefined,
          "setRogueThoughtLoad",
        ),
      charList: [] as CharData[],
      addCharData: () =>
        set(
          (state) => ({
            ...state,
            charList: [...state.charList, undefined],
          }),
          undefined,
          "addCharData",
        ),
      setCharData: (charData: CharData, i: number) =>
        set(
          (state) => {
            const charList = state.charList;
            charList[i] = charData;
          },
          undefined,
          "setCharData",
        ),
      removeCharData: (i) =>
        set(
          (state) => {
            const charList = state.charList;
            let activeCharName = state.activeCharName;
            const charName = charList[i]!.name;
            charList.splice(i, 1);
            if (!charList.length) {
              if (activeCharName === charName) activeCharName = "";
            } else {
              activeCharName = charList[0]!.name;
            }
          },
          undefined,
          "removeCharData",
        ),
      activeCharName: "",
      setActiveCharName: (charName) =>
        set((state) => ({ ...state, activeCharName: charName }), undefined, "setActiveCharName"),
      setRelicAnalysisResult: (relicAnalysisResult: BuffContext) =>
        set(
          (state) => {
            state.relicAnalysisResult = relicAnalysisResult;
          },
          undefined,
          "setRelicAnalysisResult",
        ),
      showRelics: false as boolean,
      toggleShowRelics: () =>
        set(
          (state) => ({
            ...state,
            showRelics: !state.showRelics,
          }),
          undefined,
          "toggleShowRelics",
        ),
      showTopicSpec: false as boolean,
      toggleShowTopicSpec: () =>
        set(
          (state) => ({
            ...state,
            showTopicSpec: !state.showTopicSpec,
          }),
          undefined,
          "toggleShowTopicSpec",
        ),
      topicSpecItems: [] as ITopicSpecItem[],
      setTopicSpecItems: (callback) =>
        set(
          (state) => {
            state.topicSpecItems = callback(state.topicSpecItems);
          },
          undefined,
          "setTopicSpecItems",
        ),
      relicsMap: {} as Record<RogueKey, RelicWrapper[]>,
      setRelicWrapper: (rogueKey, relics) =>
        set(
          (state) => {
            state.relicsMap[rogueKey] = relics;
          },
          false,
          "setRelicWrapper",
        ),
      updateRelic: (id, key, value) =>
        set(
          (state) => {
            const relicWrappers = state.relicsMap[state.rogueKey] as RelicWrapper[];
            if (relicWrappers) {
              relicWrappers.find((relicWrapper) => relicWrapper.id === id)![key as keyof RelicWrapper] = value as never;
            }
          },
          false,
          "updateRelic",
        ),
      updateRelics: (ids, key, value) =>
        set(
          (state) => {
            const relicWrappers = state.relicsMap[state.rogueKey] as RelicWrapper[];
            if (relicWrappers) {
              relicWrappers
                .filter((relicWrapper) => ids.includes(relicWrapper.id))
                .forEach((relicWrapper) => {
                  relicWrapper[key as keyof RelicWrapper] = value as never;
                });
            }
          },
          false,
          "updateRelics",
        ),
      setRelicLayer: (id: string, layer: string) => {
        const layerNumber = parseInt(layer);
        set(
          (state) => {
            state.relicsMap[state.rogueKey].find((r) => r.id === id)!.layer = layerNumber || 0;
          },
          undefined,
          "setRelicLayer",
        );
        return layerNumber.toString();
      },
      selectedIds: [] as string[],
      setSelectedIds: (ids) => set((state) => ({ ...state, selectedIds: ids }), undefined, "setSelectedIds"),
      toggleRelicSelection: (id) => {
        set(
          (state) => {
            if (state.selectedIds.includes(id)) {
              const i = state.selectedIds.indexOf(id);
              state.selectedIds.splice(i, 1);
            } else {
              state.selectedIds.push(id);
            }
          },
          undefined,
          "toggleRelicSelection",
        );
      },
      enemyData: undefined as unknown as EnemyData,
      enemyDataParsed: dummy,
      setEnemyData: (enemyData) =>
        set(
          (state) => ({
            ...state,
            enemyData,
          }),
          undefined,
          "setEnemyData",
        ),
      setEnemyDataParsed: (enemyDataParsed) =>
        set(
          (state) => ({
            ...state,
            enemyDataParsed: enemyDataParsed,
          }),
          undefined,
          "setEnemyDataParsed",
        ),
      enemySpec: undefined as unknown as EnemySpec[],
      setEnemySpec: (enemySpec) =>
        set(
          (state) => {
            // 字符串判断，解决enemyData与enemySpec的组件层级不同，更新不同步的问题
            if (JSON.stringify(state.enemySpec) === JSON.stringify(enemySpec)) return;
            state.enemySpec = enemySpec;
          },
          undefined,
          "setEnemySpec",
        ),
      charsModifier: {} as Record<string, AttributeModifier>,
      setCharsModifier: (charName, modifier) => {
        set(
          (state) => {
            state.charsModifier[charName] = modifier;
          },
          undefined,
          "setCharsModifier",
        );
      },
      setStageData: (stageData) => set((state) => ({ ...state, stageData }), undefined, "setStageData"),
      setLevelData: (levelData) => set((state) => ({ ...state, levelData }), undefined, "setLevelData"),
      calcOutput: undefined as unknown as CalculatorOutput,
      setCalcOutput: (output) => {
        set(
          (state) => {
            state.calcOutput = output;
          },
          undefined,
          "setCalcOutput",
        );
      },
    })),
    { name: "damageCalculatorStore" },
  ),
);
