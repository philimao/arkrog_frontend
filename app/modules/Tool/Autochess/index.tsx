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
        <EnemyPicker groups={autochess.enemyGroups} />

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
              {imageMatch.isDev && (
                <div>
                  <p className="text-xs text-default-500 mb-1">
                    DEV 模式模板加载检查（后端静态图）
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {imageMatch.templateDebugItems.map((item) => (
                      <div
                        key={item.templateUrl}
                        className="rounded border border-default-200 p-2"
                      >
                        <p className="text-[11px] text-default-600 truncate">
                          {item.templateName}
                        </p>
                        <p className="text-[11px] text-default-500">
                          {item.status === "success" ? "加载成功" : "加载失败"}
                        </p>
                        {item.status === "success" && item.previewUrl && (
                          <>
                            <img
                              src={item.previewUrl}
                              alt={item.templateName}
                              className="mt-1 w-full h-16 object-contain rounded bg-default-100"
                            />
                            <p className="text-[11px] text-default-500 mt-1">
                              {item.width ?? "?"}x{item.height ?? "?"} /{" "}
                              {item.size ?? 0} bytes
                            </p>
                          </>
                        )}
                        {item.status === "failed" && (
                          <p className="text-[11px] text-danger mt-1 truncate">
                            {item.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-default-500 mt-2">
                    DEV 下匹配完成后 Modal 不会自动关闭。
                  </p>
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
