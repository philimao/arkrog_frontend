# 通用编辑锁定系统使用说明

## 概述

这是一个通用的编辑锁定系统，用于防止多个用户同时编辑同一资源。系统包含前端Custom Hook和后端通用路由，支持不同类型的资源（tournament、player、gamedata、record等）。

## 特性

- ✅ **多资源类型支持**：支持tournament、player、gamedata、record等
- ✅ **自动倒计时**：可配置的锁定时长（默认59分钟）
- ✅ **冲突检测**：防止多用户同时编辑
- ✅ **自动清理**：页面离开时自动解锁
- ✅ **用户友好的提示**：清晰的Modal确认对话框
- ✅ **类型安全**：完整的TypeScript支持

## 后端API

### 路由前缀：`/edit-lock`

#### 锁定资源
```http
POST /edit-lock/lock
{
  "resourceType": "tournament",
  "resourceId": "123",
  "username": "user1"
}
```

#### 解锁资源
```http
POST /edit-lock/unlock
{
  "resourceType": "tournament", 
  "resourceId": "123",
  "username": "user1"
}
```

#### 检查锁定状态
```http
GET /edit-lock/status/tournament/123
```

#### 刷新锁定时间
```http
POST /edit-lock/refresh
{
  "resourceType": "tournament",
  "resourceId": "123", 
  "username": "user1"
}
```

#### 批量检查状态（可选）
```http
POST /edit-lock/batch-status
{
  "resources": [
    {"resourceType": "tournament", "resourceId": "123"},
    {"resourceType": "player", "resourceId": "456"}
  ]
}
```

## 前端使用

### 1. 基本使用

```tsx
import { useEditLock } from "~/hooks/useEditLock";
import EditLockConfirmModal from "~/components/EditLock/EditLockConfirmModal";

function TournamentEdit() {
  const { tournamentId } = useParams();
  const { userInfo } = useUserInfoStore();

  const editLock = useEditLock({
    resourceType: "tournament",
    resourceId: tournamentId || "",
    username: userInfo?.username || "",
    enabled: !!(tournamentId && userInfo?.username)
  });

  // 加载中
  if (editLock.isLoading) {
    return <div>加载中...</div>;
  }

  // 被锁定
  if (editLock.lockStatus.isLocked && !editLock.lockStatus.canEdit) {
    return <div>资源被其他用户锁定</div>;
  }

  return (
    <div>
      {/* 编辑界面 */}
      <EditForm />
      
      {/* 确认Modal */}
      <EditLockConfirmModal
        isOpen={editLock.isModalOpen}
        message={editLock.confirmMessage}
        resourceType="赛事"
        onConfirmContinue={editLock.handleConfirmContinue}
        onCancelEdit={editLock.handleCancelEdit}
      />
    </div>
  );
}
```

### 2. 高级配置

```tsx
const editLock = useEditLock({
  resourceType: "player",
  resourceId: playerId || "",
  username: userInfo?.username || "",
  enabled: !!(playerId && userInfo?.username),
  lockDuration: 30 * 60 * 1000, // 30分钟
  onLockSuccess: () => {
    console.log("锁定成功");
  },
  onLockFailed: (reason) => {
    console.warn("锁定失败:", reason);
  },
  onUnlocked: () => {
    console.log("已解锁");
  }
});
```

### 3. Hook返回值

```tsx
interface UseEditLockReturn {
  // 状态
  lockStatus: LockStatus;
  isLoading: boolean;
  confirmMessage: string;
  
  // Modal控制
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  
  // 操作方法
  lockResource: () => Promise<boolean>;
  unlockResource: () => Promise<void>;
  checkLockStatus: () => Promise<void>;
  refreshLock: () => Promise<LockResponse>;
  
  // 确认操作
  handleConfirmContinue: () => Promise<void>;
  handleCancelEdit: () => Promise<void>;
}
```

## 支持的资源类型

当前支持的资源类型（可在后端`validateResourceType`函数中添加）：

- `tournament` - 赛事
- `player` - 选手
- `gamedata` - 游戏数据  
- `record` - 记录

## 工作流程

1. **进入编辑页面**：
   - 检查当前锁定状态
   - 尝试锁定资源
   - 启动倒计时

2. **编辑过程中**：
   - 59分钟后弹出确认对话框
   - 用户可选择继续编辑或离开

3. **继续编辑**：
   - 刷新锁定时间
   - 重新启动倒计时

4. **离开编辑**：
   - 清除倒计时
   - 解锁资源

5. **页面关闭**：
   - 自动解锁资源

## 扩展新资源类型

### 1. 后端添加资源类型

```javascript
// routers/editLock.js
const validateResourceType = (resourceType) => {
  const allowedTypes = [
    'tournament', 
    'player', 
    'gamedata', 
    'record',
    'newResourceType' // 添加新类型
  ];
  return allowedTypes.includes(resourceType);
};
```

### 2. 前端使用

```tsx
const editLock = useEditLock({
  resourceType: "newResourceType", // 使用新类型
  resourceId: resourceId || "",
  username: userInfo?.username || "",
  enabled: !!(resourceId && userInfo?.username)
});
```

## 注意事项

1. **Redis依赖**：确保Redis服务正常运行
2. **用户认证**：需要valid的username
3. **资源ID**：确保resourceId的唯一性
4. **网络错误**：做好网络错误的处理
5. **并发控制**：Redis键的原子性保证了并发安全

## 测试

```tsx
// 测试锁定功能
describe('useEditLock', () => {
  it('should lock resource successfully', async () => {
    const { result } = renderHook(() => useEditLock({
      resourceType: 'tournament',
      resourceId: '123',
      username: 'testuser'
    }));
    
    // 等待锁定完成
    await waitFor(() => {
      expect(result.current.lockStatus.canEdit).toBe(true);
    });
  });
});
```

这个通用系统极大地简化了编辑锁定的实现，提高了代码复用性和维护性。 