export interface TournamentData {
  id: string; // generated random string
  name: string; // full name
  seasons: string[]; // sibling seasons
  avatar: string;
  rogue: string;
  edition: string;
  type: "individual" | "team";
  startTime: number;
  level: string;
  labels: string[];
  rule: string;
  detailRule?: string;
  organizerMid: string;
  organizerName: string;
  room: string;
  ongoing?: boolean;
  stages: TournamentStage[];
  teams?: TournamentTeam[];
  players?: TournamentPlayer[];
}

export interface TournamentStage {
  name: string;
  startTime: number;
  endTime: number;
}

export interface TournamentTeam {
  name: string;
  id?: string;
  avatar: string;
  finalRank?: number;
  note?: string;
  members: string[];
  leader: string;
  keyMember: string;
  stages: TournamentTeamStage[];
}

export interface TournamentTeamStage {
  name: string;
  point?: number;
  rank?: number;
}

export type TournamentPlayer = {
  mid: string;
  name: string;
  face: string;
  teamName?: string;
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
  strategy?: string;
  type: "rank" | "1on1";
  result?: "win" | "lose";
  rivalMid?: string;
  starterSquad?: string;
  starterOp?: string[];
  level?: string;
  duration?: string;
  rank?: number;
  playback?: string;
};
