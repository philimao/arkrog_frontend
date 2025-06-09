export * from "./calculator";
export * from "./helper";
export * from "./blackboard";
export * from "./buff-context";

import { registerCalculatorImpl, type CalculatorImpl } from "./impls";
// 自动导入所有干员计算器实现
const modules = import.meta.glob("./charImpl/*/**.ts", { eager: true });
Object.entries(modules).forEach(([path, module]) => {
  const name = path.split("/").pop()?.replace(".ts", "") || "";
  const calc = (module as any).default as CalculatorImpl;
  if (calc) {
    registerCalculatorImpl(name, calc);
  }
});
