import { useState, useRef, useEffect } from "react";

interface UseInputSuggestionsReturn {
  addToCache: (
    key: string,
    value: string,
    sortFunc?: (a: string, b: string) => number,
  ) => void;
  getSuggestions: (key: string) => string[];
  showSuggestions: string | null;
  setShowSuggestions: (key: string | null) => void;
  suggestionListRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 用于管理输入框的缓存建议功能
 *
 * @param initialCache 初始缓存数据，格式为 { [key: string]: string[] }
 * @example
 * ```tsx
 * const initialData = { server: ['官服', '渠道服'], group: ['A组', 'B组'] };
 * const { addToCache, getSuggestions, showSuggestions, setShowSuggestions, suggestionListRef } = useInputSuggestions(initialData);
 *
 * <input
 *   onFocus={() => setShowSuggestions('fieldKey')}
 *   onBlur={() => {
 *     addToCache('fieldKey', value);
 *     setShowSuggestions(null);
 *   }}
 * />
 * {showSuggestions === 'fieldKey' && getSuggestions('fieldKey').length > 0 && (
 *   <div ref={suggestionListRef}>
 *     {getSuggestions('fieldKey').map(suggestion => (
 *       <div onClick={() => handleSelect(suggestion)}>{suggestion}</div>
 *     ))}
 *   </div>
 * )}
 * ```
 */
export function useInputSuggestions(
  initialCache: Record<string, string[]> = {},
): UseInputSuggestionsReturn {
  // 缓存结构: { [key: string]: string[] }
  const [cache, setCache] = useState<Record<string, string[]>>(initialCache);
  // 当前显示建议的字段 key
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  // 建议列表的 ref，用于处理点击外部关闭
  const suggestionListRef = useRef<HTMLDivElement>(null);

  /**
   * 添加值到缓存
   * @param key 字段标识
   * @param value 要缓存的值
   * @param sortFunc 排序函数，用于排序建议列表
   */
  const addToCache = (
    key: string,
    value: string,
    sortFunc?: (a: string, b: string) => number,
  ) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    setCache((prev) => {
      const existingValues = prev[key] || [];
      // 如果值已存在，不重复添加
      if (existingValues.includes(trimmedValue)) {
        return prev;
      }
      // 添加新值到数组开头（最新的在前面）
      return {
        ...prev,
        [key]: [trimmedValue, ...existingValues.sort(sortFunc ?? (() => 0))],
      };
    });
  };

  /**
   * 获取某个字段的建议列表
   * @param key 字段标识
   * @returns 建议值数组
   */
  const getSuggestions = (key: string): string[] => {
    return cache[key] || [];
  };

  return {
    addToCache,
    getSuggestions,
    showSuggestions,
    setShowSuggestions,
    suggestionListRef,
  };
}
