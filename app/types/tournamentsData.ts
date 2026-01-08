export interface TournamentData {
  /** 由首次提交时时name的hash前8位构成，后续修改name不影响id */
  id: string;
  /** 如果有多个赛季，需包含赛季信息，例：仙术杯#6 */
  name: string;
  /** 赛事集id，若无所属赛事集置为空字符串 */
  groupId: string;
  /** 赛事头像 */
  avatar: string;
  /** 肉鸽主题 */
  rogue: string;
  /** 版本 */
  edition: "初始版本" | "DLC_1" | "DLC_2";
  /** 比赛类型（个人/团队赛） */
  type: "individual" | "team";
  /** 成员别名 */
  memberAlias: string;
  /** 关键成员别名 */
  keyMemberAlias: string;
  /** 开始时间 */
  startTime: number;
  /** 难度等级 */
  level: string;
  /** 标签 */
  labels: string[];
  /** 规则 */
  rule: string;
  /** 详细规则 */
  detailRule?: string;
  /** 组织者信息 */
  organizers: {
    mid: string;
    name: string;
    avatar: string;
  }[];
  /** 直播间信息 */
  rooms: {
    mid: string;
    room_id: string;
    name: string;
    avatar: string;
  }[];
  /** 是否正在进行 */
  ongoing?: boolean;
  /** 绑定在选手信息上的自定义keys，{server:"服务器"} */
  customPlayerKeys: Record<string, string>;
  /** 用于分组的key，可以从customPlayerKeys中获取 */
  groupBy: string;
  /** 赛事阶段 */
  stages: TournamentStage[];
  /** 团队信息 */
  teams?: TournamentTeam[];
  /** 选手信息 */
  players?: TournamentPlayer[];
  /** 最后编辑时间戳 */
  lastEditTime?: number;
}

export interface TournamentGroupData {
  /** 由新建时name的hash前8位构成，后续修改name不影响id */
  id: string;
  /** 赛事集名称 */
  name: string;
  /** 下属赛事的id */
  seasons: string[];
  /** 创建时间 */
  date_created: string;
  /** 更新时间 */
  date_updated: string;
}

export interface TournamentStage {
  /** 阶段名称 */
  name: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 阶段类型（积分赛/淘汰赛） */
  type: "rank" | "1on1";
  /** 绑定在具体比赛上的自定义keys，{session:"场地", strategy："美愿"}，value在TournamentGame中 */
  customStageKeys: Record<string, string>;
  /** 用于分组的key，可以从customStageKeys中获取 */
  groupBy: string;
}

export interface TournamentTeam {
  /** 队伍名称 */
  name: string;
  /** 队伍id */
  id?: string;
  /** 队伍头像 */
  avatar: string;
  /** 最终排名 */
  finalRank?: number;
  /** 备注 */
  note?: string;
  /** 队伍成员 */
  members: string[];
  /** 队长 */
  leader: string;
  /** 队伍关键成员 */
  keyMember: string;
  /** 比赛阶段 */
  stages: TournamentTeamStage[];
}

export interface TournamentTeamStage {
  /** 阶段名称 */
  name: string;
  /** 队伍总分 */
  point?: number;
  /** 队伍排名 */
  rank?: number;
}

export type TournamentPlayer = {
  /** 选手mid */
  mid: string;
  /** 选手名称 */
  name: string;
  /** 选手头像 */
  face: string;
  /** 粉丝数 */
  fans?: number;
  /** 队伍名称 */
  teamName?: string;
  /** 最终排名 */
  finalRank?: number;
  /** 备注 */
  note?: string;
  /** Tournament定义的key对应的values，{server:"简中服"} */
  customPlayerValues: Record<string, string>;
  /** 比赛场次 */
  games: TournamentGame[];
};

export type TournamentGame = {
  /** 比赛阶段 */
  stage: string;
  /** 比赛日期 */
  date: number;
  /** 日程（Day1） */
  schedule?: string;
  /** 分数 */
  point?: number;
  /** 结局 */
  ending?: string;
  /** 备注 */
  note?: string;
  /** 比赛结果（1 on 1) */
  result?: "win" | "lose";
  /** 对手mid */
  rivalMid?: string;
  /** 开局分队 */
  starterSquad?: string;
  /** 对手 */
  starterOp?: string;
  /** 等级 */
  level?: string;
  /** 时长 */
  duration?: string;
  /** 排名 */
  rank?: number;
  /** 回放链接 */
  playback?: string;
  /** Stage中定义的key对应的values，{session:"大粽场"}， {strategy:"美愿"} */
  customStageValues: Record<string, string>;
};
