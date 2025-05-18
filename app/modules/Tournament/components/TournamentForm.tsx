import { useState } from "react";
import { _post } from "~/utils/tools";
import { toast } from "react-toastify";
import type { TournamentData, TournamentPlayer } from "~/types/tournamentsData";
import { useNavigate } from "react-router";
import { LinkIcon, CloseIcon } from "~/components/Icons";
import { Accordion, AccordionItem } from "@heroui/react";

export default function TournamentForm({
  edit = false,
  tournamentData,
}: {
  edit?: boolean;
  tournamentData?: TournamentData;
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TournamentData>(
    tournamentData
      ? { ...tournamentData }
      : {
          id: "",
          name: "",
          seasons: [],
          avatar: "",
          rogue: "",
          edition: "",
          type: "individual",
          memberAlias: "",
          keyMemberAlias: "",
          startTime: Date.now(),
          level: "",
          labels: [],
          rule: "",
          organizerMid: "",
          organizerName: "",
          room: "",
          stages: [],
        },
  );
  const [editingPlayer, setEditingPlayer] = useState<
    TournamentPlayer | undefined
  >(formData.players?.[0]);

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

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof TournamentData,
  ) => {
    const { value } = e.target;
    const arrayValue = value.split(/[,，]+/).map((item) => item.trim());
    setFormData((prev) => ({
      ...prev,
      [field]: arrayValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the updated data to your API
      // await _post("/tournament/update", { tournament: formData });
      toast.success("已成功保存");
    } catch (error) {
      toast.error(`保存失败: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="">
      <Accordion
        className="px-0"
        defaultExpandedKeys={["赛事信息"]}
        itemClasses={{
          base: "bg-dark-gray",
          title: "text-xl",
          indicator: "text-ak-blue",
        }}
        selectionMode="multiple"
        variant="splitted"
      >
        <AccordionItem key="赛事信息" aria-label="赛事信息" title="赛事信息">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
            <div>
              <label className="block text-sm font-light mb-1">
                赛事名称 <span className="text-ak-red">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-1">
                赛事类型 <span className="text-ak-red">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
                required
              >
                <option value="individual">个人赛</option>
                <option value="team">团队赛</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-light mb-1">赛事图标</label>
              <input
                type="text"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-1">
                肉鸽 <span className="text-ak-red">*</span>
              </label>
              <input
                type="text"
                name="rogue"
                value={formData.rogue}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-1">
                肉鸽版本 <span className="text-ak-red">*</span>
              </label>
              <input
                type="text"
                name="edition"
                value={formData.edition}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
                placeholder="N18"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-1">
                肉鸽难度 <span className="text-ak-red">*</span>
              </label>
              <input
                type="text"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-1">
                主办方 <span className="text-ak-red">*</span>
              </label>
              <input
                type="text"
                name="organizerName"
                value={formData.organizerName}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-1">
                直播间 <span className="text-ak-red">*</span>
              </label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="w-full px-3 py-2 focus:outline-ak-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-light mb-1">
                标签 (用逗号隔开)
              </label>
              <input
                type="text"
                name="labels"
                value={formData.labels.join(", ")}
                onChange={(e) => handleArrayChange(e, "labels")}
                className="w-full px-3 py-2 focus:outline-ak-blue"
              />
            </div>

            {formData.type === "team" && (
              <div>
                <label className="block text-sm font-light mb-1">
                  Member Alias
                </label>
                <input
                  type="text"
                  name="memberAlias"
                  value={formData.memberAlias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 focus:outline-ak-blue"
                />
              </div>
            )}

            {formData.type === "team" && (
              <div>
                <label className="block text-sm font-light mb-1">
                  Key Member Alias
                </label>
                <input
                  type="text"
                  name="keyMemberAlias"
                  value={formData.keyMemberAlias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 focus:outline-ak-blue"
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-light mb-1">规则</label>
            <textarea
              name="rule"
              value={formData.rule}
              onChange={handleChange}
              className="w-full px-3 py-2 focus:outline-ak-blue"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-light mb-1">详细规则</label>
            <textarea
              name="detailRule"
              value={formData.detailRule}
              onChange={handleChange}
              className="w-full px-3 py-2 focus:outline-ak-blue"
              rows={4}
            />
          </div>
        </AccordionItem>

        <AccordionItem key="赛事阶段" aria-label="赛事阶段" title="赛事阶段">
          {formData.stages.length > 0 && (
            <div className="mb-4">
              {formData.stages.map((stage, index) => (
                <div
                  key={index}
                  className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div>
                      <label className="block text-sm font-light mb-1">
                        阶段名称 <span className="text-ak-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => {
                          const newStages = [...formData.stages];
                          newStages[index].name = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            stages: newStages,
                          }));
                        }}
                        className="w-full px-3 py-2 focus:outline-ak-blue"
                        required
                      />
                    </div>
                    {/* <div>
                      <label className="block text-sm font-light mb-1">类型 <span className="text-ak-red">*</span></label>
                      <select
                        value={stage.type}
                        onChange={(e) => {
                          const newStages = [...formData.stages];
                          newStages[index].type = e.target.value as "rank" | "1on1";
                          setFormData((prev) => ({ ...prev, stages: newStages }));
                        }}
                        className="w-full px-3 py-2 focus:outline-ak-blue"
                        required
                      >
                        <option value="rank">排名赛</option>
                        <option value="1on1">1对1</option>
                      </select>
                    </div> */}
                    <div>
                      <label className="block text-sm font-light mb-1">
                        开始时间 <span className="text-ak-red">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={new Date(stage.startTime)
                          .toLocaleDateString()
                          .slice(0, 16)}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          const newStages = [...formData.stages];
                          newStages[index].startTime = date.getTime();
                          setFormData((prev) => ({
                            ...prev,
                            stages: newStages,
                          }));
                        }}
                        className="w-full px-3 py-2 focus:outline-ak-blue"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-light mb-1">
                        结束时间 <span className="text-ak-red">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={new Date(stage.endTime)
                          .toLocaleDateString()
                          .slice(0, 16)}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          const newStages = [...formData.stages];
                          newStages[index].endTime = date.getTime();
                          setFormData((prev) => ({
                            ...prev,
                            stages: newStages,
                          }));
                        }}
                        className="w-full px-3 py-2 focus:outline-ak-blue"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const newStages = formData.stages.filter(
                          (_, i) => i !== index,
                        );
                        setFormData((prev) => ({ ...prev, stages: newStages }));
                      }}
                      className="rounded-md p-2 bg-ak-dark-red hover:bg-ak-red"
                    >
                      <CloseIcon width="0.7rem" height="0.7rem" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const now = Date.now();
              const newStage = {
                name: "新阶段",
                startTime: now,
                endTime: now + 86400000, // +1 day
                type: "rank" as const,
              };
              setFormData((prev) => ({
                ...prev,
                stages: [...prev.stages, newStage],
              }));
            }}
            className="w-full px-4 py-2 mb-2 text-ak-blue rounded-md hover:bg-mid-gray"
          >
            + 添加阶段
          </button>
        </AccordionItem>

        {formData.type === "team" ? (
          <AccordionItem key="参赛队伍" aria-label="参赛队伍" title="参赛队伍">
            {formData.teams && formData.teams.length > 0 && (
              <div className="mb-4">
                {formData.teams.map((team, index) => (
                  <div
                    key={index}
                    className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div>
                        <label className="block text-sm font-light mb-1">
                          队伍名称 <span className="text-ak-red">*</span>
                        </label>
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].name = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              teams: newTeams,
                            }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">
                          队伍ID
                        </label>
                        <input
                          type="text"
                          value={team.id}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].id = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              teams: newTeams,
                            }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">
                          队伍头像
                        </label>
                        <input
                          type="text"
                          value={team.avatar}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].avatar = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              teams: newTeams,
                            }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">
                          队长
                        </label>
                        <input
                          type="text"
                          value={team.leader}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].leader = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              teams: newTeams,
                            }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">
                          核心成员
                        </label>
                        <input
                          type="text"
                          value={team.keyMember}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].keyMember = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              teams: newTeams,
                            }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">
                          成员 (用逗号隔开)
                        </label>
                        <input
                          type="text"
                          value={team.members.join(", ")}
                          onChange={(e) => {
                            const members = e.target.value
                              .split(/[,，]+/)
                              .map((m) => m.trim());
                            const newTeams = [...formData.teams!];
                            newTeams[index].members = members;
                            setFormData((prev) => ({
                              ...prev,
                              teams: newTeams,
                            }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">
                          最终排名
                        </label>
                        <input
                          type="number"
                          value={team.finalRank || ""}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].finalRank = e.target.value
                              ? parseInt(e.target.value)
                              : undefined;
                            setFormData((prev) => ({
                              ...prev,
                              teams: newTeams,
                            }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const newTeams = formData.teams!.filter(
                            (_, i) => i !== index,
                          );
                          setFormData((prev) => ({ ...prev, teams: newTeams }));
                        }}
                        className="rounded-md p-2 bg-ak-dark-red hover:bg-ak-red"
                      >
                        <CloseIcon width="0.7rem" height="0.7rem" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                const newTeam = {
                  name: "新队伍",
                  avatar: "",
                  members: [],
                  leader: "",
                  keyMember: "",
                  stages: [],
                };
                setFormData((prev) => ({
                  ...prev,
                  teams: [...(prev.teams || []), newTeam],
                }));
              }}
              className="w-full px-4 py-2 mb-2 text-ak-blue rounded-md hover:bg-mid-gray"
            >
              + 添加队伍
            </button>
          </AccordionItem>
        ) : (
          <></>
        )}

        <AccordionItem key="参赛选手" aria-label="参赛选手" title="参赛选手">
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {formData.players && formData.players.length > 0 && formData.players.map((player, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 ${(!player.name || player.name === "请填写选手名字！") ? "bg-ak-dark-red" : "bg-mid-gray"} text-white  rounded-md`}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      editingPlayer === player ? setEditingPlayer(undefined) : setEditingPlayer(player);
                    }}
                  >
                    {player.name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (player === editingPlayer)
                        setEditingPlayer(undefined);
                      const newPlayers = formData.players!.filter(
                        (_, i) => i !== index,
                      );
                      setFormData((prev) => ({
                        ...prev,
                        players: newPlayers,
                      }));
                    }}
                    className="ml-1 rounded-md p-1 hover:bg-ak-red"
                  >
                    <CloseIcon width="0.7rem" height="0.7rem" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newPlayer = {
                    mid: "invalid",
                    name: "请填写选手名字！",
                    face: "",
                    games: [],
                  };
                  setFormData((prev) => ({
                    ...prev,
                    players: [...(prev.players || []), newPlayer],
                  }));
                }}
                className="px-2 py-1 text-ak-blue bg-mid-gray hover:text-black hover:bg-ak-blue rounded-md "
              >
                + 添加选手
              </button>
            </div>
          </div>
          {editingPlayer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-t-1 border-t-mid-gray pt-2 mb-2">
              <div className="w-full">
                <label className="block text-sm font-light mb-1">
                  选手名字 <span className="text-ak-red">*</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingPlayer.name}
                    placeholder="选手名字"
                    onChange={(e) => {
                      const newPlayers = [...formData.players!];
                      newPlayers.find((p) => p === editingPlayer)!.name =
                        e.target.value;
                      setFormData((prev) => ({ ...prev, players: newPlayers }));
                    }}
                    className="px-3 py-2 focus:outline-ak-blue grow"
                    maxLength={32}
                    required
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      // call bilibili API
                    }}
                    className="rounded-md px-2 text-black bg-ak-blue inline-flex items-center gap-1 h-6"
                  >
                    <LinkIcon /> 连接bilibili
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-light mb-1">
                  选手预览
                </label>
                <div>
                  <p>这里放bilibili头像😊</p>
                </div>
              </div>
            </div>
          )}
        </AccordionItem>

        <AccordionItem key="比赛进程" aria-label="比赛进程" title="比赛进程">
          再说吧😅
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-md text-black bg-light-gray"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-black bg-ak-blue"
          disabled={isSubmitting}
        >
          {isSubmitting ? "保存中..." : edit ? "保存" : "新建"}
        </button>
      </div>
    </form>
  );
}
