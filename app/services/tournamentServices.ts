import { api } from "./api";
import type {
  TournamentData,
  TournamentGroupData,
  TournamentPlayer,
} from "~/types/tournamentsData";

// 强制刷新时的请求配置
const noCacheConfig = { headers: { "Cache-Control": "no-cache" } };

export const tournamentServices = {
  // 初始化数据 - 同时获取赛事和赛事集
  getInitData: (forceRefresh?: boolean) =>
    api.get<{ tournaments: TournamentData[]; groups: TournamentGroupData[] }>(
      "/tournament/init",
      forceRefresh ? noCacheConfig : undefined,
    ),

  // 获取赛事列表
  getTournamentList: (forceRefresh?: boolean) =>
    api.get<TournamentData[]>(
      "/tournament/list",
      forceRefresh ? noCacheConfig : undefined,
    ),

  // 获取赛事选手
  getPlayers: (tournamentId: string, forceRefresh?: boolean) =>
    api.get<TournamentPlayer[]>(
      `/tournament/players?id=${tournamentId}`,
      forceRefresh ? noCacheConfig : undefined,
    ),

  // 获取赛事集列表
  getGroupList: (forceRefresh?: boolean) =>
    api.get<TournamentGroupData[]>(
      "/tournament/group/list",
      forceRefresh ? noCacheConfig : undefined,
    ),

  // 保存赛事集
  saveGroup: (data: TournamentGroupData) =>
    api.post<{ success: boolean; message: string; data: TournamentGroupData }>(
      "/tournament/group/save",
      data,
    ),
};
