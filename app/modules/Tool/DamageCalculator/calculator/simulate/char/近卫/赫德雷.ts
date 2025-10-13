/**
 * 本文件实现赫德雷在模拟器中的行为逻辑
 * 优先使用组合的编码泛式, 通过多个函数组合与状态复用实现
 */

/**
 * Unit 角色单位功能
 */
interface UnitState {
  /** 普攻硬直 */
  attack_hard_frame: number;
}

class Unit {
  static create(): UnitState {
    return {
      attack_hard_frame: 0,
    };
  }
}

function createHoederer(context: SimulateContext) {
  const state = Unit.create();
}

function Hoederer(context: SimulateContext) {
  const state = Unit.create();
}

/** 赫德雷普攻 */
function Hoederer_attack() {}

/** 赫德雷1技能 */
function Hoederer_skill_1() {}
