export * from "./calculator";
export * from "./helper";

// 自动导入所有干员计算器实现
import.meta.glob("./charImpl/**.ts", { eager: true });
