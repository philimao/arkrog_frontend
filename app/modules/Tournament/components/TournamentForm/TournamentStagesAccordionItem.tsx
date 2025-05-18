import { AccordionItem } from "@heroui/react";
import { CloseIcon } from "~/components/Icons";
import type { TournamentData } from "~/types/tournamentsData";

interface TournamentStagesAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export default function TournamentStagesAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
}: TournamentStagesAccordionItemProps) {
  return (
    <>
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
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 focus:outline-ak-blue"
                    required
                  />
                </div>
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
    </>
  );
}