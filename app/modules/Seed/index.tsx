import { Link } from "react-router";
import { SubNavbar } from "~/components/SubNavbar";
import { useEffect, useState } from "react";
import SubmitSeedForm from "~/modules/Seed/SubmitSeedForm";
import { _post, mergeArray } from "~/utils/tools";
import type { SeedType } from "~/types/seedType";
import SeedCard from "~/components/SeedCard/SeedCard";
import { Pagination } from "@heroui/react";

const navs = [
  { title: "全部" },
  { title: "胡种" },
  { title: "毒种" },
  { title: "工具种" },
  { title: "其他" },
];

const pageSize = 80;

export default function SeedIndex() {
  const [title, setTitle] = useState<string>(navs[0].title);
  const [seeds, setSeeds] = useState<SeedType[]>([]);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [reload, setReload] = useState<boolean>(false);

  useEffect(() => {
    const start = page * pageSize;
    const end = (page + 1) * pageSize;
    const isCurrentPageLoaded = seeds.some(
      (_, index) => index >= start && index < end,
    );
    if (isCurrentPageLoaded && !reload) return;
    _post<{ seeds: SeedType[]; total: number }>("/seed", { page }).then(
      (result) => {
        if (!result) return;
        const { seeds: newSeeds, total } = result;
        setMaxPage(Math.ceil(total / pageSize));
        setSeeds((prev) => {
          return mergeArray(prev, newSeeds);
        });
      },
    );
    setReload(false);
  }, [page, seeds, reload]);

  return (
    <div>
      <div className="flex flex-wrap items-center mb-4">
        <span className="text-ak-blue me-auto">
          本版块截止至2025年2月14日16:00
        </span>
        <SubmitSeedForm setReload={setReload} />
      </div>
      <div className="mb-4 px-6 py-4 bg-semi-black">
        投稿须知：
        <br />
        本版块投稿需要链接B站账号，可以点击
        <Link to="/home/link-bilibili" className="text-ak-blue">
          此处
        </Link>
        前往
        <br />
        投稿时请尽量按照现有种子格式，进行规范描述，包括开局选择、结局达成、道中关键路线选择等等
      </div>
      <SubNavbar navs={navs} title={title} setTitle={setTitle} />
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {seeds.map((seed: SeedType) => (
          <SeedCard seed={seed} setSeeds={setSeeds} key={seed._id} />
        ))}
      </div>
      {maxPage > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={maxPage}
            page={page}
            color="secondary"
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
