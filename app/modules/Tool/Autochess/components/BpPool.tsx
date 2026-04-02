import { useCallback, useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Tooltip,
} from "@heroui/react";
import OperatorAvatar from "~/components/Character/Operator/OperatorAvatar";
import type { AutochessBond, AutochessOperator } from "~/types/autochess";
import { getPath, imageHost } from "~/utils/tools";
import {
  getAvailableOperatorCountByBond,
  getBondActiveMethodLabel,
  parseAutochessDesc,
  splitBondsByCore,
} from "../utils/autochess";
import AutochessOperatorDetailBlock from "./AutochessOperatorDetailBlock";

const MANUAL_BAN_CORE_MAX = 3;
const MANUAL_BAN_EXTRA_MAX = 4;

export interface ManualBondBanConfig {
  allOperators: AutochessOperator[];
  operatorsByBond: Record<string, AutochessOperator[]>;
  banOperatorIds: string[];
  onApplyMatching: (chessIds: string[]) => void;
}

interface BpPoolProps {
  title: string;
  operators: AutochessOperator[];
  onDropOperator: (
    chessId: string,
  ) => void | { success: boolean; reason: string };
  onRemoveOperator: (chessId: string) => void;
  bonds: AutochessBond[];
  limit?: number;
  batchModifyActive?: boolean;
  onBatchModifyChange?: (active: boolean) => void;
  manualBondBan?: ManualBondBanConfig;
}

