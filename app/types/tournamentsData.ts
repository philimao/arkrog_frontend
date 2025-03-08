export interface TournamentData {
  id: string; // initials of name
  name: string; // without season
  season: number;
  seasons: number[]; // sibling seasons
  tournamentId: string; // id_season
  tournamentName: string; // name#season
  avatar: string;
  playBack: string;
  rogue: string;
  edition: string;
  level: string;
  labels: string[];
  rule: string;
  detailRule?: string;
  organizerMid: string;
  organizerName: string;
  room: string;
  ongoing?: boolean;
  stages: TournamentStage[];
  players?: TournamentPlayer[];
}

export interface TournamentStage {
  name: string;
  startTime: number;
  endTime: number;
}

export type TournamentPlayer = {
  mid: string;
  name: string;
  face: string;
  teamId?: string;
  finalRank?: number;
  note?: string;
  games: TournamentGame[];
};

export type TournamentGame = {
  stage: string;
  session?: string;
  date: number;
  schedule?: string;
  point?: number;
  ending?: string;
  note?: string;
  type: "rank" | "1on1";
  result?: "win" | "lose";
  rival?: string;
  starterSquad?: string;
  starterOp?: string[];
  level?: string;
  duration?: string;
  rank?: number;
};
