import { create } from "zustand";
import type { TournamentData, TournamentPlayer } from "~/types/tournamentsData";
import { _get, _post } from "~/utils/tools";
import { toast } from "react-toastify";

type TournamentsStore = {
  tournamentsData?: TournamentData[];
};

type TournamentDataAction = {
  fetchTournamentsData: () => Promise<void>;
  fetchTournamentPlayer: (tournamentId: string) => Promise<void>;
};

export const useTournamentDataStore = create<
  TournamentsStore & TournamentDataAction
>((set, get) => ({
  tournamentsData: undefined,
  fetchTournamentsData: async () => {
    const data = await _get<TournamentData[]>("/tournament/list");
    if (!data) return;

    const now = new Date();
    data.forEach((d) => {
      d.ongoing = d.stages.some(
        (s) => new Date(s.startTime) <= now && now <= new Date(s.endTime),
      );
    });

    if (data) {
      set((state) => ({
        ...state,
        tournamentsData: data,
      }));
    }
  },
  fetchTournamentPlayer: async (tournamentId: string) => {
    const tournament = get().tournamentsData?.find(
      (t) => t.id === tournamentId,
    );
    if (!tournament) return;
    try {
      tournament.players = await _post<TournamentPlayer[]>(
        "/tournament/players",
        { id: tournament.id },
      );
    } catch (err) {
      toast.error((err as Error).message);
      return;
    }

    set((state) => ({
      ...state,
      tournamentsData: state.tournamentsData?.map((t) =>
        t.id === tournamentId ? { ...t, players: tournament.players } : t,
      ),
    }));
  },
}));
