import { Select, SelectItem } from "@heroui/react";
import { CloseIcon } from "~/components/Icons";
import type { TournamentData, TournamentStage } from "~/types/tournamentsData";
import { getInputClassName, inputClassName, labelClassName, selectClassName } from ".";

interface TournamentStagesAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  touchedFields: Set<string>;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function TournamentStagesAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
  touchedFields,
  handleBlur,
}: TournamentStagesAccordionItemProps) {
  return (
    <>
      {formData.stages?.length > 0 && (
        <div className="mb-4">
          {formData.stages?.map((stage, index) => (
            <div key={index} className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label htmlFor={`stageName-${index}`} className={labelClassName}>
                    阶段名称 <span className="text-ak-red">*</span>
                  </label>
                  <input
                    id={`stageName-${index}`}
                    type="text"
                    value={stage.name}
                    placeholder="例：初赛"
                    onChange={(e) => {
                      const newStages = [...(formData.stages || [])];
                      newStages[index].name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        stages: newStages,
                      }));
                    }}
                    onKeyDown={handleKeyDown}
                    className={getInputClassName(`stageName-${index}`, touchedFields, { [`stageName-${index}`]: stage.name })}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`stageStartTime-${index}`} className={labelClassName}>
                    开始时间 <span className="text-ak-red">*</span>
                  </label>
                  <input
                    id={`stageStartTime-${index}`}
                    type="date"
                    value={new Date(stage.startTime).toISOString().slice(0, 10)}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      const newStages = [...(formData.stages || [])];
                      newStages[index].startTime = date.getTime();
                      setFormData((prev) => ({
                        ...prev,
                        stages: newStages,
                      }));
                    }}
                    className={getInputClassName(`stageStartTime-${index}`, touchedFields, { [`stageStartTime-${index}`]: stage.startTime })}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`stageEndTime-${index}`} className={labelClassName}>
                    结束时间 <span className="text-ak-red">*</span>
                  </label>
                  <input
                    id={`stageEndTime-${index}`}
                    type="date"
                    value={new Date(stage.endTime).toISOString().slice(0, 10)}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      const newStages = [...(formData.stages || [])];
                      newStages[index].endTime = date.getTime();
                      setFormData((prev) => ({
                        ...prev,
                        stages: newStages,
                      }));
                    }}
                    className={getInputClassName(`stageEndTime-${index}`, touchedFields, { [`stageEndTime-${index}`]: stage.endTime })}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label htmlFor={`stageType-${index}`} className={labelClassName}>
                    赛制 <span className="text-ak-red">*</span>
                  </label>
                  <Select
                    id={`stageType-${index}`}
                    name="type"
                    selectedKeys={[stage.type]}
                    onChange={(e) => {
                      const newStages = [...(formData.stages || [])];
                      newStages[index].type = e.target.value as TournamentStage["type"];
                      setFormData((prev) => ({
                        ...prev,
                        stages: newStages,
                      }));
                    }}
                    classNames={selectClassName}
                    aria-label="赛制"
                    required
                  >
                    <SelectItem key="rank" value="rank">
                      积分排名赛
                    </SelectItem>
                    <SelectItem key="1on1" value="1on1">
                      1对1淘汰赛
                    </SelectItem>
                  </Select>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const newStages = (formData.stages || []).filter((_, i) => i !== index);
                    setFormData((prev) => ({ ...prev, stages: newStages }));
                  }}
                  className="rounded-md p-1 hover:bg-ak-red"
                  aria-label="删除阶段"
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
            name: `阶段${formData.stages?.length + 1 || 1}`,
            startTime: now,
            endTime: now + 86400000, // +1 day
            type: "rank" as const,
            customStageKeys: {},
          };
          setFormData((prev) => ({
            ...prev,
            stages: [...(prev.stages || []), newStage],
          }));
        }}
        className="w-full px-4 py-2 mb-2 text-ak-blue rounded-md hover:bg-mid-gray"
      >
        + 添加阶段
      </button>
    </>
  );
}
