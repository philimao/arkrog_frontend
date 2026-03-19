import { Modal, ModalContent, ModalBody } from "@heroui/react";
import { useState } from "react";

export interface ImageDockItem {
  id: string;
  thumbnailUri: string;
  fullUri: string;
}

interface ImageDockProps {
  items: ImageDockItem[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export default function ImageDock({
  items,
  onRemove,
  onClearAll,
}: ImageDockProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewItem = items.find((i) => i.id === previewId);

  return (
    <>
      <div
        className="fixed bottom-1 left-0 right-0 z-40 flex items-end justify-center gap-2"
        style={{ minHeight: 64 }}
      >
        <div
          className="flex justify-center gap-2 overflow-x-auto bg-white/10 backdrop-blur py-1 px-1 rounded-lg"
          style={{ overflow: "visible" }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="relative flex-shrink-0 rounded-lg border-2 border-transparent hover:border-default-400 transition-all duration-200 hover:-translate-y-2 origin-bottom"
              style={{ width: 64, height: 64 }}
              onClick={() => setPreviewId(item.id)}
            >
              <img
                src={item.thumbnailUri}
                alt="识别结果"
                className="w-full h-full object-cover rounded-md"
              />
            </button>
          ))}
          {items.length > 0 && (
            <button
              type="button"
              className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 w-4 h-4 flex items-center justify-center text-white/80 hover:text-white rounded-full bg-ak-red"
              onClick={onClearAll}
            >
              <span className="text-sm">×</span>
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!previewId}
        onClose={() => setPreviewId(null)}
        size="5xl"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0 overflow-hidden",
        }}
        isDismissable
      >
        <ModalContent>
          <ModalBody className="p-0 overflow-hidden">
            {previewItem && (
              <div className="relative">
                <img
                  src={previewItem.fullUri}
                  alt="识别结果"
                  className="w-full h-auto max-h-[85vh] object-contain"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center text-sm font-bold"
                    onClick={() => {
                      onRemove(previewItem.id);
                      setPreviewId(null);
                    }}
                    aria-label="删除"
                  >
                    删
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-default-500/90 hover:bg-default-600 text-white flex items-center justify-center text-sm font-bold"
                    onClick={() => setPreviewId(null)}
                    aria-label="关闭"
                  >
                    关
                  </button>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
