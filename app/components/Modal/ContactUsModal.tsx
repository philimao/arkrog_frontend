import {
  Button,
  Input,
  ModalBody,
  ModalHeader,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { ModalFooter } from "@heroui/modal";
import ModalTemplate from "~/components/Modal/index";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { _post } from "~/utils/tools";

export function ContactUsModal({ id }: { id: string }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    if (!message) {
      return toast.warning("请填写反馈内容！");
    }
    try {
      await _post("/user/feedback", { message, email });
      setMessage("");
      toast.info(
        "我们已收到您的反馈，将会尽快进行处理。反馈回执请在个人中心中查看",
      );
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
        <div className="h-10 leading-10">请留下您的反馈，我们将会尽快回复</div>
        <Input
          name="email"
          radius="none"
          value={email}
          onValueChange={setEmail}
          placeholder="邮箱地址（选填）"
        />
        <Textarea
          radius="none"
          value={message}
          onValueChange={setMessage}
          minRows={10}
          placeholder="留下您的反馈信息"
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
