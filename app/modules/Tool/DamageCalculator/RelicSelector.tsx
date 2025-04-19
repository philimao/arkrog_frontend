import { useGameDataStore } from "~/stores/gameDataStore";
import { useEffect, useMemo, useState } from "react";
import { Button, Divider, Select, SelectItem } from "@heroui/react";
import type { ItemData, RelicData, RogueKey } from "~/types/gameData";

// 关键词筛选器
const filterTags = [
  ["先锋", "近卫", "狙击", "术师", "辅助", "重装", "医疗", "特种"],
  ["结局", "攻击", "防御", "生命", "技力", "再部署"],
  ["物理", "法术", "真实", "元素", "异常", "召唤"],
];
const filterFuncMap: Record<string, (relic: ItemData) => boolean> = {
  结局: (relic: ItemData) => relic.id.includes("final"),
};

const allowedKeys = [
  "atk",
  "multiplier@atk", // 几丁质刺刃
  "def",
  "max_hp",
  "damage_scale",
  "damage_resistance",
  "sp_recovery_per_sec",
  "attack_speed",
  "respawn_time",
];

const allowedKeyMap: Record<string, string> = {
  atk: "攻击力",
  "multiplier@atk": "刀舞攻击力", // 几丁质刺刃
  def: "防御力",
  max_hp: "生命上限",
  damage_scale: "易伤",
  damage_resistance: "法术抗性",
  sp_recovery_per_sec: "技力回复",
  attack_speed: "攻击速度",
  respawn_time: "再部署时间",
};

const allowedValueStr = [
  "rogue_3_dmg_penetrate[filter_tag]", // 猎人的洞察
  "modify_sp[attack_or_damage]", // 利口酒
  "rogue_2_hit_to_add_sp[tag]", // “讨魔义旗”
  "rogue_2_relic_mark[king_suit]", // 国王套
  "rogue_4_relic_mark[LordOfFiends_suit]", // 魔王套
  "extra_damage_via_cur_hp_ratio[magic]", // 扣挠手
  "rogue_4_extra_aoe_damage[hand]", // 烟花手
  "rogue_2_damage_in_attack_range", // 净尘手
];

const isBattleRelated = (item: ItemData & RelicData) => {
  return item.buffs.some((buff) =>
    buff.blackboard.some(
      (bb) =>
        allowedKeys.includes(bb.key) || allowedValueStr.includes(bb.valueStr!),
    ),
  );
};

