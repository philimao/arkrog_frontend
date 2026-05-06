import axios from "axios";
import type { TournamentData } from "~/types/tournamentsData";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// 预览页公开访问，不带 cookie / 鉴权
const previewApi = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

export type PreviewStatus = "pending" | "rejected";

export interface TournamentPreviewResponse {
  tournament: TournamentData;
  status: PreviewStatus;
  tournamentName: string;
  submitterUsername: string;
  submittedAt: number;
  reviewerUsername: string | null;
  reviewedAt: number | null;
  reviewNote: string | null;
  /** jsondiffpatch delta */
  delta: unknown;
}

export interface PreviewError {
  status: "approved" | "not_found" | "error";
  message: string;
  httpStatus: number;
}

export async function getTournamentPreview(
  token: string,
): Promise<TournamentPreviewResponse | PreviewError> {
  try {
    const response = await previewApi.get<TournamentPreviewResponse>(
      `/preview/tournament/${encodeURIComponent(token)}`,
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const httpStatus = err.response.status;
      const message =
        (err.response.data as { message?: string })?.message ?? "请求失败";
      if (httpStatus === 410) {
        return { status: "approved", message, httpStatus };
      }
      if (httpStatus === 404) {
        return { status: "not_found", message, httpStatus };
      }
      return { status: "error", message, httpStatus };
    }
    return { status: "error", message: (err as Error).message, httpStatus: 0 };
  }
}
