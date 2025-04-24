import { useGameDataStore } from "~/stores/gameDataStore";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, Divider, Select, SelectItem } from "@heroui/react";
import type { CharData, ItemData, RogueKey } from "~/types/gameData";
import {
  allowedBlackboardKeyMap,
  finalizeRelicResults,
  inGameRelicNames,
  type RelicWrapper,
  wrapRelicData,
} from "~/modules/Tool/DamageCalculator/utils";

// 关键词筛选器
const filterTags = [
  ["先锋", "近卫", "狙击", "术师", "辅助", "重装", "医疗", "特种"],
  ["结局", "攻速", "攻击", "防御", "生命", "技力", "再部署"],
  ["物理", "法术", "真实", "元素", "异常", "召唤"],
];

const filterFuncMap: Record<string, (relic: ItemData) => boolean> = {
  结局: (relic: ItemData) => relic.id.includes("final"),
  攻速: (relic: ItemData) => relic.usage.includes("攻击速度"),
};

export default function RelicSelector({ charData }: { charData?: CharData }) {
  const { topics, relics, items } = useGameDataStore();

  const [rogueKey, setRogueKey] = useState<RogueKey>("rogue_4");

  // 难度选择
  const [difficulty, setDifficulty] = useState<string>("N15");
  const difficulties = useMemo(() => {
    let array;
    if (rogueKey === "rogue_1") array = ["王冠", "乌萨斯弯刀"];
    else if (rogueKey === "rogue_4" || rogueKey === "rogue_2")
      // 水月有N18了
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

  // 按难度筛选藏品
  const relicsByDifficulty = useMemo(
    () =>
      Object.values(items![rogueKey])
        .filter((item) => {
          // 物品必须是藏品
          if (item.type !== "RELIC") return false;
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
        })),
    [difficulty, items, relics, rogueKey],
  );

  // 基于藏品和干员选择生成藏品池
  const relicsByChar = useMemo(
    () =>
      relicsByDifficulty
        .map((relicDataExt) => wrapRelicData(relicDataExt, charData))
        .filter((relicWrapper) =>
          relicWrapper.buffs.some((buff) => buff.isActive),
        ),
    [charData, relicsByDifficulty],
  );

  // useEffect(() => {
  //   console.log("relics", relicsByChar);
  // }, [relicsByChar]);

  // 藏品筛选
  const relicValues = ["16", "12", "8", "1"];
  const [valueFilter, setValueFilter] = useState<Set<string>>(new Set(["16"]));

  const relicsByValue: RelicWrapper[] = useMemo(
    () =>
      valueFilter
        ? relicsByChar.filter((relicWrapper) => {
            // 有价值筛选器时
            return !(
              valueFilter.size &&
              !valueFilter.has(relicWrapper.relicData.value.toString())
            );
          })
        : [],
    [relicsByChar, valueFilter],
  );

  // Tag筛选
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const relicsByTag = useMemo(
    () =>
      relicsByValue.filter(
        (relicWrapper) =>
          !selectedTags.length ||
          selectedTags.some((kw) =>
            filterFuncMap[kw]
              ? filterFuncMap[kw](relicWrapper.relicData)
              : relicWrapper.relicData.name.includes(kw) ||
                relicWrapper.relicData.usage.includes(kw),
          ),
      ),
    [relicsByValue, selectedTags],
  );

  // 藏品选择
  const [selectedRelicIds, setSelectedRelicIds] = useState<string[]>([]);
  const [charResult, setCharResult] = useState<Record<string, number>>({});
  const [enemyResult, setEnemyResult] = useState<Record<string, number>>({});

  // 根据 JSON 格式的藏品 ID 数组选中对应的藏品
  const selectRelicsByIds = (ids: string[]) => {
    setSelectedRelicIds((prev) => {
      // 合并并去重
      return [...new Set([...prev, ...ids])];
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
    } catch (err) {
      console.log(err);
      alert("输入格式错误，请输入有效的 JSON 数组！");
    }
  };

  // 应用藏品效果
  useEffect(() => {
    const { charResult, enemyResult } = finalizeRelicResults(
      relicsByChar,
      selectedRelicIds,
    );
    console.log("charResult", charResult);
    console.log("enemyResult", enemyResult);
    setCharResult(charResult);
    setEnemyResult(enemyResult);
  }, [relicsByChar, selectedRelicIds]);

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
        <div className="mb-4">
          <strong className="mb-3">当前生效藏品</strong>
          <div className="grid grid-cols-4 gap-4">
            {relicsByChar
              .filter((r) => selectedRelicIds.includes(r.relicData.id))
              .map((relicWrapper) => (
                <div
                  className={"px-3 py-2"}
                  key={relicWrapper.relicData.id}
                  style={{ background: "rgba(0,0,0,0.3)" }}
                >
                  <strong>{relicWrapper.relicData.name}</strong>
                  {inGameRelicNames.includes(relicWrapper.relicData.name) && (
                    <span>（局内生效）</span>
                  )}
                  <Divider className="my-1" />
                  {relicWrapper.buffs
                    .map((buff) => buff.charResult)
                    .flat()
                    .map((bb, i) => {
                      return Object.keys(bb).map((key) => (
                        <div className="text-xs font-light" key={i + key}>
                          {"干员" +
                            allowedBlackboardKeyMap[key] +
                            ": " +
                            bb[key]}
                        </div>
                      ));
                    })}
                  {relicWrapper.buffs
                    .map((buff) => buff.enemyResult)
                    .flat()
                    .map((bb, i) => {
                      return Object.keys(bb).map((key) => (
                        <div className="text-xs font-light" key={i + key}>
                          {"敌方" +
                            allowedBlackboardKeyMap[key] +
                            ": " +
                            bb[key]}
                        </div>
                      ));
                    })}
                  {relicWrapper.buffs.some((buff) => buff.layer) && (
                    <div className="text-xs font-light">层数: 1</div>
                  )}
                </div>
              ))}
          </div>
        </div>
        <div className="mb-4">
          <strong>干员加成：</strong>
          {Object.keys(charResult).map((key) => (
            <div className="me-2 text-sm" key={key}>
              {allowedBlackboardKeyMap[key] +
                ": " +
                Math.round(charResult[key] * 100) / 100}
            </div>
          ))}
        </div>
        <div>
          <strong>敌方加成：</strong>
          {Object.keys(enemyResult).map((key) => (
            <div className="me-2 text-sm" key={key}>
              {allowedBlackboardKeyMap[key] +
                ": " +
                Math.round(enemyResult[key] * 100) / 100}
            </div>
          ))}
        </div>
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
      <RelicsContainer
        relicsByTag={relicsByTag}
        selectedRelicIds={selectedRelicIds}
        setSelectedRelicIds={setSelectedRelicIds}
      />
    </div>
  );
}

function RelicsContainer({
  relicsByTag,
  selectedRelicIds,
  setSelectedRelicIds,
}: {
  relicsByTag: RelicWrapper[];
  selectedRelicIds: string[];
  setSelectedRelicIds: Dispatch<SetStateAction<string[]>>;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {relicsByTag.map((relicWrapper) => (
        <div
          className={
            "px-3 py-2" +
            (selectedRelicIds.includes(relicWrapper.relicData.id)
              ? " shadow shadow-ak-blue"
              : "")
          }
          key={relicWrapper.relicData.id}
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={() =>
            setSelectedRelicIds((prev) => {
              const updated = [...prev];
              const index = updated.findIndex(
                (item) => item === relicWrapper.relicData.id,
              );
              if (index > -1) updated.splice(index, 1);
              else updated.push(relicWrapper.relicData.id);
              return updated;
            })
          }
        >
          <div className="font-bold mb-1">{relicWrapper.relicData.name}</div>
          <div className="text-xs font-light">
            {relicWrapper.relicData.usage}
          </div>
          {/*<Divider className="my-1" />*/}
          {/*<div className="whitespace-pre-wrap text-xs font-light">*/}
          {/*  {relicWrapper.relicData.id}*/}
          {/*</div>*/}
          {/*<div className="whitespace-pre-wrap text-xs font-light">*/}
          {/*  {JSON.stringify(relicWrapper.relicData.buffs, null, 2)}*/}
          {/*</div>*/}
          <Divider className="my-1" />
          {relicWrapper.buffs
            .map((buff) => buff.charResult)
            .flat()
            .map((bb, i) => {
              return Object.keys(bb).map((key) => (
                <div className="text-xs font-light" key={i + key}>
                  {"干员" + allowedBlackboardKeyMap[key] + ": " + bb[key]}
                </div>
              ));
            })}
          {relicWrapper.buffs
            .map((buff) => buff.enemyResult)
            .flat()
            .map((bb, i) => {
              return Object.keys(bb).map((key) => (
                <div className="text-xs font-light" key={i + key}>
                  {"敌方" + allowedBlackboardKeyMap[key] + ": " + bb[key]}
                </div>
              ));
            })}
          {relicWrapper.buffs.some((buff) => buff.layer) && (
            <div className="text-xs font-light">层数: 1</div>
          )}
        </div>
      ))}
    </div>
  );
}
