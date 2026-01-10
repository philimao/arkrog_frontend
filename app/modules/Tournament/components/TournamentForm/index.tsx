import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import type {
  TournamentData,
  TournamentPlayer,
  TournamentStage,
} from "~/types/tournamentsData";
import { useNavigate, useSearchParams } from "react-router";
import { Accordion, AccordionItem } from "@heroui/react";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import TournamentInfoAccordionItem from "./TournamentInfoAccordionItem";
import TournamentStagesAccordionItem from "./TournamentStagesAccordionItem";
import TournamentTeamsAccordionItem from "./TournamentTeamsAccordionItem";
import TournamentPlayersAccordionItem from "./TournamentPlayersAccordionItem";
import TournamentProgressAccordionItem from "./TournamentProgressAccordionItem";
import TournamentPreview from "../../TournamentDetail/TournamentPreview";

export const getInputClassName = (
  fieldName: string,
  touchedFields: Set<string>,
  formData: any,
  customInputClass?: string,
) => {
  const isRequired = document
    .getElementById(fieldName)
    ?.hasAttribute("required");
  const isEmpty = !formData[fieldName] && formData[fieldName] !== 0;
  const defaultClass = customInputClass ? customInputClass : inputClassName;

  if (isRequired && touchedFields.has(fieldName) && isEmpty) {
    return `${defaultClass} outline outline-2 outline-ak-red`;
  }

  return defaultClass;
};

export const inputClassName =
  "bg-mid-gray w-full p-2 focus:outline focus:outline-2 focus:outline-ak-blue";
export const labelClassName = "block text-sm font-light mb-1";
export const labelWithTooltipClassName =
  "flex items-center text-sm font-light mb-1";
export const selectClassName = {
  trigger: "bg-mid-gray rounded-none",
  value: "",
  popoverContent: "bg-mid-gray rounded-none",
  listbox: "rounded-none",
};

