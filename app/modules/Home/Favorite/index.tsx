import { useUserInfoStore } from "~/stores/userInfoStore";
import { useEffect, useState } from "react";
import { SubNavForHome } from "~/modules/Home/SubNavForHome";
import type { RecordType } from "~/types/recordType";
import type { SeedType } from "~/types/seedType";
import RecordDisplay from "~/modules/RecordDisplay";
import { _post, mergeArray } from "~/utils/tools";
import { Pagination } from "@heroui/react";

const navs = [
  { title: "记录收藏", filter: () => {} },
  { title: "种子收藏", filter: () => {} },
];
const pageSize = 20;

export default function FavoritePage() {
  const { userInfo } = useUserInfoStore();
  const [title, setTitle] = useState(navs[0].title);
  const [recordIds, setRecordIds] = useState<string[]>([]);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [seedIds, setSeedIds] = useState<string[]>([]);
  const [seeds, setSeeds] = useState<SeedType[]>([]);
  const [maxRecordPages, setMaxRecordPages] = useState(0);
  const [maxSeedPages, setMaxSeedPages] = useState(0);
  const [page, setPage] = useState(0);

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
  }, [userInfo?.favorite, pageSize]);

  useEffect(() => {
    if (!userInfo?.favorite || (!maxRecordPages && !maxSeedPages)) return;
    const start = page * pageSize;
    const end = (page + 1) * pageSize;
    if (title === "记录收藏") {
      const isCurrentPageLoaded = records.some(
        (_, index) => index >= start && index < end,
      );
      if (!isCurrentPageLoaded) {
        _post<RecordType[]>("/record/ids", {
          page,
          ids: recordIds.slice(page * pageSize, (page + 3) * pageSize), // 预加载4页内容
        }).then((newRecords) => {
          setRecords((prev) => {
            return mergeArray<RecordType>(prev, newRecords || []);
          });
        });
      }
    }
  }, [
    userInfo?.favorite,
    title,
    page,
    maxRecordPages,
    maxSeedPages,
    records,
    seeds,
  ]);

  return (
    <div className="z-10 relative">
      <SubNavForHome
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
        {title === "记录收藏" ? (
          <RecordDisplay records={records} setRecords={setRecords} cols={2} />
        ) : null}
      </div>
      <Pagination
        color="secondary"
        page={page}
        total={title === "record" ? maxRecordPages : maxSeedPages}
        onChange={setPage}
      />
    </div>
  );
}
