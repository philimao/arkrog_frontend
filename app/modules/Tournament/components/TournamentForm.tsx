import { useState } from "react";
import { _post } from "~/utils/tools";
import { toast } from "react-toastify";
import type { TournamentData } from "~/types/tournamentsData";
import { useNavigate } from "react-router";
import { ModalCloseIcon } from "~/components/Icons";
import { StyledDivider } from "./Shared";

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
    tournamentData ? { ...tournamentData } : {
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
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof TournamentData
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
      {/* Tournament Detail */}
      <h2 className="text-xl mb-2">赛事信息</h2>
      <div className="bg-black-gray-70 p-1 grid gap-4 p-4 mb-2">
        <div className="grid grid-cols-[repeat(auto-fit,_minmax(300px,_1fr))] gap-4">
          <div>
            <label className="block text-sm font-light mb-1">赛事名称 <span className="text-ak-red">*</span></label>
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
            <label className="block text-sm font-light mb-1">赛事类型 <span className="text-ak-red">*</span></label>
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
            <label className="block text-sm font-light mb-1">肉鸽 <span className="text-ak-red">*</span></label>
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
            <label className="block text-sm font-light mb-1">肉鸽版本 <span className="text-ak-red">*</span></label>
            <input
              type="text"
              name="edition"
              value={formData.edition}
              onChange={handleChange}
              className="w-full px-3 py-2 focus:outline-ak-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-light mb-1">肉鸽难度 <span className="text-ak-red">*</span></label>
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
            <label className="block text-sm font-light mb-1">主办方 <span className="text-ak-red">*</span></label>
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
            <label className="block text-sm font-light mb-1">直播间 <span className="text-ak-red">*</span></label>
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
            <label className="block text-sm font-light mb-1">标签 (用逗号隔开)</label>
            <input
              type="text"
              name="labels"
              value={formData.labels.join(", ")}
              onChange={(e) => handleArrayChange(e, "labels")}
              className="w-full px-3 py-2 focus:outline-ak-blue"
            />
          </div>

          {formData.type === "team" && <div>
            <label className="block text-sm font-light mb-1">Member Alias</label>
            <input
              type="text"
              name="memberAlias"
              value={formData.memberAlias}
              onChange={handleChange}
              className="w-full px-3 py-2 focus:outline-ak-blue"
            />
          </div>}

          {formData.type === "team" && <div>
            <label className="block text-sm font-light mb-1">Key Member Alias</label>
            <input
              type="text"
              name="keyMemberAlias"
              value={formData.keyMemberAlias}
              onChange={handleChange}
              className="w-full px-3 py-2 focus:outline-ak-blue"
            />
          </div>}

          <div>
            <label className="block text-sm font-light mb-1">开始时间</label>
            <input
              type="datetime-local"
              name="startTime"
              value={new Date(formData.startTime).toLocaleDateString().slice(0, 16)}
              onChange={(e) => {
                const date = new Date(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  startTime: date.getTime(),
                }));
              }}
              className="w-full px-3 py-2 focus:outline-ak-blue"
            />
          </div>
        </div>

        <div>
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
      </div>
      <StyledDivider />

      {/* Tournament Stages */}
      <h2 className="text-xl mb-2">赛程阶段</h2>
      <div className="bg-black-gray-70 p-1 grid p-4 mb-2">
        {formData.stages.length > 0 && (
          <div className="mb-4">
            {formData.stages.map((stage, index) => (
              <div key={index} className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-sm font-light mb-1">阶段名称 <span className="text-ak-red">*</span></label>
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => {
                        const newStages = [...formData.stages];
                        newStages[index].name = e.target.value;
                        setFormData((prev) => ({ ...prev, stages: newStages }));
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
                    <label className="block text-sm font-light mb-1">开始时间 <span className="text-ak-red">*</span></label>
                    <input
                      type="datetime-local"
                      value={new Date(stage.startTime).toLocaleDateString().slice(0, 16)}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        const newStages = [...formData.stages];
                        newStages[index].startTime = date.getTime();
                        setFormData((prev) => ({ ...prev, stages: newStages }));
                      }}
                      className="w-full px-3 py-2 focus:outline-ak-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1">结束时间 <span className="text-ak-red">*</span></label>
                    <input
                      type="datetime-local"
                      value={new Date(stage.endTime).toLocaleDateString().slice(0, 16)}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        const newStages = [...formData.stages];
                        newStages[index].endTime = date.getTime();
                        setFormData((prev) => ({ ...prev, stages: newStages }));
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
                      const newStages = formData.stages.filter((_, i) => i !== index);
                      setFormData((prev) => ({ ...prev, stages: newStages }));
                    }}
                    className="rounded-md p-2 bg-ak-dark-red hover:bg-ak-red"
                  >
                    <ModalCloseIcon width="0.7rem" height="0.7rem" />
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
          className="px-4 py-2 text-ak-blue rounded-md hover:bg-mid-gray"
        >
          + 添加阶段
        </button>
      </div>
      <StyledDivider />

      {/* Tournament Teams */}
      {formData.type === "team" && (
        <>
          <h2 className="text-xl mb-2">参赛队伍</h2>
          <div className="bg-black-gray-70 p-1 grid p-4 mb-2">
            {formData.teams && formData.teams.length > 0 && (
              <div className="mb-4">
                {formData.teams.map((team, index) => (
                  <div key={index} className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div>
                        <label className="block text-sm font-light mb-1">队伍名称 <span className="text-ak-red">*</span></label>
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].name = e.target.value;
                            setFormData((prev) => ({ ...prev, teams: newTeams }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">队伍ID</label>
                        <input
                          type="text"
                          value={team.id}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].id = e.target.value;
                            setFormData((prev) => ({ ...prev, teams: newTeams }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">队伍头像</label>
                        <input
                          type="text"
                          value={team.avatar}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].avatar = e.target.value;
                            setFormData((prev) => ({ ...prev, teams: newTeams }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">队长</label>
                        <input
                          type="text"
                          value={team.leader}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].leader = e.target.value;
                            setFormData((prev) => ({ ...prev, teams: newTeams }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">核心成员</label>
                        <input
                          type="text"
                          value={team.keyMember}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].keyMember = e.target.value;
                            setFormData((prev) => ({ ...prev, teams: newTeams }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">成员 (用逗号隔开)</label>
                        <input
                          type="text"
                          value={team.members.join(", ")}
                          onChange={(e) => {
                            const members = e.target.value.split(/[,，]+/).map(m => m.trim());
                            const newTeams = [...formData.teams!];
                            newTeams[index].members = members;
                            setFormData((prev) => ({ ...prev, teams: newTeams }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-light mb-1">最终排名</label>
                        <input
                          type="number"
                          value={team.finalRank || ""}
                          onChange={(e) => {
                            const newTeams = [...formData.teams!];
                            newTeams[index].finalRank = e.target.value ? parseInt(e.target.value) : undefined;
                            setFormData((prev) => ({ ...prev, teams: newTeams }));
                          }}
                          className="w-full px-3 py-2 focus:outline-ak-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const newTeams = formData.teams!.filter((_, i) => i !== index);
                          setFormData((prev) => ({ ...prev, teams: newTeams }));
                        }}
                        className="rounded-md p-2 bg-ak-dark-red hover:bg-ak-red"
                      >
                        <ModalCloseIcon width="0.7rem" height="0.7rem" />
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
              className="px-4 py-2 text-ak-blue rounded-md hover:bg-mid-gray"
            >
              + 添加队伍
            </button>
          </div>
          <StyledDivider />
        </>
      )}

      {/* Tournament Players */}
      <h2 className="text-xl mb-2">参赛选手</h2>
      <div className="bg-black-gray-70 p-1 grid p-4 mb-2">
        {formData.players && formData.players.length > 0 && (
          <div className="mb-4">
            {formData.players.map((player, index) => (
              <div key={index} className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-sm font-light mb-1">选手ID <span className="text-ak-red">*</span></label>
                    <input
                      type="text"
                      value={player.mid}
                      onChange={(e) => {
                        const newPlayers = [...formData.players!];
                        newPlayers[index].mid = e.target.value;
                        setFormData((prev) => ({ ...prev, players: newPlayers }));
                      }}
                      className="w-full px-3 py-2 focus:outline-ak-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1">选手名字 <span className="text-ak-red">*</span></label>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => {
                        const newPlayers = [...formData.players!];
                        newPlayers[index].name = e.target.value;
                        setFormData((prev) => ({ ...prev, players: newPlayers }));
                      }}
                      className="w-full px-3 py-2 focus:outline-ak-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1">头像</label>
                    <input
                      type="text"
                      value={player.face}
                      onChange={(e) => {
                        const newPlayers = [...formData.players!];
                        newPlayers[index].face = e.target.value;
                        setFormData((prev) => ({ ...prev, players: newPlayers }));
                      }}
                      className="w-full px-3 py-2 focus:outline-ak-blue"
                    />
                  </div>
                  {formData.type === "team" && <div>
                    <label className="block text-sm font-light mb-1">队伍名称</label>
                    <input
                      type="text"
                      value={player.teamName || ""}
                      onChange={(e) => {
                        const newPlayers = [...formData.players!];
                        newPlayers[index].teamName = e.target.value || undefined;
                        setFormData((prev) => ({ ...prev, players: newPlayers }));
                      }}
                      className="w-full px-3 py-2 focus:outline-ak-blue"
                      required
                    />
                  </div>}
                  <div>
                    <label className="block text-sm font-light mb-1">最终排名</label>
                    <input
                      type="number"
                      value={player.finalRank || ""}
                      onChange={(e) => {
                        const newPlayers = [...formData.players!];
                        newPlayers[index].finalRank = e.target.value ? parseInt(e.target.value) : undefined;
                        setFormData((prev) => ({ ...prev, players: newPlayers }));
                      }}
                      className="w-full px-3 py-2 focus:outline-ak-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1">备注</label>
                    <input
                      type="text"
                      value={player.note || ""}
                      onChange={(e) => {
                        const newPlayers = [...formData.players!];
                        newPlayers[index].note = e.target.value || undefined;
                        setFormData((prev) => ({ ...prev, players: newPlayers }));
                      }}
                      className="w-full px-3 py-2 focus:outline-ak-blue"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const newPlayers = formData.players!.filter((_, i) => i !== index);
                      setFormData((prev) => ({ ...prev, players: newPlayers }));
                    }}
                    className="rounded-md p-2 bg-ak-dark-red hover:bg-ak-red"
                  >
                    <ModalCloseIcon width="0.7rem" height="0.7rem" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            const newPlayer = {
              mid: "",
              name: "新选手",
              face: "",
              games: []
            };
            setFormData((prev) => ({
              ...prev,
              players: [...(prev.players || []), newPlayer],
            }));
          }}
          className="px-4 py-2 text-ak-blue rounded-md hover:bg-mid-gray"
        >
          + 添加选手
        </button>
      </div>
      <StyledDivider />

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-black rounded-md bg-light-gray hover:bg-light-mid-gray "
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-black rounded-md bg-ak-blue hover:bg-ak-deep-blue"
          disabled={isSubmitting}
        >
          {isSubmitting ? "保存中..." : edit ? "保存" : "新建"}
        </button>
      </div>
    </form>
  )
}
