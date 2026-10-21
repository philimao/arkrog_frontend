import { beforeEach, describe, expect, test, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
  DCalculatorActions,
  DCalculatorState,
} from "~/stores/damageCalculator/calcTypes";
import { createGameDataSlice } from "~/stores/damageCalculator/slices/gameDataSlice";
import { createRelicSlice } from "~/stores/damageCalculator/slices/relicSlice";
import { initialState } from "~/stores/damageCalculator/calcConstants";
import { RogueTopic } from "~/types/gameData";
import type { StageData, LevelData } from "~/types/gameData";
import { ROGUE6_ENDING_RELIC } from "~/stores/damageCalculator/calcUtils/rogue6Ending";

const requests = vi.hoisted(() => new Map<string, () => void>());
vi.mock("~/stores/damageCalculator/calcUtils/gameDataUtils", () => ({
  getStageList: (
    _zones: unknown,
    _stages: unknown,
    input: { topic: string; rogue_6: { zone: string } },
  ) => [
    {
      id:
        input.topic === "rogue_6"
          ? `stage_${input.rogue_6.zone}`
          : "stage_other_topic",
    },
  ],
  handleUpdateStageId: (input: { stageId: string; relics: string[] }) =>
    new Promise((resolve) => {
      requests.set(input.stageId, () =>
        resolve({
          stageData: { id: input.stageId },
          levelData: { enemies: [] },
          levels: {},
          relics: [
            ...input.relics,
            ...(input.stageId === "ro4_b_7" ? ["rogue_4_relic_final_6"] : []),
          ],
          enemyData: undefined,
          enemyBase: initialState.enemyBase,
        }),
      );
    }),
}));
vi.mock("~/modules/Tool/DamageCalculator/EnemySection/enemyUtils", () => ({
  getDefaultLayerForStage: (
    _id: string,
    input: { topic: string; [key: string]: unknown },
  ) => (input[input.topic] as { layer: string }).layer,
  getDefaultLayerForZone: () => "layer_6",
}));

type State = DCalculatorState & DCalculatorActions;
function makeStore(topic = RogueTopic.ROGUE_6) {
  const store = createStore<State>()(
    devtools(
      immer((set, get, api) => ({
        ...initialState,
        ...createGameDataSlice(set, get, api),
        ...createRelicSlice(set, get, api),
      })),
    ),
  );
  const base = store.getState();
  store.setState({
    rogueInput: {
      ...base.rogueInput,
      topic,
      rogue_6: { ...base.rogueInput.rogue_6, relics: [] },
    },
    stageId: "ro6_b_1",
    stages: {
      ...base.stages,
      rogue_6: {
        ro6_b_1: { id: "ro6_b_1" },
        ro6_b_1_dlc1: { id: "ro6_b_1_dlc1" },
      } as unknown as Record<string, StageData>,
    },
    levels: {} as Record<string, LevelData>,
  });
  return store;
}
beforeEach(() => requests.clear());
describe("async calculator navigation", () => {
  test("ordinary relic edit does not drop a boss switch or lose the edit", async () => {
    const store = makeStore();
    const pending = store.getState().setRogueStageId("ro6_b_1_dlc1");
    await store.getState().selectRelic("ordinary");
    requests.get("ro6_b_1_dlc1")!();
    await pending;
    expect(store.getState().stageId).toBe("ro6_b_1_dlc1");
    expect(store.getState().rogueInput.rogue_6.relics).toEqual([
      "ordinary",
      ROGUE6_ENDING_RELIC,
    ]);
  });
  test("removing the ending relic cancels its pending enhanced boss", async () => {
    const store = makeStore();
    const pending = store.getState().selectRelic(ROGUE6_ENDING_RELIC);
    await store.getState().unselectRelic(ROGUE6_ENDING_RELIC);
    requests.get("ro6_b_1_dlc1")!();
    await pending;
    expect(store.getState().stageId).toBe("ro6_b_1");
    expect(store.getState().rogueInput.rogue_6.relics).toEqual([]);
  });
  test("latest stage wins when responses arrive out of order", async () => {
    const store = makeStore();
    const first = store.getState().setRogueStageId("first");
    const second = store.getState().setRogueStageId("second");
    requests.get("second")!();
    await second;
    requests.get("first")!();
    await first;
    expect(store.getState().stageId).toBe("second");
  });
  test.each(["zone", "topic", "input"])(
    "new %s intent cancels a pending stage before it finishes",
    async (kind) => {
      const store = makeStore();
      const first = store.getState().setRogueStageId("ro6_b_1_dlc1");
      let next: Promise<unknown> | undefined;
      if (kind === "zone") next = store.getState().setRogueZone("zone_7");
      else if (kind === "topic")
        next = store.getState().setRogueKey(RogueTopic.ROGUE_5);
      else store.getState().setRogueInput({ ...store.getState().rogueInput });
      requests.get("ro6_b_1_dlc1")!();
      await first;
      expect(store.getState().stageId).toBe("ro6_b_1");
      if (next) {
        requests.get(kind === "zone" ? "stage_zone_7" : "stage_other_topic")!();
        await next;
        expect(store.getState().stageId).toBe(
          kind === "zone" ? "stage_zone_7" : "stage_other_topic",
        );
      }
    },
  );
  test("other topics preserve edits and required automatic stage relics", async () => {
    const store = makeStore(RogueTopic.ROGUE_4);
    const first = store.getState().setRogueStageId("ro4_b_7");
    await store.getState().selectRelic("ordinary");
    requests.get("ro4_b_7")!();
    await first;
    expect(store.getState().rogueInput.rogue_4.relics).toEqual([
      "ordinary",
      "rogue_4_relic_final_6",
    ]);
  });
});
