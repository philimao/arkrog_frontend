import { api } from "./api";
import type { TournamentData } from "~/types/tournamentsData";

export interface AdminTournamentLite {
  id: string;
  name: string;
}

export type PendingStatus = "pending" | "approved" | "rejected";

export interface AuditChange {
  type: "added" | "removed" | "modified" | "created" | "deleted";
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
  value?: unknown;
}

export interface PendingTournamentListItem {
  id: string;
  tournamentId: string;
  tournamentName: string;
  submitterUsername: string;
  submittedAt: number;
  status: PendingStatus;
  reviewerUsername?: string | null;
  reviewedAt?: number | null;
  previewToken: string;
}

export interface PendingTournamentDetail {
  id: string;
  tournamentId: string;
  tournamentName: string;
  baseData: TournamentData | null;
  submittedData: TournamentData;
  submitterId: string;
  submitterUsername: string;
  submittedAt: number;
  status: PendingStatus;
  reviewerId: string | null;
  reviewerUsername: string | null;
  reviewedAt: number | null;
  reviewNote: string | null;
  previewToken: string;
  /** jsondiffpatch delta */
  delta: unknown;
}

export const adminServices = {
  searchTournaments: (keyword: string) =>
    api.get<{ tournaments: AdminTournamentLite[] }>(
      `/admin/search-tournaments?keyword=${encodeURIComponent(keyword)}`,
    ),

  listPendingTournaments: (params: {
    status?: PendingStatus | "all";
    limit?: number;
    skip?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.skip !== undefined) qs.set("skip", String(params.skip));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{ items: PendingTournamentListItem[] }>(
      `/admin/pending-tournaments${suffix}`,
    );
  },

  getPendingTournament: (id: string) =>
    api.get<{ pending: PendingTournamentDetail }>(
      `/admin/pending-tournaments/${id}`,
    ),

  approvePendingTournament: (id: string, note?: string) =>
    api.post<{ success: boolean; message: string }>(
      `/admin/pending-tournaments/${id}/approve`,
      { note: note ?? "" },
    ),

  rejectPendingTournament: (id: string, note: string) =>
    api.post<{ success: boolean; message: string }>(
      `/admin/pending-tournaments/${id}/reject`,
      { note },
    ),
};
