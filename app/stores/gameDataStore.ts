import { _get } from "~/utils/tools";
import type { GameData } from "~/types/gameData";
import { create } from "zustand";
import type { BasicObject } from "~/types/core";
import { toast } from "react-toastify";
import { devtools } from "zustand/middleware";

type GameDataAction = {
  loading: boolean;
  fetchGameData: () => Promise<void>;
  fetchGameDataExt: () => Promise<void>;
  fetchCharacterRaw: () => Promise<void>;
};

export const useGameDataStore = create<Partial<GameData> & GameDataAction>()(
  devtools(
    (set, get) => ({
      topics: undefined,
      stages: undefined,
      zones: undefined,
      traps: undefined,
      relics: undefined,
      items: undefined,
      character_basic: undefined,
      uniequipDict: undefined,
      character_table: undefined,
      skill_table: undefined,
      uniequip_table: undefined,
      loading: false,
      fetchGameData: async () => {
        try {
          set({ loading: true }, undefined, "loading");
          const dataArray = await Promise.all([
            _get<Partial<GameData>>("/gamedata/bundle"),
            _get<Partial<GameData>>("/gamedata/character-basic"),
          ]);
          if (dataArray.every((i) => i)) {
            dataArray.forEach((data) => {
              set(
                (state) => ({
                  ...state,
                  ...data,
                }),
                undefined,
                "fetchGameData",
              );
            });
          }
          const character_basic = get().character_basic;
          const uniequipDict: BasicObject = {};
          Object.values(character_basic || {}).forEach((charData) => {
            const { uniequip } = charData;
            for (const key in uniequip) {
              uniequipDict[key] = uniequip[key];
            }
          });
          set(
            {
              uniequipDict: uniequipDict,
              loading: false,
            },
            undefined,
            "loading",
          );
          // console.log(get());
        } catch (err) {
          console.error(err);
          toast.error("游戏数据加载失败\n" + (err as Error).message);
        }
      },
      fetchGameDataExt: async () => {
        try {
          set({ loading: true }, undefined, "loading");
          const extData: GameData | undefined = await _get(
            "/gamedata/bundle-ext",
          );
          if (extData) {
            set(
              (state) => ({
                ...state,
                ...extData,
              }),
              undefined,
              "fetchGameDataExt",
            );
          }
          set({ loading: false }, undefined, "loading");
        } catch (err) {
          toast.error("游戏补充数据加载失败\n" + (err as Error).message);
        }
      },
      fetchCharacterRaw: async () => {
        try {
          if (get().character_table) return;
          set({ loading: true }, undefined, "loading");
          const data: GameData | undefined = await _get(
            "/gamedata/character-raw",
          );
          if (data) {
            set(
              (state) => ({
                ...state,
                ...data,
              }),
              undefined,
              "fetchCharacterRaw",
            );
          }
          set({ loading: false }, undefined, "loading");
        } catch (err) {
          toast.error("干员数据加载失败\n" + (err as Error).message);
        }
      },
    }),
    { name: "gameDataStore" },
  ),
);
