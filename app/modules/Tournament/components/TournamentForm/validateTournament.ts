import type { TournamentData } from "~/types/tournamentsData";

export type TournamentValidationError = {
  message: string;
  section: string;
  playerIndex?: number;
  stageIndex?: number;
};

/** Validate persisted entries, including editors that are currently unmounted. */
export function validateTournament(data: TournamentData): TournamentValidationError | null {
  const empty = (value: unknown) => typeof value !== "string" || !value.trim();
  const validDate = (value: unknown) => typeof value === "number" && Number.isFinite(value) && !Number.isNaN(new Date(value).getTime());
  const info = (message: string) => ({ message, section: "赛事信息" });
  if (empty(data.name)) return info("赛事名称不可为空");
  if (!["individual", "team"].includes(data.type)) return info("请选择赛事类型");
  if (empty(data.rogue)) return info("请选择肉鸽主题");
  if (!["初始版本", "DLC_1", "DLC_2"].includes(data.edition)) return info("请选择肉鸽版本");
  if (empty(data.level)) return info("肉鸽难度不可为空");

  for (const [stageIndex, stage] of data.stages.entries()) {
    const prefix = `第 ${stageIndex + 1} 个阶段${stage.name ? `（${stage.name}）` : ""}`;
    const error = (message: string) => ({ message: `${prefix}：${message}`, section: "赛事阶段", stageIndex });
    if (empty(stage.name)) return error("阶段名称不可为空");
    if (!validDate(stage.startTime)) return error("请填写有效的开始日期");
    if (!validDate(stage.endTime)) return error("请填写有效的结束日期");
    if (!["rank", "1on1"].includes(stage.type)) return error("请选择赛制");
  }
  if (data.type === "team") {
    for (const [index, team] of (data.teams || []).entries()) {
      if (empty(team.name) || empty(team.id))
        return { message: `第 ${index + 1} 支队伍：队伍名称和队伍ID不可为空`, section: "参赛队伍" };
    }
  }
  for (const [playerIndex, player] of data.players.entries()) {
    const prefix = `第 ${playerIndex + 1} 位选手${player.name ? `（${player.name}）` : ""}`;
    const error = (message: string, section = "参赛选手") => ({ message: `${prefix}：${message}`, section, playerIndex });
    if (empty(player.name)) return error("选手名称不可为空");
    if (data.type === "team" && !(data.teams || []).some(team => !empty(team.id) && team.members.includes(player.name)))
      return error("请选择所属队伍");
    for (const [key, label] of Object.entries(data.customPlayerKeys || {})) {
      if ((player.customPlayerValues?.[key]?.length || 0) > 128)
        return error(`${label}不能超过 128 个字符`);
    }
    for (const [index, game] of player.games.entries()) {
      if (!validDate(game.date)) return error(`第 ${index + 1} 场比赛（${game.stage || "未填写阶段"}）时间无效`, "比赛进程");
      const stage = data.stages.find(stage => stage.name === game.stage);
      for (const [key, label] of Object.entries(stage?.customStageKeys || {})) {
        if ((game.customStageValues?.[key]?.length || 0) > 128)
          return error(`第 ${index + 1} 场比赛（${game.stage}）：${label}不能超过 128 个字符`, "比赛进程");
      }
    }
  }
  return null;
}
