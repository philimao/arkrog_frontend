export * from "./calculator";
export * from "./helper";
export * from "./blackboard";
export * from "./buff-context";

import {
  registerCalculatorImpl,
  type CalculatorImpl,
  type CharImpl,
  type ApplyTalentInput,
  type ApplySkillInput,
} from "./impls";

function voidApplyTalent(input: ApplyTalentInput) {
  console.warn(`[${input.charInput.name}] 未实现天赋应用`);
}

function voidApplySkill(input: ApplySkillInput) {
  console.warn(`[${input.charInput.name}] 未实现技能应用`);
}

// 自动导入所有干员计算器实现
const modules = import.meta.glob("./charImpl/*/**.ts", { eager: true });
Object.entries(modules).forEach(([path, _module]) => {
  const name = path.split("/").pop()?.replace(".ts", "") || "";
  const module = _module as Partial<CharImpl>;
  const calc = module.calculator || ((module as any).default as CalculatorImpl);
  const applyTalent = module.applyTalent;
  const applySkill = module.applySkill;
  const charSpecConfigs = module.charSpecConfigs;
  if (calc) {
    registerCalculatorImpl(name, {
      calculator: calc,
      applyTalent: applyTalent || voidApplyTalent,
      applySkill: applySkill || voidApplySkill,
      charSpecConfigs: charSpecConfigs || {},
    });
  }
});