export default function RelicSelector() {
  const { topics, relics, items } = useGameDataStore();

  const [rogueKey, setRogueKey] = useState<RogueKey>("rogue_4");

  // 难度选择
  const [difficulty, setDifficulty] = useState<string>("N15");
  const difficulties = useMemo(() => {
    let array;
    if (rogueKey === "rogue_1") array = ["王冠", "乌萨斯弯刀"];
    else if (rogueKey === "rogue_4" || rogueKey === "rogue_2") // 水月有N18了
      array = Array(19)
        .fill(0)
        .map((_, i) => "N" + i);
    else
      array = Array(16)
        .fill(0)
        .map((_, i) => "N" + i);
    setDifficulty(array.slice(-1)[0]);
    return array;
  }, [rogueKey]);

  // 藏品筛选
  const relicValues = ["16", "12", "8", "1"];
  const [valueFilter, setValueFilter] = useState<Set<string>>(new Set(["16"]));

  const relicsByValue: (ItemData & RelicData)[] = useMemo(
    () =>
      valueFilter
        ? Object.values(items![rogueKey])
            .filter((item) => {
              // 物品必须是藏品
              if (item.type !== "RELIC") return false;
              // 有价值筛选器时
              if (valueFilter.size && !valueFilter.has(item.value.toString()))
                return false;
              if (
                items![rogueKey][item.id + "_a"] ||
                items![rogueKey][item.id.replace(/_[a-z0-9]+$/, "_a")]
              ) {
                // 代表随等级难度变化的藏品
                const diff = parseInt(difficulty.slice(1));
                if (diff >= 9) return item.id.endsWith("_c");
                else if (diff >= 6) return item.id.endsWith("_b");
                else if (diff >= 3) return item.id.endsWith("_a");
                else return item.id[item.id.length - 2] !== "_";
              } else {
                // 随难度不变的藏品
                return true;
              }
            })
            .map((item) => ({
              ...item,
              ...relics![rogueKey][item.id],
            }))
        : [],
    [valueFilter, items, rogueKey, difficulty, relics],
  );

  // Tag筛选
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const relicsByTag = useMemo(
    () =>
      relicsByValue.filter(
        (relic) =>
          isBattleRelated(relic) &&
          (!selectedTags.length ||
            selectedTags.some((kw) =>
              filterFuncMap[kw]
                ? filterFuncMap[kw](relic)
                : relic.name.includes(kw) || relic.usage.includes(kw),
            )),
      ),
    [relicsByValue, selectedTags],
  );

  // 藏品选择
  const [selectedRelicIds, setSelectedRelicIds] = useState<string[]>([]);
  const [result, setResult] = useState<Record<string, number>>({});

  // 根据 JSON 格式的藏品 ID 数组选中对应的藏品
  const selectRelicsByIds = (ids: string[]) => {
    setSelectedRelicIds((prev) => {
      const updated = [...new Set([...prev, ...ids])]; // 合并并去重
      return updated;
    });
  };  
    
  const [inputRelicIds, setInputRelicIds] = useState<string>("");
  // 处理输入框中的藏品 ID
  const handleSelectFromInput = () => {
    try {
      const ids = JSON.parse(inputRelicIds);
      if (Array.isArray(ids)) {
        selectRelicsByIds(ids);
      } else {
        alert("请输入有效的 JSON 数组格式！");
      }
    } catch (error) {
      alert("输入格式错误，请输入有效的 JSON 数组！");
    }
  };

  // 应用藏品效果
  useEffect(() => {
    const result: Record<string, number> = {};
    selectedRelicIds.forEach((id) => {
      relics![rogueKey][id].buffs.forEach((buff) => {
        buff.blackboard.forEach((bb) => {
          if (allowedKeys.includes(bb.key))
            result[bb.key] = (result[bb.key] || 0) + bb.value;
        });
      });
    });
    console.log("result", result);
    setResult(result);
  }, [relics, rogueKey, selectedRelicIds]);

  return (
      <div>
       <div className="mb-4">
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          placeholder='请输入藏品 ID 数组，例如：["rogue_4_relic_legacy_82","rogue_4_relic_legacy_81"]'
          value={inputRelicIds}
          onChange={(e) => setInputRelicIds(e.target.value)}
        />
        <Button
          className="mt-2"
          color="primary"
          onPress={handleSelectFromInput}
        >
          根据输入选中藏品
        </Button>
      </div>    
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, 15rem)" }}
      >
        <Select
          disallowEmptySelection={true}
          label="选择肉鸽主题"
          selectedKeys={[rogueKey]}
          onChange={(evt) => setRogueKey(evt.target.value as RogueKey)}
        >
          {Object.values(topics!).map((topic) => (
            <SelectItem key={topic.id}>{topic.name}</SelectItem>
          ))}
        </Select>
        <Select
          disallowEmptySelection={true}
          label="难度选择"
          selectedKeys={[difficulty]}
          onChange={(evt) => setDifficulty(evt.target.value)}
        >
          {difficulties.map((difficulty) => (
            <SelectItem key={difficulty}>{difficulty}</SelectItem>
          ))}
        </Select>
        <Select
          selectionMode="multiple"
          label="藏品价值"
          selectedKeys={valueFilter}
          onSelectionChange={setValueFilter as never}
        >
          {relicValues.map((relicType) => (
            <SelectItem key={relicType}>{relicType}</SelectItem>
          ))}
        </Select>
      </div>
      <div className="my-4">
        {filterTags.map((keys, i) => (
          <div className="flex gap-2 mb-2" key={i}>
            {keys.map((key) => (
              <Button
                key={key}
                color={selectedTags.includes(key) ? "secondary" : "default"}
                onPress={() =>
                  setSelectedTags((prev) => {
                    const updated = [...prev];
                    const index = updated.findIndex((item) => item === key);
                    if (index > -1) updated.splice(index, 1);
                    else updated.push(key);
                    return updated;
                  })
                }
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex mb-4">
        {Object.keys(result).map((key) => (
          <div className="me-2 text-sm">
            {allowedKeyMap[key] + ": " + Math.round(result[key] * 100) / 100}
          </div>
        ))}
        <Button
          className="ms-auto"
          color="danger"
          variant="flat"
          size="sm"
          onPress={() => setSelectedRelicIds([])}
        >
          清空选择
        </Button>
      </div>
      <div className="grid grid-cols-6 gap-4">
        {relicsByTag.map((relic) => (
          <div
            className={
              "px-3 py-2" +
              (selectedRelicIds.includes(relic.id)
                ? " shadow shadow-ak-blue"
                : "")
            }
            key={relic.id}
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() =>
              setSelectedRelicIds((prev) => {
                const updated = [...prev];
                const index = updated.findIndex((item) => item === relic.id);
                if (index > -1) updated.splice(index, 1);
                else updated.push(relic.id);
                return updated;
              })
            }
          >
            <div className="font-bold mb-1">{relic.name}</div>
            <div className="text-xs font-light">{relic.usage}</div>
            <Divider className="my-1" />
            {/*<div className="whitespace-pre-wrap text-xs font-light">*/}
            {/*  {JSON.stringify(relic.buffs, null, 2)}*/}
            {/*</div>*/}
            {relic.buffs
              .map((buff) => buff.blackboard)
              .flat()
              .filter((bb) => allowedKeys.includes(bb.key))
              .map((bb, i) => (
                <div className="text-xs font-light" key={i}>
                  {allowedKeyMap[bb.key] + ": " + bb.value}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
