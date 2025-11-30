import { create } from "zustand";
import type {
  TournamentData,
  TournamentGroupData,
} from "~/types/tournamentsData";
import { toast } from "react-toastify";
import { devtools } from "zustand/middleware";
import { tournamentServices } from "~/services/tournamentServices";

type TournamentsStore = {
  /** 赛事数据 */
  tournamentsData?: TournamentData[];
  /** 赛事集数据 */
  tournamentGroups?: TournamentGroupData[];
  /** 是否已加载 */
  loaded: boolean;
};

type TournamentDataAction = {
  /** 获取初始赛事数据 */
  initTournamentData: (forceRefresh?: boolean) => Promise<void>;
  /** 获取赛事数据 */
  fetchTournamentsData: (forceRefresh?: boolean) => Promise<void>;
  /** 获取赛事玩家数据 */
  fetchTournamentPlayer: (
    tournamentId: string,
    forceRefresh?: boolean,
  ) => Promise<void>;
  /** 获取赛事集数据 */
  fetchTournamentGroups: (forceRefresh?: boolean) => Promise<void>;
  /** 保存赛事数据 */
  saveTournament: (
    tournament: TournamentData,
    username: string,
    editStartTime?: number,
  ) => Promise<void>;
  /** 保存赛事集数据 */
  saveTournamentGroup: (group: TournamentGroupData) => Promise<void>;
};

// 处理赛事数据，计算 ongoing 状态
const processTournamentsData = (data: TournamentData[]) => {
  const now = new Date();
  data.forEach((d) => {
    d.ongoing = d.stages.some(
      (s) => new Date(s.startTime) <= now && now <= new Date(s.endTime),
    );
  });
  return data;
};

export const useTournamentDataStore = create<
  TournamentsStore & TournamentDataAction
>()(
  devtools(
    (set, get) => ({
      tournamentsData: undefined,
      tournamentGroups: undefined,
      loaded: false,

      initTournamentData: async (forceRefresh?: boolean) => {
        if (!forceRefresh && get().loaded) return;
        try {
          const response = await tournamentServices.getInitData(forceRefresh);
          const { tournaments, groups } = response.data;

          set(
            {
              tournamentsData: processTournamentsData(tournaments),
              tournamentGroups: groups,
              loaded: true,
            },
            undefined,
            "initTournamentData",
          );
        } catch {
          // 错误已在 api 拦截器中处理
        }
      },

      fetchTournamentsData: async (forceRefresh?: boolean) => {
        try {
          const response =
            await tournamentServices.getTournamentList(forceRefresh);
          set(
            { tournamentsData: processTournamentsData(response.data) },
            undefined,
            "fetchTournamentsData",
          );
        } catch {
          // 错误已在 api 拦截器中处理
        }
      },

      fetchTournamentPlayer: async (
        tournamentId: string,
        forceRefresh?: boolean,
      ) => {
        const tournament = get().tournamentsData?.find(
          (t) => t.id === tournamentId,
        );
        if (!tournament) return;

        try {
          const response = await tournamentServices.getPlayers(
            tournamentId,
            forceRefresh,
          );
          set(
            (state) => ({
              ...state,
              tournamentsData: state.tournamentsData?.map((t) =>
                t.id === tournamentId ? { ...t, players: response.data } : t,
              ),
            }),
            undefined,
            "fetchTournamentPlayer",
          );
        } catch {
          // 错误已在 api 拦截器中处理
        }
      },

      fetchTournamentGroups: async (forceRefresh?: boolean) => {
        try {
          const response = await tournamentServices.getGroupList(forceRefresh);
          set(
            { tournamentGroups: response.data },
            undefined,
            "fetchTournamentGroups",
          );
        } catch {
          // 错误已在 api 拦截器中处理
        }
      },

      saveTournament: async (
        tournament: TournamentData,
        username: string,
        editStartTime?: number,
      ) => {
        try {
          const response = await tournamentServices.saveTournament({
            tournament,
            username,
            editStartTime,
          });
          const data = response.data;

          if (data.success) {
            toast.success(data.message);
            // 保存成功后强制刷新数据
            await get().fetchTournamentsData(true);
          } else {
            // 处理特殊错误情况
            if (data.needSync && data.latestData) {
              toast.error("数据已被其他用户更新，需要同步本地编辑数据");
            } else if (data.lockedBy) {
              toast.error(`赛事正在被用户 ${data.lockedBy} 编辑中`);
            } else {
              toast.error(data.message || "保存失败");
            }
          }
        } catch {
          // 错误已在 api 拦截器中处理
          return null;
        }
      },

      saveTournamentGroup: async (group: TournamentGroupData) => {
        try {
          const response = await tournamentServices.saveGroup(group);
          if (response.data.success) {
            toast.success(response.data.message);
            // 保存成功后强制刷新数据
            await get().fetchTournamentGroups(true);
          } else {
            toast.error(response.data.message);
          }
        } catch {
          // 错误已在 api 拦截器中处理
          return null;
        }
      },
    }),
    { name: "tournamentsData" },
  ),
);
