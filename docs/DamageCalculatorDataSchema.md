# 伤害计算器WASM数据约定

## 伤害计算接口定义

下面定义了模块导出函数calculate的接口，其中具体的类型定义可以在`gameData.ts`中详细查看

```
// 带*的域代表对计算非常重要
interface CharInput {
  phaseLevel: number;               // 精英化等级
  phase: CharPhase;                 // 精英化数据
  level: number;                    // 干员等级
  attribute: CharAttributeExt;      // 干员局外面板*
  skillKey: string;                 // 技能键名
  skillLevel: number;               // 技能等级
  skill: SkillLevelData;            // 选择的技能数据*
  uniEquipId: string;               // 模组ID
  uniEquipLevel: number;            // 模组等级
  uniEquip: UniEquipData;           // 选择的模组数据*
  potential: number;                // 潜能等级*
}

interface CalculatorOutput {
  auto: DamageData;                 // 普攻
  skill: DamageData;                // 技能
  cycle: DamageData;                // 周期
  logs: string[];                   // 运算过程
}

interface DamageData {
  atk: number,                      // 面板攻击力
  dps: DamageByType,                // dps
  total_damage: DamageByType,       // 总伤
}

interface DamageByType {
  phy?: number;                     // 物理
  mag?: number;                     // 法术
  pure?: number;                    // 真实
  ep?: number;                      // 元素
}

function calculate(
  charInput: CharInput,             // 干员数据输入
  enemyInput: EnemyAttribute,       // 敌人最终面板
  charData: CharData,               // 干员解包原始数据
  enemyData: EnemyData,             // 敌人解包原始数据
  skillData: SkillData,             // 技能原始解包数据
  uniEquipData: UniEquipData,       // 模组原始解包数据
  relics: RelicWrapper[],           // 有效藏品列表
) {
  // calculation process ...
  return {
    auto: DamageData,               // 普攻
    skill: DamageData,              // 技能
    cycle: DamageData,              // 周期
    logs: string[],                 // 运算过程
  };
}
```
