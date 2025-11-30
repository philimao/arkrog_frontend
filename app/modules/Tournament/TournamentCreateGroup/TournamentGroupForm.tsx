import { Accordion, AccordionItem } from "@heroui/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import type { TournamentGroupData } from "~/types/tournamentsData";
import { useTournamentDataStore } from "~/stores/tournamentsDataStore";
import { SearchSelect } from "~/components/SearchSelect";
import TournamentSelectorList from "./TournamentSelector";

export default function TournamentGroupForm({
  edit = false,
}: {
  edit?: boolean;
}) {
  const navigate = useNavigate();
  const { saveTournamentGroup, tournamentGroups } = useTournamentDataStore();

  // 编辑模式下选中的赛事集
  const [selectedGroup, setSelectedGroup] =
    useState<TournamentGroupData | null>(null);

  // 表单数据
  const [formData, setFormData] = useState<TournamentGroupData>(
    {} as TournamentGroupData,
  );
  // 展开的accordion项
  const [expandedKeys, setExpandedKeys] = useState<Set<React.Key>>(
    new Set(["赛事集信息"]),
  );
  // 记录已触碰的表单项，用于错误提示
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // 是否正在提交
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 编辑模式下是否已选择赛事集
  const isFormEnabled = !edit || selectedGroup !== null;

  // 处理选择赛事集（编辑模式）
  const handleGroupSelect = (group: TournamentGroupData | null) => {
    setSelectedGroup(group);
    if (group) {
      // 自动填充表单数据
      setFormData({ ...group });
    } else {
      // 清空表单数据
      setFormData({} as TournamentGroupData);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormEnabled) return;

    // 验证必填字段
    if (!formData.name) {
      setTouchedFields((prev) => new Set([...prev, "name"]));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveTournamentGroup(formData);
      if (result) {
        navigate(-1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleBlur = (e: React.FocusEvent<Element>) => {
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

  const handleSelectionChange = useCallback((keys: unknown) => {
    setExpandedKeys(keys as Set<React.Key>);
  }, []);

  const returnToPrevPage = () => {
    navigate(-1);
  };

  const goToEditPage = () => {
    navigate("/tournament/edit-group");
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      onBlur={handleBlur}
    >
      {/* 编辑模式：赛事集选择器 */}
      {edit && (
        <div className="mb-6 max-w-[40rem]">
          <label className={labelClassName}>
            选择要编辑的赛事集 <span className="text-ak-red">*</span>
          </label>
          <SearchSelect<TournamentGroupData>
            value={selectedGroup}
            onChange={handleGroupSelect}
            items={tournamentGroups || []}
            filterFn={(item, query) =>
              item.name.toLowerCase().includes(query.toLowerCase())
            }
            renderItem={(item) => (
              <div className="py-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray">
                  {item.seasons?.length || 0} 个赛事
                </div>
              </div>
            )}
            renderSelected={(item) => item.name}
            getKey={(item) => item.id}
            getSelectedText={(item) => item.name}
            placeholder="搜索赛事集名称..."
          />
          {!selectedGroup && (
            <p className="text-gray text-sm mt-2">请先选择一个赛事集进行编辑</p>
          )}
        </div>
      )}

      {/* 表单内容 */}
      <div className={!isFormEnabled ? "opacity-50 pointer-events-none" : ""}>
        <Accordion
          className="px-0"
          defaultExpandedKeys={["赛事集信息"]}
          selectedKeys={Array.from(expandedKeys) as string[]}
          onSelectionChange={handleSelectionChange}
          itemClasses={{
            base: "bg-dark-gray",
            title: "text-xl",
            indicator: "text-ak-blue",
          }}
          selectionMode="multiple"
          variant="splitted"
        >
          <AccordionItem
            key="赛事集信息"
            aria-label="赛事集信息"
            title="赛事集信息"
          >
            <TournamentGroupInfoAccordionItem
              formData={formData}
              setFormData={setFormData}
              handleKeyDown={handleKeyDown}
              touchedFields={touchedFields}
              handleBlur={handleBlur}
              disabled={!isFormEnabled}
            />
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        {!edit && (
          <button
            type="button"
            className="px-4 py-2 rounded-md text-black bg-light-gray me-auto"
            onClick={goToEditPage}
          >
            编辑赛事集
          </button>
        )}
        <button
          type="button"
          onClick={returnToPrevPage}
          className="px-4 py-2 rounded-md text-black bg-light-gray"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-black bg-ak-blue disabled:opacity-50"
          disabled={isSubmitting || !isFormEnabled}
        >
          {isSubmitting ? "保存中..." : edit ? "保存" : "新建"}
        </button>
      </div>
    </form>
  );
}

function TournamentGroupInfoAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
  touchedFields,
  handleBlur,
  disabled = false,
}: {
  formData: TournamentGroupData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentGroupData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  touchedFields: Set<string>;
  handleBlur: (e: React.FocusEvent<Element>) => void;
  disabled?: boolean;
}) {
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

  const handleSeasonsChange = useCallback(
    (seasons: string[]) => {
      setFormData((prev) => ({
        ...prev,
        seasons,
      }));
    },
    [setFormData],
  );

  return (
    <div className="grid grid-cols-1 gap-4 w-full mb-4 max-w-[40rem]">
      <div className="pe-9">
        <label htmlFor="name" className={labelClassName}>
          赛事集名称 <span className="text-ak-red">*</span>
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name || ""}
          placeholder="例：仙术杯"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={getInputClassName("name", touchedFields, formData)}
          onBlur={handleBlur}
          disabled={disabled}
          required
        />
      </div>
      <TournamentSelectorList
        selectedIds={formData.seasons || []}
        onChange={handleSeasonsChange}
      />
    </div>
  );
}

const inputClassName =
  "bg-mid-gray w-full p-2 focus:outline focus:outline-2 focus:outline-ak-blue disabled:opacity-50";
const labelClassName = "block text-sm font-light mb-1";

const getInputClassName = (
  fieldName: string,
  touchedFields: Set<string>,
  formData: TournamentGroupData,
  customInputClass?: string,
) => {
  const isRequired = document
    .getElementById(fieldName)
    ?.hasAttribute("required");
  const value = formData[fieldName as keyof TournamentGroupData];
  const isEmpty = !value;
  const defaultClass = customInputClass ? customInputClass : inputClassName;

  if (isRequired && touchedFields.has(fieldName) && isEmpty) {
    return `${defaultClass} outline outline-2 outline-ak-red`;
  }

  return defaultClass;
};
