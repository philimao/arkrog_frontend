import { Select, SelectItem, Tooltip } from "@heroui/react";
import { CloseIcon, InformationIcon } from "~/components/Icons";
import { useGameDataStore } from "~/stores/gameDataStore";
import type { RogueKey } from "~/types/gameData";
import type { TournamentData } from "~/types/tournamentsData";
import { inputClassName, labelClassName, labelWithTooltipClassName } from ".";
import UploadCenterTrigger from "~/components/COS/UploadCenterTrigger";

interface TournamentInfoAccordionItemProps {
  formData: TournamentData;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  addingLabel: boolean;
  setAddingLabel: React.Dispatch<React.SetStateAction<boolean>>;
  editingLabelIndex: number | null;
  setEditingLabelIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function TournamentInfoAccordionItem({
  formData,
  handleKeyDown,
  setFormData,
  addingLabel,
  setAddingLabel,
  editingLabelIndex,
  setEditingLabelIndex,
}: TournamentInfoAccordionItemProps) {
  const { topics } = useGameDataStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
        <div>
          <label htmlFor="name" className={labelClassName}>
            赛事名称 <span className="text-ak-red">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            placeholder="例：仙术杯#5"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="type" className={labelClassName}>
            赛事类型 <span className="text-ak-red">*</span>
          </label>
          <Select
            id="type"
            name="type"
            selectedKeys={[formData.type]}
            onChange={handleChange}
            classNames={{
              trigger: "bg-mid-gray rounded-none",
              value: "",
              popoverContent: "bg-mid-gray rounded-none",
              listbox: "rounded-none",
            }}
            aria-label="赛事类型"
            required
          >
            <SelectItem key="individual" value="individual">
              个人赛
            </SelectItem>
            <SelectItem key="team" value="team">
              团队赛
            </SelectItem>
          </Select>
        </div>

        <div>
          <label htmlFor="avatar" className={labelWithTooltipClassName}>
            赛事图标
            <Tooltip content="点击图标上传图片后，将图片链接粘贴此处" className="bg-light-mid-gray text-black">
              <span className="px-1">
                <InformationIcon width="0.75rem" height="0.75rem" />
              </span>
            </Tooltip>
          </label>
          <div className="relative">
            <input
              id="avatar"
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={`${inputClassName} pr-12`}
            />
            <UploadCenterTrigger
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#00000033] rounded hover:bg-dark-gray"
              aria-label="上传赛事图标"
            />
          </div>
        </div>

        {topics && (
          <div>
            <label htmlFor="rogue" className={labelClassName}>
              肉鸽 <span className="text-ak-red">*</span>
            </label>
            <Select
              id="rogue"
              name="rogue"
              selectedKeys={[
                formData.rogue ? topics[formData.rogue as RogueKey].id : Object.values(topics).reverse()[0].id,
              ]}
              onChange={handleChange}
              classNames={{
                trigger: "bg-mid-gray rounded-none",
                value: "",
                popoverContent: "bg-mid-gray rounded-none",
                listbox: "rounded-none",
              }}
              aria-label="肉鸽"
              required
            >
              {Object.values(topics)
                .reverse()
                .map((topic) => (
                  <SelectItem key={topic.id} value={topic.name}>
                    {topic.name}
                  </SelectItem>
                ))}
            </Select>
          </div>
        )}

        <div>
          <label htmlFor="edition" className={labelClassName}>
            肉鸽版本 <span className="text-ak-red">*</span>
          </label>
          <Select
            id="edition"
            name="edition"
            selectedKeys={[formData.edition]}
            onChange={handleChange}
            classNames={{
              trigger: "bg-mid-gray rounded-none",
              value: "",
              popoverContent: "bg-mid-gray rounded-none",
              listbox: "rounded-none",
            }}
            aria-label="肉鸽版本"
            required
          >
            <SelectItem key="初始版本" value="初始版本">
              初始版本
            </SelectItem>
            <SelectItem key="DLC_1" value="DLC_1">
              DLC_1
            </SelectItem>
            <SelectItem key="DLC_2" value="DLC_2">
              DLC_2
            </SelectItem>
          </Select>
        </div>

        <div>
          <label htmlFor="level" className={labelClassName}>
            肉鸽难度 <span className="text-ak-red">*</span>
          </label>
          <input
            id="level"
            type="text"
            name="level"
            value={formData.level}
            placeholder="例：N18"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="organizerName" className={labelClassName}>
            主办方 <span className="text-ak-red">*</span>
          </label>
          <input
            id="organizerName"
            type="text"
            name="organizerName"
            value={formData.organizerName}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="room" className="flex items-center items-center text-sm font-light mb-1">
            观赛直播间
            <Tooltip content="支持Markdown格式" className="bg-light-mid-gray text-black">
              <span className="px-1">
                <InformationIcon width="0.75rem" height="0.75rem" />
              </span>
            </Tooltip>
            <span className="text-ak-red">*</span>
          </label>
          <input
            id="room"
            type="text"
            name="room"
            value={formData.room}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={inputClassName}
            required
          />
        </div>

        {formData.type === "team" && (
          <div>
            <label htmlFor="memberAlias" className={labelClassName}>
              成员称号
            </label>
            <input
              id="memberAlias"
              type="text"
              name="memberAlias"
              value={formData.memberAlias}
              placeholder="例：讲述者"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={inputClassName}
            />
          </div>
        )}

        {formData.type === "team" && (
          <div>
            <label htmlFor="keyMemberAlias" className={labelClassName}>
              核心成员称号
            </label>
            <input
              id="keyMemberAlias"
              type="text"
              name="keyMemberAlias"
              value={formData.keyMemberAlias}
              placeholder="例：创想家"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={inputClassName}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className={labelClassName}>标签</label>
        <div className="flex flex-wrap gap-2">
          {formData.labels.map((label, index) =>
            editingLabelIndex === index ? (
              <input
                key={index}
                type="text"
                className="px-2 rounded-md border border-mid-gray focus:outline-ak-blue"
                autoFocus
                defaultValue={label}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      const newLabels = [...formData.labels];
                      newLabels[index] = value;
                      setFormData((prev) => ({
                        ...prev,
                        labels: newLabels,
                      }));
                    }
                    setEditingLabelIndex(null);
                  } else if (e.key === "Escape") {
                    setEditingLabelIndex(null);
                  }
                }}
                onBlur={(e) => {
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    const newLabels = [...formData.labels];
                    newLabels[index] = value;
                    setFormData((prev) => ({
                      ...prev,
                      labels: newLabels,
                    }));
                  }
                  setEditingLabelIndex(null);
                }}
              />
            ) : (
              <div key={index} className="px-2 py-1 rounded-md bg-mid-gray">
                <button
                  type="button"
                  className=""
                  onClick={() => setEditingLabelIndex(index)}
                  aria-label={`编辑标签${label}`}
                >
                  {label}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData((prev) => ({
                      ...prev,
                      labels: formData.labels.filter((_, i) => i !== index),
                    }));
                  }}
                  className="ml-1 rounded-md p-1 hover:text-white hover:bg-ak-red"
                  aria-label={`删除标签${label}`}
                >
                  <CloseIcon width="0.7rem" height="0.7rem" />
                </button>
              </div>
            ),
          )}
          {addingLabel && (
            <input
              type="text"
              className="px-2 rounded-md border border-mid-gray focus:outline-ak-blue min-h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      labels: [...prev.labels, value],
                    }));
                    setAddingLabel(false);
                  }
                } else if (e.key === "Escape") {
                  setAddingLabel(false);
                }
              }}
              onBlur={(e) => {
                const value = e.currentTarget.value.trim();
                if (value) {
                  setFormData((prev) => ({
                    ...prev,
                    labels: [...prev.labels, value],
                  }));
                }
                setAddingLabel(false);
              }}
              maxLength={20}
            />
          )}
          {formData.labels.length < (addingLabel ? 9 : 10) && (
            <button
              type="button"
              onClick={() => {
                if (addingLabel) return;
                setAddingLabel(true);
              }}
              className="px-2 py-1 text-ak-blue bg-mid-gray hover:text-black hover:bg-ak-blue rounded-md"
            >
              + 添加标签
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="rule" className={labelWithTooltipClassName}>
          规则
          <Tooltip content="支持Markdown格式" className="bg-light-mid-gray text-black">
            <span className="px-1">
              <InformationIcon width="0.75rem" height="0.75rem" />
            </span>
          </Tooltip>
        </label>
        <textarea
          id="rule"
          name="rule"
          value={formData.rule}
          onChange={handleChange}
          className={inputClassName}
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="detailRule" className={labelWithTooltipClassName}>
          详细规则
          <Tooltip content="支持Markdown格式" className="bg-light-mid-gray text-black">
            <span className="px-1">
              <InformationIcon width="0.75rem" height="0.75rem" />
            </span>
          </Tooltip>
        </label>
        <textarea
          id="detailRule"
          name="detailRule"
          value={formData.detailRule}
          onChange={handleChange}
          className={inputClassName}
          rows={4}
        />
      </div>
    </>
  );
}
