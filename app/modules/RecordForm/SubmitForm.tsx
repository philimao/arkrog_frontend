import React, {
  type Dispatch,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  type ButtonProps,
  Form,
  Input,
  type InputProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  type SelectProps,
  Textarea,
  type TextAreaProps,
  useDisclosure,
} from "@heroui/react";
import { charStrToData, URLValidation } from "~/utils/record";
import { _post, findDuplicates } from "~/utils/tools";
import type { RecordType, TeamMemberData } from "~/types/recordType";
import { toast } from "react-toastify";
import { StageLevels, StageTypes } from "~/types/constant";
import type { CharsBasic, GameData } from "~/types/gameData";
import { Radio, RadioGroup } from "@heroui/radio";

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
  gameData,
}: {
  stageId: string;
  setRecords: Dispatch<any>;
  gameData: GameData;
}) {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [team, setTeam] = useState("维什戴尔3+逻各斯3");
  const [memberDataArray, setMemberDataArray] = useState<TeamMemberData[]>([]);

  const _charStrToData = useCallback(charStrToData, []);

  const teamRe = /[+、]/;

  useEffect(() => {
    const charStrArray = team.split(/[+、]/);
    const memberDataArray = charStrArray.map((charStr) =>
      _charStrToData(charStr, gameData.character_basic as CharsBasic),
    );
    setMemberDataArray((prev) => {
      memberDataArray.map((memberData) => {
        const { charId, charData } = memberData;
        const prevData = prev.find((md) => md.charId === charId);
        // 继承过去选择的uniequipId
        if (prevData) {
          memberData.uniequipId = prevData.uniequipId;
        }
        // 默认选择最新模组
        memberData.uniequipId =
          Object.values(charData?.uniequip || {}).sort(
            (a, b) => b.charEquipOrder - a.charEquipOrder,
          )[0]?.uniEquipId || "";
        return memberData;
      });
      return memberDataArray;
    });
  }, [team, gameData]);

  const uniequipOptions = useMemo(
    () =>
      memberDataArray
        .reduce((a: TeamMemberData[], b: TeamMemberData) => {
          if (a.find((prevData) => prevData.charId === b.charId)) return a;
          else return [...a, b];
        }, [])
        .map((memberData) => {
          const { charData } = memberData;
          const defaultChecked =
            Object.values(charData?.uniequip || {}).sort(
              (a, b) => b.charEquipOrder - a.charEquipOrder,
            )[0]?.uniEquipId || "";
          return {
            charData,
            defaultChecked,
            options: Object.values(charData?.uniequip || {}).map(
              (uniequipData) => {
                const { uniEquipId, uniEquipName, typeIcon } = uniequipData;
                return { uniEquipId, uniEquipName, typeIcon };
              },
            ),
          };
        }),
    [memberDataArray],
  );

  useEffect(() => {
    console.log("有效干员", memberDataArray);
  }, [memberDataArray]);

  async function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const data = JSON.parse(
      JSON.stringify(
        Object.fromEntries(new FormData(evt.currentTarget as HTMLFormElement)),
      ),
    );
    for (const key in data) {
      if (key.startsWith("ignore_")) {
        delete data[key];
      }
    }

    // 链接验证
    const validatedURL = await URLValidation(data.url as string);
    if (validatedURL) {
      data.url = validatedURL;
    } else {
      return;
    }

    // 重复人员验证
    const duplicates = findDuplicates(memberDataArray.map((m) => m.name));
    if (duplicates.length) {
      return toast.warning(`队伍组成中 ${duplicates[0]} 填写重复！`);
    }

    // 干员信息验证
    const misMatch = team.split(teamRe).find((memberStr, i) => {
      const memberData = memberDataArray[i];
      if (!memberData) return true;
      const { name, skillStr } = memberData;
      return memberStr.toUpperCase() !== (name + skillStr).toUpperCase();
    });
    if (misMatch) {
      return toast.warning(
        `队伍组成中 ${misMatch} 无法解析！请检查拼写是否有误`,
      );
    }

    // 技能验证
    const skillErrorMember = memberDataArray.find(
      (memberData) => memberData.skillId === "error",
    );
    if (skillErrorMember) {
      return toast.warning(
        `队伍组成中 ${skillErrorMember.name} 的技能填写有误！`,
      );
    }

    data.team = memberDataArray.map((memberData) => {
      delete memberData.charData;
      return memberData;
    });
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
                value={team}
                onValueChange={setTeam}
                label={
                  "队伍组成" +
                  (team.split(/[+、]/).length
                    ? `（${team.split(/[+、]/).length}人）`
                    : "")
                }
                placeholder="使用加号（+）或顿号（、）分隔，例：维什戴尔3+逻各斯3"
                required
              />
              <div className="">
                {uniequipOptions.length > 0 && (
                  <div className="mb-2 text-sm">模组选择</div>
                )}
                <div className="flex flex-wrap gap-6">
                  {uniequipOptions.map((item) => (
                    <RadioGroup
                      key={item.charData?.charId}
                      size="sm"
                      className="text-xs whitespace-nowrap"
                      name={"ignore_" + item.charData?.charId}
                      defaultValue={item.defaultChecked}
                      onValueChange={(id) => {
                        setMemberDataArray((prev) => {
                          const updated = [...prev];
                          const index = updated.findIndex(
                            (memberData) =>
                              memberData.charId === item.charData?.charId,
                          );
                          if (index > -1) {
                            updated[index].uniequipId = id;
                          }
                          return updated;
                        });
                      }}
                    >
                      {item.options.map((option) => {
                        const { uniEquipId, uniEquipName, typeIcon } = option;
                        return (
                          <Radio
                            description={uniEquipName}
                            value={uniEquipId}
                            key={uniEquipId}
                          >
                            {typeIcon.toUpperCase()}
                          </Radio>
                        );
                      })}
                    </RadioGroup>
                  ))}
                </div>
              </div>

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
