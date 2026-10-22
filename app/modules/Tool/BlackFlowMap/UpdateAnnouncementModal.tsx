import { useEffect, useState } from "react";
import { ModalBody, ModalFooter, ModalHeader } from "@heroui/react";
import ModalTemplate from "~/components/Modal";

const STORAGE_KEY = "blackflowmap-update-announcement";

const announcement = {
  id: "update-2026.10.21",
  title: "更新公告 - 2026.10.21",
  sections: [
    {
      title: "功能",
      items: [
        "新增更新公告弹窗功能",
        "新增不期而遇事件列表，点击地图右上角按钮可查看",
        "新增第4层（受害者腐殖）的追忆支持"
      ],
    },
    {
      title: "优化",
      items: [
        "截图识别成功后，将自动勾选仅预览未知节点选项",
        "手机端地图背景显示",
        "优化节点生成范围及计算逻辑"
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
