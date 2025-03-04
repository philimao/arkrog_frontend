export interface TournamentData {
  id: string;
  name: string;
  face: string;
  season?: number,
  playBack: string;
  rogue: string,
  edition: string;
  level: string;
  labels: string[];
  rule: string;
  detailRule?: string;
  organizerId: string;
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
  id: string;
  mid: string;
  name: string;
  face: string;
  teamId?: string;
  finalRank?: number;
  note?: string;
  games: TournamentGame[];
}

export type TournamentGame = {
  stage: string;
  session?: string;
  date: number;
  schedule?: string;
  point?: number;
  ending?: string;
  note?: string;
  type: 'rank' | '1on1';
  result?: 'win' | 'lose';
  rival?: string;
  starterSquad?: string;
  starterOp?: string[];
  level?: string;
  duration?: string;
  rank?: number;
}
