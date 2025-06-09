import type { RouteGuardConfig } from "~/components/RouteGuard";
import type { UserInfo } from "~/types/userInfo";

/**
 * 路由权限配置
 * 定义每个路由路径对应的权限要求
 */
export const routePermissions: Record<string, RouteGuardConfig> = {
  // 首页 - 无权限要求
  "/": {},

  // 无藏收录 - 无权限要求
  "/relic-free": {},
  "/relic-free/*": {},

  // 博客 - 无权限要求
  "/blog": {},
  "/blog/*": {},

  // 工具 - 无权限要求
  "/tool": {},
  "/tool/*": {},

  // 赛事 - 浏览无权限要求，创建和编辑需要登录
  "/tournament": {},
  "/tournament/create": {
    requireAuth: true,
    unauthorizedMessage: "创建赛事需要先登录",
  },
  "/tournament/*/edit": {
    requireAuth: true,
    customCheck: (_userInfo: UserInfo | undefined) => {
      // 可以在这里添加更复杂的权限检查逻辑
      // 比如检查用户是否是赛事创建者
      return true;
    },
    unauthorizedMessage: "只有赛事创建者可以编辑赛事",
  },

  // 个人中心 - 需要登录
  "/home": {
    requireAuth: true,
    redirectTo: "/",
    unauthorizedMessage: "访问个人中心需要先登录",
  },
  "/home/*": {
    requireAuth: true,
    redirectTo: "/",
    unauthorizedMessage: "访问个人中心需要先登录",
  },

  // 消息中心 - 需要登录
  "/home/message": {
    requireAuth: true,
    redirectTo: "/",
  },

  // 我的收藏 - 需要登录
  "/home/favorite": {
    requireAuth: true,
    redirectTo: "/",
  },

  // 账户链接 - 需要登录
  "/home/link-bilibili": {
    requireAuth: true,
    redirectTo: "/",
  },

  // 赞助页面 - 无权限要求
  "/sponsor": {},
};

/**
 * 获取路由的权限配置
 * 支持通配符匹配
 * @param pathname 路由路径
 * @returns 权限配置
 */
export const getRoutePermission = (pathname: string): RouteGuardConfig => {
  // 首先尝试精确匹配
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }

  // 尝试通配符匹配
  for (const [pattern, config] of Object.entries(routePermissions)) {
    if (pattern.includes("*")) {
      const regexPattern = pattern.replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(pathname)) {
        return config;
      }
    }
  }

  // 默认无权限要求
  return {};
};

/**
 * 常用的权限检查函数
 */
export const permissionCheckers = {
  // 检查是否是管理员
  isAdmin: (userInfo: UserInfo | undefined) => {
    return (userInfo?.level ?? 0) >= 10; // 假设10级及以上是管理员
  },

  // 检查是否是VIP用户
  isVIP: (userInfo: UserInfo | undefined) => {
    return (userInfo?.level ?? 0) >= 5; // 假设5级及以上是VIP
  },

  // 检查是否已绑定B站账号
  hasBilibiliLinked: (_userInfo: UserInfo | undefined) => {
    // 这里可以根据实际的用户信息结构来判断
    // 假设有一个字段表示是否已绑定B站
    return true; // 需要根据实际情况修改
  },
};
