import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Loading from "~/components/Loading";
import { useGameDataStore } from "~/stores/gameDataStore";
import { toast } from "react-toastify";
import OperatorPicker from "./components/OperatorPicker";
import BpPool from "./components/BpPool";
import BondList from "./components/BondList";
import BondTable from "./components/BondTable";
import ClassChangeQuickRef from "./components/ClassChangeQuickRef";
import EnemyPicker from "./components/EnemyPicker";
import BandTable from "./components/BandTable";
import ImageDock from "./components/ImageDock";
import { useAutochessDeck, useAutochessRecognition } from "./hooks";
import type { RecognitionEntry } from "./hooks";

type BatchModifyTarget = "pick" | "ban" | null;

export default function AutochessPage() {
  const { autochess, fetchAutochessData } = useGameDataStore();
  const [loading, setLoading] = useState(false);
  const [recognitionEntries, setRecognitionEntries] = useState<
    RecognitionEntry[]
  >([]);

  const deck = useAutochessDeck(
    autochess?.operators || [],
    autochess?.bonds || [],
  );

  const handleRecognitionResult = useCallback(
    (entry: RecognitionEntry) => {
      setRecognitionEntries((prev) => [...prev, entry]);
      const { result } = entry;
      if (result.roiResults) {
        for (const roi of result.roiResults) {
          const best = roi.best;
          if (!best || best.score < 0.4) continue;
          const op = autochess?.operators?.find(
            (o) => o.charId === best.charId || o.chessId === best.charId,
          );
          if (op) deck.addToBan(op.chessId);
        }
      }
    },
    [autochess?.operators, deck],
  );

  const recognition = useAutochessRecognition({
    onResult: handleRecognitionResult,
  });

  const handleRemoveRecognition = useCallback(
    (id: string) => {
      recognition.revokeUri(id);
      setRecognitionEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [recognition],
  );

  const handleClearAllRecognition = useCallback(() => {
    recognitionEntries.forEach((e) => recognition.revokeUri(e.id));
    setRecognitionEntries([]);
  }, [recognitionEntries, recognition]);

  useEffect(() => {
    setLoading(true);
    fetchAutochessData().finally(() => setLoading(false));
  }, [fetchAutochessData]);

  const pickedBonds = useMemo(
    () => deck.bondsWithState.filter((bond) => bond.count > 0),
    [deck.bondsWithState],
  );

  const matchedEnemyTypes = useMemo(() => {
    const enemyEntry = [...recognitionEntries]
      .reverse()
      .find((e) => e.result.enemyMatches && e.result.enemyMatches.length > 0);
    if (!enemyEntry?.result.enemyMatches) return [];
    const names = new Set(
      enemyEntry.result.enemyMatches.map((m) => m.templateName),
    );
    return (autochess?.enemyGroups ?? [])
      .filter((group) => [...names].some((n) => group.typeName.includes(n)))
      .map((group) => group.type);
  }, [autochess?.enemyGroups, recognitionEntries]);

  const [batchModifyTarget, setBatchModifyTarget] =
    useState<BatchModifyTarget>(null);
  const [samplePreview, setSamplePreview] = useState<
    "enemy" | "operator" | null
  >(null);

  const sampleImageUrl =
    samplePreview &&
    `${import.meta.env.VITE_API_BASE_URL ?? ""}/images/autochess/${samplePreview}.png`;

  const handlePick = (chessId: string) => {
    const result = deck.addToPick(chessId);
    if (!result.success && result.reason === "limit") {
      toast.warning("Pick 池最多 9 名干员");
    }
  };

  const handleOperatorClick = (chessId: string, target: "pick" | "ban") => {
    const inPick = deck.pickOperatorIds.includes(chessId);
    const inBan = deck.banOperatorIds.includes(chessId);
    if (target === "pick") {
      if (inPick) deck.removeFromPick(chessId);
      else handlePick(chessId);
    } else {
      if (inBan) deck.removeFromBan(chessId);
      else deck.addToBan(chessId);
    }
  };

  if (loading || !autochess) return <Loading />;

  return (
    <>
      <div
        className={`min-h-screen ${recognition.isProcessing ? "pointer-events-none opacity-70" : ""}`}
      >
        <section className="mb-8">
          <EnemyPicker
            groups={autochess.enemyGroups}
            matchedActiveTypes={matchedEnemyTypes}
          />
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-default-500">
                在页面空白处粘贴含有敌人类型或禁用干员头像的截图可触发识别，截图中不要包含模拟器UI等内容
                <br />
                推荐使用{" "}
                <a
                  className="text-ak-blue underline"
                  href="https://pixpin.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PixPin
                </a>{" "}
                快速截图，智能识别UI一键粘贴到页面，注意宽度要求至少720px
              </p>
              <p className="text-xs text-default-400">
                处理中页面会被锁定，可点击取消终止任务。
              </p>
            </div>
            <div className="flex gap-0.5">
              <Button
                className="rounded-none px-5 py-2.5 text-base bg-black-gray text-white hover:opacity-90 border border-mid-gray"
                onPress={() => setSamplePreview("enemy")}
              >
                敌人示例
              </Button>
              <Button
                className="rounded-none px-5 py-2.5 text-base bg-black-gray text-white hover:opacity-90 border border-mid-gray"
                onPress={() => setSamplePreview("operator")}
              >
                干员示例
              </Button>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <OperatorPicker
            operatorsByLevel={autochess.operatorsByLevel}
            operatorsByBond={autochess.operatorsByBond}
            bonds={autochess.bonds}
            banOperatorIds={deck.banOperatorIds}
            selectedIds={deck.selectedIds}
            batchModifyTarget={batchModifyTarget}
            onOperatorClick={handleOperatorClick}
          />
          <p className="text-sm text-light-gray mb-3">
            拖动将干员加入bp池，点击批量添加后可点击加入对应池子
          </p>
          <BpPool
            title="Pick 池"
            operators={deck.pickOperators}
            onDropOperator={handlePick}
            onRemoveOperator={deck.removeFromPick}
            bonds={autochess.bonds}
            limit={deck.pickLimit}
            batchModifyActive={batchModifyTarget === "pick"}
            onBatchModifyChange={(active) =>
              setBatchModifyTarget(active ? "pick" : null)
            }
          />
          <BpPool
            title="Ban 池"
            operators={deck.banOperators}
            onDropOperator={deck.addToBan}
            onRemoveOperator={deck.removeFromBan}
            bonds={autochess.bonds}
            batchModifyActive={batchModifyTarget === "ban"}
            onBatchModifyChange={(active) =>
              setBatchModifyTarget(active ? "ban" : null)
            }
          />
          <BondList bonds={pickedBonds} />
        </section>

        <BondTable bonds={deck.bondsWithState} />
        <ClassChangeQuickRef bonds={autochess.bonds} />
        <BandTable bands={autochess.bands} />
      </div>

      <Modal
        isOpen={recognition.isModalOpen}
        onClose={() => {
          if (recognition.isProcessing) return;
          recognition.closeModal();
        }}
        isDismissable={!recognition.isProcessing}
        isKeyboardDismissDisabled={recognition.isProcessing}
        hideCloseButton={recognition.isProcessing}
      >
        <ModalContent>
          <ModalHeader>截图识别进度</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p className="text-sm text-default-700">
                {recognition.progress.message}
              </p>
              <p className="text-xs text-default-500">
                阶段：
                {(
                  {
                    upload: "已接收/上传",
                    queue: "排队中",
                    processing: "识别中",
                    done: "完成",
                    失败: "失败",
                    idle: "已取消",
                  } as Record<string, string>
                )[recognition.progress.step] ?? recognition.progress.step}
              </p>
              {recognition.pastedImagePreviewUrl && (
                <div>
                  <p className="text-xs text-default-500 mb-1">用户截图预览</p>
                  <img
                    src={recognition.pastedImagePreviewUrl}
                    alt="用户截图预览"
                    className="w-full max-h-56 object-contain rounded border border-default-200"
                  />
                </div>
              )}
              {recognition.isDev && recognition.lastResult && (
                <div className="rounded border border-default-200 p-2 overflow-auto max-h-48">
                  <p className="text-xs text-default-600 font-medium mb-1">
                    识别结果（dev）
                  </p>
                  <pre className="text-[11px] text-default-500 whitespace-pre-wrap break-words">
                    {JSON.stringify(recognition.lastResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            {recognition.isProcessing ? (
              <Button
                color="danger"
                variant="flat"
                onPress={recognition.cancel}
              >
                取消
              </Button>
            ) : null}
            <Button
              onPress={() => {
                if (recognition.isProcessing) return;
                recognition.closeModal();
              }}
              isDisabled={recognition.isProcessing}
            >
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        size="3xl"
        isOpen={!!samplePreview}
        onClose={() => setSamplePreview(null)}
      >
        <ModalContent>
          <ModalBody className="p-0">
            {sampleImageUrl && (
              <img
                src={sampleImageUrl}
                alt={samplePreview === "enemy" ? "敌人示例" : "干员示例"}
                className="w-full max-h-[70vh] object-contain rounded border border-default-200"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {recognitionEntries.length > 0 && (
        <ImageDock
          items={recognitionEntries.map((e) => ({
            id: e.id,
            thumbnailUri: e.annotatedUri,
            fullUri: e.annotatedUri,
          }))}
          onRemove={handleRemoveRecognition}
          onClearAll={handleClearAllRecognition}
        />
      )}
    </>
  );
}
