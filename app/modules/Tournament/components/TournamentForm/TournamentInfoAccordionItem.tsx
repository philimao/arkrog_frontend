import { Select, SelectItem, Tooltip, useDisclosure } from "@heroui/react";
import { CloseIcon, InformationIcon } from "~/components/Icons";
import { useGameDataStore } from "~/stores/gameDataStore";
import { useStorageStore } from "~/stores/storageStore";
import type { RogueKey } from "~/types/gameData";
import type { TournamentData } from "~/types/tournamentsData";
import { SearchSelect } from "~/components/SearchSelect";
import { miscServices } from "~/services/miscServices";
import type { SearchUserItem } from "~/types/bilibili";
import {
  getInputClassName,
  labelClassName,
  labelWithTooltipClassName,
  selectClassName,
} from ".";
import UploadCenterTrigger from "~/components/COS/UploadCenterTrigger";
import MarkdownEditorModal from "~/components/Modal/MarkdownEditorModal";
import { useState } from "react";
import { toast } from "react-toastify";

interface TournamentInfoAccordionItemProps {
  formData: TournamentData;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  addingLabel: boolean;
  setAddingLabel: React.Dispatch<React.SetStateAction<boolean>>;
  editingLabelIndex: number | null;
  setEditingLabelIndex: React.Dispatch<React.SetStateAction<number | null>>;
  touchedFields: Set<string>;
  handleBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}

