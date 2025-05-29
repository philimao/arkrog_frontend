import { CloseIcon } from "~/components/Icons";
import { useGameDataStore } from "~/stores/gameDataStore";
import type { RogueKey } from "~/types/gameData";
import type { TournamentData } from "~/types/tournamentsData";

interface TournamentInfoAccordionItemProps {
  formData: TournamentData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  addingLabel: boolean;
  setAddingLabel: React.Dispatch<React.SetStateAction<boolean>>;
  editingLabelIndex: number | null;
  setEditingLabelIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function TournamentInfoAccordionItem({
  formData,
  handleChange,
  handleKeyDown,
  setFormData,
  addingLabel,
  setAddingLabel,
  editingLabelIndex,
  setEditingLabelIndex,
}: TournamentInfoAccordionItemProps) {
  const { topics } = useGameDataStore();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-4">
        <div>
          <label className="block text-sm font-light mb-1">
            赛事名称 <span className="text-ak-red">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 focus:outline-ak-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-1">
            赛事类型 <span className="text-ak-red">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 focus:outline-ak-blue cursor-pointer"
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
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 focus:outline-ak-blue"
          />
        </div>

        {topics && <div>
          <label className="block text-sm font-light mb-1">
            肉鸽 <span className="text-ak-red">*</span>
          </label>
          <select
            name="rogue"
            value={topics[formData.rogue as RogueKey].name}
            onChange={handleChange}
            className="w-full px-3 py-2 focus:outline-ak-blue cursor-pointer"
            required
          >
            {Object.values(topics).reverse().map((topic) => (
              <option key={topic.id} value={topic.name}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>}

        <div>
          <label className="block text-sm font-light mb-1">
            肉鸽版本 <span className="text-ak-red">*</span>
          </label>
          <select
            name="edition"
            value={formData.edition}
            onChange={handleChange}
            className="w-full px-3 py-2 focus:outline-ak-blue cursor-pointer"
            required
          >
            <option value="初始版本">初始版本</option>
            <option value="DLC_1">DLC_1</option>
            <option value="DLC_2">DLC_2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-light mb-1">
            肉鸽难度 <span className="text-ak-red">*</span>
          </label>
          <input
            type="text"
            name="level"
            value={formData.level}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 focus:outline-ak-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-1">
            主办方 <span className="text-ak-red">*</span>
          </label>
          <input
            type="text"
            name="organizerName"
            value={formData.organizerName}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 focus:outline-ak-blue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-light mb-1">
            直播间 <span className="text-ak-red">*</span>
          </label>
          <input
            type="text"
            name="room"
            value={formData.room}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 focus:outline-ak-blue"
            required
          />
        </div>

        {formData.type === "team" && (
          <div>
            <label className="block text-sm font-light mb-1">Member Alias</label>
            <input
              type="text"
              name="memberAlias"
              value={formData.memberAlias}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 focus:outline-ak-blue"
            />
          </div>
        )}

        {formData.type === "team" && (
          <div>
            <label className="block text-sm font-light mb-1">Key Member Alias</label>
            <input
              type="text"
              name="keyMemberAlias"
              value={formData.keyMemberAlias}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 focus:outline-ak-blue"
            />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-light mb-1">标签</label>
        <div className="flex flex-wrap gap-2">
          {formData.labels.map((label, index) =>
            editingLabelIndex === index ? (
              <input
                key={index}
                type="text"
                className="px-2 rounded-md border border-mid-gray focus:outline-ak-blue"
                autoFocus
                defaultValue={label}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      const newLabels = [...formData.labels];
                      newLabels[index] = value;
                      setFormData((prev) => ({
                        ...prev,
                        labels: newLabels,
                      }));
                    }
                    setEditingLabelIndex(null);
                  } else if (e.key === "Escape") {
                    setEditingLabelIndex(null);
                  }
                }}
                onBlur={(e) => {
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    const newLabels = [...formData.labels];
                    newLabels[index] = value;
                    setFormData((prev) => ({
                      ...prev,
                      labels: newLabels,
                    }));
                  }
                  setEditingLabelIndex(null);
                }}
              />
            ) : (
              <div className="px-2 py-1 rounded-md bg-mid-gray">
                <button key={index} type="button" className="" onClick={() => setEditingLabelIndex(index)}>
                  {label}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData((prev) => ({
                      ...prev,
                      labels: formData.labels.filter((_, i) => i !== index),
                    }));
                  }}
                  className="ml-1 rounded-md p-1 hover:text-white hover:bg-ak-red"
                >
                  <CloseIcon width="0.7rem" height="0.7rem" />
                </button>
              </div>
            ),
          )}
          {addingLabel && (
            <input
              type="text"
              className="px-2 rounded-md border border-mid-gray focus:outline-ak-blue min-h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    setFormData((prev) => ({
                      ...prev,
                      labels: [...prev.labels, value],
                    }));
                    setAddingLabel(false);
                  }
                } else if (e.key === "Escape") {
                  setAddingLabel(false);
                }
              }}
              onBlur={(e) => {
                const value = e.currentTarget.value.trim();
                if (value) {
                  setFormData((prev) => ({
                    ...prev,
                    labels: [...prev.labels, value],
                  }));
                }
                setAddingLabel(false);
              }}
            />
          )}
          {formData.labels.length < (addingLabel ? 9 : 10) && (
            <button
              type="button"
              onClick={() => {
                if (addingLabel) return;
                setAddingLabel(true);
              }}
              className="px-2 py-1 text-ak-blue bg-mid-gray hover:text-black hover:bg-ak-blue rounded-md"
            >
              + 添加标签
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
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
    </>
  );
}
