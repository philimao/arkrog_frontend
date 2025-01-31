import { Outlet } from "react-router";

export default function SeedLayout() {
  return (
    <div className="container">
      <h1 className="text-[2.5rem] font-bold mb-4">种子分享</h1>
      <Outlet />
    </div>
  );
}
