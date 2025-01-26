import React from "react";
import { Outlet } from "react-router";

export default function RelicFreeLayout() {
  return (
    <div className="container mx-auto flex flex-row">
      <Outlet />
    </div>
  );
}
