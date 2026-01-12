import { Select, SelectItem, Tooltip } from "@heroui/react";
import { CloseIcon, InformationIcon } from "~/components/Icons";
import { SearchSelect } from "~/components/SearchSelect";
import { useState, useEffect, useRef } from "react";
import type { TournamentData, TournamentPlayer } from "~/types/tournamentsData";
import { generateID } from "~/utils/tools";
import { toast } from "react-toastify";
import { miscServices } from "~/services/miscServices";
import type { SearchUserItem } from "~/types/bilibili";
import {
  getInputClassName,
  inputClassName,
  labelClassName,
  labelWithTooltipClassName,
  selectClassName,
} from ".";
import { useInputSuggestions } from "~/hooks/useInputSuggestions";

interface TournamentPlayersAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  editingPlayer: TournamentPlayer | undefined;
  setEditingPlayer: React.Dispatch<
    React.SetStateAction<TournamentPlayer | undefined>
  >;
  touchedFields: Set<string>;
  handleBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}

export default function TournamentPlayersAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
  editingPlayer,
  setEditingPlayer,
  touchedFields,
  handleBlur,
}: TournamentPlayersAccordionItemProps) {
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomValue, setNewCustomValue] = useState("");
  const [keyError, setKeyError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [searching, setSearching] = useState(false);
  // 记录每个选手对应的已选搜索结果，便于切换编辑时回显
  const [selectedUserMap, setSelectedUserMap] = useState<
    Record<string, SearchUserItem | undefined>
  >({});

  // 从现有选手数据中提取所有自定义字段的值，作为初始缓存
  const extractInitialCache = (): Record<string, string[]> => {
    if (!formData.customPlayerKeys || !formData.players) return {};

    const initialCache: Record<string, string[]> = {};

    // 遍历所有自定义字段
    Object.keys(formData.customPlayerKeys).forEach((key) => {
      const values = new Set<string>();

      // 收集所有选手在该字段的值
      formData.players?.forEach((player) => {
        const value = player.customPlayerValues?.[key];
        if (value && value.trim()) {
          values.add(value.trim());
        }
      });

      // 将 Set 转为数组
      if (values.size > 0) {
        initialCache[key] = Array.from(values);
      }
    });

    return initialCache;
  };

  // 使用输入建议 hook，传入初始缓存数据
  const {
    addToCache,
    getSuggestions,
    showSuggestions,
    setShowSuggestions,
    suggestionListRef,
  } = useInputSuggestions(extractInitialCache());

  const isPlayerNameInvalid =
    !!editingPlayer &&
    touchedFields.has("playerName") &&
    !editingPlayer.name.trim();

  // Validate key input to only allow [a-zA-Z]
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCustomKey(value);
    if (/^[a-zA-Z]*$/.test(value)) {
      setKeyError("");
    } else {
      setKeyError("仅支持输入英文字母");
    }
  };

  // Add new custom player key
  const handleAddCustomKey = () => {
    if (!newCustomKey || !newCustomValue) return;

    // Check if key already exists
    if (formData.customPlayerKeys && formData.customPlayerKeys[newCustomKey]) {
      setKeyError("该自定义选手信息已存在");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      customPlayerKeys: {
        ...prev.customPlayerKeys,
        [newCustomKey]: newCustomValue,
      },
    }));

    // Reset inputs
    setNewCustomKey("");
    setNewCustomValue("");
  };

  // Set a key as groupBy
  const handleSetGroupBy = (key: string) => {
    const newGroupBy = formData.groupBy === key ? "" : key;
    setFormData((prev) => ({
      ...prev,
      groupBy: newGroupBy,
    }));
  };

  return (
    <>
      <div className="border-b-1 border-b-mid-gray">
        <div className="flex pb-4 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <label htmlFor="customKey" className={labelClassName}>
                自定义选手信息标识，用于选手分类（仅限英文）
              </label>
              <input
                id="customKey"
                type="text"
                value={newCustomKey}
                onChange={handleKeyChange}
                placeholder="例：server"
                className={getInputClassName("customKey", touchedFields, {
                  customKey: newCustomKey,
                })}
                onBlur={handleBlur}
                maxLength={20}
              />
              {keyError && (
                <span className="text-xs text-ak-red">{keyError}</span>
              )}
            </div>
            <div>
              <label htmlFor="customKeyValue" className={labelClassName}>
                自定义选手信息名称
              </label>
              <input
                id="customKeyValue"
                type="text"
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                placeholder="例：服务器"
                className={getInputClassName("customKeyValue", touchedFields, {
                  customKeyValue: newCustomValue,
                })}
                onBlur={handleBlur}
                maxLength={20}
              />
            </div>
          </div>
          <div className="relative w-6 flex-shrink-0">
            <button
              type="button"
              onClick={handleAddCustomKey}
              disabled={!newCustomKey || !newCustomValue || !!keyError}
              className="cursor-pointer rounded-md p-1 absolute top-8 text-black bg-ak-blue disabled:text-white disabled:bg-mid-gray disabled:cursor-not-allowed"
              aria-label="添加自定义选手信息"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        {formData.customPlayerKeys &&
          Object.keys(formData.customPlayerKeys || {}).length > 0 && (
            <div className="pb-4">
              <p className={labelWithTooltipClassName}>
                已有自定义选手信息:
                {formData.type !== "team" && (
                  <Tooltip
                    content="勾选的自定义信息将被设为参赛选手的分组依据，用于赛程信息界面"
                    className="bg-light-mid-gray text-black"
                  >
                    <span className="px-1">
                      <InformationIcon width="0.75rem" height="0.75rem" />
                    </span>
                  </Tooltip>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.customPlayerKeys || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1 bg-mid-gray p-2 rounded"
                    >
                      <span className="text-sm">
                        {key}: {value}
                      </span>
                      <label className="flex items-center ml-1">
                        <input
                          type="checkbox"
                          checked={formData.groupBy === key}
                          onChange={() => handleSetGroupBy(key)}
                          className="mr-1 accent-ak-blue w-4 h-4 cursor-pointer"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newCustomKeys = {
                            ...(formData.customPlayerKeys || {}),
                          };
                          delete newCustomKeys[key];

                          // If this was the groupBy key, reset groupBy
                          const newGroupBy =
                            formData.groupBy === key ? "" : formData.groupBy;

                          // Need to delete corresponding value from all players
                          const newPlayers = (formData.players || []).map(
                            (player) => {
                              const newPlayer = { ...player };
                              delete newPlayer.customPlayerValues[key];
                              return newPlayer;
                            },
                          );

                          setFormData((prev) => ({
                            ...prev,
                            customPlayerKeys: newCustomKeys,
                            groupBy: newGroupBy,
                            players: newPlayers,
                          }));
                        }}
                        className="rounded-md p-1 hover:text-white hover:bg-ak-red"
                        aria-label={`删除自定义选手信息${key}: ${value}`}
                      >
                        <CloseIcon width="0.7rem" height="0.7rem" />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
      </div>
      <div className="flex flex-wrap gap-2 my-4">
        {(formData.players || []).length > 0 &&
          (formData.players || []).map((player, index) => (
            <div
              key={index}
              className={`p-2 w-[117px] relative rounded-md cursor-pointer ${editingPlayer?.mid === player.mid ? "bg-ak-blue text-black" : !player.name.trim() ? "bg-ak-dark-red text-white" : "bg-mid-gray text-white"}`}
              onClick={(e) => {
                e.preventDefault();
                editingPlayer?.mid === player.mid
                  ? setEditingPlayer(undefined)
                  : setEditingPlayer(player);
              }}
            >
              <div
                className={`w-16 h-16 aspect-square flex items-center justify-center bg-light-gray text-black`}
              >
                {player.face ? (
                  <img
                    src={player.face}
                    alt="avatar"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <p className="text-5xl">
                    {!player.name ? "?" : player.name[0]}
                  </p>
                )}
              </div>
              <div className="pt-1 break-all">
                {!player.name
                  ? editingPlayer?.mid === player.mid
                    ? "请填写选手"
                    : "点击填写选手"
                  : player.name}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (editingPlayer?.mid === player.mid)
                    setEditingPlayer(undefined);
                  const newPlayers = (formData.players || []).filter(
                    (_, i) => i !== index,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    players: newPlayers,
                  }));
                }}
                className="ml-1 rounded-md p-1 hover:text-white hover:bg-ak-red absolute top-1 right-1"
                aria-label="删除选手"
              >
                <CloseIcon width="0.7rem" height="0.7rem" />
              </button>
            </div>
          ))}
        <button
          type="button"
          onClick={() => {
            const newPlayer = {
              mid: generateID(),
              name: "",
              face: "",
              room_id: "",
              games: [],
              customPlayerValues: {},
            };
            setFormData((prev) => ({
              ...prev,
              players: [...(prev.players || []), newPlayer],
            }));
            setEditingPlayer(newPlayer);
          }}
          className="p-2 w-[117px] text-ak-blue bg-mid-gray hover:text-black hover:bg-ak-blue rounded-md"
        >
          + 添加选手
        </button>
      </div>
      {editingPlayer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-t-1 border-t-mid-gray pt-2 mb-2">
          <div className="w-full">
            <label htmlFor="playerName" className={labelWithTooltipClassName}>
              选手用户名
              <span className="text-ak-red">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <SearchSelect<SearchUserItem>
                value={
                  editingPlayer
                    ? (selectedUserMap[editingPlayer.mid] ?? null)
                    : null
                }
                onChange={(item) => {
                  if (!editingPlayer) return;
                  if (!item) {
                    setSelectedUserMap((prev) => ({
                      ...prev,
                      [editingPlayer.mid]: undefined,
                    }));
                    return;
                  }
                  const newMid = String(item.mid);
                  setSelectedUserMap((prev) => {
                    const next = { ...prev };
                    if (editingPlayer.mid !== newMid) {
                      delete next[editingPlayer.mid];
                    }
                    next[newMid] = item;
                    return next;
                  });
                  const newPlayers = [...(formData.players || [])];
                  const target = newPlayers.find(
                    (p) => p.mid === editingPlayer.mid,
                  );
                  if (target) {
                    const updatedPlayer = {
                      ...target,
                      mid: newMid,
                      name: item.uname,
                      face: item.upic,
                      room_id: item.room_id ? String(item.room_id) : target.room_id,
                      fans: item.fans,
                    };
                    const idx = newPlayers.indexOf(target);
                    newPlayers[idx] = updatedPlayer;
                    setEditingPlayer(updatedPlayer);
                  }
                  setFormData((prev) => ({ ...prev, players: newPlayers }));
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
                placeholder="输入B站用户名后点击右侧搜索（外服用户不搜索）"
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
                onClearResults={() => setSearchResults([])}
                isSearching={searching}
                onInputChange={(val) => {
                  if (!editingPlayer) return;
                  const newPlayers = [...(formData.players || [])];
                  const target = newPlayers.find(
                    (p) => p.mid === editingPlayer.mid,
                  );
                  if (target) {
                    target.name = val.trim();
                  }
                  setFormData((prev) => ({ ...prev, players: newPlayers }));
                }}
                onInputKeyDown={handleKeyDown}
                onInputBlur={handleBlur}
                initialInputValue={editingPlayer?.name ?? ""}
                inputName="playerName"
                inputWrapperClassName={
                  isPlayerNameInvalid ? "outline outline-2 outline-ak-red" : ""
                }
                required
                className="grow"
              />
            </div>
          </div>

          {formData.type === "team" && (formData.teams || []).length > 0 && (
            <div>
              <label htmlFor="playerTeam" className={labelClassName}>
                所属队伍 <span className="text-ak-red">*</span>
              </label>
              <Select
                id="playerTeam"
                name="playerTeam"
                selectedKeys={[
                  formData.teams?.find((team) =>
                    team.members.includes(editingPlayer.name),
                  )?.id ?? "",
                ]}
                onChange={(e) => {
                  const newTeams = [...(formData.teams || [])];
                  newTeams
                    .find((t) => t.members.includes(editingPlayer.name))
                    ?.members.splice(
                      newTeams
                        .find((t) => t.members.includes(editingPlayer.name))
                        ?.members.indexOf(editingPlayer.name)!,
                      1,
                    );
                  newTeams
                    .find((t) => t.id === e.target.value)
                    ?.members.push(editingPlayer.name);
                  setFormData((prev) => ({
                    ...prev,
                    teams: newTeams,
                  }));
                }}
                classNames={selectClassName}
                aria-label="所属队伍"
                required
              >
                {(formData.teams || []).map((team) => {
                  return (
                    <SelectItem key={team.id} textValue={team.id}>
                      {team.name}
                    </SelectItem>
                  );
                })}
              </Select>
            </div>
          )}

          {Object.entries(formData.customPlayerKeys || {}).map(
            ([key, value]) => (
              <div key={key} className="relative">
                <label htmlFor="customPlayerValue" className={labelClassName}>
                  {value}
                </label>
                <input
                  id="customPlayerValue"
                  type="text"
                  value={editingPlayer.customPlayerValues[key] ?? ""}
                  onChange={(e) => {
                    const newPlayers = [...(formData.players || [])];
                    const player = newPlayers.find(
                      (p) => p.mid === editingPlayer.mid,
                    );
                    if (player) {
                      player.customPlayerValues[key] = e.target.value.trim();
                    }
                    setFormData((prev) => ({ ...prev, players: newPlayers }));
                  }}
                  className={getInputClassName(
                    `customPlayerValue-${key}`,
                    touchedFields,
                    {
                      [`customPlayerValue-${key}`]:
                        editingPlayer.customPlayerValues[key],
                    },
                  )}
                  onFocus={() => setShowSuggestions(key)}
                  onBlur={(e) => {
                    handleBlur(e);
                    const currentValue = editingPlayer.customPlayerValues[key];
                    if (currentValue?.trim()) {
                      addToCache(key, currentValue);
                    }
                    // 延迟关闭建议列表，以便点击建议项能够触发
                    setTimeout(() => setShowSuggestions(null), 200);
                  }}
                  maxLength={128}
                />
                {showSuggestions === key && getSuggestions(key).length > 0 && (
                  <div
                    ref={suggestionListRef}
                    className="absolute z-10 w-full mt-1 bg-dark-gray border border-mid-gray rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {getSuggestions(key).map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 cursor-pointer hover:bg-mid-gray text-white transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault(); // 防止触发 input 的 blur
                          const newPlayers = [...(formData.players || [])];
                          const player = newPlayers.find(
                            (p) => p.mid === editingPlayer.mid,
                          );
                          if (player) {
                            player.customPlayerValues[key] = suggestion;
                          }
                          setFormData((prev) => ({
                            ...prev,
                            players: newPlayers,
                          }));
                          setShowSuggestions(null);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </>
  );
}
