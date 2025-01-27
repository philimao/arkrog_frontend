import { useGameDataStore } from "~/stores/gameDataStore";
import React, { useMemo, useState } from "react";
import {
  type GameData,
  type RogueKey,
  type StageData,
  type StageOfRogue,
  type Stages,
  type TopicData,
  type Topics,
  type ZoneData,
  type ZoneOfRogue,
  type Zones,
} from "~/types/gameData";
import Loading from "~/components/Loading";
import { styled } from "styled-components";
import SelectorBanner from "~/modules/RelicFree/SelectorBanner";
import { Tooltip } from "@heroui/react";
import { Link } from "react-router";
import SelectorDetail from "~/modules/RelicFree/SelectorDetail";

export default function StageSelectorWrapper() {
  const { gameData } = useGameDataStore();
  if (!gameData) {
    return <Loading />;
  } else {
    return <StageSelector gameData={gameData} />;
  }
}

function StageSelector({ gameData }: { gameData: GameData }) {
  const {
    topics,
    zones,
    stages,
  }: { topics: Topics; zones: Zones; stages: Stages } = gameData;
  const [currentTopic, setCurrentTopic] = useState<TopicData>(
    Object.values(topics).slice(-1)[0],
  );
  const rogueKey: RogueKey = useMemo(() => currentTopic.id, [currentTopic]);
  const stageOfRogue: StageOfRogue = useMemo(
    () => stages[rogueKey],
    [stages, rogueKey],
  );
  const [zoneFilterId, setZoneFilterId] = useState<string>("all");

  return (
    <div>
      <SelectorBanner
        topics={topics}
        currentTopic={currentTopic}
        setCurrentTopic={setCurrentTopic}
      />
      <SelectorDetail
        zoneFilterId={zoneFilterId}
        setZoneFilterId={setZoneFilterId}
        stageOfRogue={stageOfRogue}
      />
    </div>
  );
}
