import { toast } from "react-toastify";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CharBasicData, CharId, StagePreview, UniEquipBasicData } from "~/types/gameData";
import { _get } from "~/utils/tools";

type RelicFreeBasic = {
  /** 干员基础数据 */
  character_basic: Record<CharId, CharBasicData>;
  /** 模组基础数据 */
  uniequip_basic: Record<string, UniEquipBasicData>;
  /** 无藏记录预览 */
  stagePreview?: StagePreview;
  /** 敌方预览数据 */
  stageEnemies?: Record<string, string[]>;
};

type RelicFreeState = RelicFreeBasic & {
  /** 无藏记录数据是否已加载 */
  relicFreeDataLoaded: boolean;
  /** 无藏记录预览数据是否已加载 */
  stagePreviewLoaded: boolean;
};

type RelicFreeAction = {
  fetchRelicFreeData: () => Promise<void>;
  fetchStagePreview: (force?: boolean) => Promise<void>;
};

export const useRelicFreeStore = create<RelicFreeState & RelicFreeAction>()(
  devtools(
    (set, get) => ({
      stageEnemies: undefined,
      stagePreview: undefined,
      fetchRelicFreeData: async () => {
        try {
          if (get().relicFreeDataLoaded) return;
          console.log("fetchRelicFreeData");
          const data = await _get<RelicFreeBasic>("/relic-free/bundle");
          console.log("relic-free data", data);
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
      fetchStagePreview: async (force = false) => {
        try {
          if (get().stagePreviewLoaded && !force) return;
          const data = await _get<StagePreview>("/relic-free/stage-preview");
          set({ stagePreview: data, stagePreviewLoaded: true });
        } catch (err) {
          console.error(err);
          toast.error(`加载无藏记录预览数据失败！`);
        }
      },
    }),
    { name: "relicFreeStore" },
  ),
);
