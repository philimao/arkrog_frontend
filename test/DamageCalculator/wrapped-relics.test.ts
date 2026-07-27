import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRelicsData, getRelicUiStates } from "~/stores/damageCalculator/calcUtils/relicUtils";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import type { ItemData, RogueKey, WrappedRelicItem } from "~/types/gameData";
import { CalculatorHelper } from "~/modules/Tool/DamageCalculator/calculator";

/** 为手写包装 fixture 补齐 item 与 relic 合并后的字段。 */
function relicItemFields(id: string, name: string, usage: string) {
  return { id, name, usage, description: null, rarity: "NORMAL", sortId: 0, type: "RELIC" };
}

describe("共享包装藏品接入", () => {
  beforeEach(() => {
    // 每个用例清空主题缓存，保证请求次数断言相互独立。
    useGameDataStore.setState({ relics: {} });
    useDamageCalculatorStore.setState({
      relics: {} as never,
      relicUiStateMap: {} as never,
      anyRelicContextMap: {} as never,
    });
    vi.restoreAllMocks();
  });

  it("保留原始 relic/charBuffs，并使用生成的 layer 与 enable 初始值", () => {
    const relic = { ...relicItemFields("relic", "测试藏品", "测试效果"), buffs: [] };
    const characterBuff = {
      id: "char-buff",
      relatedItemId: "relic",
      iconId: "relic",
      buffs: [],
    };
    const wrapped: WrappedRelicItem = {
      id: "relic",
      name: "测试藏品",
      pinyin: "ce_shi_cang_pin",
      relic,
      charBuffs: [characterBuff],
      layer: 0,
      enable: true,
    };
    // 单元测试只需要一个主题切片，运行时代码仍使用完整六主题 Record。
    const wrappedByTopic = { rogue_1: { relic: wrapped } } as unknown as Record<
      RogueKey,
      Record<string, WrappedRelicItem>
    >;
    const relicsData = getRelicsData(wrappedByTopic.rogue_1);
    const uiStates = getRelicUiStates(relicsData);

    expect(relicsData.relic?.relic).toBe(relic);
    expect(relicsData.relic?.charBuffs?.[0]).toBe(characterBuff);
    expect(relicsData.relic).toMatchObject({ layer: 0, enable: true });
    expect(uiStates.relic).toMatchObject({ hasLayer: false, disabled: false });
  });

  it("enable=false 时在读取原始 buff 前终止计算", () => {
    // getter 用于证明总开关不会进入任何藏品生效逻辑。
    const relic = {
      ...relicItemFields("disabled-relic", "禁用藏品", "不应生效"),
      get buffs(): never {
        throw new Error("禁用藏品不应读取 buffs");
      },
    };
    const wrapped: WrappedRelicItem = {
      id: "disabled-relic",
      name: "禁用藏品",
      pinyin: "jin_yong_cang_pin",
      relic,
      charBuffs: [],
      layer: 0,
      enable: false,
    };

    expect(() =>
      CalculatorHelper.applyRelic(
        { relic: wrapped, relics: [wrapped] },
        CalculatorHelper.createAdditionContext(),
      ),
    ).not.toThrow();
  });

  it("只请求指定主题，并复用同主题并发请求与已加载缓存", async () => {
    const artifact = {
      schemaVersion: 4 as const,
      sourceSha256: "test-source",
      topic: { id: "rogue_6", name: "测试主题" },
      sources: ["test"],
      items: [],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(artifact), { status: 200 }));
    const loadTopic = useGameDataStore.getState().fetchRelicTopic;

    await Promise.all([loadTopic("rogue_6"), loadTopic("rogue_6")]);
    await loadTopic("rogue_6");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/wrapped-relics/rogue_6.json");
    expect(Object.keys(useGameDataStore.getState().relics)).toEqual(["rogue_6"]);
  });

  it("拒绝尚未包含外层拼音的 v3 包装产物", async () => {
    // v3 没有稳定 pinyin 字段，不能进入 frontend 缓存。
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: 3,
          sourceSha256: "legacy-source",
          topic: { id: "rogue_6", name: "旧主题" },
          sources: ["test"],
          items: [],
        }),
        { status: 200 },
      ),
    );

    await expect(useGameDataStore.getState().fetchRelicTopic("rogue_6")).rejects.toThrow("需要 v4");
    expect(useGameDataStore.getState().relics.rogue_6).toBeUndefined();
  });

  it("计算器只初始化请求的主题映射", async () => {
    const item: ItemData = {
      id: "relic",
      name: "测试藏品",
      description: null,
      usage: "测试效果",
      type: "RELIC",
      subType: "NORMAL",
      rarity: "NORMAL",
      pinyin: "ce_shi",
    };
    const wrapped: WrappedRelicItem = {
      id: "relic",
      name: "测试藏品",
      pinyin: "ce_shi_cang_pin",
      relic: { ...relicItemFields("relic", "测试藏品", "测试效果"), buffs: [] },
      charBuffs: [],
      layer: 0,
      enable: true,
    };
    const artifact = {
      schemaVersion: 4 as const,
      sourceSha256: "test-source",
      topic: { id: "rogue_6", name: "测试主题" },
      sources: ["test"],
      items: [wrapped],
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(artifact), { status: 200 }),
    );
    useGameDataStore.setState({
      items: { rogue_6: { relic: item } } as never,
      relics: {},
    });

    await useDamageCalculatorStore.getState().loadRelicTopic("rogue_6");

    expect(Object.keys(useDamageCalculatorStore.getState().relics)).toEqual(["rogue_6"]);
    expect(Object.keys(useDamageCalculatorStore.getState().relicUiStateMap)).toEqual(["rogue_6"]);
  });
});
