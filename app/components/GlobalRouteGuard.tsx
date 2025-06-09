import React from "react";
import { useLocation } from "react-router";
import { RouteGuard } from "./RouteGuard";
import { getRoutePermission } from "~/config/routePermissions";

interface GlobalRouteGuardProps {
  children: React.ReactNode;
}

/**
 * 全局路由守卫组件
 * 自动根据当前路由路径应用相应的权限检查
 */
export const GlobalRouteGuard: React.FC<GlobalRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const routeConfig = getRoutePermission(location.pathname);

  return <RouteGuard config={routeConfig}>{children}</RouteGuard>;
};

export default GlobalRouteGuard;
