/**
 * SearchSelect - 通用搜索选择组件
 *
 * 功能：
 * - 输入框搜索 + debounce 防抖筛选
 * - Listbox 下拉展示候选项
 * - 选中后切换为 Button 显示
 * - 点击 Button 切换回 Input 编辑，保留选中项名称
 *
 * 用法示例：
 * ```tsx
 * <SearchSelect<TournamentGroupData>
 *   value={selectedGroup}
 *   onChange={setSelectedGroup}
 *   items={tournamentGroups}
 *   filterFn={(item, query) => item.name.toLowerCase().includes(query.toLowerCase())}
 *   renderItem={(item) => <div>{item.name}</div>}
 *   renderSelected={(item) => item.name}
 *   getKey={(item) => item.id}
 *   getSelectedText={(item) => item.name}  // 可选，用于回填 Input
 *   placeholder="搜索赛事集..."
 * />
 * ```
 */

import {
  type FocusEvent,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { SearchIcon } from "../Icons";
import { Input, Listbox, ListboxItem, Button } from "@heroui/react";

export interface SearchSelectProps<T> {
  /** 当前选中的值 */
  value: T | null;
  /** 值变化回调 */
  onChange: (value: T | null) => void;
  /** 可选项列表 */
  items: T[];
  /** 筛选函数 */
  filterFn: (item: T, query: string) => boolean;
  /** 渲染下拉选项 */
  renderItem: (item: T) => ReactNode;
  /** 渲染选中状态的内容 */
  renderSelected: (item: T) => ReactNode;
  /** 获取唯一标识 */
  getKey: (item: T) => string;
  /** 获取选中项的文本（用于切换回 Input 时回填），不提供则使用 renderSelected 的结果 */
  getSelectedText?: (item: T) => string;
  /** 占位文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否必填，用于原生校验 */
  required?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 输入框的 name，便于表单校验/上报触摸状态 */
  inputName?: string;
  /** 追加到 Input 外层的类名（可用于校验态样式） */
  inputWrapperClassName?: string;
  /** 追加到 Input 本体的类名 */
  inputClassName?: string;
  /** 是否启用手动触发搜索（高代价场景） */
  manualSearch?: boolean;
  /** 手动搜索回调（配合 manualSearch 使用） */
  onSearch?: (query: string) => Promise<void> | void;
  /** 手动搜索的外部 loading 状态，可选 */
  isSearching?: boolean;
  /** 输入框内容变更回调（便于父组件同步文案） */
  onInputChange?: (value: string) => void;
  /** 输入框键盘事件回调 */
  onInputKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** 输入框失焦回调 */
  onInputBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** 搜索按钮的无障碍提示文案 */
  searchButtonAriaLabel?: string;
  /** 初始输入框文本（用于回填已有值） */
  initialInputValue?: string;
  /** 选择后清除搜索结果的回调（用于manualSearch模式） */
  onClearResults?: () => void;
}

export default function SearchSelect<T>({
  value,
  onChange,
  items,
  filterFn,
  renderItem,
  renderSelected,
  getKey,
  getSelectedText,
  placeholder = "搜索...",
  disabled = false,
  required = false,
  className = "",
  manualSearch = false,
  onSearch,
  isSearching,
  onInputChange,
  onInputKeyDown,
  onInputBlur,
  searchButtonAriaLabel = "搜索",
  initialInputValue,
  inputName,
  inputWrapperClassName,
  inputClassName,
  onClearResults,
}: SearchSelectProps<T>) {
  const [showListbox, setShowListbox] = useState(false);
  const [searchValue, setSearchValue] = useState(initialInputValue ?? "");
  const [internalSearching, setInternalSearching] = useState(false);
  const searchLoading = isSearching ?? internalSearching;

  // 外部初始值变化时同步输入框
  useEffect(() => {
    if (initialInputValue !== undefined) {
      setSearchValue(initialInputValue);
    }
  }, [initialInputValue]);

  // 使用 useMemo 计算候选项（筛选逻辑轻量，无需防抖）
  const candidates = useMemo(() => {
    if (!items || items.length === 0) return [];
    if (manualSearch) return items;
    return items.filter((item) => !searchValue || filterFn(item, searchValue));
  }, [searchValue, items, filterFn, manualSearch]);

  // 处理失焦
  const handleBlur = () => {
    setTimeout(() => setShowListbox(false), 200);
  };

  // 处理选择
  const handleSelect = (item: T) => {
    onChange(item);
    setSearchValue("");
    setShowListbox(false);
    onClearResults?.();
  };

  // 处理手动搜索
  const handleSearch = async () => {
    if (!manualSearch || !onSearch || searchLoading) return;
    const query = searchValue.trim();
    if (!query) return;
    setInternalSearching(true);
    try {
      await Promise.resolve(onSearch(query));
      setShowListbox(true);
    } finally {
      setInternalSearching(false);
    }
  };

  // 处理清除（点击 Button 变回 Input，保留选中项名称）
  const handleClear = () => {
    if (value) {
      // 切换回 Input 时保留选中项的名称
      const text = getSelectedText
        ? getSelectedText(value)
        : String(renderSelected(value) ?? "");
      setSearchValue(text);
      onInputChange?.(text);
    }
    onChange(null);
  };

  return (
    <div className={`relative ${className}`}>
      {value ? (
        // 已选中状态：显示 Button
        <Button
          className="w-full justify-start bg-mid-gray text-left h-10 px-3"
          radius="none"
          isDisabled={disabled}
          onPress={handleClear}
        >
          <span className="truncate">{renderSelected(value)}</span>
        </Button>
      ) : (
        // 未选中状态：显示 Input
        <>
          <div className="relative">
            <Input
              value={searchValue}
              onValueChange={(val) => {
                setSearchValue(val);
                onInputChange?.(val);
              }}
              onKeyDown={(e) => {
                onInputKeyDown?.(e);
                if (manualSearch && e.key === "Enter") {
                  e.preventDefault();
                  void handleSearch();
                }
              }}
              onFocus={() => !disabled && setShowListbox(true)}
              onBlur={(e) => {
                handleBlur();
                onInputBlur?.(e);
              }}
              name={inputName}
              placeholder={placeholder}
              radius="none"
              isDisabled={disabled}
              isRequired={required}
              classNames={{
                inputWrapper: `bg-mid-gray h-10 ${manualSearch ? "pr-12" : ""} ${inputWrapperClassName ?? ""}`,
                input: `text-white outline-none ${inputClassName ?? ""}`,
              }}
            />
            {manualSearch && (
              <button
                type="button"
                aria-label={searchButtonAriaLabel}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#00000033] rounded hover:bg-dark-gray disabled:opacity-60 disabled:hover:bg-[#00000033]"
                onClick={() => void handleSearch()}
                disabled={
                  disabled || searchLoading || !onSearch || !searchValue.trim()
                }
              >
                {searchLoading ? (
                  <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SearchIcon width="1rem" height="1rem" />
                )}
              </button>
            )}
          </div>
          {/* 下拉列表 */}
          {showListbox && candidates.length > 0 && (
            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
              <Listbox
                aria-label="选择列表"
                classNames={{
                  base: "bg-dark-gray border border-light-gray",
                }}
              >
                {candidates.map((item) => (
                  <ListboxItem
                    key={getKey(item)}
                    textValue={getKey(item)}
                    classNames={{
                      base: "rounded-none data-[hover=true]:bg-mid-gray",
                    }}
                    onPress={() => handleSelect(item)}
                  >
                    {renderItem(item)}
                  </ListboxItem>
                ))}
              </Listbox>
            </div>
          )}
        </>
      )}
    </div>
  );
}
