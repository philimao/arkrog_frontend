import { toast } from "react-toastify";
import type { TournamentData } from "~/types/tournamentsData";

// 沿用旧表单缓存键，兼容已有本地草稿。
export const tournamentDraftKey = (id?: string) => `tournamentForm-${id}`;

export function readTournamentDraft(id?: string): TournamentData | null {
  try {
    const raw = localStorage.getItem(tournamentDraftKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = parsed?.draftVersion === 1 ? parsed.data : parsed;
    if (
      !data ||
      typeof data.name !== "string" ||
      !Array.isArray(data.players) ||
      !Array.isArray(data.stages) ||
      (id ? data.id !== id : !!data.id)
    )
      return null;
    return data;
  } catch {
    return null;
  }
}

/** 比较当前表单与初始化或最近一次成功保存时的快照。 */
export function hasTournamentChanges(data: unknown, savedSnapshot: string) {
  return savedSnapshot !== "" && JSON.stringify(data) !== savedSnapshot;
}

export function discardTournamentDraft(id?: string): boolean {
  try {
    localStorage.removeItem(tournamentDraftKey(id));
    return true;
  } catch {
    toast.error("草稿删除失败，请检查浏览器存储权限");
    return false;
  }
}

/** Stable snapshot: object key order must not cause false conflicts. */
export function tournamentSnapshot(data: unknown): string {
  const normalize = (value: any): any => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object")
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
    return value;
  };
  return JSON.stringify(normalize(data));
}

export function readTournamentDraftBase(id?: string): string | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(tournamentDraftKey(id)) || "null");
    return parsed?.draftVersion === 1 && typeof parsed.baseSnapshot === "string"
      ? parsed.baseSnapshot
      : null;
  } catch {
    return null;
  }
}

export function writeTournamentDraft(data: TournamentData, baseSnapshot: string | null, id?: string) {
  localStorage.setItem(tournamentDraftKey(id), JSON.stringify({
    draftVersion: 1,
    data,
    baseSnapshot,
    savedAt: Date.now(),
  }));
}
