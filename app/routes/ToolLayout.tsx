import { Outlet } from "react-router";

export default function ToolLayout() {
  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4">伤害计算</h1>
      <Outlet />
    </div>
  );
}
