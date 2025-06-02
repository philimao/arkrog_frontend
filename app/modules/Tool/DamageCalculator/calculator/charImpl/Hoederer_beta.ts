import type { CalculatorInput, CalculatorOutput, DamageByType } from "~/types/gameData";
import { CalculatorHelper } from "../helper";
import { registerCalculatorImpl } from "../impls";

export interface DamageRecord {
  /** 伤害造成时间轴(毫秒) */
  time: number;
  /** 造成伤害 */
  damage: DamageByType;
  /** 伤害来源 */
  source: {
    /** 来源类型: 技能、攻击、藏品 */
    type: "skill" | "attack" | "relic";
    /** 来源技能 */
    skill: string;
    /** 来源攻击 */
    attack: string;
  };
}

/** 赫德雷伤害计算器, 模拟攻击版本 */
export async function Hoederer_beta(input: CalculatorInput): Promise<CalculatorOutput> {
  const baseAttackTime = input.charInput.attribute.baseAttackTime;
  const atkSpeed = input.charInput.attribute.attackSpeed;
  const result: CalculatorOutput = CalculatorHelper.createCalculatorOutput();
  // 普攻次数
  let attackCount = 0;
  // 释放技能次数
  let skillCount = 0;
  // 造成伤害记录
  const damageRecords: DamageRecord[] = [];
  // 输出窗口(30s)
  const outputWindow = 30000;
  // 当前时间轴
  let currentTime = 0;
  // 下次普攻时间
  let nextAttackTime = 0;
  // 技力要求(初版为1技能攻击回复)1技能专3为3点攻击回复要求
  const skillEnergy = 3;
  // 当前技力
  let currentEnergy = 0;
  // 回复技力方式
  const energyRecoveryType = "attack";
  // 不考虑技能释放时间，只考虑攻击时间
  while (true) {
    // 此次循环是否可以释放技能
    if (currentEnergy >= skillEnergy) {
      hoedererSkill1();
    }
    // 此次循环是否可以普攻
    if (currentTime >= nextAttackTime) {
      console.log(`[${currentTime / 1000}s] 普攻`);
      hoedererAttack();
    }

    // 结束循环(时间轴大于输出窗口)
    if (currentTime >= outputWindow) {
      break;
    }
    /**
     * 每进行一轮循环, 时间轴向前推进1帧(定为17ms)
     */
    currentTime += 17;
  }

  /**
   * 实际攻击间隔: 基础攻击间隔 * (100 / 攻击速度)
   * @returns 实际攻击间隔(毫秒)
   */
  function getActualAttackTime() {
    return Math.round(baseAttackTime * 1000 * (100 / atkSpeed));
  }

  /**
   * 攻击力结算
   */
  function calculateAttack() {
    // 待实现管道
    const atk = input.charInput.attribute.atk;
    const atkBuffIn = input.charInput.charsBuffInGame.atk;
    const atkBuffExtra = 0; // 额外加攻，demo版不需要
    return (atk * (1 + atkBuffIn) + atkBuffExtra) * 1.1;
  }

  /**
   * 赫德雷攻击实现
   */
  function hoedererAttack() {
    attackCount += 1;
    const damageRecord: DamageRecord = {
      time: currentTime,
      damage: {
        phy: calculateAttack(),
        mag: 0,
        pure: 0,
        ep: 0,
      },
      source: {
        type: "attack",
        skill: "",
        attack: "",
      },
    };
    recordDamage(damageRecord);
    // 下次普攻时间(当前时间 + 实际攻击间隔)
    nextAttackTime = currentTime + getActualAttackTime();
    // 如果是攻击回复技力，则增加技力
    if (energyRecoveryType === "attack") {
      currentEnergy += 1;
    }
  }

  /**
   * 赫德雷1技能实现
   */
  function hoedererSkill1() {
    // 由于1技能是强化普攻，所以需要判断是否可以普攻
    if (currentTime < nextAttackTime) {
      return;
    }
    console.log(`[${currentTime / 1000}s] 释放1技能`);
    // 计算攻击力
    const damage = calculateAttack();
    // 1技能是2.6倍攻击力伤害
    const damageRecord: DamageRecord = {
      time: currentTime,
      damage: {
        phy: damage * 2.6,
        mag: 0,
        pure: 0,
        ep: 0,
      },
      source: {
        type: "skill",
        skill: "1技能",
        attack: "",
      },
    };
    recordDamage(damageRecord);
    // 释放技能清空技力
    currentEnergy = 0;
    // 技能释放次数+1
    skillCount += 1;
    // 下次普攻时间(当前时间 + 实际攻击间隔)
    nextAttackTime = currentTime + getActualAttackTime();
  }

  /**
   * 伤害记录
   */
  function recordDamage(record: DamageRecord) {
    damageRecords.push(record);
  }

  console.log("普攻次数", attackCount);
  console.log("释放技能次数", skillCount);
  printDamageRecords(damageRecords);

  return result;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printDamageRecords(records: DamageRecord[]) {
  const totalDamage = records.reduce((acc, record) => {
    return acc + record.damage.phy + record.damage.mag + record.damage.pure + record.damage.ep;
  }, 0);
  console.log("造成总伤", totalDamage);
}
// 注册赫德雷伤害计算器
registerCalculatorImpl("Hoederer_beta", Hoederer_beta);
