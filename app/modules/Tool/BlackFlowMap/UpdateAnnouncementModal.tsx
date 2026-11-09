import { useEffect, useState } from "react";
import { ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import ModalTemplate from "~/components/Modal";

const STORAGE_KEY = "blackflowmap-update-announcement";

const announcement = {
  id: "update-2026.11.09",
  title: "更新公告 - 2026.11.09",
  sections: [
    {
      title: "功能",
      items: [],
    },
    {
      title: "优化",
      items: [
        "优化未知节点的可能出现节点列表，调整节点的显示顺序",
      ],
    },
    {
      title: "修复",
      items: [],
    },
  ],
};

export default function UpdateAnnouncementModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissedAnnouncement = window.localStorage.getItem(STORAGE_KEY);
    setIsOpen(dismissedAnnouncement !== announcement.id);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, announcement.id);
    setIsOpen(false);
  };

  const hasItems = announcement.sections.some(
    (section) => section.items.length > 0,
  );

  return (
    <ModalTemplate
      size="xl"
      isOpen={isOpen}
      onOpenChange={(nextIsOpen) => {
        if (nextIsOpen) setIsOpen(true);
        else dismiss();
      }}
      backdrop="blur"
    >
      <ModalHeader>{announcement.title}</ModalHeader>
      {hasItems && (
        <ModalBody>
          <div className="flex flex-col gap-4">
            {announcement.sections.map(
              (section) =>
                section.items.length > 0 && (
                  <section key={section.title}>
                    <h3 className="mb-1 font-bold text-ak-blue">
                      {section.title}
                    </h3>
                    <ul className="list-disc pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ),
            )}
          </div>
        </ModalBody>
      )}
      <ModalFooter className="justify-center">
        <button
          type="button"
          className="bg-ak-deep-blue px-8 py-2 text-white"
          onClick={dismiss}
        >
          关闭
        </button>
      </ModalFooter>
    </ModalTemplate>
  );
}
