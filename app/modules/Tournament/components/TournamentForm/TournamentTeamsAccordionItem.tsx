import { AccordionItem } from "@heroui/react";
import { CloseIcon } from "~/components/Icons";
import type { TournamentData } from "~/types/tournamentsData";

interface TournamentTeamsAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export default function TournamentTeamsAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
}: TournamentTeamsAccordionItemProps) {
  if (formData.type !== "team") {
    return null;
  }

  return (
    <>
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
    </>
  );
}