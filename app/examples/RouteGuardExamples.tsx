import React from "react";
import { RouteGuard, withRouteGuard } from "~/components/RouteGuard";
import { useRouteGuard } from "~/hooks/useRouteGuard";
import { permissionCheckers } from "~/config/routePermissions";

// 示例1: 使用RouteGuard组件包装
const ProtectedPageExample1: React.FC = () => {
  return (
    <RouteGuard config={{ requireAuth: true, requiredLevel: 5 }}>
      <div>
        <h1>这是一个需要登录且等级≥5的页面</h1>
        <p>只有满足条件的用户才能看到这个内容</p>
      </div>
    </RouteGuard>
  );
};

// 示例2: 使用withRouteGuard高阶组件
const ProtectedPageComponent: React.FC = () => {
  return (
    <div>
      <h1>这是一个需要管理员权限的页面</h1>
      <p>只有管理员才能看到这个内容</p>
    </div>
  );
};

const ProtectedPageExample2 = withRouteGuard(ProtectedPageComponent, {
  requireAuth: true,
  customCheck: permissionCheckers.isAdmin,
  unauthorizedMessage: "只有管理员可以访问此页面",
});

// 示例3: 使用useRouteGuard Hook
const ProtectedPageExample3: React.FC = () => {
  const { userInfo, isLoggedIn, userLevel } = useRouteGuard({
    requireAuth: true,
    requiredLevel: 3,
    unauthorizedMessage: "需要VIP权限才能访问",
  });

  // 如果权限检查失败，组件会自动重定向，这里的代码不会执行
  return (
    <div>
      <h1>VIP专属页面</h1>
      <p>欢迎，{userInfo?.username}！</p>
      <p>您的等级：{userLevel}</p>
      <p>登录状态：{isLoggedIn ? "已登录" : "未登录"}</p>
    </div>
  );
};

// 示例4: 自定义权限检查
const CustomPermissionExample: React.FC = () => {
  return (
    <RouteGuard
      config={{
        requireAuth: true,
        customCheck: (userInfo) => {
          // 自定义权限逻辑：用户名包含"admin"或等级≥10
          return userInfo?.username?.includes("admin") || (userInfo?.level ?? 0) >= 10;
        },
        unauthorizedMessage: "只有管理员或高级用户可以访问",
        redirectTo: "/unauthorized",
      }}
    >
      <div>
        <h1>管理员或高级用户专属页面</h1>
      </div>
    </RouteGuard>
  );
};

// 示例5: 嵌套路由守卫
const NestedGuardExample: React.FC = () => {
  return (
    <RouteGuard config={{ requireAuth: true }}>
      <div>
        <h1>外层：需要登录</h1>

        <RouteGuard config={{ requiredLevel: 5 }}>
          <div>
            <h2>内层：需要等级≥5</h2>
            <p>这部分内容需要更高的权限</p>
          </div>
        </RouteGuard>

        <p>这部分内容只需要登录即可看到</p>
      </div>
    </RouteGuard>
  );
};

// 导出示例组件
export {
  ProtectedPageExample1,
  ProtectedPageExample2,
  ProtectedPageExample3,
  CustomPermissionExample,
  NestedGuardExample,
};
