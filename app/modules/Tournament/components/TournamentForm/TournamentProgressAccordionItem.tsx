import { Select, SelectItem, Tooltip } from "@heroui/react";
import type {
  TournamentData,
  TournamentPlayer,
  TournamentStage,
} from "~/types/tournamentsData";
import { generateDateArray, isSameDay } from "~/utils/date";
import { useEffect, useState } from "react";
import { CloseIcon, InformationIcon } from "~/components/Icons";
import {
  getInputClassName,
  labelClassName,
  labelWithTooltipClassName,
} from ".";
import { useInputSuggestions } from "~/hooks/useInputSuggestions";
import { starterSquads } from "~/utils/gamedataConst";
import { toast } from "react-toastify";

// Helper function to calculate schedule (Day1, Day2, etc.) based on game date and stage startTime
const calculateSchedule = (
  gameDate: number,
  stageStartTime: number,
): string => {
  const startDate = new Date(stageStartTime);
  startDate.setHours(0, 0, 0, 0);
  const gameDateObj = new Date(gameDate);
  gameDateObj.setHours(0, 0, 0, 0);

  const diffTime = gameDateObj.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    return `Day${diffDays + 1}`;
  }

  return "";
};

const inputClassName =
  "bg-[#00000033] w-full p-2 focus:outline focus:outline-2 focus:outline-ak-blue";
const selectClassName = {
  trigger: "bg-[#00000033] rounded-none w-full",
  value: "",
  popoverContent: "bg-mid-gray rounded-none",
  listbox: "rounded",
};

interface TournamentProgressAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  editingStage: TournamentStage | undefined;
  setEditingStage: React.Dispatch<
    React.SetStateAction<TournamentStage | undefined>
  >;
  touchedFields: Set<string>;
  handleBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}

