import { useGameDataStore } from "~/stores/gameDataStore";
import React, { useMemo } from "react";
import { type RogueKey, type StageOfRogue, type TopicData } from "~/types/gameData";
import SelectorBanner from "~/modules/RelicFree/Selector/SelectorBanner";
import SelectorDetail from "~/modules/RelicFree/Selector/SelectorDetail";
import { useSearchParams } from "react-router";

export default function StageSelector() {
  const { topics, stages } = useGameDataStore();

  const [searchParams] = useSearchParams();
  const currentTopic: TopicData = useMemo(() => {
    const topicId = searchParams.get("topicId");
    if (topicId && topics[topicId as RogueKey]) {
      return topics[topicId as RogueKey];
    } else {
      return Object.values(topics).slice(-1)[0];
    }
  }, [searchParams, topics]);
  const rogueKey: RogueKey = useMemo(() => currentTopic.id, [currentTopic]);
  const stageOfRogue: StageOfRogue = useMemo(() => stages[rogueKey], [stages, rogueKey]);
  const zoneFilterId: string = useMemo(() => {
    const zoneId = searchParams.get("zoneId");
    return zoneId || "all";
  }, [searchParams]);

  return (
    <div>
      <SelectorBanner topics={topics} currentTopic={currentTopic} />
      <SelectorDetail zoneFilterId={zoneFilterId} stageOfRogue={stageOfRogue} />
    </div>
  );
}
