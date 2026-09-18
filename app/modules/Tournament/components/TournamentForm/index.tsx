import { validateTournament } from "./validateTournament";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import type {
  TournamentData,
  TournamentPlayer,
  TournamentStage,
} from "~/types/tournamentsData";
import { useBlocker, useNavigate, useSearchParams } from "react-router";
import {
  Accordion,
  AccordionItem,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useUserInfoStore } from "~/stores/userInfoStore";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import TournamentInfoAccordionItem from "./TournamentInfoAccordionItem";
import TournamentStagesAccordionItem from "./TournamentStagesAccordionItem";
import TournamentTeamsAccordionItem from "./TournamentTeamsAccordionItem";
import TournamentPlayersAccordionItem from "./TournamentPlayersAccordionItem";
import TournamentProgressAccordionItem, {
  calculateSchedule,
} from "./TournamentProgressAccordionItem";
import TournamentPreview from "../../TournamentDetail/TournamentPreview";
import { URLValidation } from "~/utils/record";
import TournamentGenerateModal from "../TournamentGenerateModal";
import { tournamentServices } from "~/services/tournamentServices";
import ModalTemplate from "~/components/Modal";
import {
  discardTournamentDraft,
  hasTournamentChanges,
  readTournamentDraft,
  tournamentDraftKey,
  readTournamentDraftBase,
  tournamentSnapshot,
  writeTournamentDraft,
} from "../tournamentDraft";

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
  restoreDraft = false,
  canRestorePublished = false,
  onRestorePublished,
  tournamentData,
  previewMode,
  onPreviewModeChange,
}: {
  edit?: boolean;
  restoreDraft?: boolean;
  canRestorePublished?: boolean;
  onRestorePublished?: () => void;
  tournamentData?: TournamentData;
  previewMode?: boolean;
  onPreviewModeChange?: (isPreviewMode: boolean) => void;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userInfo } = useUserInfoStore();
  const { saveTournament } = useTournamentDataStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoringPublished, setIsRestoringPublished] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const submitButtonLabel = isSubmitting
    ? "提交中..."
    : edit
      ? "提交修改（待审核）"
      : "新建（待审核）";
  const [internalPreviewMode, setInternalPreviewMode] = useState(false);
  const isPreviewMode = previewMode ?? internalPreviewMode;
  const updatePreviewMode = (nextValue: boolean) => {
    if (previewMode === undefined) setInternalPreviewMode(nextValue);
    onPreviewModeChange?.(nextValue);
  };
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
  const baselineRef = useRef("");
  const serverBaseRef = useRef<string | null>(null);
  const allowLeaveRef = useRef(false);
  const editStartTimeRef = useRef<number>(Date.now());
  const accordionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [submitFromPreview, setSubmitFromPreview] = useState(false);
  const isBusy = isSubmitting || isRestoringPublished || submitFromPreview;
  const [mounted, setMounted] = useState(false);
  formDataRef.current = formData;
  // 拦截函数保持稳定；导航发生时读取最新数据，避免失焦更新后使用旧闭包。
  const hasUnsavedChanges = useCallback(
    () => hasTournamentChanges(formDataRef.current, baselineRef.current),
    [],
  );
  const shouldBlockLeave = useCallback(
    () => !allowLeaveRef.current && hasUnsavedChanges(),
    [hasUnsavedChanges],
  );
  const blocker = useBlocker(shouldBlockLeave);

  const saveDraft = useCallback(
    (automatic = false) => {
      try {
        const data = formDataRef.current;
        writeTournamentDraft(data, serverBaseRef.current, tournamentData?.id);
        baselineRef.current = JSON.stringify(data);
        toast.success(automatic ? "草稿已自动保存" : "草稿已保存");
        return true;
      } catch {
        toast.error("草稿保存失败，请检查浏览器存储空间或权限");
        return false;
      }
    },
    [tournamentData?.id],
  );

  useEffect(() => {
    if (!mounted) return;
    const timer = window.setInterval(
      () => {
        if (JSON.stringify(formDataRef.current) !== baselineRef.current)
          saveDraft(true);
      },
      3 * 60 * 1000,
    );
    return () => window.clearInterval(timer);
  }, [mounted, saveDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlockLeave()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlockLeave]);

  useEffect(() => {
    let newFormData: TournamentData;
    const storedData = restoreDraft
      ? readTournamentDraft(tournamentData?.id)
      : null;
    if (storedData) {
      newFormData = storedData;
    } else if (tournamentData) {
      newFormData = structuredClone(tournamentData);
    } else {
      // Default data for new tournament
      const tournamentNameParam = searchParams.get("tournamentName");
      const tournamentName = tournamentNameParam || "";

      newFormData = {
        id: "",
        name: tournamentName,
        groupId: "",
        avatar: "",
        rogue: "rogue_6",
        edition: "初始版本",
        type: "individual",
        memberAlias: "",
        keyMemberAlias: "",
        startTime: Date.now(),
        level: "N15",
        labels: [],
        rule: "",
        organizers: [],
        rooms: [],
        playback: "",
        stages: [],
        players: [],
        teams: [],
        customPlayerKeys: {},
        groupBy: "",
      };
    }

    serverBaseRef.current = tournamentData
      ? storedData ? readTournamentDraftBase(tournamentData.id) : tournamentSnapshot(tournamentData)
      : null;
    baselineRef.current = JSON.stringify(newFormData);
    formDataRef.current = newFormData;
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

  const checkTournamentData = () => {
    try {
      const error = validateTournament(formDataRef.current);
      if (!error) return true;
      setExpandedKeys(new Set([error.section]));
      if (error.playerIndex !== undefined && error.section === "参赛选手")
        setEditingPlayer(formDataRef.current.players[error.playerIndex]);
      if (error.stageIndex !== undefined)
        setEditingStage(formDataRef.current.stages[error.stageIndex]);
      toast.warning(error.message);
      return false;
    } catch {
      toast.error("赛事数据不完整或格式异常，无法校验，尚未提交。当前内容已保留，请检查数据或重新加载赛事版本。");
      return false;
    }
  };

  // Wait for the editing form and expanded sections to mount before validating.
  useEffect(() => {
    if (!submitFromPreview || isPreviewMode) return;
    const timer = window.setTimeout(() => {
      setSubmitFromPreview(false);
      const form = formRef.current;
      if (!form) return;
      if (!checkTournamentData()) return;
      if (!form.checkValidity()) {
        toast.warning("表单有未填写或格式不正确的内容，请检查提示项");
        form.reportValidity();
        return;
      }
      form.requestSubmit();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [submitFromPreview, isPreviewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setIsSubmitting(true);

    // Expand all accordion items to ensure all form fields are rendered for validation
    expandAllAccordionItems();

    // Use setTimeout to ensure the DOM is updated before validation
    setTimeout(async () => {
      try {
        // Check all persisted entries before checking currently mounted inputs.
        if (!checkTournamentData()) return;
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        if (!userInfo || !userInfo.username) {
          toast.error("请先登录");
          return;
        }

        // 验证并处理休赛期数据
        for (let stage of formData.stages) {
          if (stage.offseason && stage.offseason.length > 0) {
            // 确保所有休赛期日期都是数字格式（0点时间戳）
            const validOffseasons = stage.offseason
              .map((date) => {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
              })
              .filter((date) => {
                // 验证休赛期日期在开始和结束时间之间
                const startDate = new Date(stage.startTime);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(stage.endTime);
                endDate.setHours(0, 0, 0, 0);
                return date >= startDate.getTime() && date <= endDate.getTime();
              });

            stage.offseason = validOffseasons.sort((a, b) => a - b);

            // 过滤掉休赛期日期上的所有比赛数据
            if (validOffseasons.length > 0) {
              formData.players?.forEach((player) => {
                player.games = player.games.filter((game) => {
                  if (game.stage !== stage.name) return true;
                  const gameDate = new Date(game.date);
                  gameDate.setHours(0, 0, 0, 0);
                  return !validOffseasons.includes(gameDate.getTime());
                });
              });
            }
          }
        }

        // 对于Bilibili链接，进行格式化处理
        if (formData.playback) {
          const validatedPlayback = await URLValidation(formData.playback);
          if (validatedPlayback) formData.playback = validatedPlayback;
        }
        for (let player of formData.players!) {
          // 过滤掉不在当前赛事阶段的赛程
          player.games = player.games.filter((g) =>
            formData.stages.some((s) => s.name === g.stage),
          );
          for (let game of player.games) {
            // 更新所有比赛的 schedule 字段以适应休赛期
            const stage = formData.stages.find((s) => s.name === game.stage);
            if (stage && stage.startTime) {
              game.schedule = calculateSchedule(
                game.date,
                stage.startTime,
                stage.offseason,
              );
            }

            if (game.customStageValues.playback) {
              const validatedPlayback = await URLValidation(
                game.customStageValues.playback,
              );
              if (validatedPlayback) {
                game.customStageValues.playback = validatedPlayback;
              }
            }
          }
        }

        // 校验队伍成员，防止空值（如未填写名字即填写队伍）、错误值（如修改选手名字）
        if (formData.type === "team") {
          formData.teams!.forEach(
            (team) =>
              (team.members = team.members.filter((member) =>
                formData.players.find((p) => p.name === member),
              )),
          );
        }

        // 为预设缓存值的阶段信息添加默认值
        // formData.players?.forEach((player) => {
        //   player.games?.forEach((game) => {
        //     Object.keys(game.customStageValues).forEach((key) => {
        //       // 判断是否为预设缓存值的阶段信息
        //       let commonItem;
        //       if (
        //         (commonItem = commonStageKeys.find((item) => item.key === key))
        //       ) {
        //         // 如果为预设缓存值的阶段信息，且没有设置值，则设置为默认值
        //         if (!game.customStageValues[key] && commonItem.cacheValues) {
        //           game.customStageValues[key] = commonItem.cacheValues[0];
        //         }
        //       }
        //     });
        //   });
        // });

        // Fail closed if the current server version cannot be verified.
        if (tournamentData) {
          try {
            const latest = await tournamentServices.getEditView(tournamentData.id);
            if (!latest.data.success || !latest.data.tournament)
              throw new Error("Missing edit view");
            if (!serverBaseRef.current || tournamentSnapshot(latest.data.tournament) !== serverBaseRef.current) {
              toast.error("赛事已被更新，已阻止提交。请保存草稿后重新打开编辑页，使用最新版本并对照草稿修改。");
              return;
            }
          } catch {
            toast.error("无法确认赛事最新版本，暂未提交。请稍后重试，当前编辑内容已保留。");
            return;
          }
        }

        const response = await saveTournament(
          formData,
          userInfo.username,
          tournamentData ? editStartTimeRef.current : undefined,
        );

        if (response) {
          allowLeaveRef.current = true;
          try {
            localStorage.removeItem(tournamentDraftKey(tournamentData?.id));
          } catch {
            toast.warning("提交成功，但本地草稿清理失败");
          }
          returnToPrevPage();
        }
        // 错误提示已在 store 中处理
      } catch {
        toast.error("提交过程中发生异常，请检查赛事数据后重试。当前编辑内容已保留。");
      } finally {
        setIsSubmitting(false);
      }
    }, 100);
  };

  const returnToPrevPage = () => {
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

  const restorePublishedVersion = async () => {
    if (!canRestorePublished || !tournamentData || isBusy) return;
    setRestoreConfirmOpen(false);
    setIsRestoringPublished(true);
    try {
      const [list, latest] = await Promise.all([
        tournamentServices.getTournamentList(true),
        tournamentServices.getEditView(tournamentData.id),
      ]);
      const published = list.data.find(item => item.id === tournamentData.id);
      if (!published) {
        toast.warning("该赛事没有可恢复的已通过版本");
        return;
      }
      if (!latest.data.success || latest.data.pendingMeta?.status !== "rejected" ||
          tournamentSnapshot(latest.data.tournament) !== serverBaseRef.current) {
        toast.warning("赛事版本已变化，请重新打开编辑页后重试");
        return;
      }
      const restored = structuredClone(published);
      formDataRef.current = restored;
      setFormData(restored);
      setEditingPlayer(restored.players[0]);
      setEditingStage(restored.stages[0]);
      setTouchedFields(new Set());
      // Retain the effective server baseline for conflict checks and draft saves.
      onRestorePublished?.();
      toast.success("已切换为已通过版本，尚未提交");
    } catch {
      toast.error("获取已通过版本失败，当前内容未替换");
    } finally {
      setIsRestoringPublished(false);
    }
  };

  const requestRestorePublished = () => {
    if (!canRestorePublished || isBusy) return;
    if (hasUnsavedChanges() || restoreDraft) setRestoreConfirmOpen(true);
    else void restorePublishedVersion();
  };

  const handlePreview = () => {
    updatePreviewMode(true);
    window.scrollTo({ top: 0 });
  };

  const handleBackToEdit = () => {
    updatePreviewMode(false);
    window.scrollTo({ top: 0 });
  };

  // 智能生成相关
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onConfirm = useCallback(
    (tournamentData: TournamentData) => {
      const newFormData = structuredClone(tournamentData);
      setFormData(newFormData);
      setEditingPlayer(newFormData.players?.[0]);
      setEditingStage(newFormData.stages?.[0]);
      editStartTimeRef.current = Date.now();
      onClose();
    },
    [onClose],
  );

  const leaveConfirmModal = (
    <ModalTemplate
      modalControl={{
        isOpen: blocker.state === "blocked",
        onClose: () => blocker.reset?.(),
      }}
    >
      <ModalHeader>未保存的改动</ModalHeader>
      <ModalBody>您有未保存的改动，是否确认离开？</ModalBody>
      <ModalFooter className="gap-4">
        <Button
          className="text-md rounded-md text-black bg-light-gray"
          onPress={() => blocker.reset?.()}
        >
          返回编辑
        </Button>
        <Button
          color="primary"
          onPress={() => {
            if (saveDraft()) blocker.proceed?.();
          }}
          className="text-md rounded-md text-black bg-ak-blue"
        >
          保存草稿并离开
        </Button>
        <Button
          className="text-md rounded-md text-white bg-ak-dark-red"
          onPress={() => {
            if (discardTournamentDraft(tournamentData?.id)) blocker.proceed?.();
          }}
        >
          离开
        </Button>
      </ModalFooter>
    </ModalTemplate>
  );

  // 未挂载时，不渲染表单
  if (!mounted) {
    return null;
  }

  const submissionNotice = isBusy && (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60" role="status" aria-live="polite">
      <div className="flex items-center gap-3 bg-black-gray px-6 py-4 text-white shadow-lg">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-ak-blue" aria-hidden="true" />
        {isRestoringPublished ? "正在获取已发布版本，请稍候…" : "正在检查并提交，请稍候…"}
      </div>
    </div>
  );

  if (isPreviewMode) {
    return (
      <div className="relative">
        {submissionNotice}
        {leaveConfirmModal}
        <button
          type="button"
          className="hidden"
          id="tournament-save-draft-trigger"
          disabled={isBusy}
          onClick={() => saveDraft()}
        />
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
            onClick={() => {
              expandAllAccordionItems();
              setSubmitFromPreview(true);
              updatePreviewMode(false);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
            className="px-4 py-2 rounded-md text-black bg-ak-blue"
            disabled={isBusy}
          >
            {submitButtonLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      onClick={handleAccordionClick}
    >
      {submissionNotice}
      <ModalTemplate modalControl={{ isOpen: restoreConfirmOpen, onClose: () => setRestoreConfirmOpen(false) }}>
        <ModalHeader>使用已通过的版本</ModalHeader>
        <ModalBody>使用已通过的版本会替换当前表格内容。本地已保存的草稿仍会保留，是否继续？</ModalBody>
        <ModalFooter className="gap-4">
          <Button className="rounded-md bg-light-gray text-black" onPress={() => setRestoreConfirmOpen(false)}>取消</Button>
          <Button className="rounded-md bg-ak-blue text-black" onPress={() => void restorePublishedVersion()}>确认恢复</Button>
        </ModalFooter>
      </ModalTemplate>
      {canRestorePublished && (
        <button type="button" className="hidden" id="tournament-restore-published-trigger"
          disabled={isBusy} onClick={requestRestorePublished} />
      )}
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

      <div className="flex justify-end flex-wrap gap-4 mt-6">
        <button
          type="button"
          onClick={returnToPrevPage}
          className="me-auto px-4 py-2 rounded-md text-black bg-light-gray"
          disabled={isBusy}
        >
          取消
        </button>
        <button
          type="button"
          id="tournament-save-draft-trigger"
          onClick={() => saveDraft()}
          className="px-4 py-2 rounded-md text-black bg-light-gray"
          disabled={isBusy}
        >
          保存草稿
        </button>
        <button
          type="button"
          onClick={handlePreview}
          className="px-4 py-2 rounded-md text-black bg-light-gray"
          disabled={isBusy}
        >
          预览
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-black bg-ak-blue"
          disabled={isBusy}
        >
          {isSubmitting
            ? "提交中..."
            : edit
              ? "提交修改（待审核）"
              : "新建（待审核）"}
        </button>
      </div>

      {leaveConfirmModal}
      {/* 智能生成弹窗 */}
      <TournamentGenerateModal
        name={formData.name}
        isOpen={isOpen}
        onConfirm={onConfirm}
        onClose={onClose}
      />

      <button
        className="hidden"
        type="button"
        id="tournament-generate-modal-trigger"
        onClick={onOpen}
      />
    </form>
  );
}
