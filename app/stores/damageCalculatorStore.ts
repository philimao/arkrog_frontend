import { create } from "zustand/index";
import { devtools } from "zustand/middleware";
import type {
  CharData,
  EnemyData,
  EnemyDataParsed,
  RogueKey,
} from "~/types/gameData";
import { type RelicWrapper2 } from "~/modules/Tool/DamageCalculator/utils";

interface DamageCalculatorStore {
  rogueKey: RogueKey;
  difficulty: string;
  outBuff: string;
  charData: CharData;
  charList: (CharData | undefined)[];
  activeCharName: string;
  relicsMap: Record<string, RelicWrapper2[]>;
  enemyData: EnemyData;
  enemyDataParsed: EnemyDataParsed;
  showRelics: boolean;
}

interface DamageCalculatorAction {
  setRogueKey: (key: RogueKey) => void;
  setDifficulty: (difficulty: string) => void;
  setOutBuff: (outBuff: string) => void;
  addCharData: () => void;
  setCharData: (charData: CharData, i: number) => void;
  removeCharData: (i: number) => void;
  setActiveCharName: (charName: string) => void;
  setRelicsMap: (charName: string, relics: RelicWrapper2[]) => void;
  setEnemyData: (enemyData: EnemyData) => void;
  setEnemyDataParsed: (enemyDataParsed: EnemyDataParsed) => void;
  toggleShowRelics: () => void;
}

export const useDamageCalculatorStore = create<
  DamageCalculatorStore & DamageCalculatorAction
>()(
  devtools(
    (set) => ({
      rogueKey: "rogue_4",
      setRogueKey: (rogueKey) =>
        set((state) => ({ ...state, rogueKey }), undefined, "setRogueKey"),
      difficulty: "N18",
      setDifficulty: (difficulty) =>
        set((state) => ({ ...state, difficulty }), undefined, "setDifficulty"),
      outBuff: "1.3",
      setOutBuff: (outBuff: string) =>
        set((state) => ({ ...state, outBuff }), undefined, "setOutBuff"),
      charList: [undefined],
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
            return { ...state, charList };
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
              charList.push(undefined);
              if (activeCharName === charName) activeCharName = "";
            } else {
              activeCharName = charList[0]!.name;
            }
            return { ...state, charList, activeCharName };
          },
          undefined,
          "removeCharData",
        ),
      activeCharName: "",
      setActiveCharName: (charName) =>
        set(
          (state) => ({ ...state, activeCharName: charName }),
          undefined,
          "setActiveCharName",
        ),
      relicsMap: new Map(),
      setRelicsMap: (charName, relics) =>
        set(
          (state) => {
            const relicsMap = state.relicsMap;
            relicsMap[charName] = relics;
            return { ...state, relicsMap };
          },
          undefined,
          "setRelicsMap",
        ),
      enemyData: undefined,
      enemyDataParsed: undefined,
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
      topicData: undefined,
      showRelics: false,
      toggleShowRelics: () =>
        set(
          (state) => ({
            ...state,
            showRelics: !state.showRelics,
          }),
          undefined,
          "toggleShowRelics",
        ),
    }),
    { name: "damageCalculatorStore" },
  ),
);
