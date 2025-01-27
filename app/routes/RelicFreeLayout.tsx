import React from "react";
import { Outlet } from "react-router";

export default function RelicFreeLayout() {
  return (
    <div className="container flex-grow">
      <Outlet />
    </div>
  );
}