export default function TournamentInfoAccordionItem({
  formData,
  handleKeyDown,
  setFormData,
  addingLabel,
  setAddingLabel,
  editingLabelIndex,
  setEditingLabelIndex,
  touchedFields,
  handleBlur,
}: TournamentInfoAccordionItemProps) {
  const { topics } = useGameDataStore();
  const {
    setUploadLabel,
    setUploadDirectory,
    setOnUploadedItemClick,
    clearUploadParams,
  } = useStorageStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editorInitialContent, setEditorInitialContent] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [searching, setSearching] = useState(false);
  // 记录已选的搜索结果
  const [selectedUser, setSelectedUser] = useState<SearchUserItem | undefined>(
    undefined,
  );

  // 直播间搜索相关状态
  const [roomSearchResults, setRoomSearchResults] = useState<SearchUserItem[]>(
    [],
  );
  const [roomSearching, setRoomSearching] = useState(false);
  const [selectedRoomUser, setSelectedRoomUser] = useState<
    SearchUserItem | undefined
  >(undefined);

  const handleOpenEditor = (key: string) => {
    setUploadDirectory(
      "tournament/" + formData.name.replace(/[!@#$%^&*()+\s]+/g, "_"),
    );
    const initialContent =
      (formData[key as keyof TournamentData] as string) || "";
    setEditorInitialContent(initialContent);
    // 设置保存回调
    setOnEditorSave(() => (content: string) => {
      setFormData((prev) => ({
        ...prev,
        [key]: content,
      }));
      onEditorClose();
    });
    onOpen();
  };

  // 编辑器保存内容回调，在打开编辑器时设置
  const [onEditorSave, setOnEditorSave] = useState<(content: string) => void>(
    () => {},
  );

  // 关闭编辑器时，清除上传参数
  const onEditorClose = () => {
    clearUploadParams();
    onClose();
  };

  const isOrganizerInvalid =
    touchedFields.has("organizerSearch") &&
    (!formData.organizers || formData.organizers.length === 0);

  const isRoomInvalid =
    touchedFields.has("roomSearch") &&
    (!formData.rooms || formData.rooms.length === 0);

  // 更新input内容到formData
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
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
            className={getInputClassName("name", touchedFields, formData)}
            onBlur={handleBlur}
            disabled
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
            classNames={selectClassName}
            aria-label="赛事类型"
            required
          >
            <SelectItem key="individual">个人赛</SelectItem>
            <SelectItem key="team">团队赛</SelectItem>
          </Select>
        </div>

        <div>
          <label htmlFor="avatar" className={labelWithTooltipClassName}>
            赛事图标
          </label>
          <div className="relative">
            <input
              id="avatar"
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={`${getInputClassName("avatar", touchedFields, formData)} pr-12`}
              onBlur={handleBlur}
            />
            <UploadCenterTrigger
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#00000033] rounded hover:bg-dark-gray"
              aria-label="上传赛事图标"
              beforeOpen={() => {
                if (!formData.name) {
                  toast.warning("请先输入赛事名称");
                  return false;
                }
                setUploadLabel("赛事图标");
                setUploadDirectory(
                  "tournament/" +
                    formData.name.replace(/[!@#$%^&*()+\s]+/g, "_"),
                );
                setOnUploadedItemClick((item) => {
                  setFormData((prev) => ({
                    ...prev,
                    avatar: item.url,
                  }));
                });
                return true;
              }}
            />
          </div>
        </div>

        {topics && (
          <div>
            <label htmlFor="rogue" className={labelClassName}>
              肉鸽主题 <span className="text-ak-red">*</span>
            </label>
            <Select
              id="rogue"
              name="rogue"
              selectedKeys={[
                formData.rogue
                  ? topics[formData.rogue as RogueKey].id
                  : Object.values(topics).reverse()[0].id,
              ]}
              onChange={handleChange}
              classNames={selectClassName}
              aria-label="肉鸽"
              required
            >
              {Object.values(topics)
                .reverse()
                .map((topic) => (
                  <SelectItem key={topic.id}>{topic.name}</SelectItem>
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
            classNames={selectClassName}
            aria-label="肉鸽版本"
            required
          >
            <SelectItem key="初始版本">初始版本</SelectItem>
            <SelectItem key="DLC_1">DLC_1</SelectItem>
            <SelectItem key="DLC_2">DLC_2</SelectItem>
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
            className={getInputClassName("level", touchedFields, formData)}
            onBlur={handleBlur}
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
              className={getInputClassName(
                "memberAlias",
                touchedFields,
                formData,
              )}
              onBlur={handleBlur}
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
              className={getInputClassName(
                "keyMemberAlias",
                touchedFields,
                formData,
              )}
              onBlur={handleBlur}
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className={labelWithTooltipClassName}>
          主办方 <span className="text-ak-red">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {formData.organizers?.map((organizer, index) => (
            <div
              key={organizer.mid}
              className="flex items-center gap-2 px-2 py-1 rounded-md bg-mid-gray"
            >
              <div className="w-6 h-6 rounded-full border border-white overflow-hidden flex-shrink-0">
                <img
                  src={organizer.avatar}
                  alt={organizer.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-sm">{organizer.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    organizers: prev.organizers.filter((_, i) => i !== index),
                  }));
                }}
                className="rounded-md p-1 hover:text-white hover:bg-ak-red"
                aria-label={`删除组织者${organizer.name}`}
              >
                <CloseIcon width="0.7rem" height="0.7rem" />
              </button>
            </div>
          ))}

          <SearchSelect<SearchUserItem>
            value={selectedUser ?? null}
            onChange={(item) => {
              if (!item) {
                return;
              }
              const newMid = String(item.mid);
              setSelectedUser(item);

              // 检查是否已存在
              const exists = formData.organizers?.some(
                (org) => org.mid === newMid,
              );
              if (exists) {
                toast.warning("该组织者已添加");
                setSelectedUser(undefined);
                setSearchResults([]);
                return;
              }

              // 添加到组织者列表
              setFormData((prev) => ({
                ...prev,
                organizers: [
                  ...(prev.organizers || []),
                  {
                    mid: newMid,
                    name: item.uname,
                    avatar: item.upic,
                  },
                ],
              }));

              // 重置搜索状态，保持搜索框可用以便添加下一个
              setSelectedUser(undefined);
              setSearchResults([]);
            }}
            items={searchResults}
            filterFn={() => true}
            renderItem={(item) => (
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 flex-shrink-0 rounded bg-light-gray overflow-hidden">
                  <img
                    src={item.upic}
                    alt={item.uname}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium truncate">{item.uname}</span>
                  {item.fans && item.fans > -1 ? (
                    <span className="text-xs text-gray truncate">
                      粉丝 {item.fans ?? 0}
                    </span>
                  ) : (
                    <span>请设置为此临时值</span>
                  )}
                </div>
              </div>
            )}
            renderSelected={(item) => item.uname}
            getKey={(item) => String(item.mid)}
            placeholder="输入B站用户名"
            manualSearch
            onSearch={async (query) => {
              try {
                setSearching(true);
                const resp = await miscServices.searchBilibiliUsers(
                  query,
                  1,
                  20,
                );
                const body = resp.data;
                if (body.code !== 0) {
                  toast.error(body.message || "搜索失败");
                  setSearchResults([]);
                  return;
                }
                if (!body.data?.result) {
                  toast.error("搜索结果为空");
                  setSearchResults([]);
                } else {
                  setSearchResults(body.data.result);
                }
              } catch (err) {
                if ((err as any).status === 502) {
                  setSearchResults([
                    {
                      mid: 0,
                      uname: query,
                      upic: "https://static.hdslb.com/images/member/noface.gif",
                      fans: -1,
                      sign: "",
                      room_id: 22450647,
                      level: 6,
                      gender: 0,
                      is_live: false,
                      is_upuser: false,
                    },
                  ]);
                } else {
                  setSearchResults([]);
                }
              } finally {
                setSearching(false);
              }
            }}
            isSearching={searching}
            onInputChange={() => {}}
            onInputKeyDown={handleKeyDown}
            onInputBlur={handleBlur}
            inputName="organizerSearch"
            className="w-64"
            onClearResults={() => setSearchResults([])}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className={labelClassName}>
            观赛直播间 <span className="text-ak-red">*</span>
          </label>
        </div>

        {/* 已添加的直播间列表 */}
        <div className="flex flex-wrap gap-2">
          {formData.rooms?.map((room, index) => (
            <div
              key={room.mid}
              className="flex items-center gap-2 px-2 py-1 rounded-md bg-mid-gray"
            >
              <div className="w-6 h-6 rounded-full border border-white overflow-hidden flex-shrink-0">
                <img
                  src={room.avatar}
                  alt={room.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-sm">{room.name}的直播间</span>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    rooms: prev.rooms.filter((_, i) => i !== index),
                  }));
                }}
                className="rounded-md p-1 hover:text-white hover:bg-ak-red"
                aria-label={`删除直播间${room.name}`}
              >
                <CloseIcon width="0.7rem" height="0.7rem" />
              </button>
            </div>
          ))}

          {/* 添加新直播间的搜索框 */}
          <SearchSelect<SearchUserItem>
            value={selectedRoomUser ?? null}
            onChange={(item) => {
              if (!item) {
                return;
              }
              const newMid = String(item.mid);
              setSelectedRoomUser(item);

              // 检查是否已存在
              const exists = formData.rooms?.some(
                (room) => room.mid === newMid,
              );
              if (exists) {
                toast.warning("该直播间已添加");
                setSelectedRoomUser(undefined);
                setRoomSearchResults([]);
                return;
              }

              // 检查是否有直播间ID
              if (!item.room_id) {
                toast.warning("该用户暂无直播间");
                setSelectedRoomUser(undefined);
                setRoomSearchResults([]);
                return;
              }

              // 添加到直播间列表
              setFormData((prev) => ({
                ...prev,
                rooms: [
                  ...(prev.rooms || []),
                  {
                    mid: newMid,
                    room_id: String(item.room_id),
                    name: item.uname,
                    avatar: item.upic,
                  },
                ],
              }));

              // 重置搜索状态
              setSelectedRoomUser(undefined);
              setRoomSearchResults([]);
            }}
            items={roomSearchResults}
            filterFn={() => true}
            renderItem={(item) => (
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 flex-shrink-0 rounded bg-light-gray overflow-hidden">
                  <img
                    src={item.upic}
                    alt={item.uname}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium truncate">{item.uname}</span>
                  {item.fans && item.fans > -1 ? (
                    <span className="text-xs text-gray truncate">
                      粉丝 {item.fans ?? 0}
                      {item.room_id && (
                        <span className="ml-2 text-ak-blue">
                          {item.is_live ? "🔴直播中" : "⚪未开播"}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>请设置为此临时值</span>
                  )}
                </div>
              </div>
            )}
            renderSelected={(item) => item.uname}
            getKey={(item) => String(item.mid)}
            placeholder="输入B站用户名"
            manualSearch
            onSearch={async (query) => {
              try {
                setRoomSearching(true);
                const resp = await miscServices.searchBilibiliUsers(
                  query,
                  1,
                  20,
                );
                const body = resp.data;
                if (body.code !== 0) {
                  toast.error(body.message || "搜索失败");
                  setRoomSearchResults([]);
                  return;
                }
                if (!body.data?.result) {
                  toast.error("搜索结果为空");
                  setRoomSearchResults([]);
                } else {
                  setRoomSearchResults(body.data.result);
                }
              } catch (err) {
                console.error(err);
                if ((err as any).status === 502) {
                  setRoomSearchResults([
                    {
                      mid: 0,
                      uname: query,
                      upic: "https://static.hdslb.com/images/member/noface.gif",
                      fans: -1,
                      sign: "",
                      room_id: 22450647,
                      level: 6,
                      gender: 0,
                      is_live: false,
                      is_upuser: false,
                    },
                  ]);
                } else {
                  setRoomSearchResults([]);
                }
              } finally {
                setRoomSearching(false);
              }
            }}
            isSearching={roomSearching}
            onInputChange={() => {}}
            onInputKeyDown={handleKeyDown}
            onInputBlur={handleBlur}
            inputName="roomSearch"
            className="w-64"
            onClearResults={() => setRoomSearchResults([])}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClassName}>标签</label>
        <div className="flex flex-wrap gap-2">
          {formData.labels?.map((label, index) =>
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
                      const newLabels = [...(formData.labels || [])];
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
                    const newLabels = [...(formData.labels || [])];
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
                      labels: (formData.labels || []).filter(
                        (_, i) => i !== index,
                      ),
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
                      labels: [...(prev.labels || []), value],
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
                    labels: [...(prev.labels || []), value],
                  }));
                }
                setAddingLabel(false);
              }}
              maxLength={20}
            />
          )}
          {(formData.labels?.length || 0) < (addingLabel ? 9 : 10) && (
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
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor="rule"
            className="flex items-center text-sm font-light"
          >
            规则（文字展示，不宜过长）
          </label>
          <button
            type="button"
            onClick={() => handleOpenEditor("rule")}
            className="text-xs text-ak-blue hover:underline"
          >
            富文本编辑
          </button>
        </div>
        <textarea
          id="rule"
          name="rule"
          value={formData.rule}
          onChange={handleChange}
          className={getInputClassName("rule", touchedFields, formData)}
          onBlur={handleBlur}
          rows={4}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="detailRule" className={labelWithTooltipClassName}>
            详细规则（可插入主办方制作的规则图片）
          </label>
          <button
            type="button"
            onClick={() => handleOpenEditor("detailRule")}
            className="text-xs text-ak-blue hover:underline"
          >
            富文本编辑
          </button>
        </div>
        <textarea
          id="detailRule"
          name="detailRule"
          value={formData.detailRule}
          onChange={handleChange}
          className={getInputClassName("detailRule", touchedFields, formData)}
          onBlur={handleBlur}
          rows={4}
        />
      </div>
      <MarkdownEditorModal
        isOpen={isOpen}
        onClose={onEditorClose}
        initialContent={editorInitialContent}
        onSave={onEditorSave}
        title="编辑规则"
      />
    </>
  );
}
