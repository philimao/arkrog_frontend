import type { RecordType } from "~/types/recordType";
import { StageLevels, StageTypes } from "~/types/constant";
import RecordCard from "~/components/RecordCard/RecordCard";
import type { Dispatch, SetStateAction } from "react";

export default function RecordDisplay({
  records,
  setRecords,
  isStagePage,
  cols = 1,
}: {
  records: RecordType[];
  setRecords: Dispatch<SetStateAction<RecordType[]>>;
  isStagePage?: boolean;
  cols?: 1 | 2;
}) {
  const className = cols === 1 ? "" : "grid grid-cols-1 xl:grid-cols-2 gap-4";
  // 找出有效的记录类型（普通，突袭，带船）
  const types = Object.keys(StageTypes).filter((type) => records.some((record) => record.type === type));

  return (
    <div className={className}>
      {types.map((type) => (
        <RecordsByType
          type={type}
          isStagePage={isStagePage}
          records={records.filter((record) => record.type === type)}
          setRecords={setRecords}
          key={type}
        />
      ))}
    </div>
  );
}

function RecordsByType({
  type,
  isStagePage,
  records,
  setRecords,
}: {
  type: string;
  isStagePage?: boolean;
  records: RecordType[];
  setRecords: Dispatch<SetStateAction<RecordType[]>>;
}) {
  // 计算相同关卡类型，最高难度下的最少人数
  const optimalTeamNum = StageLevels.map(
    (level) =>
      records
        .filter((r) => r.level === level)
        .map((r) => r.team.length)
        // 在相同难度下找出最少人
        .reduce((a, b) => Math.min(a, b), 14),
    // 逆序找出难度最高的有效人数（<14）
  ).findLast((num) => num < 14);

  return (
    <div>
      {isStagePage && (
        <div className="my-3 font-bold">
          <div className="bg-dark-gray inline-block px-4 pe-12 relative">
            <span className="text-lg me-4">{StageTypes[type]}</span>
            <span
              className={
                "text-[2.5rem] absolute left-16 top-1/2 -translate-y-1/2 " +
                (type === "normal" ? "text-ak-blue" : type === "elite" ? "text-ak-red" : "text-ak-purple")
              }
            >
              {optimalTeamNum}
            </span>
          </div>
        </div>
      )}
      {records
        // 后排序队伍人数
        .sort((a, b) => a.team.length - b.team.length)
        // 优先排序难度
        .sort((a, b) => StageLevels.indexOf(b.level) - StageLevels.indexOf(a.level))
        .map((record) => (
          <RecordCard key={record._id} record={record} setRecords={setRecords} isStagePage={isStagePage} />
        ))}
    </div>
  );
}
