# 路由守卫使用指南

这个路由守卫系统提供了类似Vue Router `beforeEach` 的功能，让你可以在用户访问路由前进行权限检查。

## 功能特性

- ✅ 登录状态检查
- ✅ 用户等级权限检查  
- ✅ 自定义权限检查函数
- ✅ 自动重定向到指定页面
- ✅ 友好的错误提示
- ✅ 支持全局配置和局部配置
- ✅ TypeScript 类型支持

## 基本概念

### RouteGuardConfig 配置选项

```typescript
interface RouteGuardConfig {
  // 是否需要登录
  requireAuth?: boolean;
  // 需要的最低用户等级
  requiredLevel?: number;
  // 自定义权限检查函数
  customCheck?: (userInfo: UserInfo | undefined) => boolean;
  // 权限检查失败时重定向的路径
  redirectTo?: string;
  // 权限检查失败时的提示信息
  unauthorizedMessage?: string;
}
```

## 使用方式

### 1. 使用 RouteGuard 组件

最直接的方式，将需要保护的内容包装在 `RouteGuard` 组件中：

```tsx
import { RouteGuard } from '~/components/RouteGuard';

const ProtectedPage = () => {
  return (
    <RouteGuard config={{ requireAuth: true, requiredLevel: 5 }}>
      <div>
        <h1>VIP专属内容</h1>
        <p>只有登录且等级≥5的用户才能看到</p>
      </div>
    </RouteGuard>
  );
};
```

### 2. 使用 withRouteGuard 高阶组件

适用于需要保护整个组件的场景：

```tsx
import { withRouteGuard } from '~/components/RouteGuard';

const AdminPageComponent = () => {
  return (
    <div>
      <h1>管理员页面</h1>
    </div>
  );
};

// 包装组件，添加权限检查
const AdminPage = withRouteGuard(AdminPageComponent, {
  requireAuth: true,
  customCheck: (userInfo) => userInfo?.level >= 10,
  unauthorizedMessage: '只有管理员可以访问'
});
```

### 3. 使用 useRouteGuard Hook

在组件内部进行权限检查，获取用户信息：

```tsx
import { useRouteGuard } from '~/hooks/useRouteGuard';

const ProfilePage = () => {
  const { userInfo, isLoggedIn, userLevel } = useRouteGuard({
    requireAuth: true
  });

  return (
    <div>
      <h1>个人资料</h1>
      <p>用户名：{userInfo?.username}</p>
      <p>等级：{userLevel}</p>
    </div>
  );
};
```

### 4. 全局路由守卫

在根布局中使用 `GlobalRouteGuard`，自动根据路由配置进行权限检查：

```tsx
import { GlobalRouteGuard } from '~/components/GlobalRouteGuard';

export default function RootLayout() {
  return (
    <div>
      <GlobalRouteGuard>
        <Outlet />
      </GlobalRouteGuard>
    </div>
  );
}
```

## 路由权限配置

在 `app/config/routePermissions.ts` 中配置各个路由的权限要求：

```typescript
export const routePermissions: Record<string, RouteGuardConfig> = {
  '/': {},  // 首页无权限要求
  
  '/home/*': {
    requireAuth: true,
    redirectTo: '/',
    unauthorizedMessage: '访问个人中心需要先登录'
  },
  
  '/admin/*': {
    requireAuth: true,
    customCheck: (userInfo) => userInfo?.level >= 10,
    unauthorizedMessage: '只有管理员可以访问'
  }
};
```

## 常用权限检查函数

系统提供了一些预定义的权限检查函数：

```typescript
import { permissionCheckers } from '~/config/routePermissions';

// 检查是否是管理员（等级≥10）
permissionCheckers.isAdmin(userInfo)

// 检查是否是VIP用户（等级≥5）  
permissionCheckers.isVIP(userInfo)

// 检查是否已绑定B站账号
permissionCheckers.hasBilibiliLinked(userInfo)
```

## 高级用法

### 嵌套路由守卫

可以嵌套使用路由守卫，实现层级权限控制：

```tsx
const NestedPage = () => {
  return (
    <RouteGuard config={{ requireAuth: true }}>
      <div>
        <h1>需要登录的页面</h1>
        
        <RouteGuard config={{ requiredLevel: 5 }}>
          <div>
            <h2>VIP专属内容</h2>
            <p>需要等级≥5才能看到</p>
          </div>
        </RouteGuard>
      </div>
    </RouteGuard>
  );
};
```

### 自定义权限检查

```tsx
<RouteGuard 
  config={{
    requireAuth: true,
    customCheck: (userInfo) => {
      // 复杂的权限逻辑
      const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
      const isVIP = userInfo?.level >= 5;
      
      // 只有VIP用户才能在周末访问
      return !isWeekend || isVIP;
    },
    unauthorizedMessage: '周末期间只有VIP用户可以访问'
  }}
>
  <WeekendContent />
</RouteGuard>
```

### 动态权限检查

```tsx
const DynamicPermissionPage = ({ resourceId }) => {
  const { userInfo } = useRouteGuard({
    requireAuth: true,
    customCheck: (userInfo) => {
      // 根据资源ID动态检查权限
      return checkResourcePermission(userInfo, resourceId);
    }
  });

  return <ResourceDetail id={resourceId} />;
};
```

## 最佳实践

1. **统一配置**: 在 `routePermissions.ts` 中统一配置路由权限，便于管理
2. **错误提示**: 为不同的权限检查提供清晰的错误提示信息
3. **重定向策略**: 合理设置重定向路径，提供良好的用户体验
4. **性能考虑**: 避免在权限检查函数中进行复杂的计算或API调用
5. **类型安全**: 充分利用TypeScript类型检查，确保代码质量

## 与 userInfoStore 的集成

路由守卫系统与 `userInfoStore` 深度集成：

- 自动监听用户登录状态变化
- 在用户信息加载完成后才进行权限检查
- 支持用户等级、用户名等字段的权限验证

```typescript
// userInfoStore 结构
interface UserInfo {
  username: string;
  level: number;
  // 其他用户信息字段...
}
```

这个路由守卫系统提供了灵活且强大的权限控制功能，可以满足各种复杂的业务需求。 