import { describe, expect, test } from "vitest";

import { calculator } from "~/modules/Tool/DamageCalculator/calculator";
import dataHoederer01 from "./data/data_Hoederer_01.json";
import dataMon3tr01 from "./data/data_Mon3tr_01.json";
import dataVinaVictoria01 from "./data/data_Vina_Victoria_01.json";
import dataWisdel01 from "./data/data_Wiš'adel_01.json";

import type { CalculatorInput } from "~/types/gameData";

describe("肉鸽计算器", () => {
  test("测试赫德雷伤害", async () => {
    expect(calculator(dataHoederer01 as unknown as CalculatorInput)).toEqual({
      attack: {
        dph: 9163,
        dps: { phy: 4031.7200000000007, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 0, ep: 0 },
      },
      skill: {
        dph: 12304.6,
        dps: { phy: 5414.024, mag: 0, pure: 200, ep: 0 },
        total_damage: { phy: 378981.68000000005, mag: 0, pure: 14000, ep: 0 },
      },
      cycle: {
        dph: 0,
        dps: { phy: 4838.064, mag: 0, pure: 116.66666666666667, ep: 0 },
        total_damage: { phy: 580567.68, mag: 0, pure: 14000, ep: 0 },
      },
      logs: [],
    });
  });

  test("测试Mon3tr伤害", async () => {
    expect(calculator(dataMon3tr01 as unknown as CalculatorInput)).toEqual({
      attack: {
        dph: 0,
        dps: { phy: 0, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 0, ep: 0 },
      },
      skill: {
        dph: 0,
        dps: { phy: 0, mag: 0, pure: 11005.12, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 275128, ep: 0 },
      },
      cycle: {
        dph: 0,
        dps: { phy: 0, mag: 0, pure: 4194.024390243902, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 275128, ep: 0 },
      },
      logs: [],
    });
  });

  test("测试维娜·维多利亚伤害", async () => {
    expect(
      calculator(dataVinaVictoria01 as unknown as CalculatorInput),
    ).toEqual({
      attack: {
        dph: 0,
        dps: { phy: 6576.315789473684, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 0, ep: 0 },
      },
      skill: {
        dph: 0,
        dps: { phy: 0, mag: 0, pure: 12852, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 321300, ep: 0 },
      },
      cycle: {
        dph: 0,
        dps: { phy: 0, mag: 4331.6, pure: 4284, ep: 0 },
        total_damage: { phy: 0, mag: 324870, pure: 321300, ep: 0 },
      },
      logs: [],
    });
  });

  test("测试维什戴尔伤害", async () => {
    expect(calculator(dataWisdel01 as unknown as CalculatorInput)).toEqual({
      attack: {
        dph: 0,
        dps: { phy: 11017.416666666666, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 0, mag: 0, pure: 0, ep: 0 },
      },
      skill: {
        dph: 0,
        dps: { phy: 36228.178263199574, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 905704.4565799893, mag: 0, pure: 0, ep: 0 },
      },
      cycle: {
        dph: 0,
        dps: { phy: 20404.839131599787, mag: 0, pure: 0, ep: 0 },
        total_damage: { phy: 1020241.9565799893, mag: 0, pure: 0, ep: 0 },
      },
      logs: [],
    });
  });
});
