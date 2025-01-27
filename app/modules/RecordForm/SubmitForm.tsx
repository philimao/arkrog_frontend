import React, { type Dispatch, type FormEvent } from "react";
import {
  Button,
  type InputProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
  Input,
  type SelectProps,
  Select,
  type TextAreaProps,
  Textarea,
  ModalFooter,
  Form,
  SelectItem,
  type ButtonProps,
} from "@heroui/react";
import { URLValidation } from "~/utils/record";
import { _post } from "~/utils/tools";
import type { RecordType } from "~/types/recordType";
import { toast } from "react-toastify";
import { StageLevels, StageTypes } from "~/types/constant";

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

export default function SubmitForm({
  stageId,
  setRecords,
}: {
  stageId: string;
  setRecords: Dispatch<any>;
}) {
  const { onOpen, onClose, isOpen } = useDisclosure();
  async function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const data = JSON.parse(
      JSON.stringify(
        Object.fromEntries(new FormData(evt.currentTarget as HTMLFormElement)),
      ),
    );
    // 链接验证
    const validatedURL = await URLValidation(data.url as string);
    if (validatedURL) {
      data.url = validatedURL;
    } else {
      return;
    }
    // 干员信息验证
    data.team = data.team.split(/[+、]/);
    if (!data.team.every((member: string) => member.match(/.+[123]/))) {
      return toast.warning("请填写每个干员的技能！");
    }
    data.stageId = stageId;
    console.log(data);
    const records: RecordType[] | undefined = await _post<RecordType[]>(
      "/record/submit",
      data,
    );
    if (records) {
      setRecords(records);
      onClose();
    }
  }

  return (
    <>
      <MyButton onPress={onOpen}>提交记录</MyButton>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        radius="none"
        backdrop="blur"
        size="3xl"
      >
        <ModalContent>
          <ModalHeader>提交记录</ModalHeader>
          <ModalBody>
            <Form
              validationBehavior="native"
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-6"
            >
              <MyInput
                name="url"
                label="视频链接"
                placeholder="B站长短链，单独BV号，YouTube链接均可解析"
                required
              />
              <MyInput
                name="team"
                label="队伍组成"
                placeholder="使用加号（+）或顿号（、）分隔，例：维什戴尔3+逻各斯3"
                required
              />
              <MySelect
                name="type"
                label="作战类型"
                defaultSelectedKeys={[StageTypes[0].key]}
                required
              >
                {StageTypes.map((type) => (
                  <SelectItem key={type.key}>{type.text}</SelectItem>
                ))}
              </MySelect>
              <MySelect
                name="level"
                label="难度等级"
                defaultSelectedKeys={[StageLevels[0]]}
                required
              >
                {StageLevels.map((l) => (
                  <SelectItem key={l}>{l}</SelectItem>
                ))}
              </MySelect>
              <MyTextarea
                name="note"
                label="备注"
                minRows={5}
                placeholder="攻略者ID、等效情况等"
              />
              <MyButton className="w-full" type="submit">
                提交
              </MyButton>
            </Form>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
