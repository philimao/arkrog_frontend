// 由 tools/build-map-sprite.py 生成，不要手改。
// 新增或替换 public/images/map/ 下的节点图标后重跑该脚本。

/** sprite 整图尺寸（px） */
export const SPRITE_SHEET_WIDTH = 1300;
export const SPRITE_SHEET_HEIGHT = 1300;

/** 图标 id -> 它在 sprite 里的矩形 [x, y, width, height]（px） */
export const SPRITE_RECTS: Record<string, [number, number, number, number]> = {
  battle_boss_cadejo: [0, 0, 260, 260],
  battle_elite: [260, 0, 260, 260],
  battle_mid_boss_shsgzd: [520, 0, 260, 260],
  battle_normal: [780, 0, 260, 260],
  battle_savage: [1040, 0, 260, 260],
  door: [0, 260, 260, 260],
  duel: [260, 260, 260, 260],
  employ: [520, 260, 260, 260],
  evacuate: [780, 260, 260, 260],
  expedition: [1040, 260, 260, 260],
  final: [0, 520, 260, 260],
  hide_battle: [260, 520, 260, 260],
  hide_invisible: [520, 520, 260, 260],
  incident: [780, 520, 260, 260],
  light: [1040, 520, 260, 260],
  portal: [0, 780, 260, 260],
  rest: [260, 780, 260, 260],
  sacrifice: [520, 780, 260, 260],
  scrap_shop: [780, 780, 260, 260],
  shop: [1040, 780, 260, 260],
  story: [0, 1040, 260, 260],
  wish: [260, 1040, 260, 260],
  empty: [520, 1040, 45, 45],
  cursor_anchor: [780, 1040, 176, 176],
};
