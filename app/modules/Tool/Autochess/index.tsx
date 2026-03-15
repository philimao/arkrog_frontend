import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { toast } from "react-toastify";
import OperatorPicker from "./components/OperatorPicker";
import BpPool from "./components/BpPool";
import BondList from "./components/BondList";
import BondTable from "./components/BondTable";
import EnemyPicker from "./components/EnemyPicker";
import BandTable from "./components/BandTable";
import { useAutochessDeck, useAutochessImageMatch } from "./hooks";

export default function AutochessPage() {
  const { autochess, fetchAutochessData } = useGameDataStore();
  const [loading, setLoading] = useState(false);
  const imageMatch = useAutochessImageMatch();

  useEffect(() => {
    setLoading(true);
    fetchAutochessData().finally(() => setLoading(false));
  }, [fetchAutochessData]);

  const deck = useAutochessDeck(
    autochess?.operators || [],
    autochess?.bonds || [],
  );

  const pickedBonds = useMemo(
    () => deck.bondsWithState.filter((bond) => bond.count > 0),
    [deck.bondsWithState],
  );

  const matchedEnemyTypes = useMemo(() => {
    const matched = new Set(imageMatch.matchedTemplateNames ?? []);
    if (!matched.size) return [];
    return (autochess?.enemyGroups ?? [])
      .filter((group) => {
        const shortTypeName = group.typeName.split("·").pop() || group.typeName;
        return matched.has(shortTypeName);
      })
      .map((group) => group.type);
  }, [autochess?.enemyGroups, imageMatch.matchedTemplateNames]);

  const handlePick = (chessId: string) => {
    const result = deck.addToPick(chessId);
    if (!result.success && result.reason === "limit") {
      toast.warning("Pick 池最多 9 名干员");
    }
  };

  if (loading || !autochess) return <Loading />;

  return (
    <>
      <div
        className={`min-h-screen ${imageMatch.isProcessing ? "pointer-events-none opacity-70" : ""}`}
      >
        <EnemyPicker
          groups={autochess.enemyGroups}
          matchedActiveTypes={matchedEnemyTypes}
        />

        <section className="mb-8">
          <OperatorPicker
            operatorsByLevel={autochess.operatorsByLevel}
            operatorsByBond={autochess.operatorsByBond}
            bonds={autochess.bonds}
            banOperatorIds={deck.banOperatorIds}
            selectedIds={deck.selectedIds}
            onPickToPick={handlePick}
          />
          <BpPool
            title="Pick 池"
            operators={deck.pickOperators}
            onDropOperator={handlePick}
            onRemoveOperator={deck.removeFromPick}
            bonds={autochess.bonds}
            limit={deck.pickLimit}
          />
          <BpPool
            title="Ban 池"
            operators={deck.banOperators}
            onDropOperator={deck.addToBan}
            onRemoveOperator={deck.removeFromBan}
            bonds={autochess.bonds}
          />
          <BondList bonds={pickedBonds} />
        </section>

        <BondTable bonds={deck.bondsWithState} />
        <BandTable bands={autochess.bands} />
      </div>
      <Modal
        isOpen={imageMatch.isModalOpen}
        onClose={() => {
          if (imageMatch.isProcessing) return;
          imageMatch.closeModal();
          imageMatch.resetToIdle();
        }}
        isDismissable={!imageMatch.isProcessing}
        isKeyboardDismissDisabled={imageMatch.isProcessing}
        hideCloseButton={imageMatch.isProcessing}
      >
        <ModalContent>
          <ModalHeader>截图匹配进度</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-sm text-default-700">
                {imageMatch.progress.message}
              </p>
              <p className="text-xs text-default-500">
                阶段：{imageMatch.progress.step}
              </p>
              <p className="text-xs text-default-500">
                进度：{imageMatch.progress.current}/{imageMatch.progress.total}
              </p>
              {imageMatch.scaleDebug && (
                <div className="space-y-1 rounded border border-default-200 p-2">
                  <p className="text-xs text-default-600 font-medium">
                    Scale策略日志
                  </p>
                  <p className="text-[11px] text-default-500">
                    全局范围(高度基准): {imageMatch.scaleDebug.minScale} ~{" "}
                    {imageMatch.scaleDebug.maxScale} | 已评估:{" "}
                    {imageMatch.scaleDebug.scaleCount}
                  </p>
                  <p className="text-[11px] text-default-500">
                    粗搜: step={imageMatch.scaleDebug.coarseStep ?? "-"} | 点数=
                    {imageMatch.scaleDebug.coarseScaleCount ?? "-"} | 峰值=
                    {imageMatch.scaleDebug.coarsePeakScale ?? "-"} (
                    {imageMatch.scaleDebug.coarsePeakTopScore ?? "-"}) | 转折早停=
                    {imageMatch.scaleDebug.coarseTurningStopped ? "是" : "否"}
                  </p>
                  <p className="text-[11px] text-default-500">
                    细化: range {imageMatch.scaleDebug.refineRangeMin ?? "-"} ~{" "}
                    {imageMatch.scaleDebug.refineRangeMax ?? "-"} | step=
                    {imageMatch.scaleDebug.refineStep ?? "-"} | 点数=
                    {imageMatch.scaleDebug.refineScaleCount ?? "-"} | 峰值=
                    {imageMatch.scaleDebug.refinePeakScale ?? "-"} (
                    {imageMatch.scaleDebug.refinePeakTopScore ?? "-"}) | 转折早停=
                    {imageMatch.scaleDebug.refineTurningStopped ? "是" : "否"}
                  </p>
                  <p className="text-[11px] text-default-500">
                    早停阈值: topScore &gt;= {" "}
                    {imageMatch.scaleDebug.turningScoreThreshold ?? "-"}
                  </p>
                </div>
              )}
              {imageMatch.pastedImagePreviewUrl && (
                <div>
                  <p className="text-xs text-default-500 mb-1">用户截图预览</p>
                  <img
                    src={imageMatch.pastedImagePreviewUrl}
                    alt="用户截图预览"
                    className="w-full max-h-56 object-contain rounded border border-default-200"
                  />
                </div>
              )}
              {imageMatch.bestScaleGroup && (
                <div>
                  <p className="text-xs text-default-500 mb-1">
                    最高分组匹配结果（短路组合）
                  </p>
                  <p className="text-[11px] text-default-600">
                    算法: {imageMatch.bestScaleGroup.algorithm} / scale:{" "}
                    {imageMatch.bestScaleGroup.scale} / 组内最高分:{" "}
                    {imageMatch.bestScaleGroup.topScore}
                  </p>
                  <div className="mt-1 space-y-1">
                    {imageMatch.bestScaleGroup.matchedTemplateNames.map(
                      (item, index) => (
                      <p
                        key={`matched-${item}-${index}`}
                        className="text-[11px] text-default-600"
                      >
                        {index + 1}. {item}
                      </p>
                    ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                if (imageMatch.isProcessing) return;
                imageMatch.closeModal();
                imageMatch.resetToIdle();
              }}
              isDisabled={imageMatch.isProcessing}
            >
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
