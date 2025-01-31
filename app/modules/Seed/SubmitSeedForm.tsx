import {
  Button,
  type ButtonProps,
  Form,
  Input,
  type InputProps,
  ModalBody,
  ModalHeader,
  Select,
  SelectItem,
  type SelectProps,
  Textarea,
  type TextAreaProps,
  useDisclosure,
} from "@heroui/react";
import React, {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { openModal } from "~/utils/dom";
import { toast } from "react-toastify";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { SeedTypes } from "~/types/constant";
import ModalTemplate from "~/components/Modal";
import { ModalFooter } from "@heroui/modal";
import type { RecordType } from "~/types/recordType";
import { _post, mergeArray } from "~/utils/tools";
import type { SeedType } from "~/types/seedType";
import { URLValidation } from "~/utils/record";

const MyInput = (props: InputProps) => (
  <Input radius="none" labelPlacement="outside" {...props}></Input>
);
const MySelect = (props: SelectProps) => (
  <Select radius="none" labelPlacement="outside" {...props}>
    {props.children}
  </Select>
);
const MyTextarea = (props: TextAreaProps) => (
  <Textarea radius="none" labelPlacement="outside" {...props}></Textarea>
);
const MyButton = (props: ButtonProps) => (
  <Button
    {...props}
    radius="none"
    className={
      "ms-auto px-4 py-1.5 bg-ak-blue text-black font-bold " +
      (props.className ?? "")
    }
  >
    {props.children}
  </Button>
);

const presetLabels = [
  "主播精选",
  "罗德之门",
  "金酒之杯",
  "老蒲扇",
  "探灵伯爵",
  "天灾年代",
  "贵重商店",
  "无相遇",
  "少构想",
  "戈读不语",
  "奇观年代",
  "锁路线失与得",
  "无藏",
];

export default function SubmitSeedForm({
  setReload,
}: {
  setReload: Dispatch<SetStateAction<boolean>>;
}) {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const { userInfo } = useUserInfoStore();
  const [label, setLabel] = useState("");

  async function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const data = JSON.parse(
      JSON.stringify(
        Object.fromEntries(new FormData(evt.currentTarget as HTMLFormElement)),
      ),
    );
    for (const key in data) {
      data[key] = data[key].trim();
    }

    // 链接验证
    if (data.url) {
      const validatedURL = await URLValidation(data.url as string);
      if (validatedURL) {
        data.url = validatedURL;
      } else {
        return;
      }
    }

    data.labels = data.label.split(" ").filter((i: string) => i);
    delete data.label;
    try {
      await _post<RecordType[]>("/seed/submit", data);
      setReload((prev) => !prev);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <MyButton
        onPress={() => {
          if (!userInfo) {
            return openModal("login");
          } else if (userInfo.level < 2) {
            return toast.warning(
              "投稿功能需链接B站信息后使用！请点击右上角前往个人中心绑定身份",
            );
          }
          onOpen();
        }}
      >
        投稿种子
      </MyButton>
      <ModalTemplate
        isOpen={isOpen}
        onClose={onClose}
        radius="none"
        backdrop="blur"
        size="3xl"
      >
        <ModalHeader>投稿种子</ModalHeader>
        <ModalBody>
          <Form
            validationBehavior="native"
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-6"
          >
            <MyInput
              name="code"
              label="种子代码"
              placeholder="直接从游戏中复制粘贴即可"
              required
            />
            <MySelect
              name="type"
              label="种子类型"
              defaultSelectedKeys={[Object.keys(SeedTypes)[0]]}
              required
            >
              {Object.keys(SeedTypes).map((typeKey) => (
                <SelectItem key={typeKey}>{SeedTypes[typeKey]}</SelectItem>
              ))}
            </MySelect>
            <MyInput
              name="title"
              label="种子标题"
              placeholder="一层相遇+罗德之门，贵重商店；首发天灾年代"
              required
            />
            <MyInput
              name="label"
              value={label}
              onValueChange={setLabel}
              label="种子标签"
              placeholder="使用空格分隔，可以点击下方预设标签添加"
              required
            />
            <div className="flex flex-wrap gap-2">
              {presetLabels.map((text) => (
                <span
                  key={text}
                  className={
                    "px-3 py-1 text-sm font-light" +
                    (label.includes(text) ? " bg-ak-deep-blue" : " bg-mid-gray")
                  }
                  onClick={() => {
                    setLabel((prev) => {
                      const set = new Set(prev.split(" "));
                      if (set.has(text)) {
                        set.delete(text);
                      } else {
                        set.add(text);
                      }
                      return [...set].join(" ");
                    });
                  }}
                  role="button"
                >
                  {text}
                </span>
              ))}
            </div>
            <MyTextarea
              name="note"
              label="使用方式"
              minRows={10}
              placeholder={`描述请尽量详细，参考格式\n使用开局：\n达成结局：\n详细操作：\n`}
              required
            />
            <MyInput
              name="url"
              label="关联视频"
              placeholder="如果有演示视频、来源视频等，请填写此栏"
            />
            <MyButton className="w-full" type="submit">
              提交
            </MyButton>
          </Form>
        </ModalBody>
        <ModalFooter />
      </ModalTemplate>
    </>
  );
}
