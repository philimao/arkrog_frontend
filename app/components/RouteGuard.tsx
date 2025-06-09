import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { toast } from "react-toastify";
import type { UserInfo } from "~/types/userInfo";

export interface RouteGuardConfig {
  // 需要登录的路由
  requireAuth?: boolean;
  // 需要特定权限级别
  requiredLevel?: number;
  // 自定义权限检查函数
  customCheck?: (userInfo: UserInfo | undefined) => boolean;
  // 重定向路径
  redirectTo?: string;
  // 权限检查失败时的提示信息
  unauthorizedMessage?: string;
}

interface RouteGuardProps {
  children: React.ReactNode;
  config?: RouteGuardConfig;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, config = {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, loaded } = useUserInfoStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const {
    requireAuth = false,
    requiredLevel = 0,
    customCheck,
    redirectTo = "/",
    unauthorizedMessage = "您没有访问此页面的权限",
  } = config;

  useEffect(() => {
    // 等待用户信息加载完成
    if (!loaded) {
      return;
    }

    let authorized = true;

    // 检查是否需要登录
    if (requireAuth) {
      if (!userInfo || !userInfo.username) {
        authorized = false;
        toast.error("请先登录");
      }
    }

    // 检查用户等级
    if (authorized && requiredLevel > 0) {
      if (!userInfo || userInfo.level < requiredLevel) {
        authorized = false;
        toast.error(`需要等级 ${requiredLevel} 及以上才能访问`);
      }
    }

    // 自定义权限检查
    if (authorized && customCheck) {
      if (!customCheck(userInfo)) {
        authorized = false;
        toast.error(unauthorizedMessage);
      }
    }

    setIsAuthorized(authorized);

    // 如果权限检查失败，重定向
    if (!authorized) {
      navigate(redirectTo, {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [
    userInfo,
    loaded,
    location.pathname,
    navigate,
    requireAuth,
    requiredLevel,
    customCheck,
    redirectTo,
    unauthorizedMessage,
  ]);

  // 等待权限检查完成
  if (!loaded || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">正在验证权限...</div>
      </div>
    );
  }

  // 权限检查通过，渲染子组件
  if (isAuthorized) {
    return <>{children}</>;
  }

  // 权限检查失败，不渲染任何内容（已经重定向）
  return null;
};

// 高阶组件版本，用于包装路由组件
export const withRouteGuard = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config?: RouteGuardConfig,
) => {
  return (props: P) => (
    <RouteGuard config={config}>
      <WrappedComponent {...props} />
    </RouteGuard>
  );
};

export default RouteGuard;