export default function TournamentProgressAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
  editingStage,
  setEditingStage,
  touchedFields,
  handleBlur,
}: TournamentProgressAccordionItemProps) {
  if (!formData.stages?.length) {
    return <div className="mb-4 text-ak-red">请先添加赛事阶段</div>;
  }

  if (
    !formData.players ||
    formData.players?.filter((player) => player.name).length === 0
  ) {
    return <div className="mb-4 text-ak-red">请先添加参赛选手</div>;
  }

  const dates = generateDateArray(
    editingStage?.startTime || 0,
    editingStage?.endTime || 0,
  );
  const players = formData.players?.filter((player) =>
    player.games.find((game) => game.stage === editingStage?.name),
  );
  const remainingPlayers = formData.players?.filter(
    (player) => player.name && !players?.includes(player),
  );
  const [editingPlayer, setEditingPlayer] = useState<
    TournamentPlayer | undefined
  >(undefined);
  const [isAddingPlayers, setIsAddingPlayers] = useState<boolean[]>([]);
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomValue, setNewCustomValue] = useState("");
  const [keyError, setKeyError] = useState("");

  // 从现有比赛数据中提取所有字段的值，作为初始缓存
  const extractInitialCache = (): Record<string, string[]> => {
    if (!formData.players) return {};

    const initialCache: Record<string, string[]> = {
      date: new Set<string>(),
      starterSquad: new Set<string>(
        starterSquads[formData.rogue as keyof typeof starterSquads],
      ),
      starterOp: new Set<string>(),
      ending: new Set<string>(),
    } as any;

    // 收集所有选手的比赛数据
    formData.players.forEach((player) => {
      player.games.forEach((game) => {
        // 收集比赛时间
        if (game.date) {
          const dateStr = new Date(game.date).toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          (initialCache.date as any).add(dateStr);
        }
        // 收集开局干员
        if (game.starterOp?.trim()) {
          (initialCache.starterOp as any).add(game.starterOp.trim());
        }
        // 收集结局
        if (game.ending?.trim()) {
          (initialCache.ending as any).add(game.ending.trim());
        }
        // 收集自定义阶段字段值
        if (game.customStageValues) {
          Object.entries(game.customStageValues).forEach(([key, value]) => {
            if (value?.trim()) {
              if (!initialCache[`customStageValue-${key}`]) {
                initialCache[`customStageValue-${key}`] =
                  new Set<string>() as any;
              }
              (initialCache[`customStageValue-${key}`] as any).add(
                value.trim(),
              );
            }
          });
        }
      });
    });

    // 将 Set 转为数组
    const result: Record<string, string[]> = {};
    Object.entries(initialCache).forEach(([key, valueSet]) => {
      if ((valueSet as any).size > 0) {
        result[key] = Array.from(valueSet as any);
      }
    });

    return result;
  };

  // 使用输入建议 hook，传入初始缓存数据
  const {
    addToCache,
    getSuggestions,
    showSuggestions,
    setShowSuggestions,
    suggestionListRef,
  } = useInputSuggestions(extractInitialCache());

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

  // Add new custom stage key
  const handleAddCustomKey = () => {
    if (!newCustomKey || !newCustomValue || !editingStage) return;

    // Check if key already exists
    if (
      editingStage.customStageKeys &&
      editingStage.customStageKeys[newCustomKey]
    ) {
      setKeyError("该自定义阶段信息已存在");
      return;
    }

    const newStages = [...formData.stages];
    const stageIndex = newStages.findIndex(
      (stage) => stage.name === editingStage.name,
    );

    if (stageIndex !== -1) {
      newStages[stageIndex] = {
        ...newStages[stageIndex],
        customStageKeys: {
          ...newStages[stageIndex].customStageKeys,
          [newCustomKey]: newCustomValue,
        },
      };

      setFormData((prev) => ({
        ...prev,
        stages: newStages,
      }));

      // Update the editingStage reference
      setEditingStage(newStages[stageIndex]);
    }

    // Reset inputs
    setNewCustomKey("");
    setNewCustomValue("");
  };

  // 设置为全局分组依据
  const handleSetGroupBy = (key: string) => {
    const newGroupBy = formData.groupBy === key ? "" : key;
    setFormData((prev) => ({
      ...prev,
      groupBy: newGroupBy,
    }));
  };

  useEffect(() => {
    if (!editingStage) {
      setEditingStage(formData.stages[0]);
    }
    setEditingPlayer(undefined);
    setIsAddingPlayers(new Array(dates.length).fill(false));
  }, [editingStage]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pb-4 mb-4 border-b-1 border-b-mid-gray">
        <div className="flex">
          <label htmlFor="stage" className="pt-2 flex-shrink-0">
            编辑赛事阶段：
          </label>
          <Select
            id="stage"
            name="stage"
            selectedKeys={[
              formData.stages?.find(
                (stage) => stage.name === editingStage?.name,
              )?.name ?? "",
            ]}
            onChange={(e) => {
              setEditingStage(
                formData.stages?.find((stage) => stage.name === e.target.value),
              );
            }}
            classNames={{
              trigger: "bg-mid-gray rounded-none w-48",
              value: "",
              popoverContent: "bg-mid-gray rounded-none",
              listbox: "rounded-none",
            }}
            aria-label="编辑赛事阶段"
            required
          >
            {formData.stages?.map((stage) => {
              return <SelectItem key={stage.name}>{stage.name}</SelectItem>;
            })}
          </Select>
        </div>
      </div>

      {/** 常用阶段信息标示 */}
      <div className="mb-4">
        <label className={labelClassName}>常用阶段信息标示</label>
        <div className="flex gap-2 flex-wrap mt-2">
          <button
            type="button"
            onClick={() => {
              if (!editingStage) return;

              const newStages = [...formData.stages];
              const stageIndex = newStages.findIndex(
                (stage) => stage.name === editingStage.name,
              );

              if (stageIndex !== -1) {
                newStages[stageIndex] = {
                  ...newStages[stageIndex],
                  customStageKeys: {
                    ...newStages[stageIndex].customStageKeys,
                    note: "备注",
                  },
                };

                setFormData((prev) => ({
                  ...prev,
                  stages: newStages,
                }));

                setEditingStage(newStages[stageIndex]);
              }
            }}
            disabled={editingStage?.customStageKeys?.note !== undefined}
            className={`px-3 py-1.5 transition-colors text-sm ${
              editingStage?.customStageKeys?.note !== undefined
                ? "bg-[#00000022] text-gray-500 cursor-not-allowed"
                : "bg-[#00000033] hover:bg-[#00000055]"
            }`}
          >
            备注
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editingStage) return;

              const newStages = [...formData.stages];
              const stageIndex = newStages.findIndex(
                (stage) => stage.name === editingStage.name,
              );

              if (stageIndex !== -1) {
                newStages[stageIndex] = {
                  ...newStages[stageIndex],
                  customStageKeys: {
                    ...newStages[stageIndex].customStageKeys,
                    level: "难度等级",
                  },
                };

                setFormData((prev) => ({
                  ...prev,
                  stages: newStages,
                }));

                setEditingStage(newStages[stageIndex]);
              }
            }}
            disabled={editingStage?.customStageKeys?.level !== undefined}
            className={`px-3 py-1.5 transition-colors text-sm ${
              editingStage?.customStageKeys?.level !== undefined
                ? "bg-[#00000022] text-gray-500 cursor-not-allowed"
                : "bg-[#00000033] hover:bg-[#00000055]"
            }`}
          >
            难度等级
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editingStage) return;

              const newStages = [...formData.stages];
              const stageIndex = newStages.findIndex(
                (stage) => stage.name === editingStage.name,
              );

              if (stageIndex !== -1) {
                newStages[stageIndex] = {
                  ...newStages[stageIndex],
                  customStageKeys: {
                    ...newStages[stageIndex].customStageKeys,
                    duration: "比赛时长",
                  },
                };

                setFormData((prev) => ({
                  ...prev,
                  stages: newStages,
                }));

                setEditingStage(newStages[stageIndex]);
              }
            }}
            disabled={editingStage?.customStageKeys?.duration !== undefined}
            className={`px-3 py-1.5 transition-colors text-sm ${
              editingStage?.customStageKeys?.duration !== undefined
                ? "bg-[#00000022] text-gray-500 cursor-not-allowed"
                : "bg-[#00000033] hover:bg-[#00000055]"
            }`}
          >
            比赛时长
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editingStage) return;

              const newStages = [...formData.stages];
              const stageIndex = newStages.findIndex(
                (stage) => stage.name === editingStage.name,
              );

              if (stageIndex !== -1) {
                newStages[stageIndex] = {
                  ...newStages[stageIndex],
                  customStageKeys: {
                    ...newStages[stageIndex].customStageKeys,
                    playback: "回放链接",
                  },
                };

                setFormData((prev) => ({
                  ...prev,
                  stages: newStages,
                }));

                setEditingStage(newStages[stageIndex]);
              }
            }}
            disabled={editingStage?.customStageKeys?.playback !== undefined}
            className={`px-3 py-1.5 transition-colors text-sm ${
              editingStage?.customStageKeys?.playback !== undefined
                ? "bg-[#00000022] text-gray-500 cursor-not-allowed"
                : "bg-[#00000033] hover:bg-[#00000055]"
            }`}
          >
            回放链接
          </button>
        </div>
      </div>

      {/* 自定义阶段信息 */}
      <div className="border-b-1 border-b-mid-gray mb-4">
        <div className="flex pb-4 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <label htmlFor="customKey" className={labelClassName}>
                自定义阶段信息标识，记录额外信息（仅限英文）
              </label>
              <input
                id="customKey"
                type="text"
                value={newCustomKey}
                onChange={handleKeyChange}
                placeholder="例：session"
                className={getInputClassName(
                  "customSessionKey",
                  touchedFields,
                  { customSessionKey: newCustomKey },
                )}
                onBlur={handleBlur}
                maxLength={20}
              />
              {keyError && (
                <span className="text-xs text-ak-red">{keyError}</span>
              )}
            </div>
            <div>
              <label htmlFor="customKeyValue" className={labelClassName}>
                自定义阶段信息名称
              </label>
              <input
                id="customKeyValue"
                type="text"
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                placeholder="例：场地"
                className={getInputClassName(
                  "customSessionKeyValue",
                  touchedFields,
                  {
                    customSessionKeyValue: newCustomValue,
                  },
                )}
                onBlur={handleBlur}
                maxLength={20}
              />
            </div>
          </div>
          <div className="relative w-6 flex-shrink-0">
            <button
              type="button"
              onClick={handleAddCustomKey}
              disabled={
                !newCustomKey || !newCustomValue || !!keyError || !editingStage
              }
              className="cursor-pointer rounded-md p-1 absolute top-8 text-black bg-ak-blue disabled:text-white disabled:bg-mid-gray disabled:cursor-not-allowed"
              aria-label="添加自定义阶段信息"
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
        {editingStage?.customStageKeys &&
          Object.keys(editingStage.customStageKeys).length > 0 && (
            <div className="pb-4">
              <p className={labelWithTooltipClassName}>
                已有自定义阶段信息:
                {editingStage.type !== "1on1" && (
                  <Tooltip
                    content="勾选的自定义信息将作为此阶段的分组依据，用于分别计算分组排名"
                    className="bg-light-mid-gray text-black"
                  >
                    <span className="px-1">
                      <InformationIcon width="0.75rem" height="0.75rem" />
                    </span>
                  </Tooltip>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(editingStage.customStageKeys).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1 bg-mid-gray p-2 rounded"
                    >
                      <span className="text-sm">
                        {key}: {value}
                      </span>
                      {/* 当赛事类型不为团体赛，且该阶段不为1on1时，允许设置分组依据 */}
                      {formData.type !== "team" &&
                        editingStage.type !== "1on1" && (
                          <label className="flex items-center ml-1">
                            <input
                              type="checkbox"
                              checked={formData.groupBy === key}
                              onChange={() => handleSetGroupBy(key)}
                              className="mr-1 accent-ak-blue w-4 h-4 cursor-pointer"
                            />
                          </label>
                        )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!editingStage) return;

                          const newStages = [...formData.stages];
                          const stageIndex = newStages.findIndex(
                            (stage) => stage.name === editingStage.name,
                          );

                          if (stageIndex !== -1) {
                            const newCustomStageKeys = {
                              ...newStages[stageIndex].customStageKeys,
                            };
                            delete newCustomStageKeys[key];

                            // TODO: If this was the stage's groupBy key, reset groupBy
                            // const newGroupBy = newStages[stageIndex].groupBy === key ? "" : newStages[stageIndex].groupBy;

                            // Need to delete corresponding value from all players' games
                            const newPlayers = (formData.players || []).map(
                              (player) => {
                                const newPlayer = { ...player };
                                newPlayer.games = newPlayer.games.map(
                                  (game) => {
                                    if (game.stage === editingStage.name) {
                                      const newCustomStageValues = {
                                        ...game.customStageValues,
                                      };
                                      delete newCustomStageValues[key];
                                      return {
                                        ...game,
                                        customStageValues: newCustomStageValues,
                                      };
                                    }
                                    return game;
                                  },
                                );
                                return newPlayer;
                              },
                            );

                            newStages[stageIndex] = {
                              ...newStages[stageIndex],
                              customStageKeys: newCustomStageKeys,
                              // TODO: groupBy: newGroupBy,
                            };

                            setFormData((prev) => ({
                              ...prev,
                              stages: newStages,
                              players: newPlayers,
                            }));

                            // Update the editingStage reference
                            setEditingStage(newStages[stageIndex]);
                          }
                        }}
                        className="rounded-md p-1 hover:text-white hover:bg-ak-red"
                        aria-label={`删除自定义阶段信息${key}: ${value}`}
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

      {/* 按日程设置选手赛况 */}
      {dates.map((date, index) => {
        const playersForDate = formData.players?.filter((player) =>
          player.games.find(
            (game) =>
              game.stage === editingStage?.name && isSameDay(game.date, date),
          ),
        );
        const editingGame = editingPlayer?.games.find(
          (game) =>
            game.stage === editingStage?.name && isSameDay(game.date, date),
        );
        const editingPlayerTeam =
          formData.type === "team" && editingPlayer
            ? formData.teams?.find((t) =>
                t.members.includes(editingPlayer.name),
              )
            : undefined;
        const tempNewPlayer = {
          mid: `newPlayer-${index}`,
          name: "点击选择选手",
          face: "",
          games: [],
          customPlayerValues: {},
        };

        return (
          <div className="mb-4 flex" key={index}>
            <div className="w-24 flex-shrink-0">
              <p className="text-xl text-bold text-ak-blue">Day{index + 1}</p>
              <p>{`${date.getMonth() + 1}月${date.getDate()}日`}</p>
            </div>

            {/* 当日选手赛况 */}
            <div className="w-full">
              {/* 已填写选手 */}
              <div className="flex flex-wrap gap-2">
                {playersForDate &&
                  playersForDate.map((player) => {
                    return (
                      <div
                        key={player.mid}
                        className={`p-2 w-[117px] relative rounded-md cursor-pointer ${editingPlayer?.mid === player.mid ? "bg-ak-blue text-black" : "bg-mid-gray text-white"}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingPlayer(
                            editingPlayer?.mid === player.mid
                              ? undefined
                              : player,
                          );
                        }}
                      >
                        <div
                          className={`w-16 h-16 aspect-square flex items-center justify-center ${editingPlayer?.mid === player.mid ? "bg-mid-gray text-white" : "bg-light-gray text-black"}`}
                        >
                          {player.face ? (
                            <img
                              src={player.face}
                              alt="avatar"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <p className="text-5xl">{player.name[0]}</p>
                          )}
                        </div>
                        <div className="pt-1 break-all">{player.name}</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (player.mid === editingPlayer?.mid) {
                              setEditingPlayer(undefined);
                            }
                            const newPlayers = [...(formData.players || [])];

                            // Check if there was a rival and clear that relationship
                            if (editingStage?.type === "1on1") {
                              const rivalMid = newPlayers
                                .find((p) => p === player)!
                                .games.find((g) =>
                                  isSameDay(g.date, date),
                                )?.rivalMid;

                              if (rivalMid) {
                                const rivalIndex = newPlayers.findIndex(
                                  (p) =>
                                    p.mid.toString() === rivalMid.toString(),
                                );
                                if (rivalIndex !== -1) {
                                  const rivalGameIndex = newPlayers[
                                    rivalIndex
                                  ].games.findIndex(
                                    (g) => g.stage === editingStage.name,
                                  );

                                  if (rivalGameIndex !== -1) {
                                    // Clear the rival's rivalMid and result
                                    newPlayers[rivalIndex].games[
                                      rivalGameIndex
                                    ].rivalMid = undefined;
                                    newPlayers[rivalIndex].games[
                                      rivalGameIndex
                                    ].result = undefined;
                                  }
                                }
                              }
                            }

                            newPlayers.find((p) => p === player)!.games =
                              newPlayers
                                .find((p) => p === player)!
                                .games.filter((g) => !isSameDay(g.date, date));
                            setFormData((prev) => ({
                              ...prev,
                              players: newPlayers,
                            }));
                          }}
                          className="ml-1 rounded-md p-1 hover:text-white hover:bg-ak-red absolute top-1 right-1"
                          aria-label="移除选手"
                        >
                          <CloseIcon width="0.7rem" height="0.7rem" />
                        </button>
                      </div>
                    );
                  })}
                {/* 添加选手 */}
                {!!remainingPlayers?.length &&
                  (isAddingPlayers[index] ? (
                    <div
                      className="p-2 w-[117px] relative rounded-md cursor-pointer bg-ak-dark-red text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingPlayer(
                          editingPlayer?.mid === tempNewPlayer.mid
                            ? undefined
                            : tempNewPlayer,
                        );
                      }}
                    >
                      <div className="w-16 h-16 aspect-square flex items-center justify-center bg-light-gray text-black">
                        <p className="text-5xl">?</p>
                      </div>
                      <div className="pt-1 break-all">点击选择选手</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingPlayers((prev) => {
                            const newArray = [...prev];
                            newArray[index] = false;
                            return newArray;
                          });
                          if (editingPlayer?.mid === tempNewPlayer.mid) {
                            setEditingPlayer(undefined);
                          }
                        }}
                        className="ml-1 rounded-md p-1 hover:text-white hover:bg-ak-red absolute top-1 right-1"
                        aria-label="取消添加选手"
                      >
                        <CloseIcon width="0.7rem" height="0.7rem" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAddingPlayers((prev) => {
                          const newArray = [...prev];
                          newArray[index] = true;
                          return newArray;
                        });
                        setEditingPlayer(tempNewPlayer);
                      }}
                      className="p-2 w-[117px] text-ak-blue bg-mid-gray hover:text-black hover:bg-ak-blue rounded-md"
                    >
                      + 添加选手
                    </button>
                  ))}
              </div>

              {editingPlayer &&
                (playersForDate?.find((p) => p.mid === editingPlayer.mid) ||
                  (isAddingPlayers[index] &&
                    editingPlayer.mid === tempNewPlayer.mid)) && (
                  <div className="bg-mid-gray text-white mt-4 p-2 rounded-md">
                    {editingPlayer.mid === tempNewPlayer.mid ? (
                      <div className="flex">
                        <label
                          htmlFor="editingPlayer"
                          className="pt-2 flex-shrink-0"
                        >
                          <span className="text-ak-red">*</span> 请选择选手：
                        </label>
                        <Select
                          id="editingPlayer"
                          name="editingPlayer"
                          classNames={selectClassName}
                          aria-label="选择选手"
                          onChange={(e) => {
                            if (
                              !e.target.value ||
                              e.target.value === "请选择选手"
                            )
                              return;
                            const newPlayer = formData.players?.find(
                              (p) => p.mid.toString() === e.target.value,
                            );
                            const newPlayers = [...formData.players!];
                            const newDate = new Date(date);
                            newDate.setHours(0, 0, 0, 0);
                            const gameDate = newDate.getTime();
                            newPlayers
                              .find((p) => p.mid === newPlayer?.mid)!
                              .games.push({
                                date: gameDate,
                                stage: editingStage?.name || "",
                                schedule: editingStage?.startTime
                                  ? calculateSchedule(
                                      gameDate,
                                      editingStage.startTime,
                                    )
                                  : undefined,
                                customStageValues: {},
                              });
                            setFormData((prev) => ({
                              ...prev,
                              players: newPlayers,
                            }));
                            setEditingPlayer(newPlayer);
                            setIsAddingPlayers((prev) => {
                              const newArray = [...prev];
                              newArray[index] = false;
                              return newArray;
                            });
                          }}
                          selectedKeys={["请选择选手"]}
                          required
                        >
                          {[
                            <SelectItem key="请选择选手">
                              请选择选手
                            </SelectItem>,
                          ].concat(
                            remainingPlayers?.map((player) => {
                              return (
                                <SelectItem key={player.mid}>
                                  {player.name}
                                </SelectItem>
                              );
                            }),
                          )}
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-4">正在编辑：{editingPlayer.name}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                          <div>
                            <label
                              htmlFor="gameTime"
                              className={labelClassName + " flex"}
                            >
                              比赛时间（可粘贴）
                              <span className="text-ak-red">*</span>
                              <div className="flex gap-1 ms-auto">
                                {getSuggestions("date").map((dateStr) => {
                                  return (
                                    <span
                                      className="px-1 cursor-pointer bg-[#00000033] hover:bg-[#00000055]"
                                      key={dateStr}
                                      onClick={() => {
                                        const newPlayers = [
                                          ...(formData.players || []),
                                        ];
                                        const game = newPlayers
                                          .find(
                                            (p) => p.mid === editingPlayer.mid,
                                          )!
                                          .games.find((g) =>
                                            isSameDay(g.date, date),
                                          );
                                        if (game) {
                                          const currentDate = new Date(
                                            game.date,
                                          );
                                          const [hours, minutes] = dateStr
                                            .split(":")
                                            .map(Number);
                                          const newDate = new Date(currentDate);
                                          newDate.setHours(
                                            hours,
                                            minutes,
                                            0,
                                            0,
                                          );
                                          if (!isNaN(newDate.getTime())) {
                                            game.date = newDate.getTime();
                                            // Update schedule when date changes
                                            if (editingStage?.startTime) {
                                              game.schedule = calculateSchedule(
                                                newDate.getTime(),
                                                editingStage.startTime,
                                              );
                                            }
                                            setFormData((prev) => ({
                                              ...prev,
                                              players: newPlayers,
                                            }));
                                          }
                                        }
                                      }}
                                    >
                                      {dateStr}
                                    </span>
                                  );
                                })}
                              </div>
                            </label>
                            <input
                              id="gameTime"
                              type="time"
                              name="gameTime"
                              value={(() => {
                                const game = editingPlayer.games.find((g) =>
                                  isSameDay(g.date, date),
                                );
                                if (!game) return "";
                                const gameDate = new Date(game.date);
                                return `${gameDate.getHours().toString().padStart(2, "0")}:${gameDate.getMinutes().toString().padStart(2, "0")}`;
                              })()}
                              onChange={(e) => {
                                // Check if the time string is valid
                                if (
                                  e.target.value &&
                                  /^\d{1,2}:\d{1,2}$/.test(e.target.value)
                                ) {
                                  const newPlayers = [
                                    ...(formData.players || []),
                                  ];
                                  const game = newPlayers
                                    .find((p) => p.mid === editingPlayer.mid)!
                                    .games.find((g) => isSameDay(g.date, date));
                                  if (game) {
                                    const currentDate = new Date(game.date);
                                    const [hours, minutes] = e.target.value
                                      .split(":")
                                      .map(Number);

                                    // Additional validation to ensure hours and minutes are valid numbers
                                    if (!isNaN(hours) && !isNaN(minutes)) {
                                      addToCache("date", e.target.value);
                                      // Create new date with same date but updated time
                                      const newDate = new Date(currentDate);
                                      newDate.setHours(hours, minutes, 0, 0);

                                      // Ensure the date is valid before updating
                                      if (!isNaN(newDate.getTime())) {
                                        game.date = newDate.getTime();
                                        // Update schedule when date changes
                                        if (editingStage?.startTime) {
                                          game.schedule = calculateSchedule(
                                            newDate.getTime(),
                                            editingStage.startTime,
                                          );
                                        }
                                        setFormData((prev) => ({
                                          ...prev,
                                          players: newPlayers,
                                        }));
                                      }
                                    }
                                  }
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className={getInputClassName(
                                "gameTime",
                                touchedFields,
                                { gameTime: editingGame?.date },
                                inputClassName,
                              )}
                              onPaste={(evt) => {
                                const newPlayers = [
                                  ...(formData.players || []),
                                ];
                                const game = newPlayers
                                  .find((p) => p.mid === editingPlayer.mid)!
                                  .games.find((g) => isSameDay(g.date, date));
                                const pasteData =
                                  evt.clipboardData.getData("text");
                                if (!pasteData) {
                                  return toast.warning("粘贴内容为空");
                                }
                                if (
                                  game &&
                                  pasteData &&
                                  /\d{1,2}:\d{1,2}/.test(pasteData)
                                ) {
                                  const currentDate = new Date(game.date);
                                  const [hours, minutes] =
                                    pasteData
                                      .match(/\d{1,2}:\d{1,2}/)?.[0]
                                      ?.split(":")
                                      ?.map(Number) || [];
                                  const newDate = new Date(currentDate);
                                  newDate.setHours(hours, minutes, 0, 0);
                                  // Ensure the date is valid before updating
                                  if (!isNaN(newDate.getTime())) {
                                    addToCache("date", `${hours}:${minutes}`);
                                    game.date = newDate.getTime();
                                    // Update schedule when date changes
                                    if (editingStage?.startTime) {
                                      game.schedule = calculateSchedule(
                                        newDate.getTime(),
                                        editingStage.startTime,
                                      );
                                    }
                                    setFormData((prev) => ({
                                      ...prev,
                                      players: newPlayers,
                                    }));
                                  }
                                } else {
                                  toast.warning("粘贴内容不满足HH:MM格式");
                                }
                              }}
                              onBlur={handleBlur}
                              required
                            />
                          </div>

                          <div className="relative">
                            <label
                              htmlFor="starterSquad"
                              className={labelClassName}
                            >
                              开局分队
                            </label>
                            <input
                              id="starterSquad"
                              type="text"
                              name="starterSquad"
                              value={editingGame?.starterSquad || ""}
                              placeholder="例：破坏战术分队"
                              onChange={(e) => {
                                const newPlayers = [...formData.players!];
                                const game = newPlayers
                                  .find((p) => p.mid === editingPlayer.mid)!
                                  .games.find((g) => isSameDay(g.date, date));
                                if (game) {
                                  game.starterSquad = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    players: newPlayers,
                                  }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className={getInputClassName(
                                "starterSquad",
                                touchedFields,
                                { starterSquad: editingGame?.starterSquad },
                                inputClassName,
                              )}
                              onFocus={() => setShowSuggestions("starterSquad")}
                              onBlur={(e) => {
                                handleBlur(e);
                                const currentValue = editingGame?.starterSquad;
                                if (currentValue?.trim()) {
                                  addToCache("starterSquad", currentValue);
                                }
                                setTimeout(() => setShowSuggestions(null), 200);
                              }}
                            />
                            {showSuggestions === "starterSquad" &&
                              getSuggestions("starterSquad").length > 0 && (
                                <div
                                  ref={suggestionListRef}
                                  className="absolute z-10 w-full mt-1 bg-dark-gray border border-mid-gray rounded-md shadow-lg max-h-60 overflow-y-auto"
                                >
                                  {getSuggestions("starterSquad").map(
                                    (suggestion, idx) => (
                                      <div
                                        key={idx}
                                        className="px-3 py-2 cursor-pointer hover:bg-mid-gray text-white transition-colors"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          const newPlayers = [
                                            ...formData.players!,
                                          ];
                                          const game = newPlayers
                                            .find(
                                              (p) =>
                                                p.mid === editingPlayer.mid,
                                            )!
                                            .games.find((g) =>
                                              isSameDay(g.date, date),
                                            );
                                          if (game) {
                                            game.starterSquad = suggestion;
                                            setFormData((prev) => ({
                                              ...prev,
                                              players: newPlayers,
                                            }));
                                          }
                                          setShowSuggestions(null);
                                        }}
                                      >
                                        {suggestion}
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="relative">
                            <label
                              htmlFor="starterOp"
                              className={labelClassName}
                            >
                              开局干员
                            </label>
                            <input
                              id="starterOp"
                              type="text"
                              name="starterOp"
                              value={editingGame?.starterOp || ""}
                              placeholder="例：维什戴尔/三星队"
                              onChange={(e) => {
                                const newPlayers = [...formData.players!];
                                const game = newPlayers
                                  .find((p) => p.mid === editingPlayer.mid)!
                                  .games.find((g) => isSameDay(g.date, date));
                                if (game) {
                                  game.starterOp = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    players: newPlayers,
                                  }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className={getInputClassName(
                                "starterOp",
                                touchedFields,
                                { starterOp: editingGame?.starterOp },
                                inputClassName,
                              )}
                              onFocus={() => setShowSuggestions("starterOp")}
                              onBlur={(e) => {
                                handleBlur(e);
                                const currentValue = editingGame?.starterOp;
                                if (currentValue?.trim()) {
                                  addToCache("starterOp", currentValue);
                                }
                                setTimeout(() => setShowSuggestions(null), 200);
                              }}
                            />
                            {showSuggestions === "starterOp" &&
                              getSuggestions("starterOp").length > 0 && (
                                <div
                                  ref={suggestionListRef}
                                  className="absolute z-10 w-full mt-1 bg-dark-gray border border-mid-gray rounded-md shadow-lg max-h-60 overflow-y-auto"
                                >
                                  {getSuggestions("starterOp").map(
                                    (suggestion, idx) => (
                                      <div
                                        key={idx}
                                        className="px-3 py-2 cursor-pointer hover:bg-mid-gray text-white transition-colors"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          const newPlayers = [
                                            ...formData.players!,
                                          ];
                                          const game = newPlayers
                                            .find(
                                              (p) =>
                                                p.mid === editingPlayer.mid,
                                            )!
                                            .games.find((g) =>
                                              isSameDay(g.date, date),
                                            );
                                          if (game) {
                                            game.starterOp = suggestion;
                                            setFormData((prev) => ({
                                              ...prev,
                                              players: newPlayers,
                                            }));
                                          }
                                          setShowSuggestions(null);
                                        }}
                                      >
                                        {suggestion}
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>

                          <div>
                            <label htmlFor="point" className={labelClassName}>
                              分数
                            </label>
                            <input
                              id="point"
                              type="number"
                              name="point"
                              value={editingGame?.point || ""}
                              onChange={(e) => {
                                const newPlayers = [...formData.players!];
                                const game = newPlayers
                                  .find((p) => p.mid === editingPlayer.mid)!
                                  .games.find((g) => isSameDay(g.date, date));
                                if (game) {
                                  game.point = e.target.value
                                    ? Number(e.target.value)
                                    : undefined;
                                  setFormData((prev) => ({
                                    ...prev,
                                    players: newPlayers,
                                  }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className={getInputClassName(
                                "point",
                                touchedFields,
                                { point: editingGame?.point },
                                inputClassName,
                              )}
                              onBlur={handleBlur}
                            />
                          </div>

                          {formData.type === "team" && editingPlayerTeam && (
                            <div>
                              <label
                                htmlFor="teamTotalPoints"
                                className={labelWithTooltipClassName}
                              >
                                <span className="text-ak-blue">
                                  {editingPlayerTeam.name}
                                </span>
                                &nbsp;队伍总分
                                <Tooltip
                                  content="根据已有数据自动计算得出"
                                  className="bg-light-mid-gray text-black"
                                >
                                  <span className="px-1">
                                    <InformationIcon
                                      width="0.75rem"
                                      height="0.75rem"
                                    />
                                  </span>
                                </Tooltip>
                              </label>
                              <input
                                id="teamTotalPoints"
                                type="number"
                                name="teamTotalPoints"
                                value={(() => {
                                  // Calculate sum of points for all players in the same team
                                  const teamPoints = formData.players
                                    ?.filter((player) =>
                                      editingPlayerTeam.members.includes(
                                        player.name,
                                      ),
                                    )
                                    .flatMap((player) => player.games)
                                    .filter(
                                      (game) =>
                                        game.stage === editingStage?.name &&
                                        game.point !== undefined,
                                    )
                                    .reduce(
                                      (sum, game) => sum + (game.point || 0),
                                      0,
                                    );

                                  return teamPoints || "";
                                })()}
                                className={`${inputClassName} text-ak-blue cursor-not-allowed`}
                                readOnly
                                disabled
                              />
                            </div>
                          )}

                          {editingStage?.type === "1on1" && (
                            <>
                              <div>
                                <label
                                  htmlFor="rival"
                                  className={labelClassName}
                                >
                                  对手
                                </label>
                                <Select
                                  id="rival"
                                  name="rival"
                                  selectedKeys={
                                    editingGame?.rivalMid
                                      ? [editingGame?.rivalMid.toString()]
                                      : [""]
                                  }
                                  onChange={(e) => {
                                    const rivalMid = e.target.value;
                                    const newPlayers = [
                                      ...(formData.players || []),
                                    ];

                                    // Find the current player's game
                                    const playerIndex = newPlayers.findIndex(
                                      (p) => p.mid === editingPlayer.mid,
                                    );
                                    const gameIndex = newPlayers[
                                      playerIndex
                                    ].games.findIndex(
                                      (g) => g.stage === editingStage.name,
                                    );

                                    if (gameIndex !== -1) {
                                      // Check if there was a previous rival and clear that relationship
                                      const previousRivalMid =
                                        newPlayers[playerIndex].games[
                                          gameIndex
                                        ].rivalMid?.toString();
                                      if (previousRivalMid) {
                                        const previousRivalIndex =
                                          newPlayers.findIndex(
                                            (p) =>
                                              p.mid.toString() ===
                                              previousRivalMid,
                                          );
                                        if (previousRivalIndex !== -1) {
                                          const previousRivalGameIndex =
                                            newPlayers[
                                              previousRivalIndex
                                            ].games.findIndex(
                                              (g) =>
                                                g.stage === editingStage.name,
                                            );
                                          if (previousRivalGameIndex !== -1) {
                                            // Clear the previous rival's rivalMid and result
                                            newPlayers[
                                              previousRivalIndex
                                            ].games[
                                              previousRivalGameIndex
                                            ].rivalMid = undefined;
                                            newPlayers[
                                              previousRivalIndex
                                            ].games[
                                              previousRivalGameIndex
                                            ].result = undefined;
                                          }
                                        }
                                      }

                                      // Update current player's rivalMid and clear result when changing rivals
                                      newPlayers[playerIndex].games[
                                        gameIndex
                                      ].rivalMid = rivalMid;
                                      newPlayers[playerIndex].games[
                                        gameIndex
                                      ].result = !!rivalMid ? "win" : undefined;

                                      // Find the rival player and update their rivalMid to point to current player
                                      const rivalIndex = newPlayers.findIndex(
                                        (p) => p.mid.toString() === rivalMid,
                                      );

                                      if (rivalIndex !== -1) {
                                        const rivalGameIndex = newPlayers[
                                          rivalIndex
                                        ].games.findIndex(
                                          (g) => g.stage === editingStage.name,
                                        );

                                        if (rivalGameIndex !== -1) {
                                          newPlayers[rivalIndex].games[
                                            rivalGameIndex
                                          ].rivalMid =
                                            editingPlayer.mid.toString();
                                          newPlayers[rivalIndex].games[
                                            rivalGameIndex
                                          ].result = "lose";
                                        } else {
                                          // Create a new game for the rival if it doesn't exist
                                          const newDate = new Date(date);
                                          newDate.setHours(0, 0, 0, 0);
                                          const gameDate = newDate.getTime();
                                          newPlayers[rivalIndex].games.push({
                                            date: gameDate,
                                            stage: editingStage?.name || "",
                                            schedule: editingStage?.startTime
                                              ? calculateSchedule(
                                                  gameDate,
                                                  editingStage.startTime,
                                                )
                                              : undefined,
                                            rivalMid:
                                              editingPlayer.mid.toString(),
                                            result: "lose",
                                            customStageValues: {},
                                          });
                                        }
                                      }

                                      setFormData((prev) => ({
                                        ...prev,
                                        players: newPlayers,
                                      }));
                                    }
                                  }}
                                  classNames={selectClassName}
                                  aria-label="选择对手"
                                >
                                  <SelectItem key="">请选择对手</SelectItem>
                                  {players && editingPlayer ? (
                                    <>
                                      {players
                                        .filter(
                                          (player) =>
                                            player.mid !== editingPlayer.mid &&
                                            !player.games.find(
                                              (g) =>
                                                g.stage === editingStage.name &&
                                                g.rivalMid &&
                                                g.rivalMid.toString() !==
                                                  editingPlayer.mid.toString(),
                                            ),
                                        )
                                        .map((player) => (
                                          <SelectItem key={player.mid}>
                                            {player.name}
                                          </SelectItem>
                                        ))}
                                    </>
                                  ) : null}
                                </Select>
                              </div>

                              {editingGame?.rivalMid && (
                                <div>
                                  <label
                                    htmlFor="result"
                                    className={labelClassName}
                                  >
                                    比赛结果
                                  </label>
                                  <Select
                                    id="result"
                                    name="result"
                                    selectedKeys={[
                                      editingGame?.result || "win",
                                    ]}
                                    onChange={(e) => {
                                      const result = e.target.value as
                                        | "win"
                                        | "lose";
                                      const newPlayers = [
                                        ...(formData.players || []),
                                      ];

                                      // Find the current player's game
                                      const playerIndex = newPlayers.findIndex(
                                        (p) => p.mid === editingPlayer.mid,
                                      );
                                      const gameIndex = newPlayers[
                                        playerIndex
                                      ].games.findIndex(
                                        (g) => g.stage === editingStage.name,
                                      );

                                      if (gameIndex !== -1) {
                                        // Update current player's result
                                        newPlayers[playerIndex].games[
                                          gameIndex
                                        ].result = result;

                                        // Find the rival player and update their result to the opposite
                                        const rivalMid =
                                          newPlayers[playerIndex].games[
                                            gameIndex
                                          ].rivalMid;
                                        const rivalIndex = newPlayers.findIndex(
                                          (p) =>
                                            p.mid.toString() ===
                                            rivalMid?.toString(),
                                        );

                                        if (rivalIndex !== -1) {
                                          const rivalGameIndex = newPlayers[
                                            rivalIndex
                                          ].games.findIndex(
                                            (g) =>
                                              g.stage === editingStage.name,
                                          );

                                          if (rivalGameIndex !== -1) {
                                            // Set opposite result for rival
                                            newPlayers[rivalIndex].games[
                                              rivalGameIndex
                                            ].result =
                                              result === "win" ? "lose" : "win";
                                          }
                                        }

                                        setFormData((prev) => ({
                                          ...prev,
                                          players: newPlayers,
                                        }));
                                      }
                                    }}
                                    classNames={selectClassName}
                                    aria-label="选择比赛结果"
                                  >
                                    <SelectItem key="win">胜利</SelectItem>
                                    <SelectItem key="lose">失败</SelectItem>
                                  </Select>
                                </div>
                              )}
                            </>
                          )}

                          {/* 自定义阶段信息值 */}
                          {editingStage?.customStageKeys &&
                            Object.entries(editingStage.customStageKeys).map(
                              ([key, value]) => (
                                <div key={key} className="relative">
                                  <label
                                    htmlFor={`customStageValue-${key}`}
                                    className={labelClassName}
                                  >
                                    {value}
                                  </label>
                                  <input
                                    id={`customStageValue-${key}`}
                                    type="text"
                                    value={
                                      editingGame?.customStageValues?.[key] ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const newPlayers = [...formData.players!];
                                      const game = newPlayers
                                        .find(
                                          (p) => p.mid === editingPlayer.mid,
                                        )!
                                        .games.find((g) =>
                                          isSameDay(g.date, date),
                                        );
                                      if (game) {
                                        game.customStageValues = {
                                          ...game.customStageValues,
                                          [key]: e.target.value,
                                        };
                                        setFormData((prev) => ({
                                          ...prev,
                                          players: newPlayers,
                                        }));
                                      }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    className={getInputClassName(
                                      `customStageValue-${key}`,
                                      touchedFields,
                                      {
                                        [`customStageValue-${key}`]:
                                          editingGame?.customStageValues?.[key],
                                      },
                                      inputClassName,
                                    )}
                                    onFocus={() =>
                                      setShowSuggestions(
                                        `customStageValue-${key}`,
                                      )
                                    }
                                    onBlur={(e) => {
                                      handleBlur(e);
                                      const currentValue =
                                        editingGame?.customStageValues?.[key];
                                      if (currentValue?.trim()) {
                                        addToCache(
                                          `customStageValue-${key}`,
                                          currentValue,
                                        );
                                      }
                                      setTimeout(
                                        () => setShowSuggestions(null),
                                        200,
                                      );
                                    }}
                                    maxLength={32}
                                  />
                                  {showSuggestions ===
                                    `customStageValue-${key}` &&
                                    getSuggestions(`customStageValue-${key}`)
                                      .length > 0 && (
                                      <div
                                        ref={suggestionListRef}
                                        className="absolute z-10 w-full mt-1 bg-dark-gray border border-mid-gray rounded-md shadow-lg max-h-60 overflow-y-auto"
                                      >
                                        {getSuggestions(
                                          `customStageValue-${key}`,
                                        ).map((suggestion, idx) => (
                                          <div
                                            key={idx}
                                            className="px-3 py-2 cursor-pointer hover:bg-mid-gray text-white transition-colors"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const newPlayers = [
                                                ...formData.players!,
                                              ];
                                              const game = newPlayers
                                                .find(
                                                  (p) =>
                                                    p.mid === editingPlayer.mid,
                                                )!
                                                .games.find((g) =>
                                                  isSameDay(g.date, date),
                                                );
                                              if (game) {
                                                game.customStageValues = {
                                                  ...game.customStageValues,
                                                  [key]: suggestion,
                                                };
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  players: newPlayers,
                                                }));
                                              }
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
                        <div className="mb-4 relative">
                          <label htmlFor="ending" className={labelClassName}>
                            结局
                          </label>
                          <input
                            id="ending"
                            name="ending"
                            value={editingGame?.ending || ""}
                            placeholder="例：通关【朝谒】【授法】【不容拒绝】"
                            onChange={(e) => {
                              const newPlayers = [...formData.players!];
                              const game = newPlayers
                                .find((p) => p.mid === editingPlayer.mid)!
                                .games.find((g) => isSameDay(g.date, date));
                              if (game) {
                                game.ending = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  players: newPlayers,
                                }));
                              }
                            }}
                            onKeyDown={handleKeyDown}
                            className={inputClassName}
                            onFocus={() => setShowSuggestions("ending")}
                            onBlur={(e) => {
                              const currentValue = editingGame?.ending;
                              if (currentValue?.trim()) {
                                addToCache("ending", currentValue);
                              }
                              setTimeout(() => setShowSuggestions(null), 200);
                            }}
                          />
                          {showSuggestions === "ending" &&
                            getSuggestions("ending").length > 0 && (
                              <div
                                ref={suggestionListRef}
                                className="absolute z-10 w-full mt-1 bg-dark-gray border border-mid-gray rounded-md shadow-lg max-h-60 overflow-y-auto"
                              >
                                {getSuggestions("ending").map(
                                  (suggestion, idx) => (
                                    <div
                                      key={idx}
                                      className="px-3 py-2 cursor-pointer hover:bg-mid-gray text-white transition-colors"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        const newPlayers = [
                                          ...formData.players!,
                                        ];
                                        const game = newPlayers
                                          .find(
                                            (p) => p.mid === editingPlayer.mid,
                                          )!
                                          .games.find((g) =>
                                            isSameDay(g.date, date),
                                          );
                                        if (game) {
                                          game.ending = suggestion;
                                          setFormData((prev) => ({
                                            ...prev,
                                            players: newPlayers,
                                          }));
                                        }
                                        setShowSuggestions(null);
                                      }}
                                    >
                                      {suggestion}
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </>
  );
}