export default function TournamentForm({
  edit = false,
  tournamentData,
}: {
  edit?: boolean;
  tournamentData?: TournamentData;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userInfo } = useUserInfoStore();
  const { saveTournament } = useTournamentDataStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [formData, setFormData] = useState<TournamentData>(
    {} as TournamentData,
  );
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [editingPlayer, setEditingPlayer] = useState<
    TournamentPlayer | undefined
  >();
  const [addingLabel, setAddingLabel] = useState<boolean>(false);
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(
    null,
  );
  const [editingStage, setEditingStage] = useState<
    TournamentStage | undefined
  >();
  const [expandedKeys, setExpandedKeys] = useState<Set<React.Key>>(
    new Set(["赛事信息"]),
  );
  const formDataRef = useRef<TournamentData>(formData);
  const saveToStorageRef = useRef<boolean>(true);
  const editStartTimeRef = useRef<number>(Date.now()); // 记录进入编辑的时间
  const accordionRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saveFormData = () => {
      if (saveToStorageRef.current) {
        localStorage.setItem(
          `tournamentForm-${tournamentData?.id}`,
          JSON.stringify(formDataRef.current),
        );
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
    let newFormData;
    const storedData = localStorage.getItem(
      `tournamentForm-${tournamentData?.id}`,
    );

    if (
      storedData &&
      (newFormData = JSON.parse(storedData)) &&
      newFormData.lastEditTime &&
      newFormData.lastEditTime > (tournamentData?.lastEditTime || 0)
    ) {
      // 仅当存储的数据比当前数据新时，才使用存储的数据
    } else if (tournamentData) {
      newFormData = structuredClone(tournamentData);
    } else {
      // Default data for new tournament
      const tournamentNameParam = searchParams.get("tournamentName");
      const tournamentName = tournamentNameParam
        ? decodeURIComponent(tournamentNameParam)
        : "";

      newFormData = {
        id: "",
        name: tournamentName,
        groupId: "",
        avatar: "",
        rogue: "rogue_4",
        edition: "初始版本",
        type: "individual",
        memberAlias: "",
        keyMemberAlias: "",
        startTime: Date.now(),
        level: "N18",
        labels: [],
        rule: "",
        organizers: [],
        room: "",
        stages: [],
        players: [],
        teams: [],
        customPlayerKeys: {},
        groupBy: "",
      };
    }

    setFormData(newFormData);
    setEditingPlayer(newFormData.players?.[0]);
    setEditingStage(newFormData.stages?.[0]);

    // 每次组件重新挂载时重置编辑开始时间
    if (tournamentData) {
      editStartTimeRef.current = Date.now();
    }

    setMounted(true);
  }, [tournamentData]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  // Handle accordion selection change
  const handleSelectionChange = useCallback((keys: any) => {
    setExpandedKeys(keys);
  }, []);

  // Expand all accordion items
  const expandAllAccordionItems = useCallback(() => {
    const allKeys = [
      "赛事信息",
      "赛事阶段",
      "参赛队伍",
      "参赛选手",
      "比赛进程",
    ];
    setExpandedKeys(new Set(allKeys));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Expand all accordion items to ensure all form fields are rendered for validation
    expandAllAccordionItems();

    // Use setTimeout to ensure the DOM is updated before validation
    setTimeout(async () => {
      // Check form validity after accordion items are expanded
      if (e.target instanceof HTMLFormElement && !e.target.checkValidity()) {
        e.target.reportValidity();
        return;
      }

      setIsSubmitting(true);

      if (!userInfo || !userInfo.username) {
        toast.error("请先登录");
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await saveTournament(
          formData,
          userInfo.username,
          tournamentData ? editStartTimeRef.current : undefined,
        );

        if (response) {
          returnToPrevPage();
        }
        // 错误提示已在 store 中处理
      } finally {
        setIsSubmitting(false);
      }
    }, 100);
  };

  const returnToPrevPage = () => {
    saveToStorageRef.current = false;
    localStorage.removeItem(`tournamentForm-${tournamentData?.id}`);
    if (tournamentData) {
      navigate(`/tournament/${tournamentData.id}`);
    } else {
      navigate("/tournament");
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleBlur = (e: React.FocusEvent<Element>) => {
    // Check if the event target has a name property and is an HTMLElement
    const target = e.target as HTMLElement & { name?: string };
    if (target.name && typeof target.name === "string") {
      const fieldName = target.name;
      setTouchedFields((prev) => {
        const newSet = new Set(prev);
        newSet.add(fieldName);
        return newSet;
      });
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

  const handlePreview = () => {
    setIsPreviewMode(true);
    // Scroll to the top of the page when switching to preview mode
    window.scrollTo({ top: 0 });
  };

  const handleBackToEdit = () => {
    setIsPreviewMode(false);
    window.scrollTo({ top: 0 });
  };

  // 未挂载时，不渲染表单
  if (!mounted) {
    return null;
  }

  if (isPreviewMode) {
    return (
      <div className="relative">
        <TournamentPreview formData={formData} />
        <div className="flex justify-end space-x-4 mb-6">
          <button
            type="button"
            onClick={handleBackToEdit}
            className="px-4 py-2 rounded-md text-black bg-light-gray"
          >
            返回编辑
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md text-black bg-ak-blue"
            disabled={isSubmitting}
          >
            {isSubmitting ? "保存中..." : edit ? "保存" : "新建"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      onClick={handleAccordionClick}
    >
      <Accordion
        ref={accordionRef}
        className="px-0"
        defaultExpandedKeys={["赛事信息"]}
        // Use any type to bypass TypeScript errors with the Accordion component
        selectedKeys={Array.from(expandedKeys) as any}
        onSelectionChange={handleSelectionChange}
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
            touchedFields={touchedFields}
            handleBlur={handleBlur}
          />
        </AccordionItem>

        <AccordionItem key="赛事阶段" aria-label="赛事阶段" title="赛事阶段">
          <TournamentStagesAccordionItem
            formData={formData}
            setFormData={setFormData}
            handleKeyDown={handleKeyDown}
            touchedFields={touchedFields}
            handleBlur={handleBlur}
          />
        </AccordionItem>

        {formData.type === "team" ? (
          <AccordionItem key="参赛队伍" aria-label="参赛队伍" title="参赛队伍">
            <TournamentTeamsAccordionItem
              formData={formData}
              setFormData={setFormData}
              handleKeyDown={handleKeyDown}
              touchedFields={touchedFields}
              handleBlur={handleBlur}
            />
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
            touchedFields={touchedFields}
            handleBlur={handleBlur}
          />
        </AccordionItem>

        <AccordionItem key="比赛进程" aria-label="比赛进程" title="比赛进程">
          <TournamentProgressAccordionItem
            formData={formData}
            setFormData={setFormData}
            handleKeyDown={handleKeyDown}
            editingStage={editingStage}
            setEditingStage={setEditingStage}
            touchedFields={touchedFields}
            handleBlur={handleBlur}
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
        <button
          type="button"
          onClick={handlePreview}
          className="px-4 py-2 rounded-md text-black bg-light-gray"
          disabled={isSubmitting}
        >
          预览
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
