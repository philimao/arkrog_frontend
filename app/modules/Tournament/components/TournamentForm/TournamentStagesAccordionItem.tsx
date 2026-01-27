import { Select, SelectItem } from "@heroui/react";
import { CloseIcon } from "~/components/Icons";
import type { TournamentData, TournamentStage } from "~/types/tournamentsData";
import { formatDateForInput, generateDateArray } from "~/utils/date";
import { getInputClassName, labelClassName, selectClassName } from ".";
import { useMemo } from "react";

interface TournamentStagesAccordionItemProps {
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
            <div
              key={index}
              className="flex py-4 first:pt-0 border-b-1 border-b-mid-gray gap-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label
                    htmlFor={`stageName-${index}`}
                    className={labelClassName}
                  >
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
                    className={getInputClassName(
                      `stageName-${index}`,
                      touchedFields,
                      {
                        [`stageName-${index}`]: stage.name,
                      },
                    )}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`stageStartTime-${index}`}
                    className={labelClassName}
                  >
                    开始时间 <span className="text-ak-red">*</span>
                  </label>
                  <input
                    id={`stageStartTime-${index}`}
                    type="date"
                    value={formatDateForInput(stage.startTime)}
                    onChange={(e) => {
                      // Check if the date string is valid before creating a Date object
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        if (!isNaN(date.getTime())) {
                          const newStages = [...(formData.stages || [])];
                          const newStartTime = date.getTime();
                          newStages[index].startTime = newStartTime;
                          
                          // 清理超出日期范围的休赛期
                          if (newStages[index].offseason && newStages[index].offseason.length > 0) {
                            const startDate = new Date(newStartTime);
                            startDate.setHours(0, 0, 0, 0);
                            const endDate = new Date(newStages[index].endTime);
                            endDate.setHours(0, 0, 0, 0);
                            
                            newStages[index].offseason = newStages[index].offseason.filter(
                              offday => offday >= startDate.getTime() && offday <= endDate.getTime()
                            );
                          }
                          
                          setFormData((prev) => ({
                            ...prev,
                            stages: newStages,
                          }));
                        }
                      }
                    }}
                    className={getInputClassName(
                      `stageStartTime-${index}`,
                      touchedFields,
                      {
                        [`stageStartTime-${index}`]: stage.startTime,
                      },
                    )}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`stageEndTime-${index}`}
                    className={labelClassName}
                  >
                    结束时间 <span className="text-ak-red">*</span>
                  </label>
                  <input
                    id={`stageEndTime-${index}`}
                    type="date"
                    value={formatDateForInput(stage.endTime)}
                    onChange={(e) => {
                      // Check if the date string is valid before creating a Date object
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        if (!isNaN(date.getTime())) {
                          const newStages = [...(formData.stages || [])];
                          const newEndTime = date.getTime();
                          newStages[index].endTime = newEndTime;
                          
                          // 清理超出日期范围的休赛期
                          if (newStages[index].offseason && newStages[index].offseason.length > 0) {
                            const startDate = new Date(newStages[index].startTime);
                            startDate.setHours(0, 0, 0, 0);
                            const endDate = new Date(newEndTime);
                            endDate.setHours(0, 0, 0, 0);
                            
                            newStages[index].offseason = newStages[index].offseason.filter(
                              offday => offday >= startDate.getTime() && offday <= endDate.getTime()
                            );
                          }
                          
                          setFormData((prev) => ({
                            ...prev,
                            stages: newStages,
                          }));
                        }
                      }
                    }}
                    className={getInputClassName(
                      `stageEndTime-${index}`,
                      touchedFields,
                      {
                        [`stageEndTime-${index}`]: stage.endTime,
                      },
                    )}
                    onBlur={handleBlur}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor={`stageType-${index}`}
                    className={labelClassName}
                  >
                    赛制 <span className="text-ak-red">*</span>
                  </label>
                  <Select
                    id={`stageType-${index}`}
                    name="type"
                    selectedKeys={[stage.type]}
                    onChange={(e) => {
                      const newStages = [...(formData.stages || [])];
                      newStages[index].type = e.target
                        .value as TournamentStage["type"];
                      setFormData((prev) => ({
                        ...prev,
                        stages: newStages,
                      }));
                    }}
                    classNames={selectClassName}
                    aria-label="赛制"
                    required
                  >
                    <SelectItem key="rank">积分排名赛</SelectItem>
                    <SelectItem key="1on1">1对1淘汰赛</SelectItem>
                  </Select>
                </div>
                {/* 休赛期 */}
                <div className="md:col-span-2">
                  <label className={labelClassName}>
                    休赛期
                    <span className="text-sm text-light-mid-gray ms-2">
                      点击日期按钮将该日加入休赛期，日程会自动往后推移
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(() => {
                      if (!stage.startTime || !stage.endTime) {
                        return (
                          <span className="text-light-mid-gray text-sm">
                            请先设置开始时间和结束时间
                          </span>
                        );
                      }

                      const dates = generateDateArray(
                        stage.startTime,
                        stage.endTime,
                      );

                      return dates.map((date, dateIndex) => {
                        const dateMs = new Date(date).setHours(0, 0, 0, 0);
                        const isOffseason = stage.offseason?.includes(dateMs);
                        const isFirstOrLastDay =
                          dateIndex === 0 || dateIndex === dates.length - 1;

                        return (
                          <button
                            key={dateIndex}
                            type="button"
                            onClick={() => {
                              if (isFirstOrLastDay) return;

                              const newStages = [...(formData.stages || [])];
                              const currentOffseason =
                                newStages[index].offseason || [];

                              if (isOffseason) {
                                // Remove from offseason
                                newStages[index].offseason =
                                  currentOffseason.filter((d) => d !== dateMs);
                              } else {
                                // Add to offseason - 不立即删除比赛数据，在提交时过滤
                                newStages[index].offseason = [
                                  ...currentOffseason,
                                  dateMs,
                                ].sort((a, b) => a - b);
                              }

                              setFormData((prev) => ({
                                ...prev,
                                stages: newStages,
                              }));
                            }}
                            className={`px-3 py-1.5 text-sm transition-colors w-[5.5rem] ${
                              isFirstOrLastDay
                                ? "bg-[#00000033] cursor-not-allowed"
                                : isOffseason
                                  ? "bg-ak-red text-white"
                                  : "bg-[#00000033] hover:bg-[#00000055]"
                            }`}
                            disabled={isFirstOrLastDay}
                          >
                            <div className="text-center">
                              <div>
                                {date.getMonth() + 1}月{date.getDate()}日
                              </div>
                              <div className="text-xs">
                                Day
                                {dateIndex +
                                  1 -
                                  (stage.offseason?.filter((d) => d < dateMs)
                                    .length || 0)}
                              </div>
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const newStages = (formData.stages || []).filter(
                      (_, i) => i !== index,
                    );
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
          // 获取上一阶段的 customStageKeys
          const previousStage = formData.stages?.[formData.stages.length - 1];
          const customStageKeys = previousStage?.customStageKeys
            ? { ...previousStage.customStageKeys }
            : {};

          const newStage = {
            name: `阶段${formData.stages?.length + 1 || 1}`,
            startTime: now,
            endTime: now + 86400000, // +1 day
            offseason: [],
            type: "rank" as const,
            customStageKeys: customStageKeys,
            groupBy: "",
          };
          setFormData((prev) => ({
            ...prev,
            stages: [...(prev.stages || []), newStage].sort(
              (a, b) => a.startTime - b.startTime,
            ), // 按开始时间排序
          }));
        }}
        className="w-full px-4 py-2 mb-2 text-ak-blue rounded-md hover:bg-mid-gray"
      >
        + 添加阶段
      </button>
    </>
  );
}
