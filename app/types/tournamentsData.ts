export interface TournamentGroupData {
  id: string; // 由新建时name的hash前8位构成，后续修改name不影响id
  name: string;
  seasons: string[]; // 下属赛事的id
}

export interface TournamentData {
  id: string; // 由首次提交时时name的hash前8位构成，后续修改name不影响id
  name: string; // 如果有多个赛季，需包含赛季，例：仙术杯#6
  groupId: string; // 赛事集id，若无所属赛事集置为空字符串
  avatar: string;
  rogue: string;
  edition: "初始版本" | "DLC_1" | "DLC_2";
  type: "individual" | "team";
  memberAlias: string;
  keyMemberAlias: string;
  startTime: number;
  level: string;
  labels: string[];
  rule: string;
  detailRule?: string;
  organizerMid: string;
  organizerName: string;
  room: string;
  ongoing?: boolean;
  customPlayerKeys: Record<string, string>; // 绑定在选手信息上的自定义keys，{server:"服务器"}
  groupBy: string; // 用于分组的key，可以从customPlayerKeys或customStageKeys中获取
  stages: TournamentStage[];
  teams?: TournamentTeam[];
  players?: TournamentPlayer[];
  lastEditTime?: number; // 最后编辑时间戳
}

export interface TournamentStage {
  name: string;
  startTime: number;
  endTime: number;
  type: "rank" | "1on1";
  customStageKeys: Record<string, string>; // 绑定在具体比赛上的自定义keys，{session:"场地", strategy："美愿"}，value在TournamentGame中
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
  customPlayerValues: Record<string, string>; // Tournament定义的key对应的values，{server:"简中服"}
  games: TournamentGame[];
};

export type TournamentGame = {
  stage: string;
  date: number;
  schedule?: string;
  point?: number;
  ending?: string;
  note?: string;
  result?: "win" | "lose";
  rivalMid?: string;
  starterSquad?: string;
  starterOp?: string;
  level?: string;
  duration?: string;
  rank?: number;
  playback?: string;
  customStageValues: Record<string, string>; // Stage中定义的key对应的values，{session:"大粽场"}， {strategy:"美愿"}
};
