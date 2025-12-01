import { CloseIcon, InformationIcon } from "~/components/Icons";
import type { TournamentData } from "~/types/tournamentsData";
import {
  getInputClassName,
  labelClassName,
  labelWithTooltipClassName,
} from ".";
import UploadCenterTrigger from "~/components/COS/UploadCenterTrigger";
import { Tooltip } from "@heroui/react";
import { useStorageStore } from "~/stores/storageStore";

interface TournamentTeamsAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  touchedFields: Set<string>;
  handleBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}

export default function TournamentTeamsAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
  touchedFields,
  handleBlur,
}: TournamentTeamsAccordionItemProps) {
  const { setUploadLabel, setUploadDirectory, setOnUploadedItemClick } =
    useStorageStore();

  if (formData.type !== "team") {
    return null;
  }

  return (
    <>
      {(formData.teams || []).length > 0 && (
        <div className="mb-4">
          {(formData.teams || []).map((team, index) => (
            <div
              key={index}
              className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label
                    htmlFor={`teamName-${index}`}
                    className={labelClassName}
                  >
                    队伍名称 <span className="text-ak-red">*</span>
                  </label>
                  <input
                    id={`teamName-${index}`}
                    type="text"
                    value={team.name}
                    placeholder="例：紧集授课"
                    onChange={(e) => {
                      const newTeams = [...(formData.teams || [])];
                      newTeams[index].name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        teams: newTeams,
                      }));
                    }}
                    onKeyDown={handleKeyDown}
                    className={getInputClassName(
                      `teamName-${index}`,
                      touchedFields,
                      {
                        [`teamName-${index}`]: team.name,
                      },
                    )}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`teamId-${index}`} className={labelClassName}>
                    队伍ID <span className="text-ak-red">*</span>
                  </label>
                  <input
                    id={`teamId-${index}`}
                    type="text"
                    value={team.id}
                    placeholder="例：ET"
                    onChange={(e) => {
                      const newTeams = [...(formData.teams || [])];
                      newTeams[index].id = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        teams: newTeams,
                      }));
                    }}
                    onKeyDown={handleKeyDown}
                    className={getInputClassName(
                      `teamId-${index}`,
                      touchedFields,
                      { [`teamId-${index}`]: team.id },
                    )}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`teamAvatar-${index}`}
                    className={labelWithTooltipClassName}
                  >
                    队伍头像
                    <Tooltip
                      content="点击图标上传图片后，将图片链接粘贴此处"
                      className="bg-light-mid-gray text-black"
                    >
                      <span className="px-1">
                        <InformationIcon width="0.75rem" height="0.75rem" />
                      </span>
                    </Tooltip>
                  </label>
                  <div className="relative">
                    <input
                      id={`teamAvatar-${index}`}
                      type="text"
                      value={team.avatar}
                      onChange={(e) => {
                        const newTeams = [...(formData.teams || [])];
                        newTeams[index].avatar = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          teams: newTeams,
                        }));
                      }}
                      onKeyDown={handleKeyDown}
                      className={`${getInputClassName(`teamAvatar-${index}`, touchedFields, { [`teamAvatar-${index}`]: team.avatar })} pr-12`}
                      onBlur={handleBlur}
                    />
                    <UploadCenterTrigger
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[#00000033] rounded hover:bg-dark-gray"
                      aria-label="上传队伍头像"
                      beforeOpen={() => {
                        setUploadLabel("队伍头像");
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
                <div>
                  <label
                    htmlFor={`teamLeader-${index}`}
                    className={labelClassName}
                  >
                    队长
                  </label>
                  <input
                    id={`teamLeader-${index}`}
                    type="text"
                    value={team.leader}
                    onChange={(e) => {
                      const newTeams = [...(formData.teams || [])];
                      newTeams[index].leader = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        teams: newTeams,
                      }));
                    }}
                    onKeyDown={handleKeyDown}
                    className={getInputClassName(
                      `teamLeader-${index}`,
                      touchedFields,
                      {
                        [`teamLeader-${index}`]: team.leader,
                      },
                    )}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`teamKeyMember-${index}`}
                    className={labelClassName}
                  >
                    核心成员
                  </label>
                  <input
                    id={`teamKeyMember-${index}`}
                    type="text"
                    value={team.keyMember}
                    onChange={(e) => {
                      const newTeams = [...(formData.teams || [])];
                      newTeams[index].keyMember = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        teams: newTeams,
                      }));
                    }}
                    onKeyDown={handleKeyDown}
                    className={getInputClassName(
                      `teamKeyMember-${index}`,
                      touchedFields,
                      {
                        [`teamKeyMember-${index}`]: team.keyMember,
                      },
                    )}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`teamFinalRank-${index}`}
                    className={labelClassName}
                  >
                    最终排名
                  </label>
                  <input
                    id={`teamFinalRank-${index}`}
                    type="number"
                    value={team.finalRank || ""}
                    onChange={(e) => {
                      const newTeams = [...(formData.teams || [])];
                      newTeams[index].finalRank = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      setFormData((prev) => ({
                        ...prev,
                        teams: newTeams,
                      }));
                    }}
                    onKeyDown={handleKeyDown}
                    className={getInputClassName(
                      `teamFinalRank-${index}`,
                      touchedFields,
                      {
                        [`teamFinalRank-${index}`]: team.finalRank,
                      },
                    )}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const newTeams = (formData.teams || []).filter(
                      (_, i) => i !== index,
                    );
                    setFormData((prev) => ({ ...prev, teams: newTeams }));
                  }}
                  className="rounded-md p-1 hover:bg-ak-red"
                  aria-label="删除队伍"
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
            name: `队伍${(formData.teams?.length ?? 0) + 1}`,
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
