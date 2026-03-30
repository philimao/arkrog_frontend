import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import DecisionPhaseSection from "./components/DecisionPhaseSection";
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

  const [isPC, setIsPC] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("autochess-isPC");
      if (stored === "true") return true;
      if (stored === "false") return false;
      return window.innerWidth >= 768;
    } catch {
      return window.innerWidth >= 768;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("autochess-isPC", String(isPC));
    } catch {
      // ignore
    }
  }, [isPC]);

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
    isPC,
  });
  const batchInputRef = useRef<HTMLInputElement>(null);

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
  const [enemyPickerResetKey, setEnemyPickerResetKey] = useState(0);
  const [samplePreview, setSamplePreview] = useState<
    "enemy" | "operator" | null
  >(null);

  const sampleImageUrl =
    samplePreview &&
    `${import.meta.env.VITE_API_BASE_URL ?? ""}/images/autochess/${samplePreview}.png`;

  const handlePick = (chessId: string) => {
    deck.addToPick(chessId);
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

  const handleNewGame = useCallback(() => {
    deck.resetDeck();
    setBatchModifyTarget(null);
    setRecognitionEntries((prev) => {
      prev.forEach((e) => recognition.revokeUri(e.id));
      return [];
    });
    setEnemyPickerResetKey((k) => k + 1);
    toast.success("干员/敌人BP信息已重置", { autoClose: 1000 });
  }, [deck.resetDeck, recognition]);

  if (loading || !autochess) return <Loading />;

  return (
    <>
      <div
        className={`relative min-h-screen ${recognition.isProcessing ? "pointer-events-none opacity-70" : ""}`}
      >
        <div className="relative z-10 mb-4 flex flex-col items-end gap-2 md:absolute md:top-0 md:left-1/2 md:mb-0 md:block md:w-screen md:-translate-x-1/2 md:pr-0">
          <button
            type="button"
            onClick={handleNewGame}
            className="absolute right-0 -top-4 h-10 w-32 bg-black-gray text-white max-md:relative max-md:top-auto max-md:right-auto"
          >
            新游戏
          </button>
        </div>
        <section className="mb-8">
          <EnemyPicker
            key={`enemy-picker-${enemyPickerResetKey}`}
            groups={autochess.enemyGroups}
            matchedActiveTypes={matchedEnemyTypes}
          />
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-default-500">
                在页面空白处粘贴截图可触发识别，截图要求16:9，画面中{" "}
                <strong className="text-ak-red">不要包含模拟器UI</strong>{" "}
                ，可参考右侧示例图片
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
                <br />
                请根据使用的是 <strong>模拟器</strong> 还是{" "}
                <strong>PC版</strong> ，选择对应的设备类型，使用{" "}
                <strong>手机版</strong> 时两种选项都可以尝试
                <br />
                使用中遇到无法识别的问题或有好的建议，请加入影语集反馈群{" "}
                <span
                  className="text-ak-blue underline cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText("909687635");
                    toast.success("已复制到剪贴板");
                  }}
                >
                  909687635
                </span>{" "}
                联系管理员
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">模拟器</span>
                <Switch isSelected={isPC} onValueChange={setIsPC} size="sm" />
                <span className="text-sm text-default-600">PC版 / 手机版</span>
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
              <input
                ref={batchInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) {
                    recognition.recognizeFromFiles(Array.from(files));
                  }
                  e.target.value = "";
                }}
              />
              <Button
                className="w-full block sm:hidden rounded-none px-5 py-2.5 text-base bg-black-gray text-white hover:opacity-90 border border-mid-gray"
                onPress={() => batchInputRef.current?.click()}
                isDisabled={recognition.isProcessing}
              >
                批量识别
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
        <DecisionPhaseSection
          effectInfoDataDict={autochess.effectInfoDataDict ?? {}}
          enemyGains={autochess.enemyGains ?? []}
        />
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
