import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { toast } from "react-toastify";
import type { UserInfo } from "~/types/userInfo";
import type { RouteGuardConfig } from "~/components/RouteGuard";

/**
 * 路由守卫Hook，用于在组件内部进行权限检查
 * @param config 守卫配置
 * @returns 权限检查结果
 */
export const useRouteGuard = (config: RouteGuardConfig = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, loaded } = useUserInfoStore();

  const {
    requireAuth = false,
    requiredLevel = 0,
    customCheck,
    redirectTo = "/",
    unauthorizedMessage = "您没有访问此页面的权限",
  } = config;

  useEffect(() => {
    if (!loaded) return;

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

  return {
    userInfo,
    loaded,
    isLoggedIn: !!(userInfo && userInfo.username),
    userLevel: userInfo?.level || 0,
  };
};

/**
 * 检查用户是否有权限访问指定路由
 * @param userInfo 用户信息
 * @param config 路由守卫配置
 * @returns 是否有权限
 */
export const checkRoutePermission = (userInfo: UserInfo | undefined, config: RouteGuardConfig = {}): boolean => {
  const { requireAuth = false, requiredLevel = 0, customCheck } = config;

  // 检查是否需要登录
  if (requireAuth) {
    if (!userInfo || !userInfo.username) {
      return false;
    }
  }

  // 检查用户等级
  if (requiredLevel > 0) {
    if (!userInfo || userInfo.level < requiredLevel) {
      return false;
    }
  }

  // 自定义权限检查
  if (customCheck) {
    return customCheck(userInfo);
  }

  return true;
};
