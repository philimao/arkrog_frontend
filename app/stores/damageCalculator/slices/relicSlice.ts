import type { SlicedCalcRelicActions, SlicedCalcRelicState } from "../calcTypes";
import { initialRelicState } from "../calcConstants";
import type { SliceCreator } from "../calcTypes";
import type { WrappedRelicItem } from "~/types/gameData";

import {
  assertions_layer_sync,
  baoleixieyi_layer_sync,
  gin_layer_sync,
  pohuaixieyi_layer_sync,
  sizhuke_layer_sync,
  thought_layer_sync,
  tujixieyi_layer_sync,
  yuanchengxieyi_layer_sync,
} from "~/modules/Tool/DamageCalculator/utils";

export const createRelicSlice: SliceCreator<SlicedCalcRelicState & SlicedCalcRelicActions> = (set) => ({
  ...initialRelicState,
  updateRelic: (id, key, value) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        // 用户态只允许修改包装字段，原封的 relic/charBuffs 不可写入。
        state.relics[rogueKey][id][key as keyof Pick<WrappedRelicItem, "layer" | "enable">] = value as never;
      },
      false,
      "updateRelic",
    ),
  updateRelics: (ids, key, value) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        const relics = state.relics[rogueKey];
        Object.values(relics)
          .filter((relic) => ids.includes(relic.id))
          .forEach((relic) => {
            relic[key as keyof Pick<WrappedRelicItem, "layer" | "enable">] = value as never;
          });
      },
      false,
      "updateRelics",
    ),
  setRelicLayer: (id: string, layer: string) => {
    const layerNumber = parseInt(layer) || 0;
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        const relics = state.relics[rogueKey];
        function updateRelics(ids: string[], key: string, value: number) {
          Object.values(relics)
            .filter((relic) => ids.includes(relic.id))
            .forEach((relic) => {
              relic[key as keyof Pick<WrappedRelicItem, "layer">] = value as never;
            });
        }
        if (gin_layer_sync.includes(id)) {
          updateRelics(gin_layer_sync, "layer", layerNumber);
        } else if (thought_layer_sync.includes(id)) {
          updateRelics(thought_layer_sync, "layer", layerNumber);
        } else if (assertions_layer_sync.includes(id)) {
          updateRelics(assertions_layer_sync, "layer", layerNumber);
        } else if (tujixieyi_layer_sync.includes(id)) {
          updateRelics(tujixieyi_layer_sync, "layer", layerNumber);
        } else if (baoleixieyi_layer_sync.includes(id)) {
          updateRelics(baoleixieyi_layer_sync, "layer", layerNumber);
        } else if (yuanchengxieyi_layer_sync.includes(id)) {
          updateRelics(yuanchengxieyi_layer_sync, "layer", layerNumber);
        } else if (pohuaixieyi_layer_sync.includes(id)) {
          updateRelics(pohuaixieyi_layer_sync, "layer", layerNumber);
        } else if (sizhuke_layer_sync.includes(id)) {
          updateRelics(sizhuke_layer_sync, "layer", layerNumber);
        } else {
          state.relics[rogueKey][id].layer = layerNumber;
        }
      },
      undefined,
      "setRelicLayer",
    );
    return layerNumber.toString();
  },
  setSelectedIds: (ids) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        state.rogueInput[rogueKey].relics = ids;
      },
      undefined,
      "setSelectedIds",
    ),
  selectRelic: (id) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        const selectedIds = state.rogueInput[rogueKey].relics;
        if (!selectedIds.includes(id)) {
          selectedIds.push(id);
        }
      },
      undefined,
      "selectRelic",
    ),
  unselectRelic: (id) =>
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        const selectedIds = state.rogueInput[rogueKey].relics;
        if (selectedIds.includes(id)) {
          const i = selectedIds.indexOf(id);
          selectedIds.splice(i, 1);
        }
      },
      undefined,
      "unselectRelic",
    ),
  toggleRelicSelection: (id) => {
    set(
      (state) => {
        const rogueKey = state.rogueInput.topic;
        const selectedIds = state.rogueInput[rogueKey].relics;
        if (selectedIds.includes(id)) {
          const i = selectedIds.indexOf(id);
          selectedIds.splice(i, 1);
        } else {
          selectedIds.push(id);
        }
      },
      undefined,
      "toggleRelicSelection",
    );
  },
});
