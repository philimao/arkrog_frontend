import { toast } from "react-toastify";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CharBasicData, CharId, EnemyBasicData, StagePreview, UniEquipBasicData } from "~/types/gameData";
import { _get } from "~/utils/tools";

type RelicFreeBasic = {
  /** 干员基础数据 */
  character_basic: Record<CharId, CharBasicData>;
  /** 模组基础数据 */
  uniequip_basic: Record<string, UniEquipBasicData>;
  /** 无藏记录预览 */
  stagePreview?: StagePreview;
  /** 敌人基础数据 */
  enemies: Record<string, EnemyBasicData[]>;
};

type RelicFreeState = RelicFreeBasic & {
  /** 无藏记录数据是否已加载 */
  relicFreeDataLoaded: boolean;
};

type RelicFreeAction = {
  fetchRelicFreeData: () => Promise<void>;
};

export const useRelicFreeStore = create<RelicFreeState & RelicFreeAction>()(
  devtools(
    (set, get) => ({
      enemies: undefined,
      stagePreview: undefined,
      fetchRelicFreeData: async () => {
        try {
          if (get().relicFreeDataLoaded) return;
          console.log("fetchRelicFreeData");
          const data = await _get<RelicFreeBasic>("/relic-free/bundle");
          // 提取模组基础数据
          const character_basic = data.character_basic;
          data.uniequip_basic = {};
          Object.values(character_basic || {}).forEach((charData) => {
            const { uniequip } = charData;
            for (const key in uniequip) {
              data.uniequip_basic[key] = uniequip[key];
            }
          });
          set({ ...data, relicFreeDataLoaded: true });
        } catch (err) {
          console.error(err);
          toast.error(`加载无藏记录数据失败！`);
        }
      },
    }),
    { name: "relicFreeStore" },
  ),
);
