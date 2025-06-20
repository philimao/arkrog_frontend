import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { TournamentData, TournamentPlayer, TournamentStage } from "~/types/tournamentsData";
import { useNavigate } from "react-router";
import { _post } from "~/utils/tools";
import { Accordion, AccordionItem } from "@heroui/react";
import { useUserInfoStore } from "~/stores/userInfoStore";
import TournamentInfoAccordionItem from "./TournamentInfoAccordionItem";
import TournamentStagesAccordionItem from "./TournamentStagesAccordionItem";
import TournamentTeamsAccordionItem from "./TournamentTeamsAccordionItem";
import TournamentPlayersAccordionItem from "./TournamentPlayersAccordionItem";
import TournamentProgressAccordionItem from "./TournamentProgressAccordionItem";

export const inputClassName = "bg-mid-gray w-full p-2 focus:outline-ak-blue";
export const labelClassName = "block text-sm font-light mb-1";
export const labelWithTooltipClassName = "flex items-center text-sm font-light mb-1";

export default function TournamentForm({
  edit = false,
  tournamentData,
}: {
  edit?: boolean;
  tournamentData?: TournamentData;
}) {
  const navigate = useNavigate();
  const { userInfo } = useUserInfoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TournamentData>(
    tournamentData
      ? structuredClone(tournamentData)
      : {
          id: "",
          name: "",
          groupId: "",
          avatar: "",
          rogue: "",
          edition: "初始版本",
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
          customPlayerKeys: {},
          groupBy: "",
        },
  );
  const [editingPlayer, setEditingPlayer] = useState<TournamentPlayer | undefined>();
  const [addingLabel, setAddingLabel] = useState<boolean>(false);
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
  const [editingStage, setEditingStage] = useState<TournamentStage | undefined>();
  const formDataRef = useRef<TournamentData>(formData);
  const saveToStorageRef = useRef<boolean>(true);
  const editStartTimeRef = useRef<number>(Date.now()); // 记录进入编辑的时间

  useEffect(() => {
    const saveFormData = () => {
      if (saveToStorageRef.current) {
        localStorage.setItem(`tournamentForm-${tournamentData?.id}`, JSON.stringify(formDataRef.current));
      }
    };

    window.addEventListener("beforeunload", saveFormData);
    window.addEventListener("popstate", saveFormData);

    return () => {
      window.removeEventListener("beforeunload", saveFormData);
      window.removeEventListener("popstate", saveFormData);
    };
  }, []);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    let formData = undefined;
    const storedData = localStorage.getItem(`tournamentForm-${tournamentData?.id}`);
    if (storedData) {
      formData = JSON.parse(storedData);
    } else if (tournamentData) {
      formData = structuredClone(tournamentData);
    }

    setFormData(formData);
    setEditingPlayer(formData.players?.[0]);
    setEditingStage(formData.stages?.[0]);

    // 每次组件重新挂载时重置编辑开始时间
    if (tournamentData) {
      editStartTimeRef.current = Date.now();
    }
  }, [tournamentData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!userInfo?.username) {
      toast.error("请先登录");
      setIsSubmitting(false);
      return;
    }

    try {
      // 提交赛事数据
      const response = await _post<{
        success: boolean;
        message: string;
        data?: TournamentData;
        needSync?: boolean;
        latestData?: TournamentData;
        lockedBy?: string;
      }>("/tournament/save", {
        tournament: formData,
        editStartTime: tournamentData ? editStartTimeRef.current : undefined, // 记录进入编辑的时间
        username: userInfo.username,
      });

      if (response.success) {
        toast.success(response.message);
        returnToPrevPage();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;

      // 尝试解析错误响应
      try {
        const errorData = JSON.parse(errorMessage);
        if (errorData.needSync && errorData.latestData) {
          toast.error("数据已被其他用户更新，需要同步本地编辑数据");
          // 这里可以添加数据同步的逻辑
        } else if (errorData.lockedBy) {
          toast.error(`赛事正在被用户 ${errorData.lockedBy} 编辑中`);
        } else {
          toast.error(errorData.message || "保存失败");
        }
      } catch {
        toast.error(`保存失败: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToPrevPage = () => {
    saveToStorageRef.current = false;
    localStorage.removeItem(`tournamentForm-${tournamentData?.id}`);
    if (tournamentData) {
      navigate(`/tournament/${tournamentData.id}`);
    } else {
      navigate(-1);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleAccordionClick = (e: React.MouseEvent) => {
    // If the click is on an input, select, or textarea, force focus
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      setTimeout(() => {
        (e.target as HTMLElement).focus();
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} onClick={handleAccordionClick}>
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
          <TournamentInfoAccordionItem
            formData={formData}
            handleKeyDown={handleKeyDown}
            setFormData={setFormData}
            addingLabel={addingLabel}
            setAddingLabel={setAddingLabel}
            editingLabelIndex={editingLabelIndex}
            setEditingLabelIndex={setEditingLabelIndex}
          />
        </AccordionItem>

        <AccordionItem key="赛事阶段" aria-label="赛事阶段" title="赛事阶段">
          <TournamentStagesAccordionItem formData={formData} setFormData={setFormData} handleKeyDown={handleKeyDown} />
        </AccordionItem>

        {formData.type === "team" ? (
          <AccordionItem key="参赛队伍" aria-label="参赛队伍" title="参赛队伍">
            <TournamentTeamsAccordionItem formData={formData} setFormData={setFormData} handleKeyDown={handleKeyDown} />
          </AccordionItem>
        ) : (
          <></>
        )}

        <AccordionItem key="参赛选手" aria-label="参赛选手" title="参赛选手">
          <TournamentPlayersAccordionItem
            formData={formData}
            setFormData={setFormData}
            handleKeyDown={handleKeyDown}
            editingPlayer={editingPlayer}
            setEditingPlayer={setEditingPlayer}
          />
        </AccordionItem>

        <AccordionItem key="比赛进程" aria-label="比赛进程" title="比赛进程">
          <TournamentProgressAccordionItem
            formData={formData}
            setFormData={setFormData}
            handleKeyDown={handleKeyDown}
            editingStage={editingStage}
            setEditingStage={setEditingStage}
          />
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={returnToPrevPage}
          className="px-4 py-2 rounded-md text-black bg-light-gray"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button type="submit" className="px-4 py-2 rounded-md text-black bg-ak-blue" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : edit ? "保存" : "新建"}
        </button>
      </div>
    </form>
  );
}
