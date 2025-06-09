// 示例：在Player编辑页面中使用通用锁定系统
import { useParams } from "react-router";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useEditLock } from "~/hooks/useEditLock";
import EditLockConfirmModal from "~/components/EditLock/EditLockConfirmModal";

export default function PlayerEditExample() {
  const { playerId } = useParams();
  const { userInfo } = useUserInfoStore();

  // 使用通用编辑锁定Hook - 只需要改变resourceType即可
  const editLock = useEditLock({
    resourceType: "player", // 这里改为player
    resourceId: playerId || "",
    username: userInfo?.username || "",
    enabled: !!(playerId && userInfo?.username),
    lockDuration: 30 * 60 * 1000, // 可以自定义锁定时长，这里设为30分钟
    onLockSuccess: () => {
      console.log("Player locked successfully");
    },
    onLockFailed: (reason) => {
      console.warn("Failed to lock player:", reason);
    },
    onUnlocked: () => {
      console.log("Player unlocked");
    },
  });

  // 加载中状态
  if (editLock.isLoading) {
    return <div className="text-2xl font-bold">加载中...</div>;
  }

  // 被其他用户锁定
  if (editLock.lockStatus.isLocked && !editLock.lockStatus.canEdit) {
    return (
      <div className="container">
        <div className="text-2xl font-bold text-red-600">
          该选手正在被 {editLock.lockStatus.lockedBy} 编辑，请稍后再试
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-[1.5rem] font-bold">编辑选手 {playerId}</h1>
      {editLock.lockStatus.canEdit && <div className="text-sm text-green-600 mb-2">当前由您锁定编辑中</div>}

      {/* 这里放置PlayerForm组件 */}
      <div className="p-4 border border-gray-200 rounded">
        <p>选手编辑表单内容...</p>
      </div>

      {/* 通用的编辑确认弹窗 */}
      <EditLockConfirmModal
        isOpen={editLock.isModalOpen}
        message={editLock.confirmMessage}
        resourceType="选手" // 自定义资源类型显示名称
        onConfirmContinue={editLock.handleConfirmContinue}
        onCancelEdit={editLock.handleCancelEdit}
      />
    </div>
  );
}

// 示例：在GameData编辑页面中使用
export function GameDataEditExample() {
  const { gameDataId } = useParams();
  const { userInfo } = useUserInfoStore();

  const editLock = useEditLock({
    resourceType: "gamedata", // 这里改为gamedata
    resourceId: gameDataId || "",
    username: userInfo?.username || "",
    enabled: !!(gameDataId && userInfo?.username),
  });

  // ... 类似的实现

  return (
    <div className="container">
      <h1>编辑游戏数据</h1>
      {/* ... */}
      <EditLockConfirmModal
        isOpen={editLock.isModalOpen}
        message={editLock.confirmMessage}
        resourceType="游戏数据"
        onConfirmContinue={editLock.handleConfirmContinue}
        onCancelEdit={editLock.handleCancelEdit}
      />
    </div>
  );
}
