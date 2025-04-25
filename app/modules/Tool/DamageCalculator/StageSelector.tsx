import { useGameDataStore } from "~/stores/gameDataStore";
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { navOfZone } from "~/utils/stageSelector";
import { Button, Select, SelectItem } from "@heroui/react";
import type { EnemyData, LevelData, RogueKey } from "~/types/gameData";
import { _post, getPath, imageHost } from "~/utils/tools";
import { getEnemyAttributes } from "~/modules/Tool/DamageCalculator/utils";

export default function StageSelector({
  rogueKey,
  enemyData,
  setEnemyData,
}: {
  rogueKey: RogueKey;
  enemyData?: EnemyData;
  setEnemyData: Dispatch<SetStateAction<EnemyData | undefined>>;
}) {
  const { stages } = useGameDataStore();
  const [zoneFilterId, setZoneFilterId] = useState<string>("boss");

  const renderStages = useMemo(() => {
    const stageOfRogue = stages![rogueKey];
    const zone = navOfZone.find((zone) => zoneFilterId === zone.id);
    const renderedStageIds: string[] = [];
    return Object.values(stageOfRogue).filter((stage) =>
      zone!.filter(stage!, renderedStageIds),
    );
  }, [rogueKey, stages, zoneFilterId]);

  const [stageId, setStageId] = useState<string>("");

  const [levelData, setLevelData] = useState<LevelData>();

  async function handleLoadLevelData() {
    const stageData = stages![rogueKey][stageId];
    const stageRawData = await _post<LevelData>("/gamedata/level", {
      levelId: stageData.levelId,
    });
    setLevelData(stageRawData);
  }

  useEffect(() => {
    if (enemyData) {
      console.log("enemyInput", getEnemyAttributes(enemyData));
    }
  }, [enemyData]);

  return (
    <div className="mb-4">
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, 15rem)" }}
      >
        <Select
          disallowEmptySelection={true}
          label="选择区域"
          selectedKeys={[zoneFilterId]}
          onChange={(evt) => setZoneFilterId(evt.target.value)}
        >
          {navOfZone.map((zone) => (
            <SelectItem key={zone.id}>{zone.name}</SelectItem>
          ))}
        </Select>
        <Select
          disallowEmptySelection={true}
          label="选择关卡"
          selectedKeys={[stageId]}
          onChange={(evt) => setStageId(evt.target.value)}
        >
          {renderStages.map((stage) => (
            <SelectItem key={stage.id}>{stage.name}</SelectItem>
          ))}
        </Select>
      </div>

      {stageId && <Button onPress={handleLoadLevelData}>加载</Button>}

      {levelData && (
        <div className="flex whitespace-nowrap overflow-x-hidden">
          {levelData.enemies.map((enemyData) => {
            const url = encodeURI(
              imageHost + getPath(`头像_敌人_${enemyData.name.m_value}.png`),
            );
            return (
              <div
                className="w-24 me-4 shrink-0 cursor-pointer"
                key={enemyData.id}
                onClick={() => {
                  setEnemyData(enemyData);
                  console.log("enemyData", enemyData);
                }}
              >
                <img
                  src={url}
                  alt={enemyData.name.m_value}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(evt) => {
                    (evt.target as HTMLImageElement).onerror = null;
                    (evt.target as HTMLImageElement).src =
                      "https://media.prts.wiki/thumb/f/fb/%E6%97%A0%E5%9B%BE%E7%89%87%E5%8D%A0%E4%BD%8D%E7%AC%A6.png/75px-%E6%97%A0%E5%9B%BE%E7%89%87%E5%8D%A0%E4%BD%8D%E7%AC%A6.png";
                  }}
                />
                <span className="text-[0.75rem] whitespace-normal">
                  {enemyData.name.m_value}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {enemyData && (
        <div>
          <div className="font-bold mb-2">{enemyData.name.m_value}</div>
          {Object.entries(getEnemyAttributes(enemyData))
            .slice(0, 8)
            .map(([key, value]) => (
              <div key={key}>{key + ": " + value}</div>
            ))}
        </div>
      )}
    </div>
  );
}
