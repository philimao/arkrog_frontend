import { useUserInfoStore } from "~/stores/userInfoStore";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { SubNavbar } from "~/components/SubNavbar";
import type { RecordType } from "~/types/recordType";
import type { SeedType } from "~/types/seedType";
import RecordDisplay from "~/modules/RecordDisplay";
import { _post } from "~/utils/tools";
import { Pagination } from "@heroui/react";
import SeedCard from "~/components/SeedCard/SeedCard";

// key 是 tab 的稳定判据，title 只做展示
const navs = [
  { key: "record", title: "记录收藏", filter: () => {} },
  // { key: "seed", title: "种子收藏", filter: () => {} },
];
const pageSize = 20;
// 每次预加载3页（60条），预加载量不得超过后端 /record/ids、/seed/ids 的单批上限 batchSize=80
const preloadPages = 3;

/**
 * 将按 id 批量请求的返回合并进与收藏 id 列表同序的槽位数组。
 * 后端按 Mongo 自然序返回，悬挂 id（已删除）直接缺位，返回与请求既不同序也不同长，
 * 因此按 _id 回对请求 id 的槽位写入，缺失槽位留空（渲染时静默缺卡）。
 */
function mergeByRequestedIds<T extends { _id: string }>(
  target: (T | undefined)[],
  source: T[],
  requestedIds: string[],
  offset: number,
): (T | undefined)[] {
  const merged = [...target];
  if (merged.length < offset + requestedIds.length) {
    merged.length = offset + requestedIds.length;
  }
  const byId = new Map(source.map((item): [string, T] => [item._id, item]));
  requestedIds.forEach((id, index) => {
    merged[offset + index] = byId.get(id);
  });
  return merged;
}

export default function FavoritePage() {
  const { userInfo } = useUserInfoStore();
  const [title, setTitle] = useState(navs[0].title);
  const [recordIds, setRecordIds] = useState<string[]>([]);
  const [records, setRecords] = useState<(RecordType | undefined)[]>([]);
  const [seedIds, setSeedIds] = useState<string[]>([]);
  const [seeds, setSeeds] = useState<(SeedType | undefined)[]>([]);
  const [maxRecordPages, setMaxRecordPages] = useState(0);
  const [maxSeedPages, setMaxSeedPages] = useState(0);
  const [page, setPage] = useState(0);
  // 已发起请求的页集合：请求发出即标记，空返回（如整批悬挂 id）也算已加载，避免重复请求
  const loadedRecordPages = useRef(new Set<number>());
  const loadedSeedPages = useRef(new Set<number>());
  // 槽位数组对应的 id 列表引用，favorite 变化后据此丢弃过期响应
  const recordIdsRef = useRef<string[]>([]);
  const seedIdsRef = useRef<string[]>([]);

  const activeKey = navs.find((nav) => nav.title === title)?.key ?? navs[0].key;

  useEffect(() => {
    if (!userInfo?.favorite) return;
    const recordIds = userInfo.favorite
      .filter((item) => item.type === "record")
      .map((item) => item._id);
    setRecordIds(recordIds);
    setMaxRecordPages(Math.ceil(recordIds.length / pageSize));
    const seedIds = userInfo.favorite
      .filter((item) => item.type === "seed")
      .map((item) => item._id);
    setSeedIds(seedIds);
    setMaxSeedPages(Math.ceil(seedIds.length / pageSize));
    // 槽位数组与收藏 id 列表一一对应，favorite 变化后重置以保持对齐
    recordIdsRef.current = recordIds;
    seedIdsRef.current = seedIds;
    setRecords([]);
    setSeeds([]);
    loadedRecordPages.current.clear();
    loadedSeedPages.current.clear();
  }, [userInfo?.favorite, pageSize]);

  // 收藏减少后当前页可能越界（末页取消收藏使总页数下降时 Pagination 会卸载，
  // 越界的 page 将只渲染空页且无控件可返回），收敛到当前 tab 的最大页
  useEffect(() => {
    const maxPages = activeKey === "record" ? maxRecordPages : maxSeedPages;
    setPage((p) => Math.min(p, Math.max(0, maxPages - 1)));
  }, [activeKey, maxRecordPages, maxSeedPages]);

  useEffect(() => {
    const start = page * pageSize;
    if (activeKey === "record") {
      if (loadedRecordPages.current.has(page)) return;
      const requestedIds = recordIds.slice(
        start,
        (page + preloadPages) * pageSize,
      );
      if (!requestedIds.length) return;
      for (let p = page; p < page + preloadPages; p++) {
        if (p * pageSize < recordIds.length) loadedRecordPages.current.add(p);
      }
      _post<RecordType[]>("/record/ids", {
        page,
        ids: requestedIds,
      }).then((newRecords) => {
        setRecords((prev) =>
          recordIdsRef.current === recordIds
            ? mergeByRequestedIds(prev, newRecords || [], requestedIds, start)
            : prev,
        );
      });
    } else {
      if (loadedSeedPages.current.has(page)) return;
      const requestedIds = seedIds.slice(
        start,
        (page + preloadPages) * pageSize,
      );
      if (!requestedIds.length) return;
      for (let p = page; p < page + preloadPages; p++) {
        if (p * pageSize < seedIds.length) loadedSeedPages.current.add(p);
      }
      _post<SeedType[]>("/seed/ids", {
        page,
        ids: requestedIds,
      }).then((newSeeds) => {
        setSeeds((prev) =>
          seedIdsRef.current === seedIds
            ? mergeByRequestedIds(prev, newSeeds || [], requestedIds, start)
            : prev,
        );
      });
    }
  }, [activeKey, page, recordIds, seedIds]);

  // 当前页槽位中悬挂 id（已删除记录）为空位，过滤后静默缺卡
  const pageStart = page * pageSize;
  const pageRecords = records
    .slice(pageStart, pageStart + pageSize)
    .filter((record): record is RecordType => !!record);
  const pageSeeds = seeds
    .slice(pageStart, pageStart + pageSize)
    .filter((seed): seed is SeedType => !!seed);

  // RecordCard 的删除回调按密集数组操作，这里换算回槽位数组：不在结果里的记录清空槽位
  const setDisplayRecords: Dispatch<SetStateAction<RecordType[]>> = (
    action,
  ) => {
    setRecords((prev) => {
      const dense = prev.filter((record): record is RecordType => !!record);
      const next = typeof action === "function" ? action(dense) : action;
      const keep = new Set(next.map((record) => record._id));
      return prev.map((record) =>
        record && keep.has(record._id) ? record : undefined,
      );
    });
  };

  return (
    <div className="z-10 relative">
      <SubNavbar
        navs={navs}
        title={title}
        setTitle={(newTitle) => {
          console.log(newTitle);
          if (newTitle !== title) {
            setTitle(newTitle);
            setPage(0);
          }
        }}
      />
      <div>
        {activeKey === "record" ? (
          <RecordDisplay
            records={pageRecords}
            setRecords={setDisplayRecords}
            cols={2}
          />
        ) : (
          <div>
            {pageSeeds.map((seed) => {
              return <SeedCard seed={seed} />;
            })}
          </div>
        )}
      </div>
      {((activeKey === "record" && maxRecordPages > 1) ||
        (activeKey === "seed" && maxSeedPages > 1)) && (
        <Pagination
          color="secondary"
          page={page + 1}
          total={activeKey === "record" ? maxRecordPages : maxSeedPages}
          onChange={(newPage) => setPage(newPage - 1)}
        />
      )}
    </div>
  );
}
