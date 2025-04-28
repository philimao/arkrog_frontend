import { create } from "zustand/index";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import type {
  CharData,
  EnemyData,
  EnemyDataParsed,
  RogueKey,
} from "~/types/gameData";
import { type RelicWrapper } from "~/modules/Tool/DamageCalculator/utils";

interface DamageCalculatorStore {
  rogueKey: RogueKey;
  difficulty: string;
  outBuff: string;
  charList: CharData[];
  activeCharName: string;
  relicsMap: Record<string, Record<RogueKey, RelicWrapper[]>>;
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
  setRelicWrapper: (
    charName: string,
    rogueKey: RogueKey,
    relics: RelicWrapper[],
  ) => void;
  setEnemyData: (enemyData: EnemyData) => void;
  setEnemyDataParsed: (enemyDataParsed: EnemyDataParsed) => void;
  toggleShowRelics: () => void;
  setRelicLayer: (id: string, layer: string) => string;
  updateRelic: (
    id: string,
    key: string,
    value: number | string | boolean,
  ) => void;
  updateRelics: (
    ids: string[],
    key: string,
    value: number | string | boolean,
  ) => void;
}

export const useDamageCalculatorStore = create<
  DamageCalculatorStore & DamageCalculatorAction
>()(
  devtools(
    immer((set) => ({
      rogueKey: "rogue_4" as RogueKey,
      setRogueKey: (rogueKey) =>
        set((state) => ({ ...state, rogueKey }), undefined, "setRogueKey"),
      difficulty: "N18",
      setDifficulty: (difficulty) =>
        set((state) => ({ ...state, difficulty }), undefined, "setDifficulty"),
      outBuff: "1.3",
      setOutBuff: (outBuff: string) =>
        set((state) => ({ ...state, outBuff }), undefined, "setOutBuff"),
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
      relicsMap: {},
      setRelicWrapper: (charName, rogueKey, relics) =>
        set(
          (state) => {
            state.relicsMap[charName] = {
              ...state.relicsMap[charName],
              [rogueKey]: relics,
            };
          },
          false,
          "setRelicWrapper",
        ),
      updateRelic: (id, key, value) =>
        set(
          (state) => {
            const relicWrappers = state.relicsMap[state.activeCharName]?.[
              state.rogueKey
            ] as RelicWrapper[];
            if (relicWrappers) {
              relicWrappers.find((relicWrapper) => relicWrapper.id === id)![
                key as keyof RelicWrapper
              ] = value as never;
            }
          },
          false,
          "updateRelic",
        ),
      updateRelics: (ids, key, value) =>
        set(
          (state) => {
            const relicWrappers = state.relicsMap[state.activeCharName]?.[
              state.rogueKey
            ] as RelicWrapper[];
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
        if (layerNumber) {
          set(
            (state) => {
              state.relicsMap[state.activeCharName][state.rogueKey].find(
                (r) => r.id === id,
              )!.layer = layerNumber || 0;
            },
            undefined,
            "setRelicLayer",
          );
        }
        return layerNumber.toString();
      },
      enemyData: undefined as unknown as EnemyData,
      enemyDataParsed: undefined as unknown as EnemyDataParsed,
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
    })),
    { name: "damageCalculatorStore" },
  ),
);
