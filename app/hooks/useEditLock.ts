import { useState, useEffect, useRef, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { _get, _post } from "~/utils/tools";

export interface LockStatus {
  isLocked: boolean;
  lockedBy: string | null;
  canEdit: boolean;
}

export interface LockResponse {
  success: boolean;
  message: string;
  lockedBy?: string;
  resourceType?: string;
  resourceId?: string;
}

export interface UseEditLockOptions {
  resourceType: string;
  resourceId: string;
  username: string;
  enabled?: boolean; // 是否启用锁定功能
  lockDuration?: number; // 锁定持续时间（毫秒），默认59分钟
  onLockSuccess?: () => void;
  onLockFailed?: (reason: string) => void;
  onUnlocked?: () => void;
}

export interface UseEditLockReturn {
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

  // 内部方法（用于测试）
  startCountdown: () => void;
  clearCountdown: () => void;
}

export function useEditLock(options: UseEditLockOptions): UseEditLockReturn {
  const {
    resourceType,
    resourceId,
    username,
    enabled = true,
    lockDuration = 59 * 60 * 1000, // 59分钟
    onLockSuccess,
    onLockFailed,
    onUnlocked,
  } = options;

  // 使用useRef存储回调函数，避免依赖变化
  const callbacksRef = useRef({
    onLockSuccess,
    onLockFailed,
    onUnlocked,
  });

  // 更新回调函数引用
  callbacksRef.current = {
    onLockSuccess,
    onLockFailed,
    onUnlocked,
  };

  // 状态管理
  const [lockStatus, setLockStatus] = useState<LockStatus>({
    isLocked: false,
    lockedBy: null,
    canEdit: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [confirmMessage, setConfirmMessage] = useState("");

  // 倒计时管理
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化状态标记，避免重复初始化
  const initializedRef = useRef(false);

  // Modal控制
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  // API调用：锁定资源
  const lockResource = useCallback(async (): Promise<boolean> => {
    if (!enabled || !resourceId || !username) return false;

    try {
      const result = await _post<LockResponse>("/edit-lock/lock", {
        resourceType,
        resourceId,
        username,
      });

      if (result.success) {
        setLockStatus({
          isLocked: true,
          lockedBy: username,
          canEdit: true,
        });
        callbacksRef.current.onLockSuccess?.();
        return true;
      } else {
        setLockStatus({
          isLocked: true,
          lockedBy: result.lockedBy || null,
          canEdit: false,
        });
        callbacksRef.current.onLockFailed?.(result.message);
        return false;
      }
    } catch (error) {
      console.error("Lock resource error:", error);
      callbacksRef.current.onLockFailed?.("锁定失败");
      return false;
    }
  }, [enabled, resourceType, resourceId, username]);

  // API调用：解锁资源
  const unlockResource = useCallback(async (): Promise<void> => {
    if (!resourceId || !username) return;

    try {
      await _post("/edit-lock/unlock", {
        resourceType,
        resourceId,
        username,
      });
      callbacksRef.current.onUnlocked?.();
    } catch (error) {
      console.error("Unlock resource error:", error);
    }
  }, [resourceType, resourceId, username]);

  // API调用：检查锁定状态
  const checkLockStatus = useCallback(async (): Promise<void> => {
    if (!resourceId) return;

    try {
      const result = await _get<{
        success: boolean;
        isLocked: boolean;
        lockedBy: string | null;
      }>(`/edit-lock/status/${resourceType}/${resourceId}`);

      if (result.success) {
        const canEdit = !result.isLocked || result.lockedBy === username;
        setLockStatus({
          isLocked: result.isLocked,
          lockedBy: result.lockedBy,
          canEdit,
        });
      }
    } catch (error) {
      console.error("Check lock status error:", error);
    }
  }, [resourceType, resourceId, username]);

  // API调用：刷新锁定时间
  const refreshLock = useCallback(async (): Promise<LockResponse> => {
    try {
      const result = await _post<LockResponse>("/edit-lock/refresh", {
        resourceType,
        resourceId,
        username,
      });
      return result;
    } catch (error) {
      console.error("Refresh lock error:", error);
      return {
        success: false,
        message: "刷新锁定时间失败",
        lockedBy: "未知",
      };
    }
  }, [resourceType, resourceId, username]);

  // 启动倒计时
  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
    }

    countdownTimerRef.current = setTimeout(() => {
      setConfirmMessage(`您已长时间在编辑${resourceType}，是否仍在编辑中？`);
      openModal();
    }, lockDuration);
  }, [lockDuration, resourceType, openModal]);

  // 清除倒计时
  const clearCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // 处理用户确认继续编辑
  const handleConfirmContinue = useCallback(async () => {
    const result = await refreshLock();

    if (result.success) {
      // 成功刷新，重新启动倒计时
      startCountdown();
      setConfirmMessage("");
      closeModal();
    } else {
      // 刷新失败，可能被其他人锁定
      await checkLockStatus();
      setConfirmMessage(`该${resourceType}已被${result.lockedBy}锁定，您的编辑权限已失效。`);
    }
  }, [refreshLock, startCountdown, closeModal, checkLockStatus, resourceType]);

  // 处理用户取消编辑
  const handleCancelEdit = useCallback(async () => {
    closeModal();
    clearCountdown();
    await unlockResource();
    setLockStatus({
      isLocked: false,
      lockedBy: null,
      canEdit: false,
    });
    setConfirmMessage("");
  }, [closeModal, clearCountdown, unlockResource]);

  // 初始化锁定状态 - 只执行一次
  useEffect(() => {
    if (!enabled || initializedRef.current) {
      setIsLoading(false);
      return;
    }

    const initializeLock = async () => {
      if (!resourceId || !username) {
        setIsLoading(false);
        return;
      }

      initializedRef.current = true;

      try {
        // 首先检查当前锁定状态
        const statusResult = await _get<{
          success: boolean;
          isLocked: boolean;
          lockedBy: string | null;
        }>(`/edit-lock/status/${resourceType}/${resourceId}`);

        if (statusResult.success) {
          const canEdit = !statusResult.isLocked || statusResult.lockedBy === username;
          setLockStatus({
            isLocked: statusResult.isLocked,
            lockedBy: statusResult.lockedBy,
            canEdit,
          });
        }

        // 尝试锁定资源
        const lockResult = await _post<LockResponse>("/edit-lock/lock", {
          resourceType,
          resourceId,
          username,
        });

        if (lockResult.success) {
          setLockStatus({
            isLocked: true,
            lockedBy: username,
            canEdit: true,
          });
          callbacksRef.current.onLockSuccess?.();

          // 启动倒计时
          if (countdownTimerRef.current) {
            clearTimeout(countdownTimerRef.current);
          }
          countdownTimerRef.current = setTimeout(() => {
            setConfirmMessage(`您已长时间在编辑${resourceType}，是否仍在编辑中？`);
            openModal();
          }, lockDuration);
        } else {
          setLockStatus({
            isLocked: true,
            lockedBy: lockResult.lockedBy || null,
            canEdit: false,
          });
          callbacksRef.current.onLockFailed?.(lockResult.message);
        }
      } catch (error) {
        console.error("Initialize lock error:", error);
        callbacksRef.current.onLockFailed?.("初始化锁定失败");
      }

      setIsLoading(false);
    };

    initializeLock();
  }, [enabled, resourceId, username, resourceType, lockDuration, openModal]); // 包含必要的基础参数

  // 当resourceId或username变化时重置初始化状态
  useEffect(() => {
    initializedRef.current = false;
  }, [resourceId, username]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearCountdown();

      // 组件卸载时解锁资源（使用函数而不是状态判断）
      if (resourceId && username) {
        _post("/edit-lock/unlock", {
          resourceType,
          resourceId,
          username,
        }).catch(console.error);
      }
    };
  }, [resourceType, resourceId, username, clearCountdown]);

  // 页面离开时解锁资源
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (resourceId && username) {
        // 清除倒计时
        if (countdownTimerRef.current) {
          clearTimeout(countdownTimerRef.current);
        }

        // 使用同步请求确保在页面卸载前完成解锁
        const blob = new Blob(
          [
            JSON.stringify({
              resourceType,
              resourceId,
              username,
            }),
          ],
          { type: "application/json" },
        );
        navigator.sendBeacon("/edit-lock/unlock", blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [resourceType, resourceId, username]);

  return {
    // 状态
    lockStatus,
    isLoading,
    confirmMessage,

    // Modal控制
    isModalOpen,
    openModal,
    closeModal,

    // 操作方法
    lockResource,
    unlockResource,
    checkLockStatus,
    refreshLock,

    // 确认操作
    handleConfirmContinue,
    handleCancelEdit,

    // 内部方法
    startCountdown,
    clearCountdown,
  };
}
