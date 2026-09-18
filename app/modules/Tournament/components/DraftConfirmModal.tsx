import { Button, ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import ModalTemplate from "~/components/Modal";

export default function DraftConfirmModal({
  isOpen,
  onConfirm,
  onDecline,
  onClose,
  isStale = false,
  isLoading = false,
  onViewDraft,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  onClose: () => void;
  isStale?: boolean;
  isLoading?: boolean;
  onViewDraft?: () => void;
}) {
  return (
    <ModalTemplate modalControl={{ isOpen, onClose }}>
      <ModalHeader>本地草稿</ModalHeader>
      <ModalBody>{isStale
        ? "赛事已更新，或草稿缺少基础版本信息，无法安全恢复。草稿将保留，您可以查看旧草稿并在最新版本上重新修改。"
        : "发现本地草稿，是否继续编辑？"}</ModalBody>
      <ModalFooter className="gap-4">
        <Button isDisabled={isLoading} onPress={onDecline} className="text-md rounded-md text-black bg-light-gray">
          {isStale ? "使用最新版本" : "否"}
        </Button>
        <Button isLoading={isLoading} className="text-md rounded-md text-black bg-ak-blue" onPress={isStale ? onViewDraft : onConfirm}>
          {isStale ? "查看旧草稿" : "是"}
        </Button>
      </ModalFooter>
    </ModalTemplate>
  );
}
