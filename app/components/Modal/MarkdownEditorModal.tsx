import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Spinner,
} from "@heroui/react";
import { lazy, Suspense } from "react";

const BlockNoteEditor = lazy(() => import("~/components/BlockNoteEditor"));

interface MarkdownEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onChange?: (content: string) => void;
  onSave: (content: string) => void;
  title?: string;
}

export default function MarkdownEditorModal({
  isOpen,
  onClose,
  initialContent,
  onSave,
  onChange,
  title = "编辑内容",
}: MarkdownEditorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      isDismissable={false} // Prevent accidental closing by clicking outside
      hideCloseButton={false}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              {isOpen && (
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center h-[35rem]">
                      <Spinner label="编辑器加载中..." />
                    </div>
                  }
                >
                  <div className="h-[35rem]">
                    <BlockNoteEditor
                      initialMarkdown={initialContent}
                      onSave={onSave}
                      onChange={onChange}
                      onCancel={onClose}
                    />
                  </div>
                </Suspense>
              )}
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
