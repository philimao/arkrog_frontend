import { Select, SelectItem } from "@heroui/react";
import type { TournamentData, TournamentPlayer, TournamentStage } from "~/types/tournamentsData";
import { generateDateArray } from "~/utils/date";
import { useEffect, useState } from "react";
import { CloseIcon } from "~/components/Icons";
import { inputClassName } from ".";

interface TournamentProgressAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  editingStage: TournamentStage | undefined;
  setEditingStage: React.Dispatch<React.SetStateAction<TournamentStage | undefined>>;
}

export default function TournamentProgressAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
  editingStage,
  setEditingStage,
}: TournamentProgressAccordionItemProps) {
  if (formData.stages.length === 0) {
    return <div className="mb-4 text-ak-red">请先添加赛事阶段</div>;
  }

  if (!formData.players || formData.players?.filter((player) => player.name).length === 0) {
    return <div className="mb-4 text-ak-red">请先添加参赛选手</div>;
  }

  const dates = generateDateArray(editingStage?.startTime || 0, editingStage?.endTime || 0);
  const players = formData.players?.filter((player) => player.games.find((game) => game.stage === editingStage?.name));
  const remainingPlayers = formData.players?.filter((player) => player.name && !players?.includes(player));
  const [editingPlayer, setEditingPlayer] = useState<TournamentPlayer | undefined>(undefined);
  const [isAddingPlayers, setIsAddingPlayers] = useState<boolean[]>([]);

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
        <div>
          <label htmlFor="stage" className="block text-sm font-light mb-1">编辑赛事阶段</label>
          <Select
            id="stage"
            name="stage"
            selectedKeys={[formData.stages?.find((stage) => stage.name === editingStage?.name)?.name ?? '']}
            onChange={(e) => {
              setEditingStage(formData.stages?.find((stage) => stage.name === e.target.value));
            }}
            classNames={{
              trigger: "bg-mid-gray rounded-none",
              value: "",
              popoverContent: "bg-mid-gray rounded-none",
              listbox: "rounded-none",
            }}
            aria-label="编辑赛事阶段"
            required
          >
            {formData.stages?.map((stage) => {
              return (
                <SelectItem key={stage.name} value={stage.name}>
                  {stage.name}
                </SelectItem>
              );
            })}
          </Select>
        </div>
      </div>
      {dates.map((date, index) => {
        const playersForDate = formData.players?.filter((player) =>
          player.games.find((game) => new Date(game.date).getDate() === date.getDate()),
        );
        const editingGame = editingPlayer?.games.find((game) => new Date(game.date).getDate() === date.getDate());
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
                          setEditingPlayer(editingPlayer?.mid === player.mid ? undefined : player);
                        }}
                      >
                        <div
                          className={`w-16 h-16 aspect-square flex items-center justify-center ${editingPlayer?.mid === player.mid ? "bg-mid-gray text-white" : "bg-light-gray text-black"}`}
                        >
                          {player.face ? (
                            <img src={player.face} alt="avatar" referrerPolicy="no-referrer" crossOrigin="anonymous" />
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
                            const newPlayers = [...formData.players!];
                            newPlayers.find((p) => p === player)!.games = newPlayers
                              .find((p) => p === player)!
                              .games.filter((g) => new Date(g.date).getDate() !== date.getDate());
                            setFormData((prev) => ({ ...prev, players: newPlayers }));
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
                        setEditingPlayer(editingPlayer?.mid === tempNewPlayer.mid ? undefined : tempNewPlayer);
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
                  (isAddingPlayers[index] && editingPlayer.mid === tempNewPlayer.mid)) && (
                  <div className="bg-mid-gray text-white mt-4 p-2 rounded-md">
                    {editingPlayer.mid === tempNewPlayer.mid ? (
                      <div>
                        <label htmlFor="editingPlayer" className="">
                          <span className="text-ak-red">*</span> 请选择选手：
                        </label>
                        <Select
                          id="editingPlayer"
                          name="editingPlayer"
                          classNames={{
                            trigger: "bg-mid-gray rounded-none",
                            value: "",
                            popoverContent: "bg-mid-gray rounded-none",
                            listbox: "rounded-none",
                          }}
                          aria-label="选择选手"
                          onChange={(e) => {
                            const newPlayer = formData.players?.find((p) => p.mid.toString() === e.target.value);
                            const newPlayers = [...formData.players!];
                            const newDate = new Date(date);
                            newDate.setHours(0, 0, 0, 0);
                            newPlayers
                              .find((p) => p.mid === newPlayer?.mid)!
                              .games.push({
                                date: newDate.getTime(),
                                stage: editingStage?.name || "",
                                customStageValues: {},
                              });
                            setFormData((prev) => ({ ...prev, players: newPlayers }));
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
                          {[<SelectItem key="请选择选手" value="请选择选手" aria-disabled>
                            请选择选手
                          </SelectItem>
                          ].concat(remainingPlayers?.map((player) => {
                            return (
                              <SelectItem key={player.mid} value={player.mid}>
                                {player.name}
                              </SelectItem>
                            );
                          }))}
                        </Select>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-4">正在编辑：{editingPlayer.name}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
                          <div>
                            <label htmlFor="gameTime" className="block text-sm font-light mb-1">
                              比赛时间 <span className="text-ak-red">*</span>
                            </label>
                            <input
                              id="gameTime"
                              type="time"
                              name="gameTime"
                              value={(() => {
                                const game = editingPlayer.games.find(
                                  (g) => new Date(g.date).getDate() === date.getDate(),
                                );
                                if (!game) return "";
                                const gameDate = new Date(game.date);
                                return `${gameDate.getHours().toString().padStart(2, "0")}:${gameDate.getMinutes().toString().padStart(2, "0")}`;
                              })()}
                              onChange={(e) => {
                                const newPlayers = [...formData.players!];
                                const game = newPlayers
                                  .find((p) => p.mid === editingPlayer.mid)!
                                  .games.find((g) => new Date(g.date).getDate() === date.getDate());
                                if (game) {
                                  const currentDate = new Date(game.date);
                                  const [hours, minutes] = e.target.value.split(":").map(Number);

                                  // Create new date with same date but updated time
                                  const newDate = new Date(currentDate);
                                  newDate.setHours(hours, minutes, 0, 0);

                                  game.date = newDate.getTime();
                                  setFormData((prev) => ({ ...prev, players: newPlayers }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className="bg-[#00000033] w-full p-2 focus:outline-ak-blue"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="starterSquad" className="block text-sm font-light mb-1">开局分队</label>
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
                                  .games.find((g) => new Date(g.date).getDate() === date.getDate());
                                if (game) {
                                  game.starterSquad = e.target.value;
                                  setFormData((prev) => ({ ...prev, players: newPlayers }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className="bg-[#00000033] w-full p-2 focus:outline-ak-blue"
                            />
                          </div>

                          <div>
                            <label htmlFor="starterOp" className="block text-sm font-light mb-1">开局干员</label>
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
                                  .games.find((g) => new Date(g.date).getDate() === date.getDate());
                                if (game) {
                                  game.starterOp = e.target.value;
                                  setFormData((prev) => ({ ...prev, players: newPlayers }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className="bg-[#00000033] w-full p-2 focus:outline-ak-blue"
                            />
                          </div>

                          <div>
                            <label htmlFor="point" className="block text-sm font-light mb-1">分数</label>
                            <input
                              id="point"
                              type="number"
                              name="point"
                              value={editingGame?.point || ""}
                              onChange={(e) => {
                                const newPlayers = [...formData.players!];
                                const game = newPlayers
                                  .find((p) => p.mid === editingPlayer.mid)!
                                  .games.find((g) => new Date(g.date).getDate() === date.getDate());
                                if (game) {
                                  game.point = e.target.value ? Number(e.target.value) : undefined;
                                  setFormData((prev) => ({ ...prev, players: newPlayers }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className="bg-[#00000033] w-full p-2 focus:outline-ak-blue"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="ending" className="block text-sm font-light mb-1">结局</label>
                          <input
                            id="ending"
                            name="ending"
                            value={editingGame?.ending || ""}
                            placeholder="例：通关【朝谒】【授法】【不容拒绝】"
                            onChange={(e) => {
                              const newPlayers = [...formData.players!];
                              const game = newPlayers
                                .find((p) => p.mid === editingPlayer.mid)!
                                .games.find((g) => new Date(g.date).getDate() === date.getDate());
                              if (game) {
                                game.ending = e.target.value;
                                setFormData((prev) => ({ ...prev, players: newPlayers }));
                              }
                            }}
                            onKeyDown={handleKeyDown}
                            className="bg-[#00000033] w-full p-2 focus:outline-ak-blue"
                          />
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