export default function BpPool({
  title,
  operators,
  onDropOperator,
  onRemoveOperator,
  bonds,
  limit,
  batchModifyActive = false,
  onBatchModifyChange,
  manualBondBan,
}: BpPoolProps) {
  const [manualBanOpen, setManualBanOpen] = useState(false);
  const [selectedCoreIds, setSelectedCoreIds] = useState<string[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  const bondNameMap = bonds.reduce(
    (acc, bond) => {
      acc[bond.bondId] = bond.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  const { core, extra } = useMemo(() => splitBondsByCore(bonds), [bonds]);

  const openManualBanModal = useCallback(() => {
    setSelectedCoreIds([]);
    setSelectedExtraIds([]);
    setManualBanOpen(true);
  }, []);

  const closeManualBanModal = useCallback(() => {
    setManualBanOpen(false);
    setSelectedCoreIds([]);
    setSelectedExtraIds([]);
  }, []);

  const toggleCoreBond = useCallback((bondId: string) => {
    setSelectedCoreIds((prev) => {
      if (prev.includes(bondId)) return prev.filter((id) => id !== bondId);
      if (prev.length >= MANUAL_BAN_CORE_MAX) return prev;
      return [...prev, bondId];
    });
  }, []);

  const toggleExtraBond = useCallback((bondId: string) => {
    setSelectedExtraIds((prev) => {
      if (prev.includes(bondId)) return prev.filter((id) => id !== bondId);
      if (prev.length >= MANUAL_BAN_EXTRA_MAX) return prev;
      return [...prev, bondId];
    });
  }, []);

  const canConfirmManualBan =
    selectedCoreIds.length === MANUAL_BAN_CORE_MAX &&
    selectedExtraIds.length === MANUAL_BAN_EXTRA_MAX;

  const applyManualBan = useCallback(() => {
    if (!manualBondBan || !canConfirmManualBan) return;
    const required = [...selectedCoreIds, ...selectedExtraIds];
    const chessIds = manualBondBan.allOperators
      .filter((op) => op.bondIds.every((bid) => required.includes(bid)))
      .map((op) => op.chessId);
    manualBondBan.onApplyMatching(chessIds);
    closeManualBanModal();
  }, [
    manualBondBan,
    canConfirmManualBan,
    selectedCoreIds,
    selectedExtraIds,
    closeManualBanModal,
  ]);

  const operatorsByBond = manualBondBan?.operatorsByBond;
  const banOperatorIds = manualBondBan?.banOperatorIds ?? [];

  interface BondGroup {
    bondId: string;
    name: string;
    operators: AutochessOperator[];
    count?: number;
    activeCount?: number;
    active?: boolean;
  }

  const isPickPool = title === "Pick 池";

  const bondGroups = useMemo(() => {
    const groups: BondGroup[] = [];
    for (const bond of bonds) {
      const groupOps = operators
        .filter((op) => op.bondIds.includes(bond.bondId))
        .sort((a, b) => b.chessLevel - a.chessLevel);
      if (groupOps.length > 0) {
        const count = groupOps.length;
        groups.push({
          bondId: bond.bondId,
          name: bond.name,
          operators: groupOps,
          count: isPickPool ? count : undefined,
          activeCount: isPickPool ? bond.activeCount : undefined,
          active: isPickPool ? count >= bond.activeCount : undefined,
        });
      }
    }
    const otherOps = operators
      .filter(
        (op) => !op.bondIds.some((bid) => bonds.some((b) => b.bondId === bid)),
      )
      .sort((a, b) => b.chessLevel - a.chessLevel);
    if (otherOps.length > 0) {
      groups.push({
        bondId: "__other__",
        name: "其他",
        operators: otherOps,
      });
    }
    return groups;
  }, [operators, bonds, isPickPool]);

  return (
    <section className="mb-8">
      <div className="text-lg font-bold mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3>{title}</h3>
          {typeof limit === "number" && (
            <span
              className={
                "text-sm font-normal " +
                (operators.length > limit ? "text-ak-red" : "text-light-gray")
              }
            >
              {operators.length}/{limit}
            </span>
          )}
        </div>
        {title === "Ban 池" && manualBondBan && (
          <button
            type="button"
            className="text-sm bg-mid-gray border border-mid-gray rounded-lg py-1 px-2 ms-4 me-auto"
            onClick={openManualBanModal}
          >
            手动选择盟约
          </button>
        )}
        {(operators.length > 0 || onBatchModifyChange) && (
          <div className="flex items-center gap-3">
            {operators.length > 0 && (
              <button
                type="button"
                className="text-sm text-default-500 hover:text-default-700"
                onClick={() =>
                  operators.forEach((op) => onRemoveOperator(op.chessId))
                }
              >
                清空
              </button>
            )}
            {onBatchModifyChange && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-normal">批量修改</label>
                <Switch
                  isSelected={batchModifyActive}
                  onValueChange={onBatchModifyChange}
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className="min-h-20 border border-dashed border-mid-gray p-3 bg-black-gray-70 flex flex-col gap-3"
        onDragOver={(evt) => {
          evt.preventDefault();
          evt.dataTransfer.dropEffect = "move";
        }}
        onDrop={(evt) => {
          evt.preventDefault();
          const chessId = evt.dataTransfer.getData("text/plain");
          if (chessId) onDropOperator(chessId);
        }}
      >
        {bondGroups.map((group) => {
          const bondInfo = (
            <div
              className="flex flex-col items-center shrink-0 w-16"
              style={{
                opacity: isPickPool && group.active === false ? 0.5 : 1,
              }}
            >
              {group.bondId !== "__other__" ? (
                <img
                  src={
                    imageHost +
                    getPath(`卫戍协议：盟约_icon_${group.bondId}.png`)
                  }
                  alt={group.name}
                  loading="lazy"
                  className="w-10 h-10 object-cover"
                  onError={(evt) => {
                    (evt.target as HTMLImageElement).onerror = null;
                    (evt.target as HTMLImageElement).src =
                      "/images/logo/logo.png";
                  }}
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center rounded-full border border-mid-gray text-xs text-light-gray">
                  ?
                </div>
              )}
              <span className="text-xs mt-1 text-center truncate w-full">
                {group.name}
              </span>
            </div>
          );

          const bondData = bonds.find((b) => b.bondId === group.bondId);

          return (
            <div key={group.bondId} className="flex gap-3">
              {isPickPool && bondData ? (
                <Tooltip
                  content={
                    <div className="p-3 max-w-96 text-sm">
                      <div>
                        激活人数：{group.count}/{group.activeCount}
                      </div>
                      <div>激活方式：{getBondActiveMethodLabel(bondData)}</div>
                      <div className="mt-1">
                        {parseAutochessDesc(bondData.desc)}
                      </div>
                    </div>
                  }
                >
                  {bondInfo}
                </Tooltip>
              ) : (
                bondInfo
              )}
              <div className="flex flex-wrap gap-3 flex-1 min-w-0">
                {group.operators.map((operator) => (
                  <div key={operator.chessId} className="relative w-14 h-14">
                    <Tooltip
                      content={
                        <AutochessOperatorDetailBlock
                          operator={operator}
                          bondNameMap={bondNameMap}
                        />
                      }
                    >
                      <div
                        className="w-14 h-14 rounded-full overflow-hidden border border-mid-gray cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(evt) => {
                          evt.dataTransfer.setData(
                            "text/plain",
                            operator.chessId,
                          );
                          evt.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <OperatorAvatar
                          name={operator.name}
                          className="w-full h-full"
                          loading="lazy"
                        />
                      </div>
                    </Tooltip>
                    <button
                      className="absolute -top-1 -right-1 rounded-full w-5 h-5 text-xs bg-ak-red text-white"
                      onClick={() => onRemoveOperator(operator.chessId)}
                      aria-label={`remove-${operator.name}`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {manualBondBan && operatorsByBond && (
        <Modal
          isOpen={manualBanOpen}
          onOpenChange={(open) => {
            if (!open) closeManualBanModal();
          }}
          size="2xl"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <span>手动选择盟约</span>
              <span className="text-xs font-normal text-default-500">
                请选择 {MANUAL_BAN_CORE_MAX} 个核心盟约与 {MANUAL_BAN_EXTRA_MAX}{" "}
                个附加盟约，确定后将同时包含上述盟约的干员加入 Ban 池
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="mb-4 flex flex-col gap-2">
                <div className="text-sm text-light-gray">核心盟约</div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-[1px] bg-black-gray">
                  {core.map((bond) => {
                    const active = selectedCoreIds.includes(bond.bondId);
                    const available = getAvailableOperatorCountByBond(
                      bond.bondId,
                      operatorsByBond,
                      banOperatorIds,
                    );
                    return (
                      <button
                        key={bond.bondId}
                        type="button"
                        className={
                          "text-center font-bold leading-[2.5rem] text-sm " +
                          `${active ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
                        }
                        onClick={() => toggleCoreBond(bond.bondId)}
                      >
                        {bond.name}（{available}）
                      </button>
                    );
                  })}
                </div>
                <div className="text-sm text-light-gray mt-2">附加盟约</div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-[1px] bg-black-gray">
                  {extra.map((bond) => {
                    const active = selectedExtraIds.includes(bond.bondId);
                    const available = getAvailableOperatorCountByBond(
                      bond.bondId,
                      operatorsByBond,
                      banOperatorIds,
                    );
                    return (
                      <button
                        key={bond.bondId}
                        type="button"
                        className={
                          "text-center font-bold leading-[2.5rem] text-sm " +
                          `${active ? "bg-ak-blue text-black" : "bg-black-gray text-white"}`
                        }
                        onClick={() => toggleExtraBond(bond.bondId)}
                      >
                        {bond.name}（{available}）
                      </button>
                    );
                  })}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={closeManualBanModal}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={applyManualBan}
                isDisabled={!canConfirmManualBan}
              >
                确定
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </section>
  );
}
