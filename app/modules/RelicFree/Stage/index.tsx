import { useParams } from "react-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { _post } from "~/utils/tools";
import { type RecordType } from "~/types/recordType";
import { toast } from "react-toastify";
import { useGameDataStore } from "~/stores/gameDataStore";
import Loading from "~/components/Loading";
import type {
  GameData,
  RogueKey,
  StageData,
  StageOfRogue,
  TopicData,
} from "~/types/gameData";
import StageDetail from "~/modules/RelicFree/Stage/StageDetail";
import RecordDisplay from "~/modules/RecordDisplay";

export default function StagePage() {
  const { stageId } = useParams();
  const { gameData } = useGameDataStore();
  const stageDataMounted = useRef(false);
  // 关卡信息
  const stageData: StageData | null = useMemo(() => {
    if (!gameData) return null;
    if (!stageId) {
      stageDataMounted.current = true;
      return null;
    }
    // ro1_b_1
    const [ro, type, si] = stageId.split("_");
    if (!ro || !type || !si) {
      stageDataMounted.current = true;
      return null;
    }
    const { stages } = gameData;
    const rogueKey: RogueKey = ("rogue_" + ro.slice(-1)) as RogueKey;
    const stageOfRogue: StageOfRogue = stages[rogueKey];
    const _stageData: StageData = stageOfRogue[stageId];
    stageDataMounted.current = true;
    if (_stageData) return _stageData;
    else return null;
  }, [gameData, stageId]);
  const topicData: TopicData | null = useMemo(() => {
    if (!stageData) return null;
    const [ro] = stageData.id.split("_");
    const rogueKey: RogueKey = ("rogue_" + ro.slice(-1)) as RogueKey;
    const { topics } = gameData as GameData;
    return topics[rogueKey];
  }, [gameData, stageData]);

  const [records, setRecords] = useState<RecordType[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  useEffect(() => {
    if (!stageData) return;
    _post<RecordType[]>("/record", { stageId })
      .then((records) => {
        if (records) {
          setRecords(records);
        } else {
          throw new Error("未获取到当前的关卡记录");
        }
      })
      .then(() => setRecordsLoaded(true))
      .catch((err) => toast.error(err.message));
  }, [stageId, stageData]);

  if (!stageDataMounted.current || !recordsLoaded) return <Loading />;
  if (!stageData) return <div>非法的关卡名称</div>;
  return (
    <div>
      <StageDetail
        topicData={topicData as TopicData}
        gameData={gameData as GameData}
        stageData={stageData}
        setRecords={setRecords}
      />
      <div className="font-bold text-lg">记录收录</div>
      <RecordDisplay
        records={records}
        setRecords={setRecords}
        isStagePage={true}
      />
    </div>
  );
}
