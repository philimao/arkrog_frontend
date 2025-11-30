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

import { useMemo, useState, type ReactNode } from "react";
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
  /** 自定义类名 */
  className?: string;
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
  className = "",
}: SearchSelectProps<T>) {
  const [showListbox, setShowListbox] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // 使用 useMemo 计算候选项（筛选逻辑轻量，无需防抖）
  const candidates = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.filter((item) => !searchValue || filterFn(item, searchValue));
  }, [searchValue, items, filterFn]);

  // 处理失焦
  const handleBlur = () => {
    setTimeout(() => setShowListbox(false), 200);
  };

  // 处理选择
  const handleSelect = (item: T) => {
    onChange(item);
    setSearchValue("");
    setShowListbox(false);
  };

  // 处理清除（点击 Button 变回 Input，保留选中项名称）
  const handleClear = () => {
    if (value) {
      // 切换回 Input 时保留选中项的名称
      const text = getSelectedText
        ? getSelectedText(value)
        : String(renderSelected(value) ?? "");
      setSearchValue(text);
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
          <Input
            value={searchValue}
            onValueChange={setSearchValue}
            onFocus={() => !disabled && setShowListbox(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            radius="none"
            isDisabled={disabled}
            classNames={{
              inputWrapper: "bg-mid-gray h-10",
              input: "text-white",
            }}
          />
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
