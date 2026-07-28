import React, { type Dispatch, type FormEvent, type SetStateAction, useEffect, useMemo, useState } from "react";
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
  Radio,
  RadioGroup,
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
import { StageLevels, StageTypes, topicMaxLevels } from "~/types/constant";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useRelicFreeStore } from "~/stores/relicFreeStore";

const MyInput = (props: InputProps) => <Input radius="none" labelPlacement="outside" {...props}></Input>;
const MySelect = (props: SelectProps) => (
  <Select radius="none" labelPlacement="outside" {...props}>
    {props.children}
  </Select>
);
const MyTextarea = (props: TextAreaProps) => <Textarea radius="none" labelPlacement="outside" {...props}></Textarea>;
const MyButton = (props: ButtonProps) => (
  <Button
    {...props}
    radius="none"
    className={"ms-auto px-4 py-1.5 bg-ak-blue text-black font-bold " + (props.className ?? "")}
  >
    {props.children}
  </Button>
);

/** 将存量队伍数据反序列化为输入字符串（与 charStrToData 的 name+skillStr 解析规则互逆） */
function teamToString(team: TeamMemberData[]) {
  return team.map((memberData) => memberData.name + memberData.skillStr).join("+");
}

/**
 * 记录提交/编辑表单。
 * - 提交模式（默认）：自带"提交记录"触发按钮，走 /record/submit，成功后整表替换
 * - 编辑模式（传入 record）：弹窗受控（由父组件条件渲染 + onClose 关闭），
 *   走 /record/edit，成功后按 _id 原位更新——编辑入口在首页/收藏页也存在，
 *   那里的列表不是单关卡记录列表，不能整表替换
 */
