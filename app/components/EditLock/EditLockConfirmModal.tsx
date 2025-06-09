import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface EditLockConfirmModalProps {
  isOpen: boolean;
  message: string;
  resourceType?: string;
  onConfirmContinue: () => Promise<void>;
  onCancelEdit: () => Promise<void>;
}

export default function EditLockConfirmModal({
  isOpen,
  message,
  resourceType = "资源",
  onConfirmContinue,
  onCancelEdit,
}: EditLockConfirmModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirmContinue = async () => {
    setIsProcessing(true);
    try {
      await onConfirmContinue();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = async () => {
    setIsProcessing(true);
    try {
      await onCancelEdit();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = message.includes("已被") && message.includes("锁定");

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // 禁止点击外部关闭
      isDismissable={false}
      hideCloseButton={true}
      backdrop="opaque"
      size="md"
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">
            <div className="text-lg font-bold">{isDisabled ? "编辑权限失效" : "编辑确认"}</div>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-3">
              <p className={isDisabled ? "text-red-600" : "text-gray-700"}>{message}</p>
              {isDisabled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">
                    该{resourceType}已被其他用户锁定，您的编辑权限已失效。请稍后再试。
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="flex gap-2">
            <Button
              color="danger"
              variant="light"
              onPress={handleCancelEdit}
              disabled={isProcessing}
              className="flex-1"
            >
              {isDisabled ? "退出编辑" : "离开编辑"}
            </Button>
            {!isDisabled && (
              <Button
                color="primary"
                onPress={handleConfirmContinue}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="flex-1"
              >
                继续编辑
              </Button>
            )}
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
