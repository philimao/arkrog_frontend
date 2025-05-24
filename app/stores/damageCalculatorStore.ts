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
} from "~/types/gameData";
import type { BuffContext } from "~/modules/Tool/DamageCalculator/calculator";

interface AttributeModifier {
  atkBase: number;
  atkPercent: number;
  atkFinal: number;
}

interface DamageCalculatorStore {
  rogueKey: RogueKey;
  /** 肉鸽难度 */
  rogueInput: RogueInput;
  difficulty: number;
  outBuff: string;
  charList: CharData[];
  /** 当前选中的角色 */
  activeCharName: string;
  /** 仅有藏品的加成上下文 */
  relicAnalysisResult?: BuffContext;
  showRelics: boolean;
  relicsMap: Record<RogueKey, RelicWrapper[]>;
  enemyBuff: Record<string, number>;
  /** @deprecated 请使用BuffContext中的relicBuff */
  charsBuff: Record<string, Record<string, number>>;
  /** @deprecated 请使用BuffContext中的in_game_buff */
  charsBuffInGame: Record<string, Record<string, number>>;
  charsModifier: Record<string, AttributeModifier>;
  selectedIds: string[];
  enemyData: EnemyData;
  enemyDataParsed: EnemyInput;
  calcOutput: CalculatorOutput;
}

interface DamageCalculatorAction {
  setRogueKey: (key: RogueKey) => void;
  setRogueInput: (rogueInput: RogueInput) => void;
  setRogueDifficulty: (difficulty: number) => void;
  setRogueZone: (zone: string) => void;
  setRogueThoughtLoad: (thoughtLoad: RogueInput["rogue_4"]["thoughtLoad"]) => void;
  setOutBuff: (outBuff: string) => void;
  addCharData: () => void;
  setCharData: (charData: CharData, i: number) => void;
  removeCharData: (i: number) => void;
  setActiveCharName: (charName: string) => void;
  setRelicAnalysisResult: (relicAnalysisResult: BuffContext) => void;
  setRelicWrapper: (rogueKey: RogueKey, relics: RelicWrapper[]) => void;
  toggleShowRelics: () => void;
  setRelicLayer: (id: string, layer: string) => string;
  updateRelic: (id: string, key: string, value: number | string | boolean) => void;
  updateRelics: (ids: string[], key: string, value: number | string | boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleRelicSelection: (id: string) => void;
  setEnemyData: (enemyData: EnemyData) => void;
  setEnemyDataParsed: (enemyDataParsed: EnemyInput) => void;
  setEnemyBuff: (buff: Record<string, number>) => void;
  setCharsBuff: (charName: string, buff: Record<string, number>) => void;
  setCharsModifier: (charName: string, modifier: AttributeModifier) => void;
  setCalcOutput: (output: CalculatorOutput) => void;
}

const dummy: EnemyInput = {
  id: "dummy",
  level: 0,
  name: "木桩",
  description: "请任意调整木桩数值",
  attributes: {
    maxHp: 0,
    atk: 0,
    def: 0,
    magicResistance: 0,
    blockCnt: 0,
    moveSpeed: 0,
    attackSpeed: 0,
    baseAttackTime: 0,
    epDamageResistance: 0,
    epResistance: 0,
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
          zone: "zone_7",
          difficulty: 18,
          thoughtLoad: "NORMAL",
        },
      } as RogueInput,
      setRogueInput: (rogueInput: RogueInput) => set((state) => ({ ...state, rogueInput }), undefined, "setRogueInput"),
      difficulty: 18,
      setRogueDifficulty: (difficulty) => {
        return set(
          (state) => {
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
      outBuff: "1.3",
      setOutBuff: (outBuff: string) => set((state) => ({ ...state, outBuff }), undefined, "setOutBuff"),
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
        set((state) => ({ ...state, relicAnalysisResult }), undefined, "setRelicAnalysisResult"),
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
      enemyDataParsed: dummy as unknown as EnemyInput,
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
      enemyBuff: {} as Record<string, number>,
      charsBuff: {} as Record<string, Record<string, number>>,
      charsBuffInGame: {} as Record<string, Record<string, number>>,
      setEnemyBuff: (buff) => set((state) => ({ ...state, enemyBuff: buff }), undefined, "setEnemyBuff"),
      setCharsBuff: (charName, buff) => {
        set(
          (state) => {
            state.charsBuff[charName] = buff as never;
          },
          undefined,
          "setCharsBuff",
        );
      },
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
