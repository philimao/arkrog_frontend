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
              <p className={isDisabled ? "text-ak-red" : "text-light-gray"}>{message}</p>
            </div>
          </ModalBody>
          <ModalFooter className="flex gap-4">
            <Button
              onPress={handleCancelEdit}
              disabled={isProcessing}
              className="bg-ak-dark-red"
            >
              {isDisabled ? "退出编辑" : "离开编辑"}
            </Button>
            {!isDisabled && (
              <Button
                onPress={handleConfirmContinue}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="bg-ak-blue text-black"
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