export default function SubmitRecordForm({
  stageId,
  setRecords,
  record,
  onClose: onCloseProp,
}: {
  stageId?: string;
  setRecords: Dispatch<SetStateAction<RecordType[]>>;
  /** 编辑模式：被编辑的记录 */
  record?: RecordType;
  /** 编辑模式：关闭弹窗回调 */
  onClose?: () => void;
}) {
  const isEdit = !!record;
  const { character_basic, uniequip_basic, fetchRelicFreeData } = useRelicFreeStore();
  const { userInfo } = useUserInfoStore();
  const { fetchStagePreview } = useRelicFreeStore();
  const disclosure = useDisclosure();
  const isOpen = isEdit ? true : disclosure.isOpen;
  const onClose = isEdit ? (onCloseProp ?? (() => {})) : disclosure.onClose;
  const [team, setTeam] = useState(record ? teamToString(record.team) : "");
  const [memberDataArray, setMemberDataArray] = useState<TeamMemberData[]>([]);

  /** 生效关卡：编辑模式取记录自身的 stageId（不可改），提交模式取当前关卡 */
  const effectiveStageId = record?.stageId ?? stageId ?? "";
  /** 肉鸽主题 */
  const rogueKey = effectiveStageId.split("_")[0].replace("ro", "rogue_");
  /** 肉鸽主题最高难度等级 */
  const maxLevel = topicMaxLevels[rogueKey as keyof typeof topicMaxLevels];

  /** 队伍组成分隔符 */
  const teamSplitterRe = /[+、]/;

  // 编辑入口在首页/收藏页也存在，那里未加载干员数据；fetch 有 loaded 闩锁，幂等
  useEffect(() => {
    if (isEdit) fetchRelicFreeData();
  }, [isEdit]);

  useEffect(() => {
    if (!character_basic) return;
    const charStrArray = team.split(/[+、]/);
    const memberDataArray = charStrArray
      .map((charStr) => charStrToData(charStr, character_basic))
      .filter((i) => i.charData);
    setMemberDataArray((prev: TeamMemberData[]) => {
      memberDataArray.map((memberData) => {
        const { charId, charData } = memberData;
        const prevData = prev.find((md) => md.charId === charId);
        // 模组初值优先级：本次会话已选 > 记录存量（编辑模式） > 最新模组
        const inheritedId = prevData?.uniequipId || record?.team.find((md) => md.charId === charId)?.uniequipId;
        memberData.uniequipId =
          inheritedId ||
          Object.values(charData?.uniequip || {}).sort((a, b) => b.charEquipOrder - a.charEquipOrder)[0]?.uniEquipId ||
          "";
        memberData.uniequipName = uniequip_basic[memberData.uniequipId || ""]?.typeIcon.toUpperCase() || "";
        return memberData;
      });
      return memberDataArray as TeamMemberData[];
    });
  }, [team, character_basic]);

  const uniequipOptions = useMemo(
    () =>
      memberDataArray
        .reduce((a: TeamMemberData[], b: TeamMemberData) => {
          if (a.find((prevData) => prevData.charId === b.charId)) return a;
          else return [...a, b];
        }, [])
        .map((memberData) => {
          const { charData } = memberData;
          // 与上方 effect 的初值保持一致，编辑模式下勾选记录存量模组
          const defaultChecked =
            memberData.uniequipId ||
            Object.values(charData?.uniequip || {}).sort((a, b) => b.charEquipOrder - a.charEquipOrder)[0]
              ?.uniEquipId ||
            "";
          return {
            charData,
            defaultChecked,
            options: Object.values(charData?.uniequip || {}).map((uniequipData) => {
              const { uniEquipId, uniEquipName, typeIcon } = uniequipData;
              return { uniEquipId, uniEquipName, typeIcon };
            }),
          };
        })
        .filter((i) => i),
    [memberDataArray],
  );

  async function handleSubmit(evt: FormEvent<HTMLFormElement>) {
    evt.preventDefault();
    const data = JSON.parse(JSON.stringify(Object.fromEntries(new FormData(evt.currentTarget as HTMLFormElement))));
    for (const key in data) {
      if (key.startsWith("ignore_")) {
        delete data[key];
      }
    }

    try {
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
      const misMatch = team.split(teamSplitterRe).find((memberStr, i) => {
        const memberData = memberDataArray[i];
        if (!memberData) return true;
        const { name, skillStr } = memberData;
        return memberStr.toUpperCase() !== (name + skillStr).toUpperCase();
      });
      if (misMatch) {
        return toast.warning(`队伍组成中 ${misMatch} 无法解析！请检查拼写是否有误`);
      }

      // 技能验证
      const skillErrorMember = memberDataArray.find((memberData) => memberData.skillId === "error");
      if (skillErrorMember) {
        return toast.warning(`队伍组成中 ${skillErrorMember.name} 的技能填写有误！`);
      }

      // 技能非空验证
      const skillEmptyMember = memberDataArray.find(
        (memberData) => !memberData.skillId && !memberData.name.match(/-\d$/),
      );
      if (skillEmptyMember) {
        return toast.warning(`队伍组成中 ${skillEmptyMember.name} 的技能未填写！`);
      }

      data.team = memberDataArray.map((memberData) => {
        delete memberData.charData;
        return memberData;
      });

      if (isEdit && record) {
        // 编辑：stageId 不可改（不发送），按 _id 原位更新列表
        data._id = record._id;
        const records: RecordType[] | undefined = await _post<RecordType[]>("/record/edit", data);
        if (records) {
          const updated = records.find((r) => r._id === record._id);
          setRecords((prev) => prev.map((r) => (r._id === record._id && updated ? updated : r)));
          onClose();
        }
      } else {
        data.stageId = effectiveStageId;
        const records: RecordType[] | undefined = await _post<RecordType[]>("/record/submit", data);
        if (records) {
          setRecords(records);
          onClose();
        }
      }
      setTimeout(() => {
        fetchStagePreview(true);
      }, 2000);
    } catch (err) {
      // 失败保持弹窗与已填内容，供用户修正后重试
      toast.error((err as Error).message);
    }
  }

  // 软守卫（安全边界在后端）：提交需 L3+；编辑需 L4+ 或 L3 本人记录
  const level = userInfo?.level ?? 0;
  const canEdit =
    level >= 4 || (level >= 3 && !!record?.submitterId && record.submitterId === userInfo?.userId);
  if (isEdit ? !canEdit : level < 3) return null;
  return (
    <>
      {!isEdit && <MyButton onPress={disclosure.onOpen}>提交记录</MyButton>}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        radius="none"
        backdrop="blur"
        size="3xl"
        classNames={{
          base: "my-auto",
          backdrop: "backdrop-blur-sm",
          closeButton: "top-6 end-6 bg-black-gray",
        }}
      >
        <ModalContent>
          <ModalHeader>{isEdit ? "编辑记录" : "提交记录"}</ModalHeader>
          <ModalBody>
            <Form validationBehavior="native" onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
              <MyInput
                name="url"
                label="视频链接"
                placeholder="B站长短链，单独BV号，YouTube链接均可解析"
                defaultValue={record?.url}
                required
              />
              <MyInput
                value={team}
                onValueChange={setTeam}
                label={"队伍组成" + (team.split(/[+、]/).length ? `（${team.split(/[+、]/).length}人）` : "")}
                placeholder="使用加号（+）或顿号（、）分隔，例：维什戴尔3+逻各斯3"
                required
              />
              {uniequipOptions.length > 0 && (
                <div className="">
                  <div className="mb-2 text-sm">模组选择</div>
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
                              (memberData) => memberData.charId === item.charData?.charId,
                            );
                            if (index > -1) {
                              updated[index].uniequipId = id;
                              updated[index].uniequipName = uniequip_basic[id]?.typeIcon.toUpperCase() || "";
                            }
                            return updated;
                          });
                        }}
                      >
                        {item.options.map((option) => {
                          const { uniEquipId, uniEquipName, typeIcon } = option;
                          return (
                            <Radio description={uniEquipName} value={uniEquipId} key={uniEquipId}>
                              {typeIcon.toUpperCase()}
                            </Radio>
                          );
                        })}
                      </RadioGroup>
                    ))}
                  </div>
                </div>
              )}
              <MySelect
                name="type"
                label="作战类型"
                defaultSelectedKeys={[record?.type ?? Object.keys(StageTypes)[0]]}
                required
              >
                {Object.keys(StageTypes).map((typeKey) => (
                  <SelectItem key={typeKey}>{StageTypes[typeKey] + "作战"}</SelectItem>
                ))}
              </MySelect>
              <MySelect name="level" label="难度等级" defaultSelectedKeys={[record?.level ?? maxLevel]} required>
                {StageLevels.map((l) => (
                  <SelectItem key={l}>{l}</SelectItem>
                ))}
              </MySelect>
              <MyTextarea name="note" label="备注" minRows={5} placeholder="攻略者ID、等效情况等" defaultValue={record?.note} />
              <MyButton className="w-full" type="submit">
                {isEdit ? "保存" : "提交"}
              </MyButton>
              {isEdit && record && (
                <div className="w-full text-xs text-white/60">
                  <span>提交人：{record.submitter || "未知"}</span>
                  {record.editor && (
                    <span className="ms-4">
                      最近编辑：{record.editor}
                      {record.date_modified ? `（${new Date(record.date_modified).toLocaleString("zh-CN")}）` : ""}
                    </span>
                  )}
                </div>
              )}
            </Form>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
