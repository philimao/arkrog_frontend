import { StageTypes } from "~/types/constant";
import type { RecordType } from "~/types/recordType";
import { Button } from "@heroui/react";
import { _post } from "~/utils/tools";
import type { Dispatch, SetStateAction } from "react";

export default function RecordCard({
  record,
  setRecords,
}: {
  record?: RecordType;
  setRecords?: Dispatch<SetStateAction<RecordType[]>>;
}) {
  async function handleDeleteRecord() {
    if (!record) return;
    if (!window.confirm("是否确定删除")) return;
    await _post("/record/delete", { _id: record._id });
    setRecords?.((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((r) => r._id === record._id);
      updated.splice(index, 1);
      return updated;
    });
  }

  if (!record) {
    return (
      <div className="w-full h-72 mb-4 p-8 last-of-type:mb-0 bg-mid-gray"></div>
    );
  }
  return (
    <div className="w-full h-72 mb-4 p-8 last-of-type:mb-0 border bg-mid-gray">
      <div>队伍组成：{record.team.join(" + ")}</div>
      <div>关卡类型：{StageTypes.find((t) => t.key === record.type)?.text}</div>
      <div>关卡难度：{record.level}</div>
      <div>备注信息：{record.note}</div>
      <div>
        提交日期：{new Date(record.date_created).toLocaleString("zh-CN")}
      </div>
      <div>暂时没法编辑，有问题就删了</div>
      <div className="mt-4">
        <Button color="primary" className="me-2">
          <a href={record.url} target="_blank" rel="noreferrer">
            视频链接
          </a>
        </Button>
        <Button color="danger" onPress={handleDeleteRecord}>
          删除记录
        </Button>
      </div>
    </div>
  );
}
