import { useState } from "react";
import { toast } from "react-toastify";
import type { TournamentData, TournamentPlayer } from "~/types/tournamentsData";
import { useNavigate } from "react-router";
import { Accordion, AccordionItem } from "@heroui/react";
import TournamentInfoAccordionItem from "./TournamentInfoAccordionItem";
import TournamentStagesAccordionItem from "./TournamentStagesAccordionItem";
import TournamentTeamsAccordionItem from "./TournamentTeamsAccordionItem";
import TournamentPlayersAccordionItem from "./TournamentPlayersAccordionItem";
import TournamentProgressAccordionItem from "./TournamentProgressAccordionItem";

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
  const [addingLabel, setAddingLabel] = useState<boolean>(false);
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
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

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
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
            handleChange={handleChange}
            handleKeyDown={handleKeyDown}
            setFormData={setFormData}
            addingLabel={addingLabel}
            setAddingLabel={setAddingLabel}
            editingLabelIndex={editingLabelIndex}
            setEditingLabelIndex={setEditingLabelIndex}
          />
        </AccordionItem>

        <AccordionItem key="赛事阶段" aria-label="赛事阶段" title="赛事阶段">
          <TournamentStagesAccordionItem
            formData={formData}
            setFormData={setFormData}
            handleKeyDown={handleKeyDown}
          />
        </AccordionItem>

        {formData.type === "team"
          ? <AccordionItem key="参赛队伍" aria-label="参赛队伍" title="参赛队伍">
            <TournamentTeamsAccordionItem
              formData={formData}
              setFormData={setFormData}
              handleKeyDown={handleKeyDown}
            />
          </AccordionItem>
          : <></>
        }

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
          <TournamentProgressAccordionItem />
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