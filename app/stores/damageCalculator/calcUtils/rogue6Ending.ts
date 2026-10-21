export const ROGUE6_ENDING_RELIC = "rogue_6_relic_final_7";
export const ROGUE6_BLUEPRINT_RELIC = "rogue_6_relic_final_10";

export function getRogue6BossRelic(stageId: string) {
  if (/^ro6_b_[123](?:_b)?(?:_dlc1)?$/.test(stageId)) return ROGUE6_ENDING_RELIC;
  if (/^ro6_b_7(?:_b)?$/.test(stageId)) return ROGUE6_BLUEPRINT_RELIC;
  return undefined;
}

/** 结局藏品对应的普通/加强关卡。 */
export function getRogue6BossVariant(stageId: string, enhanced: boolean) {
  const relic = getRogue6BossRelic(stageId);
  if (relic === ROGUE6_BLUEPRINT_RELIC) return enhanced ? "ro6_b_7_b" : "ro6_b_7";
  if (relic !== ROGUE6_ENDING_RELIC) return stageId;
  const base = stageId.replace(/_dlc1$/, "");
  return enhanced ? `${base}_dlc1` : base;
}

export function syncRogue6BossRelics(stageId: string, relics: string[]) {
  const relic = getRogue6BossRelic(stageId);
  if (!relic) return relics;
  const next = relics.filter(id => id !== relic);
  if (getRogue6BossVariant(stageId, false) !== stageId) next.push(relic);
  return next;
}
