import { describe, test, expect } from "vitest";
import { getRogue6Scraps } from "~/modules/Tool/DamageCalculator/TopicSpecSection/components/use-rogue6-topic-spec-items";
import {
  CalculatorHelper,
  BuffContext,
} from "~/modules/Tool/DamageCalculator/calculator";
import type { ItemData } from "~/types/gameData";
import fixture from "./data/rogue6-dlc1-scraps.json";

const items = Object.fromEntries(
  fixture.items.map((item) => [item.id, item]),
) as Record<string, ItemData>;
describe("DLC1 scrap coverage", () => {
  test("all 44 decoded scraps are present and only combat scraps are selectable", () => {
    const scraps = getRogue6Scraps(items);
    expect(scraps).toHaveLength(44);
    expect(
      scraps.filter((item) => !item.disabled).map((item) => item.id),
    ).toEqual(["rogue_6_scrap_P_01", "rogue_6_scrap_P_04"]);
    expect(fixture.added).toHaveLength(14);
    for (const id of fixture.added) {
      const item = scraps.find((item) => item.id === id)!;
      expect(item.disabled).toBe(true);
      expect(item.buffs).toEqual([]);
      expect(item.description).not.toMatch(/<[^>]*>/);
    }
  });
  test.each([
    ["rogue_6_scrap_P_01", 50],
    ["rogue_6_scrap_P_04", 35],
  ] as const)(
    "%s contributes its actual attack speed through analysis",
    (id, expected) => {
      const item = getRogue6Scraps(items).find((item) => item.id === id)!;
      const context = CalculatorHelper.analyzeTopicSpec(
        { topicSpecItems: [item] },
        new BuffContext(),
      );
      expect(context.relic_rune_add.attack_speed.calculate()).toBe(expected);
    },
  );
  test("both combat scraps stack to +85 attack speed", () => {
    const selected = getRogue6Scraps(items).filter((item) => !item.disabled);
    const context = CalculatorHelper.analyzeTopicSpec(
      { topicSpecItems: selected },
      new BuffContext(),
    );
    expect(context.relic_rune_add.attack_speed.calculate()).toBe(85);
  });
});
