import { useMemo, useRef, useState } from "react";
import { useGameDataStore } from "~/stores/gameDataStore";
import {
  StyledGridContainer,
  StyledGridItem,
  StyledGridItemIcon,
  StyledGridItemInner,
  StyledGridItemTitle,
  type ITopicSpecConfig,
} from "../TopicSpecSelector";
import { useDamageCalculatorStore } from "~/stores/damageCalculatorStore";
import { StyledTitle } from "~/modules/Tool/components/Shared";
import { getPath, imageHost } from "~/utils/tools";
import type { BlackboardData, RelicDataExt, RelicWrapper } from "~/types/gameData";
import { applyAnyRelics } from "../../calculator/debug/print-relics-info";
import { BuffContext, CalculatorHelper } from "../../calculator";
import { wrapRelicData } from "~/stores/damageCalculator/calcUtils/relicUtils";
import type { ExpressionGroupNode } from "../../calculator/ast";
import { styled } from "styled-components";
import { allowedBlackboardKeyMap } from "../../utils";

export default function Rogue5Selector() {
  const { items, relics } = useGameDataStore();
  const { rogueInput, topicSpecItems, setTopicSpecItems } = useDamageCalculatorStore();

  /** 通宝 */
  const coppers: RelicDataExt[] = useMemo(() => {
    const result = Object.values(relics.rogue_5)
      .filter((relic) => relic.id.includes("copper"))
      .map((relic) => ({
        ...items.rogue_5[relic.id],
        ...relic,
      }));
    return result;
  }, [items.rogue_5, relics.rogue_5]);

  const anyRelicContext = useRef<BuffContext>({} as BuffContext);

  const [coppersWrapper, setCoppersWrapper] = useState<RelicWrapper[]>(() => {
    const result = coppers.map((copper) => wrapRelicData(copper));
    const copperList = result.map((copperWrapper) => ({
      ...copperWrapper,
      ...coppers.find((copper) => copper.id === copperWrapper.id)!,
    }));
    /** 应用所有通宝buff，标注无效的通宝 */
    anyRelicContext.current = applyAnyRelics(copperList);
    const validCopperList: string[] = [];
    Object.values(anyRelicContext.current).forEach((value: string[] | Record<string, ExpressionGroupNode>) => {
      if (Array.isArray(value)) return;
      Object.values(value).forEach((node: ExpressionGroupNode) =>
        node.children.forEach((child) => validCopperList.push(child.tooltip)),
      );
    });
    result.forEach((copper) => {
      if (!validCopperList.includes(copper.name)) {
        copper.disabled = true;
      }
    });
    // CalculatorHelper.printAdditionContext(anyRelicContext.current, copperList);
    console.log(anyRelicContext.current);
    return result;
  });

  /** 难度 */
  const difficulty = rogueInput[rogueInput.topic].difficulty;
  /** 岁时天象等级 */
  const level = difficulty < 6 ? 0 : difficulty < 13 ? 1 : 2;
  /** 岁时天象 */
  const levelStr = levels[level];

  return (
    <>
      <StyledTitle>岁时</StyledTitle>
      <StyledGridContainer $cols={4}>
        {Object.values(wrath)
          .sort((a, b) => wrathOrder.indexOf(a.name) - wrathOrder.indexOf(b.name))
          .map((wr) => {
            const buffs = wr.values[level];
            const desc = wr.functionDesc(buffs.map((buff) => buff.blackboard).flat());
            const url = imageHost + getPath(`集成战略_6_岁时_${wr.name}.png`);
            const onClick = () => {
              setTopicSpecItems((nodes) => {
                const updated = [...nodes];
                let index;
                if ((index = updated.findIndex((node) => node.id === wr.id)) > -1) updated.splice(index, 1);
                else {
                  updated.unshift({
                    ...wr,
                    description: desc,
                    url,
                    userActive: true,
                    invert: 0,
                    buffs,
                    rows: 1,
                    layer: 1,
                  });
                }
                return updated;
              });
            };
            return (
              <StyledGridItem
                key={wr.id}
                $selected={!!topicSpecItems.find((node) => node.id === wr.id)}
                onClick={onClick}
                $disabled={wr.disabled}
              >
                <StyledGridItemInner>
                  <StyledGridItemIcon $url={url} />
                  <div className="flex flex-col gap-0.5 justify-center">
                    <StyledGridItemTitle>
                      <span>{wr.name}</span>
                      <span>{levelStr}</span>
                    </StyledGridItemTitle>
                    <div className="text-tiny">{desc}</div>
                  </div>
                </StyledGridItemInner>
              </StyledGridItem>
            );
          })}
      </StyledGridContainer>
      {["厉", "花", "衡"].map((type) => (
        <div key={type}>
          <StyledTitle>{type + "钱"}</StyledTitle>
          <StyledGridContainer $cols={4}>
            {coppersWrapper
              .filter((copperWrapper) => copperWrapper.name.startsWith(type))
              .map((copperWrapper) => {
                const onClick = () => {
                  setTopicSpecItems((nodes) => {
                    const updated = [...nodes];
                    let index;
                    if ((index = updated.findIndex((node) => node.id === copperWrapper.id)) > -1)
                      updated.splice(index, 1);
                    else {
                      const copper = coppers.find((copper) => copper.id === copperWrapper.id)!;
                      updated.push({
                        ...copperWrapper,
                        description: copperWrapper.usage,
                        url: "#",
                        userActive: true,
                        invert: 0,
                        buffs: copper.buffs,
                        rows: 1,
                      });
                    }
                    return updated;
                  });
                };
                const buffStrs: string[] = [];
                const parse = (buffKey: string, key: string, value: number) =>
                  `${buffKey.startsWith("in_game") ? "局内" : ""}${allowedBlackboardKeyMap[key] || key}: ${buffKey.endsWith("_add") ? value : Math.round(value * 100) + "%"}`;
                Object.entries(anyRelicContext.current!).forEach(([buffKey, buffValue]) => {
                  if (Array.isArray(buffValue)) return;
                  Object.entries(buffValue).forEach(([key, value]) => {
                    const node = value as ExpressionGroupNode;
                    for (const child of node.children) {
                      if (child.tooltip === copperWrapper.name) {
                        // 加算与减伤的基数为0，乘算的基数为1
                        const effectiveValue =
                          buffKey.endsWith("_add") || key === "enemy_damage_resistance"
                            ? child.calculate()
                            : child.calculate() - 1;
                        if (!effectiveValue) return;
                        buffStrs.push(parse(buffKey, key, child.calculate()));
                      }
                    }
                  });
                });
                return (
                  <StyledGridItem
                    key={copperWrapper.id}
                    $selected={!!topicSpecItems.find((node) => node.id === copperWrapper.id)}
                    onClick={onClick}
                    $disabled={copperWrapper.disabled}
                  >
                    <StyledGridItemInner>
                      <div className="flex flex-col gap-0.5 justify-center">
                        <StyledGridItemTitle>
                          <span>{copperWrapper.name}</span>
                        </StyledGridItemTitle>
                        <div className="text-tiny">{copperWrapper.usage}</div>
                        {buffStrs.length > 0 && (
                          <div
                            className="text-tiny mt-2 pt-2 whitespace-pre-wrap"
                            style={{ borderTop: "1px solid var(--ak-blue)" }}
                          >
                            {buffStrs.join("\n")}
                          </div>
                        )}
                      </div>
                      {copperWrapper.hasLayer && (
                        <LayerInput
                          updateLayer={(layer: number) => {
                            // 如何与topicSpecItems同步？ TODO
                            setCoppersWrapper(() => {
                              const updated = [...coppersWrapper];
                              const index = updated.findIndex((copper) => copper.id === copperWrapper.id);
                              if (index > -1) updated[index].layer = layer;
                              return updated;
                            });
                          }}
                        />
                      )}
                    </StyledGridItemInner>
                  </StyledGridItem>
                );
              })}
          </StyledGridContainer>
        </div>
      ))}
    </>
  );
}

const StyledLayerWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  position: absolute;
  right: 0;
  top: 0;
  height: 1rem;
  font-size: 0.8rem;
  background: var(--black-gray);
  text-align: center;
  align-items: center;
  color: var(--ak-blue);
  font-weight: bold;
  & > input {
    width: 2rem;
    height: 100%;
    padding: 0 0.25rem;
    text-align: center;
  }
  & > input:focus-visible {
    outline: none;
  }
`;

function LayerInput({ updateLayer }: { updateLayer: (layer: number) => void }) {
  const [layer, setLayer] = useState("1");
  return (
    <StyledLayerWrapper>
      <span>层数</span>
      <input
        type="text"
        value={layer}
        onChange={(evt) => setLayer(evt.target.value)}
        onClick={(evt) => evt.stopPropagation()}
        onKeyDown={(evt) => evt.key === "Enter" && evt.currentTarget.blur()}
        onBlur={() => {
          const layerNum = Number(layer) || 1;
          setLayer(String(layerNum));
          updateLayer(layerNum);
        }}
      />
    </StyledLayerWrapper>
  );
}

/** 岁时天象 */
const levels = ["朦胧", "真切", "入髓"];

/** 地支顺序 */
const wrathOrder = ["子武", "丑谋", "寅诗", "卯律", "辰■", "巳农", "午商", "未建", "申铸", "酉疗", "戌绘", "亥食"];

/** 秉烛岁谱 */
const wrath: Record<string, ITopicSpecConfig> = {
  rogue_5_wrath_1: {
    id: "rogue_5_wrath_1",
    name: "戌绘",
    functionDesc: (blackboard: BlackboardData[]) =>
      `随机${blackboard.find((item) => item.key === "profession_count")?.value}个职业的干员首次部署后立即受到便符附着（近卫/辅助/特种/狙击/术师/先锋）`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "profession_count", value: 1, valueStr: null },
            { key: "selector.profession", value: 0, valueStr: "warrior|support|special|sniper|caster|pioneer" },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "profession_count", value: 2, valueStr: null },
            { key: "selector.profession", value: 0, valueStr: "warrior|support|special|sniper|caster|pioneer" },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "profession_count", value: 3, valueStr: null },
            { key: "selector.profession", value: 0, valueStr: "warrior|support|special|sniper|caster|pioneer" },
          ],
        },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_2: {
    id: "rogue_5_wrath_2",
    name: "巳农",
    functionDesc: (blackboard: BlackboardData[]) =>
      `干员部署费用+${blackboard.find((item) => item.key === "cost")?.value}`,
    values: [
      [{ key: "char_attribute_add", blackboard: [{ key: "cost", value: 2, valueStr: null }] }],
      [{ key: "char_attribute_add", blackboard: [{ key: "cost", value: 3, valueStr: null }] }],
      [{ key: "char_attribute_add", blackboard: [{ key: "cost", value: 4, valueStr: null }] }],
    ],
    disabled: false,
  },
  rogue_5_wrath_3: {
    id: "rogue_5_wrath_3",
    name: "午商",
    functionDesc: (blackboard: BlackboardData[]) =>
      `诡意行商商品售价提升${blackboard.find((item) => item.key === "price_normal")?.value}%，较为稀有的商品售价提升${blackboard.find((item) => item.key === "price_rare")?.value}%`,
    values: [
      [
        { key: "", blackboard: [{ key: "price_normal", value: 0, valueStr: null }] },
        { key: "", blackboard: [{ key: "price_rare", value: 25, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "price_normal", value: 25, valueStr: null }] },
        { key: "", blackboard: [{ key: "price_rare", value: 25, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "price_normal", value: 25, valueStr: null }] },
        { key: "", blackboard: [{ key: "price_rare", value: 50, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_4: {
    id: "rogue_5_wrath_4",
    name: "丑谋",
    functionDesc: (blackboard: BlackboardData[]) =>
      `每进入一个非战斗节点，有${blackboard.find((item) => item.key === "probability")?.value}%${blackboard.find((item) => item.key === "target")?.valueStr}`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "target", value: 0, valueStr: "目标生命值" }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "target", value: 0, valueStr: "希望、目标生命值" }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 20, valueStr: null }] },
        { key: "", blackboard: [{ key: "target", value: 0, valueStr: "希望、目标生命值" }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_5: {
    id: "rogue_5_wrath_5",
    name: "未建",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有我方干员部署时，流失${blackboard.find((item) => item.key === "sp_loss")?.value}%最大技力值`,
    values: [
      [{ key: "", blackboard: [{ key: "sp_loss", value: 10, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_loss", value: 20, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_loss", value: 30, valueStr: null }] }],
    ],
    disabled: true,
  },
  rogue_5_wrath_6: {
    id: "rogue_5_wrath_6",
    name: "子武",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有我方干员部署时，有${blackboard.find((item) => item.key === "probability")?.value}%概率最大生命值-${blackboard.find((item) => item.key === "max_hp_loss")?.value}%`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "max_hp_loss", value: 20, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 10, valueStr: null }] },
        { key: "", blackboard: [{ key: "max_hp_loss", value: 30, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 15, valueStr: null }] },
        { key: "", blackboard: [{ key: "max_hp_loss", value: 40, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_7: {
    id: "rogue_5_wrath_7",
    name: "寅诗",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有敌人对非秉烛状态干员造成${blackboard.find((item) => item.key === "extra_damage")?.value}%额外伤害`,
    values: [
      [{ key: "", blackboard: [{ key: "enemy_damage_", value: 10, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "extra_damage", value: 15, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "extra_damage", value: 25, valueStr: null }] }],
    ],
    disabled: true,
  },
  rogue_5_wrath_8: {
    id: "rogue_5_wrath_8",
    name: "申铸",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有【化物】敌人生命值、攻击力+${Math.round(((blackboard.find((item) => item.key === "atk")?.value || 1) - 1) * 100)}%`,
    values: [
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "atk", value: 1.1, valueStr: null },
            { key: "max_hp", value: 1.1, valueStr: null },
          ],
        },
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "max_hp", value: 1.1, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "atk", value: 1.2, valueStr: null },
          ],
        },
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "max_hp", value: 1.2, valueStr: null },
          ],
        },
      ],
      [
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_atk_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "atk", value: 1.3, valueStr: null },
          ],
        },
        {
          key: "",
          blackboard: [
            { key: "key", value: 0, valueStr: "enemy_max_hp_down" },
            { key: "tag", value: 0, valueStr: "animated" },
            { key: "max_hp", value: 1.3, valueStr: null },
          ],
        },
      ],
    ],
    disabled: false,
  },
  rogue_5_wrath_9: {
    id: "rogue_5_wrath_9",
    name: "卯律",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有我方单位造成伤害后有${blackboard.find((item) => item.key === "probability")?.value}%概率晕眩${blackboard.find((item) => item.key === "stun_duration")?.value}秒`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 0.5, valueStr: null }] },
        { key: "", blackboard: [{ key: "stun_duration", value: 0.5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "stun_duration", value: 0.5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "stun_duration", value: 1, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_10: {
    id: "rogue_5_wrath_10",
    name: "酉疗",
    functionDesc: (blackboard: BlackboardData[]) =>
      `所有敌方受到伤害后有${blackboard.find((item) => item.key === "probability")?.value}%概率【沉睡】${blackboard.find((item) => item.key === "sleep_duration")?.value}秒`,
    values: [
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "sleep_duration", value: 5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "sleep_duration", value: 5, valueStr: null }] },
      ],
      [
        { key: "", blackboard: [{ key: "probability", value: 1, valueStr: null }] },
        { key: "", blackboard: [{ key: "sleep_duration", value: 5, valueStr: null }] },
      ],
    ],
    disabled: true,
  },
  rogue_5_wrath_11: {
    id: "rogue_5_wrath_11",
    name: "辰■",
    functionDesc: () => `所有干员形象不可见`,
    values: [[], [], []],
    disabled: true,
  },
  rogue_5_wrath_12: {
    id: "rogue_5_wrath_12",
    name: "亥食",
    functionDesc: (blackboard: BlackboardData[]) =>
      `场上每有一个岁阵营干员，所有岁阵营干员每${blackboard.find((item) => item.key === "sp_regen_interval")?.value}秒回复一点技力`,
    values: [
      [{ key: "", blackboard: [{ key: "sp_regen_interval", value: 4, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_regen_interval", value: 3, valueStr: null }] }],
      [{ key: "", blackboard: [{ key: "sp_regen_interval", value: 2, valueStr: null }] }],
    ],
    disabled: true,
  },
};
