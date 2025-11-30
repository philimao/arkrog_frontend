import { useMemo, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Input, Listbox, ListboxItem, Button } from "@heroui/react";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { useGameDataStore } from "~/stores/gameDataStore";
import type { TournamentData } from "~/types/tournamentsData";
import type { RogueKey } from "~/types/gameData";

// 拖拽抓手图标
function DragHandleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

// 删除图标
function DeleteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// 选择器项的状态
interface SelectorItem {
  id: string; // 用于 Reorder 的唯一标识
  tournamentId: string | null; // 选中的赛事 ID，null 表示未选中
}

// 获取赛事展示文本
function getTournamentDisplayText(
  tournament: TournamentData,
  topics: Record<string, { name: string }> | undefined,
): string {
  const topicName =
    tournament.rogue && topics?.[tournament.rogue as RogueKey]?.name;
  const parts = [topicName, tournament.edition];
  if (tournament.level) {
    parts.push(tournament.level);
  }
  return parts.filter(Boolean).join(" // ");
}

interface TournamentSelectorListProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function TournamentSelectorList({
  selectedIds,
  onChange,
}: TournamentSelectorListProps) {
  const { tournamentsData } = useTournamentDataStore();
  const { topics } = useGameDataStore();

  // 辅助函数：从 items 提取 tournamentIds
  const extractIds = (itemList: SelectorItem[]): string[] =>
    itemList
      .map((item) => item.tournamentId)
      .filter((id): id is string => id !== null);

  // 辅助函数：从 selectedIds 创建 items
  const createItemsFromIds = (ids: string[]): SelectorItem[] => {
    if (ids.length === 0) {
      return [{ id: crypto.randomUUID(), tournamentId: null }];
    }
    const newItems: SelectorItem[] = ids.map((tid) => ({
      id: crypto.randomUUID(),
      tournamentId: tid,
    }));
    // 确保最后有一个空行
    newItems.push({ id: crypto.randomUUID(), tournamentId: null });
    return newItems;
  };

  // 内部状态：管理选择器项列表
  const [items, setItems] = useState<SelectorItem[]>(() =>
    createItemsFromIds(selectedIds),
  );

  // 追踪上一次处理过的 selectedIds，用于检测外部变化
  const [lastSyncedIds, setLastSyncedIds] = useState<string>(
    JSON.stringify(selectedIds),
  );

  // 检测外部 selectedIds 变化（编辑模式切换赛事集）
  const currentSelectedIdsStr = JSON.stringify(selectedIds);
  if (currentSelectedIdsStr !== lastSyncedIds) {
    // 外部数据变化，重建内部状态
    setItems(createItemsFromIds(selectedIds));
    setLastSyncedIds(currentSelectedIdsStr);
  }

  // 处理选中赛事（直接在事件中通知父组件）
  const handleSelect = (itemId: string, tournamentId: string) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, tournamentId } : item,
    );
    // 如果最后一项被选中，自动添加新的空行
    const lastItem = newItems[newItems.length - 1];
    if (lastItem && lastItem.tournamentId !== null) {
      newItems.push({ id: crypto.randomUUID(), tournamentId: null });
    }
    setItems(newItems);

    // 直接通知父组件
    const newIds = extractIds(newItems);
    setLastSyncedIds(JSON.stringify(newIds));
    onChange(newIds);
  };

  // 处理清除选择（点击 Button 变回 Input）
  const handleClear = (itemId: string) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, tournamentId: null } : item,
    );
    setItems(newItems);

    // 直接通知父组件
    const newIds = extractIds(newItems);
    setLastSyncedIds(JSON.stringify(newIds));
    onChange(newIds);
  };

  // 处理删除行
  const handleDelete = (itemId: string) => {
    let newItems = items.filter((item) => item.id !== itemId);
    // 确保至少有一行
    if (newItems.length === 0) {
      newItems = [{ id: crypto.randomUUID(), tournamentId: null }];
    }
    setItems(newItems);

    // 直接通知父组件
    const newIds = extractIds(newItems);
    setLastSyncedIds(JSON.stringify(newIds));
    onChange(newIds);
  };

  // 处理拖拽排序
  const handleReorder = (newItems: SelectorItem[]) => {
    setItems(newItems);

    // 直接通知父组件
    const newIds = extractIds(newItems);
    setLastSyncedIds(JSON.stringify(newIds));
    onChange(newIds);
  };

  // 已选中的赛事 ID 集合
  const selectedTournamentIds = useMemo(
    () => new Set(items.map((item) => item.tournamentId).filter(Boolean)),
    [items],
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-light mb-1">包含赛事</label>
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="flex flex-col gap-2"
      >
        {items.map((item, index) => {
          // 最后一个空行不可删除
          const isLastEmptyRow =
            index === items.length - 1 && item.tournamentId === null;
          return (
            <TournamentSelectorItem
              key={item.id}
              item={item}
              tournamentsData={tournamentsData}
              topics={topics}
              selectedTournamentIds={selectedTournamentIds}
              canDelete={items.length > 1 && !isLastEmptyRow}
              onSelect={(tournamentId) => handleSelect(item.id, tournamentId)}
              onClear={() => handleClear(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          );
        })}
      </Reorder.Group>
    </div>
  );
}

interface TournamentSelectorItemProps {
  item: SelectorItem;
  tournamentsData: TournamentData[] | undefined;
  topics: Record<string, { name: string }> | undefined;
  selectedTournamentIds: Set<string | null>;
  canDelete: boolean;
  onSelect: (tournamentId: string) => void;
  onClear: () => void;
  onDelete: () => void;
}

function TournamentSelectorItem({
  item,
  tournamentsData,
  topics,
  selectedTournamentIds,
  canDelete,
  onSelect,
  onClear,
  onDelete,
}: TournamentSelectorItemProps) {
  const dragControls = useDragControls();
  const [showListbox, setShowListbox] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // 获取当前选中的赛事数据
  const selectedTournament = useMemo(
    () => tournamentsData?.find((t) => t.id === item.tournamentId),
    [tournamentsData, item.tournamentId],
  );

  // 使用 useMemo 计算候选项（筛选逻辑轻量，无需防抖）
  const candidates = useMemo(() => {
    if (!tournamentsData) return [];

    return tournamentsData.filter((tournament) => {
      // 只选择不属于任何赛事集的赛事（groupId 未设置或为空）
      if (tournament.groupId) return false;

      // 排除已选中的赛事（除了当前项）
      if (
        selectedTournamentIds.has(tournament.id) &&
        tournament.id !== item.tournamentId
      ) {
        return false;
      }

      // 如果没有搜索值，显示所有可选赛事
      if (!searchValue) return true;

      // 搜索匹配
      const displayText = getTournamentDisplayText(tournament, topics);
      const searchLower = searchValue.toLowerCase();
      return (
        tournament.name.toLowerCase().includes(searchLower) ||
        displayText.toLowerCase().includes(searchLower)
      );
    });
  }, [
    searchValue,
    tournamentsData,
    topics,
    selectedTournamentIds,
    item.tournamentId,
  ]);

  // 处理失焦
  const handleBlur = () => {
    // 延迟关闭，让点击事件先触发
    setTimeout(() => setShowListbox(false), 200);
  };

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-2"
    >
      {/* 拖拽抓手 */}
      <div
        className="cursor-grab active:cursor-grabbing p-1 text-gray hover:text-white transition-colors"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <DragHandleIcon />
      </div>

      {/* 输入框 / 按钮 */}
      <div className="flex-1 relative">
        {item.tournamentId && selectedTournament ? (
          // 已选中状态：显示 Button
          <Button
            className="w-full justify-start bg-mid-gray text-left h-10 px-3"
            radius="none"
            onPress={() => {
              // 切换回 Input 时设置赛事名
              setSearchValue(selectedTournament.name);
              onClear();
            }}
          >
            <span className="truncate">
              {selectedTournament.name} -{" "}
              {getTournamentDisplayText(selectedTournament, topics)}
            </span>
          </Button>
        ) : (
          // 未选中状态：显示 Input
          <>
            <Input
              value={searchValue}
              onValueChange={setSearchValue}
              onFocus={() => setShowListbox(true)}
              onBlur={handleBlur}
              placeholder="搜索赛事名称..."
              radius="none"
              classNames={{
                inputWrapper: "bg-mid-gray h-10",
                input: "text-white",
              }}
            />
            {/* 下拉列表 */}
            {showListbox && candidates.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
                <Listbox
                  aria-label="赛事列表"
                  classNames={{
                    base: "bg-dark-gray border border-light-gray",
                  }}
                >
                  {candidates.map((tournament) => (
                    <ListboxItem
                      key={tournament.id}
                      textValue={tournament.name}
                      classNames={{
                        base: "rounded-none data-[hover=true]:bg-mid-gray",
                      }}
                      onPress={() => {
                        onSelect(tournament.id);
                        setSearchValue("");
                        setShowListbox(false);
                      }}
                    >
                      <div className="py-1">
                        <div className="font-medium">{tournament.name}</div>
                        <div className="text-sm text-ak-blue">
                          {getTournamentDisplayText(tournament, topics)}
                        </div>
                      </div>
                    </ListboxItem>
                  ))}
                </Listbox>
              </div>
            )}
          </>
        )}
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        className={
          "p-1 text-gray hover:text-ak-red transition-colors " +
          (canDelete ? "" : "opacity-0")
        }
        onClick={onDelete}
        disabled={!canDelete}
      >
        <DeleteIcon />
      </button>
    </Reorder.Item>
  );
}
