import {
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import ModalTemplate from "~/components/Modal";
import { useRecordStore } from "~/stores/recordStore";
import { useGameDataStore } from "~/stores/gameDataStore";
import type { RogueKey } from "~/types/gameData";
import { StageTypes } from "~/types/constant";
import { toast } from "react-toastify";
import { _post } from "~/utils/tools";

export default function ReportModal({ id }: { id: string }) {
  const { activeRecord } = useRecordStore();
  const { stages } = useGameDataStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stageName, setStageName] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!activeRecord || !stages) return;
    // ro4_b_4
    const topicId = "rogue_" + activeRecord.stageId.split("_")[0].slice(-1);
    const stageName = stages[topicId as RogueKey]?.[activeRecord.stageId]?.name;
    if (stageName) setStageName(stageName);
  }, [activeRecord, stages]);

  async function handleSubmit() {
    if (!feedback) {
      return toast.warning("请填写反馈内容！");
    }
    if (!activeRecord) {
      return toast.warning("未正确加载卡片信息");
    }
    try {
      await _post("/user/feedback", {
        message: feedback,
        stageId: activeRecord?.stageId,
        recordId: activeRecord?._id,
      });
      setFeedback("");
      toast.warning(
        "我们已收到您的反馈，将会尽快进行处理。反馈回执请在个人中心中查看",
      );
      onClose();
    } catch (err) {
      toast.warning((err as Error).message);
    }
  }

  return (
    <ModalTemplate
      triggerId={id}
      modalControl={{ isOpen, onOpen, onClose }}
      size="3xl"
    >
      <ModalHeader className="text-2xl pb-0">这个记录有问题</ModalHeader>
      <ModalBody>
        <div className="h-10 leading-10">
          {stageName && activeRecord && (
            <div className="flex">
              <div className="me-auto">
                <span>{`${activeRecord.team.length}人-${StageTypes[activeRecord.type]}-`}</span>
                <span className="text-ak-blue">{stageName}</span>
              </div>
              <div className="flex">
                <img
                  src={activeRecord.raiderImage}
                  alt="raiderImage"
                  className="w-10 h-10 me-2"
                  style={{ borderRadius: "50%" }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                {activeRecord.raider}
              </div>
            </div>
          )}
        </div>
        <Textarea
          radius="none"
          value={feedback}
          onValueChange={setFeedback}
          minRows={10}
        />
      </ModalBody>
      <ModalFooter>
        <Button radius="none" onPress={onClose} className="text-lg w-24">
          取消
        </Button>
        <Button
          radius="none"
          className="bg-ak-deep-blue text-lg w-24"
          onPress={handleSubmit}
        >
          提交
        </Button>
      </ModalFooter>
    </ModalTemplate>
  );
}
